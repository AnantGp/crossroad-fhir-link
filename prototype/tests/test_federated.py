from __future__ import annotations

from pathlib import Path

import torch

from ips_agent.federated import (
    FederatedTerminologyLinker,
    LocalUpdate,
    TerminologyClassifier,
    build_example_pools,
    fedavg,
    masked_logits,
    run_federated_demo,
)
from ips_agent.models import ClinicalFact
from ips_agent.pipeline import run_pipeline
from ips_agent.terminology import LinkPrediction, TerminologyAgent


BASE = Path(__file__).resolve().parents[1]


class StaticLinker:
    def __init__(self, canonical: str | None, confidence: float, review: bool = False) -> None:
        self.canonical = canonical
        self.confidence = confidence
        self.review = review
        self.calls = 0

    def predict(self, mention: str, category: str) -> LinkPrediction:
        self.calls += 1
        return LinkPrediction(
            canonical_concept=self.canonical,
            confidence=self.confidence,
            human_review_required=self.review,
        )


def test_synthetic_pools_have_separate_training_transfer_and_unseen_sets() -> None:
    pools = build_example_pools()
    training_mentions = {example.mention.lower() for example in pools.all_training}
    unseen_mentions = {example.mention.lower() for example in pools.globally_unseen}

    assert len(pools.all_training) == 768
    assert len(pools.globally_unseen) == 192
    assert len(pools.all_transfer) == 48
    assert not training_mentions & unseen_mentions
    for transfer in pools.all_transfer:
        sender_mentions = {example.mention.lower() for example in pools.training_by_site[transfer.owner_site]}
        receiver_mentions = {
            example.mention.lower()
            for example in pools.training_by_site[transfer.receiver_site or ""]
        }
        assert transfer.mention.lower() in sender_mentions
        assert transfer.mention.lower() not in receiver_mentions


def test_fedavg_uses_weighted_float64_aggregation_with_tolerance() -> None:
    update_a = LocalUpdate(
        site="India",
        sample_count=1,
        state={"linear.bias": torch.tensor([1.0, 3.0]), "linear.weight": torch.tensor([[1.0], [3.0]])},
        final_loss=0.0,
    )
    update_b = LocalUpdate(
        site="USA",
        sample_count=3,
        state={"linear.bias": torch.tensor([5.0, 7.0]), "linear.weight": torch.tensor([[5.0], [7.0]])},
        final_loss=0.0,
    )
    averaged = fedavg([update_b, update_a])
    expected_bias = torch.tensor([(1.0 + 3 * 5.0) / 4, (3.0 + 3 * 7.0) / 4])
    expected_weight = torch.tensor([[(1.0 + 3 * 5.0) / 4], [(3.0 + 3 * 7.0) / 4]])

    assert torch.allclose(averaged["linear.bias"], expected_bias, atol=1e-6, rtol=1e-6)
    assert torch.allclose(averaged["linear.weight"], expected_weight, atol=1e-6, rtol=1e-6)


def test_category_masking_happens_before_decoding() -> None:
    logits = torch.zeros((1, 12), dtype=torch.float32)
    logits[0, 8] = 99.0  # Metformin is a medication, not an allowed condition.
    logits[0, 0] = 2.0
    masked = masked_logits(logits, ["condition"])

    assert int(torch.argmax(masked, dim=1).item()) == 0
    assert float(masked[0, 8].item()) < -1e8


def test_low_confidence_linker_requires_review_while_registry_stays_deterministic() -> None:
    model = TerminologyClassifier(1024)
    with torch.no_grad():
        model.linear.weight.zero_()
        model.linear.bias.zero_()
    linker = FederatedTerminologyLinker(model, input_dimension=1024, threshold=0.70)
    agent = TerminologyAgent(linker=linker)

    unknown = ClinicalFact("condition", "Madhumeha", "madhumeha", "Madhumeha")
    unknown_mapping = agent.map_fact(unknown).primary_mapping()
    assert unknown_mapping.is_unknown is True
    assert unknown_mapping.human_review_required is True

    known = ClinicalFact("medication", "Metformin", "metformin", "Metformin")
    known_mapping = agent.map_fact(known).primary_mapping("RxNorm")
    assert known_mapping.is_unknown is False
    assert known_mapping.source == "local terminology registry"

    reviewed_pipeline = run_pipeline(
        "Synthetic report. Patient has Madhumeha type 2.",
        source_country="India",
        target_country="USA",
        terminology_agent=agent,
    )
    condition = next(
        entry["resource"]
        for entry in reviewed_pipeline["fhir_bundle"]["entry"]
        if entry["resource"]["resourceType"] == "Condition"
    )
    assert "coding" not in condition["code"]


