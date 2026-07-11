from __future__ import annotations

import random
import statistics
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Sequence, Tuple

import torch
from torch.nn import functional as F

from ..models import ClinicalFact
from ..pipeline import run_pipeline
from ..terminology import BASE_ALIASES, TerminologyAgent, normalize_term
from .data import ExamplePools, SITES, TerminologyExample, build_example_pools, data_summary
from .linker import CONCEPTS_BY_INDEX, CONCEPT_INDEX, FederatedTerminologyLinker, TerminologyClassifier, hashed_features, masked_logits


@dataclass(frozen=True)
class TrainingConfig:
    rounds: int = 5
    seed: int = 42
    hash_dim: int = 1024
    local_epochs: int = 10
    batch_size: int = 16
    learning_rate: float = 0.1

    def to_dict(self) -> Dict[str, int | float]:
        return {
            "rounds": self.rounds,
            "seed": self.seed,
            "hash_dim": self.hash_dim,
            "local_epochs": self.local_epochs,
            "batch_size": self.batch_size,
            "learning_rate": self.learning_rate,
        }


@dataclass(frozen=True)
class LocalUpdate:
    site: str
    sample_count: int
    state: Mapping[str, torch.Tensor]
    final_loss: float

    def coordinator_metadata(self) -> Dict[str, Any]:
        return {
            "site": self.site,
            "sample_count": self.sample_count,
            "shared_payload": {
                "contains": ["model_tensors", "sample_count"],
                "excludes": ["reports", "mentions", "labels", "aliases", "patient_identifiers", "fhir_bundles"],
            },
            "final_local_loss": round(self.final_loss, 6),
        }


@dataclass(frozen=True)
class Metrics:
    correct: int
    total: int
    accuracy: float
    macro_f1: float

    def to_dict(self) -> Dict[str, float | int]:
        return {
            "correct": self.correct,
            "total": self.total,
            "accuracy": round(self.accuracy, 6),
            "macro_f1": round(self.macro_f1, 6),
        }


def _clone_state(state: Mapping[str, torch.Tensor]) -> Dict[str, torch.Tensor]:
    return {key: state[key].detach().cpu().clone() for key in sorted(state)}


def initial_state(config: TrainingConfig) -> Dict[str, torch.Tensor]:
    torch.manual_seed(config.seed)
    return _clone_state(TerminologyClassifier(config.hash_dim).state_dict())


def _site_seed(config: TrainingConfig, site_index: int, round_index: int, epoch: int) -> int:
    return config.seed + site_index * 10_000 + round_index * 100 + epoch


class FederatedClient:
    def __init__(self, site: str, site_index: int, examples: Sequence[TerminologyExample], config: TrainingConfig) -> None:
        self.site = site
        self.site_index = site_index
        self.examples = tuple(sorted(examples, key=lambda example: example.id))
        self.config = config
        self.features = torch.stack([hashed_features(example.mention, config.hash_dim) for example in self.examples])
        self.labels = torch.tensor([CONCEPT_INDEX[example.canonical_concept] for example in self.examples], dtype=torch.long)
        self.categories = [example.category for example in self.examples]

    def local_train(self, global_state: Mapping[str, torch.Tensor], round_index: int) -> LocalUpdate:
        model = TerminologyClassifier(self.config.hash_dim)
        model.load_state_dict(_clone_state(global_state))
        model.train()
        optimizer = torch.optim.SGD(model.parameters(), lr=self.config.learning_rate)
        final_loss = 0.0

        for epoch in range(self.config.local_epochs):
            indices = list(range(len(self.examples)))
            random.Random(_site_seed(self.config, self.site_index, round_index, epoch)).shuffle(indices)
            for start in range(0, len(indices), self.config.batch_size):
                batch_indices = indices[start:start + self.config.batch_size]
                features = self.features[batch_indices]
                labels = self.labels[batch_indices]
                categories = [self.categories[index] for index in batch_indices]
                optimizer.zero_grad()
                loss = F.cross_entropy(masked_logits(model(features), categories), labels)
                loss.backward()
                optimizer.step()
                final_loss = float(loss.item())

        return LocalUpdate(
            site=self.site,
            sample_count=len(self.examples),
            state=_clone_state(model.state_dict()),
            final_loss=final_loss,
        )


def fedavg(updates: Sequence[LocalUpdate]) -> Dict[str, torch.Tensor]:
    if not updates:
        raise ValueError("FedAvg requires at least one local update.")
    ordered_updates = tuple(sorted(updates, key=lambda update: update.site))
    total_examples = sum(update.sample_count for update in ordered_updates)
    if not total_examples:
        raise ValueError("FedAvg requires a positive number of local examples.")
    averaged: Dict[str, torch.Tensor] = {}
    for key in sorted(ordered_updates[0].state):
        dtype = ordered_updates[0].state[key].dtype
        accumulator = torch.zeros_like(ordered_updates[0].state[key], dtype=torch.float64)
        for update in ordered_updates:
            accumulator += update.state[key].to(torch.float64) * update.sample_count
        averaged[key] = (accumulator / total_examples).to(dtype)
    return averaged


def _evaluate_state(state: Mapping[str, torch.Tensor], examples: Sequence[TerminologyExample], config: TrainingConfig) -> Metrics:
    model = TerminologyClassifier(config.hash_dim)
    model.load_state_dict(_clone_state(state))
    model.eval()
    correct = 0
    per_class: Dict[str, Dict[str, int]] = {
        concept: {"tp": 0, "fp": 0, "fn": 0}
        for concept in CONCEPTS_BY_INDEX
    }
    with torch.no_grad():
        for example in sorted(examples, key=lambda item: item.id):
            feature = hashed_features(example.mention, config.hash_dim).unsqueeze(0)
            prediction_index = int(torch.argmax(masked_logits(model(feature), [example.category]), dim=1).item())
            prediction = CONCEPTS_BY_INDEX[prediction_index]
            if prediction == example.canonical_concept:
                correct += 1
                per_class[prediction]["tp"] += 1
            else:
                per_class[prediction]["fp"] += 1
                per_class[example.canonical_concept]["fn"] += 1
    f1_scores = []
    for concept in CONCEPTS_BY_INDEX:
        counts = per_class[concept]
        denominator = 2 * counts["tp"] + counts["fp"] + counts["fn"]
        f1_scores.append((2 * counts["tp"] / denominator) if denominator else 0.0)
    total = len(examples)
    return Metrics(correct=correct, total=total, accuracy=(correct / total if total else 0.0), macro_f1=sum(f1_scores) / len(f1_scores))


def _dictionary_metrics(examples: Sequence[TerminologyExample]) -> Metrics:
    correct = 0
    for example in examples:
        prediction = normalize_term(example.mention, BASE_ALIASES)
        if prediction == example.canonical_concept:
            correct += 1
    total = len(examples)
    return Metrics(correct=correct, total=total, accuracy=(correct / total if total else 0.0), macro_f1=0.0)


def _predict_example(
    state: Mapping[str, torch.Tensor],
    example: TerminologyExample,
    config: TrainingConfig,
) -> Dict[str, Any]:
    model = TerminologyClassifier(config.hash_dim)
    model.load_state_dict(_clone_state(state))
    model.eval()
    with torch.no_grad():
        feature = hashed_features(example.mention, config.hash_dim).unsqueeze(0)
        probabilities = torch.softmax(masked_logits(model(feature), [example.category]), dim=1)
        confidence, index = torch.max(probabilities, dim=1)
        predicted = CONCEPTS_BY_INDEX[int(index.item())]
    return {
        "id": example.id,
        "owner_site": example.owner_site,
        "receiver_site": example.receiver_site,
        "split": example.split,
        "category": example.category,
        "mention": example.mention,
        "expected_canonical_concept": example.canonical_concept,
        "predicted_canonical_concept": predicted,
        "confidence": round(float(confidence.item()), 6),
        "correct": predicted == example.canonical_concept,
    }


def _semantic_mapping_validation(
    state: Mapping[str, torch.Tensor],
    examples: Sequence[TerminologyExample],
    config: TrainingConfig,
) -> List[Dict[str, Any]]:
    return [
        _predict_example(state, example, config)
        for example in sorted(examples, key=lambda item: item.id)
    ]