def test_fhir_native_terminology_layer_creates_conceptmap_and_reuses_cache() -> None:
    linker = StaticLinker("type 2 diabetes mellitus", 0.94)
    agent = TerminologyAgent(linker=linker)
    unknown = ClinicalFact("condition", "Madhumeha type 2", "madhumeha type 2", "Madhumeha type 2")

    first = agent.map_fact(unknown, source_site="India")
    first_evidence = agent.export_fhir_terminology_evidence()

    assert linker.calls == 1
    assert first.primary_mapping("SNOMED CT").code == "44054006"
    assert first.primary_mapping("SNOMED CT").source == "federated terminology linker + FHIR ConceptMap"
    assert first_evidence["concept_maps"][0]["resourceType"] == "ConceptMap"
    assert first_evidence["translation_results"][0]["operation"] == "$translate"
    assert first_evidence["translation_results"][0]["result"] is True
    assert all(item["operation"] == "$validate-code" and item["result"] is True for item in first_evidence["code_validation_results"])
    assert any(item["event"] == "learned_cache_updated" for item in first_evidence["terminology_service_trace"])

    agent.reset_run_evidence()
    second = agent.map_fact(unknown, source_site="India")
    second_evidence = agent.export_fhir_terminology_evidence()

    assert linker.calls == 1
    assert second.primary_mapping("SNOMED CT").source == "local learned FHIR ConceptMap cache"
    assert second_evidence["translation_results"][0]["source"] == "local learned FHIR ConceptMap cache"
    assert any(item["event"] == "learned_cache_hit" for item in second_evidence["terminology_service_trace"])
    assert len(second_evidence["learned_mapping_cache"]) == 1


def test_low_confidence_fhir_terminology_mapping_is_not_cached() -> None:
    linker = StaticLinker(None, 0.21, review=True)
    agent = TerminologyAgent(linker=linker)
    unknown = ClinicalFact("condition", "Unclear sugar phrase", "unclear sugar phrase", "Unclear sugar phrase")

    mapped = agent.map_fact(unknown, source_site="India")
    evidence = agent.export_fhir_terminology_evidence()

    assert mapped.primary_mapping().is_unknown is True
    assert mapped.primary_mapping().human_review_required is True
    assert evidence["concept_maps"] == []
    assert evidence["translation_results"] == []
    assert evidence["learned_mapping_cache"] == []


def test_genuine_federated_demo_has_transfer_gain_and_private_payloads() -> None:
    output = run_federated_demo(BASE)

    assert output["data_summary"] == {
        "sites": 4,
        "canonical_concepts": 12,
        "training_examples": 768,
        "globally_unseen_examples": 192,
        "cross_site_transfer_examples": 48,
    }
    assert output["quality_metrics"]["initial_model_weights_changed"] is True
    assert output["quality_metrics"]["aggregate_transfer_improved"] is True
    assert all(output["quality_metrics"]["transfer_non_regression_by_receiver"].values())
    assert output["privacy_report"]["raw_reports_shared_with_coordinator"] is False
    assert output["privacy_report"]["formal_privacy_guarantee"] is False
    assert len(output["case_study_conversions"]) == 20
    assert len(output["relay_conversions"]) == 4
    assert len(output["semantic_mapping_validation"]) == 48
    assert all(item["correct"] for item in output["semantic_mapping_validation"])
    assert output["fhir_terminology_validation"]["translation_results"]
    assert output["mapping_reuse_benefit"]["first_lookup"]["concept_maps_created"] >= 1
    assert "federated terminology linker + FHIR ConceptMap" in output["mapping_reuse_benefit"]["first_lookup"]["mapping_sources"]
    assert "local learned FHIR ConceptMap cache" in output["mapping_reuse_benefit"]["second_lookup"]["mapping_sources"]
    india_relay = next(item for item in output["relay_conversions"] if item["source_country"] == "India")
    assert india_relay["quality_metrics"]["terminology_mapping_coverage"] >= 0.9
    assert all(item["fhir_bundle"]["type"] == "document" for item in output["relay_conversions"])
    assert all(
        item["fhir_bundle"]["entry"][0]["resource"]["resourceType"] == "Composition"
        for item in output["relay_conversions"]
    )
    for round_data in output["rounds"]:
        for update in round_data["client_updates"]:
            payload = update["shared_payload"]
            assert payload["contains"] == ["model_tensors", "sample_count"]
            assert "mentions" not in payload["contains"]
            assert "labels" not in payload["contains"]