def _train_centralized(examples: Sequence[TerminologyExample], config: TrainingConfig, state: Mapping[str, torch.Tensor]) -> Dict[str, torch.Tensor]:
    # Offline comparison only. This pooled model is never used in the demo pipeline.
    client = FederatedClient("centralized-reference", 0, examples, config)
    return client.local_train(state, round_index=0).state


def _train_local_only(pools: ExamplePools, config: TrainingConfig, state: Mapping[str, torch.Tensor]) -> Dict[str, Dict[str, torch.Tensor]]:
    local_config = TrainingConfig(
        rounds=config.rounds,
        seed=config.seed,
        hash_dim=config.hash_dim,
        local_epochs=config.local_epochs * config.rounds,
        batch_size=config.batch_size,
        learning_rate=config.learning_rate,
    )
    return {
        site: FederatedClient(site, index, pools.training_by_site[site], local_config).local_train(state, 0).state
        for index, site in enumerate(SITES)
    }


def _relay_path(base_dir: Path, source: str, target: str) -> Path:
    return base_dir / "examples" / "reports" / f"relay_{source.lower()}_to_{target.lower()}.txt"


def _case_study_report_paths(base_dir: Path, source: str, target: str) -> Tuple[Path, ...]:
    reports = base_dir / "examples" / "reports"
    local_reports = tuple(reports / f"{source.lower()}_local_{index}.txt" for index in range(1, 5))
    return (*local_reports, _relay_path(base_dir, source, target))


def _mapping_reuse_demo(linker: FederatedTerminologyLinker) -> Dict[str, Any]:
    agent = TerminologyAgent(linker=linker)
    fact = ClinicalFact(
        category="condition",
        text="Madhumeha type 2",
        normalized="madhumeha type 2",
        source_text="Madhumeha type 2",
        confidence=0.95,
    )

    agent.reset_run_evidence()
    first = agent.map_fact(fact, source_site="India")
    first_evidence = agent.export_fhir_terminology_evidence()

    agent.reset_run_evidence()
    second = agent.map_fact(fact, source_site="India")
    second_evidence = agent.export_fhir_terminology_evidence()

    return {
        "phrase": fact.source_text,
        "source_site": "India",
        "expected_behavior": "First lookup uses federated linker and creates a ConceptMap; second lookup uses local learned cache.",
        "first_lookup": {
            "mapping_sources": sorted({mapping.source for mapping in first.mappings}),
            "human_review_required": any(mapping.human_review_required for mapping in first.mappings),
            "concept_maps_created": len(first_evidence["concept_maps"]),
            "translation_results": first_evidence["translation_results"],
            "code_validation_results": first_evidence["code_validation_results"],
            "terminology_service_trace": first_evidence["terminology_service_trace"],
            "cache_size_after": len(first_evidence["learned_mapping_cache"]),
        },
        "second_lookup": {
            "mapping_sources": sorted({mapping.source for mapping in second.mappings}),
            "human_review_required": any(mapping.human_review_required for mapping in second.mappings),
            "concept_maps_available": len(second_evidence["concept_maps"]),
            "translation_results": second_evidence["translation_results"],
            "code_validation_results": second_evidence["code_validation_results"],
            "terminology_service_trace": second_evidence["terminology_service_trace"],
            "cache_size_after": len(second_evidence["learned_mapping_cache"]),
        },
    }


def _state_payload_bytes(state: Mapping[str, torch.Tensor]) -> int:
    return sum(tensor.numel() * tensor.element_size() for tensor in state.values())


def _run_training_benchmark(
    config: TrainingConfig,
    pools: ExamplePools,
    *,
    include_centralized: bool,
) -> Dict[str, Any]:
    global_state = initial_state(config)
    starting_state = _clone_state(global_state)
    clients = [
        FederatedClient(site, index, pools.training_by_site[site], config)
        for index, site in enumerate(SITES)
    ]
    round_summaries: List[Dict[str, Any]] = []

    for round_index in range(config.rounds):
        updates = [client.local_train(global_state, round_index) for client in clients]
        global_state = fedavg(updates)
        round_summaries.append({
            "round_index": round_index,
            "client_updates": [update.coordinator_metadata() for update in updates],
            "aggregate_global_unseen_metrics": _evaluate_state(global_state, pools.globally_unseen, config).to_dict(),
            "privacy_statement": "Coordinator receives model tensors and sample counts only; no report text, labels, aliases, or FHIR Bundles are shared.",
        })

    local_states = _train_local_only(pools, config, starting_state)
    transfer_by_receiver: Dict[str, Dict[str, Any]] = {}
    aggregate_local_correct = 0
    aggregate_federated_correct = 0
    for receiver in SITES:
        transfer_examples = pools.transfer_by_receiver[receiver]
        local_metrics = _evaluate_state(local_states[receiver], transfer_examples, config)
        federated_metrics = _evaluate_state(global_state, transfer_examples, config)
        aggregate_local_correct += local_metrics.correct
        aggregate_federated_correct += federated_metrics.correct
        transfer_by_receiver[receiver] = {
            "local_only": local_metrics.to_dict(),
            "federated": federated_metrics.to_dict(),
            "non_regression": federated_metrics.correct >= local_metrics.correct,
        }

    global_metrics: Dict[str, Any] = {
        "dictionary": _dictionary_metrics(pools.globally_unseen).to_dict(),
        "federated": _evaluate_state(global_state, pools.globally_unseen, config).to_dict(),
        "local_only_average": {
            "accuracy": round(
                sum(_evaluate_state(local_states[site], pools.globally_unseen, config).accuracy for site in SITES)
                / len(SITES),
                6,
            ),
        },
    }
    if include_centralized:
        centralized_state = _train_centralized(pools.all_training, config, starting_state)
        global_metrics["centralized_reference"] = _evaluate_state(
            centralized_state,
            pools.globally_unseen,
            config,
        ).to_dict()

    initial_weight_changed = any(
        not torch.allclose(starting_state[key], global_state[key], atol=1e-6, rtol=1e-6)
        for key in sorted(global_state)
    )
    return {
        "global_state": global_state,
        "round_summaries": round_summaries,
        "transfer_by_receiver": transfer_by_receiver,
        "aggregate_local_correct": aggregate_local_correct,
        "aggregate_federated_correct": aggregate_federated_correct,
        "global_metrics": global_metrics,
        "initial_weight_changed": initial_weight_changed,
        "model_tensor_bytes": _state_payload_bytes(global_state),
    }


def _distribution(values: Sequence[float]) -> Dict[str, float]:
    return {
        "mean": round(statistics.fmean(values), 6),
        "sample_stddev": round(statistics.stdev(values), 6) if len(values) > 1 else 0.0,
        "minimum": round(min(values), 6),
        "maximum": round(max(values), 6),
    }


def run_multi_seed_benchmark(
    *,
    seeds: Sequence[int] = (7, 21, 42, 84, 126),
    rounds: int = 5,
    hash_dim: int = 1024,
) -> Dict[str, Any]:
    ordered_seeds = tuple(int(seed) for seed in seeds)
    if not ordered_seeds:
        raise ValueError("Multi-seed benchmark requires at least one seed.")
    if len(set(ordered_seeds)) != len(ordered_seeds):
        raise ValueError("Multi-seed benchmark seeds must be unique.")

    pools = build_example_pools()
    seed_results: List[Dict[str, Any]] = []
    model_tensor_bytes = 0
    for seed in ordered_seeds:
        config = TrainingConfig(rounds=rounds, seed=seed, hash_dim=hash_dim)
        result = _run_training_benchmark(config, pools, include_centralized=False)
        model_tensor_bytes = result["model_tensor_bytes"]
        federated_global = result["global_metrics"]["federated"]
        first_perfect_round = next(
            (
                round_data["round_index"] + 1
                for round_data in result["round_summaries"]
                if round_data["aggregate_global_unseen_metrics"]["accuracy"] == 1.0
            ),
            None,
        )
        seed_results.append({
            "seed": seed,
            "local_only_transfer_correct": result["aggregate_local_correct"],
            "federated_transfer_correct": result["aggregate_federated_correct"],
            "transfer_total": len(pools.all_transfer),
            "transfer_gain_correct": result["aggregate_federated_correct"] - result["aggregate_local_correct"],
            "receivers_non_regressive": sum(
                int(values["non_regression"])
                for values in result["transfer_by_receiver"].values()
            ),
            "globally_unseen_federated_accuracy": federated_global["accuracy"],
            "globally_unseen_federated_macro_f1": federated_global["macro_f1"],
            "globally_unseen_local_only_average_accuracy": result["global_metrics"]["local_only_average"]["accuracy"],
            "first_round_with_perfect_globally_unseen_accuracy": first_perfect_round,
            "initial_model_weights_changed": result["initial_weight_changed"],
        })

    transfer_total = len(pools.all_transfer)
    sample_count_bytes = 8
    client_update_bytes = model_tensor_bytes + sample_count_bytes
    coordinator_inbound_bytes = client_update_bytes * len(SITES) * rounds
    global_broadcast_bytes = model_tensor_bytes * len(SITES) * rounds
    return {
        "study": "deterministic multi-seed robustness study for the federated terminology linker",
        "configuration": {
            "seeds": list(ordered_seeds),
            "seed_count": len(ordered_seeds),
            "rounds": rounds,
            "hash_dim": hash_dim,
            "local_epochs": TrainingConfig.local_epochs,
            "batch_size": TrainingConfig.batch_size,
            "learning_rate": TrainingConfig.learning_rate,
            "stddev_definition": "sample standard deviation across configured seeds",
        },
        "data_summary": data_summary(pools),
        "per_seed": seed_results,
        "aggregate": {
            "local_only_transfer_accuracy": _distribution([
                result["local_only_transfer_correct"] / transfer_total
                for result in seed_results
            ]),
            "federated_transfer_accuracy": _distribution([
                result["federated_transfer_correct"] / transfer_total
                for result in seed_results
            ]),
            "transfer_gain_correct": _distribution([
                float(result["transfer_gain_correct"])
                for result in seed_results
            ]),
            "globally_unseen_federated_accuracy": _distribution([
                result["globally_unseen_federated_accuracy"]
                for result in seed_results
            ]),
            "globally_unseen_federated_macro_f1": _distribution([
                result["globally_unseen_federated_macro_f1"]
                for result in seed_results
            ]),
            "globally_unseen_local_only_average_accuracy": _distribution([
                result["globally_unseen_local_only_average_accuracy"]
                for result in seed_results
            ]),
            "seeds_with_federated_transfer_non_regression": sum(
                int(result["receivers_non_regressive"] == len(SITES))
                for result in seed_results
            ),
            "seeds_with_perfect_federated_transfer": sum(
                int(result["federated_transfer_correct"] == transfer_total)
                for result in seed_results
            ),
            "seeds_with_perfect_globally_unseen_accuracy": sum(
                int(result["globally_unseen_federated_accuracy"] == 1.0)
                for result in seed_results
            ),
        },
        "communication_estimate": {
            "model_tensor_bytes_per_update": model_tensor_bytes,
            "sample_count_bytes_per_update": sample_count_bytes,
            "client_update_bytes": client_update_bytes,
            "coordinator_inbound_bytes_across_all_rounds": coordinator_inbound_bytes,
            "global_model_broadcast_bytes_across_all_rounds": global_broadcast_bytes,
            "two_way_model_traffic_bytes": coordinator_inbound_bytes + global_broadcast_bytes,
            "scope": "Tensor payload estimate only; excludes transport, encryption, framing, and serialization overhead.",
        },
        "limitations": [
            "Synthetic terminology examples only; this is not clinical accuracy evidence.",
            "Clients and coordinator run in one process; this is not a deployed hospital network.",
            "FedAvg gives data locality only; no DP-SGD or secure aggregation guarantee is claimed.",
        ],
    }


def run_federated_demo(
    base_dir: Path,
    rounds: int = 5,
    seed: int = 42,
    hash_dim: int = 1024,
) -> Dict[str, Any]:
    config = TrainingConfig(rounds=rounds, seed=seed, hash_dim=hash_dim)
    pools = build_example_pools()
    training = _run_training_benchmark(config, pools, include_centralized=True)
    global_state = training["global_state"]
    transfer_by_receiver = training["transfer_by_receiver"]
    global_metrics = training["global_metrics"]
    linker = FederatedTerminologyLinker(
        model=_model_from_state(global_state, config),
        input_dimension=config.hash_dim,
    )
    exchange_paths = (("India", "USA"), ("USA", "Australia"), ("Australia", "Europe"), ("Europe", "India"))
    site_agents = {site: TerminologyAgent(linker=linker) for site in SITES}
    case_study_conversions = []
    for source, target in exchange_paths:
        for report_path in _case_study_report_paths(base_dir, source, target):
            output = run_pipeline(
                report_path.read_text(encoding="utf-8"),
                source_country=source,
                target_country=target,
                terminology_agent=site_agents[source],
            )
            case_study_conversions.append({
                "source_country": source,
                "target_country": target,
                "report": report_path.name,
                "quality_metrics": output["quality_metrics"],
                "target_country_gaps": output["target_country_gaps"],
                "concept_maps": output["concept_maps"],
                "translation_results": output["translation_results"],
                "code_validation_results": output["code_validation_results"],
                "terminology_service_trace": output["terminology_service_trace"],
                "fhir_bundle": output["fhir_bundle"],
                "explanation_trace": output["explanation_trace"],
            })
    relay_conversions = [
        conversion
        for conversion in case_study_conversions
        if conversion["report"].startswith("relay_")
    ]

    return {
        "demo": "genuine federated terminology linking for four-country diabetes interoperability",
        "configuration": config.to_dict(),
        "data_summary": data_summary(pools),
        "privacy_report": {
            "raw_reports_shared_with_coordinator": False,
            "patient_identifiers_shared_with_coordinator": False,
            "patient_level_fhir_bundles_shared_with_coordinator": False,
            "coordinator_receives": "model tensors and site sample counts only",
            "formal_privacy_guarantee": False,
            "limitation": "FedAvg provides data locality only. Model updates can leak training information without DP-SGD or secure aggregation.",
            "simulation_limitation": "Clients and coordinator are simulated in one Python process; production deployment needs process and network isolation.",
        },
        "quality_metrics": {
            "initial_model_weights_changed": training["initial_weight_changed"],
            "transfer_non_regression_by_receiver": {
                receiver: values["non_regression"]
                for receiver, values in transfer_by_receiver.items()
            },
            "aggregate_transfer_correct_local_only": training["aggregate_local_correct"],
            "aggregate_transfer_correct_federated": training["aggregate_federated_correct"],
            "aggregate_transfer_improved": training["aggregate_federated_correct"] > training["aggregate_local_correct"],
            "raw_reports_shared_with_coordinator": 0,
            "patient_level_fhir_bundles_shared_with_coordinator": 0,
        },
        "benchmarks": {
            "globally_unseen": global_metrics,
            "cross_site_transfer_by_receiver": transfer_by_receiver,
            "centralized_reference_notice": "Offline benchmark only; it is not the deployed privacy-preserving approach.",
        },
        "semantic_mapping_validation": _semantic_mapping_validation(global_state, pools.all_transfer, config),
        "fhir_terminology_validation": {
            "translation_results": [
                result
                for conversion in case_study_conversions
                for result in conversion["translation_results"]
            ],
            "code_validation_results": [
                result
                for conversion in case_study_conversions
                for result in conversion["code_validation_results"]
            ],
        },
        "mapping_reuse_benefit": _mapping_reuse_demo(linker),
        "rounds": training["round_summaries"],
        "case_study_conversions": case_study_conversions,
        "relay_conversions": relay_conversions,
    }


def _model_from_state(state: Mapping[str, torch.Tensor], config: TrainingConfig) -> TerminologyClassifier:
    model = TerminologyClassifier(config.hash_dim)
    model.load_state_dict(_clone_state(state))
    return model
