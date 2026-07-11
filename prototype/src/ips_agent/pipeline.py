from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

from .explainer import ExplanationAgent
from .extractor import ReportUnderstandingAgent
from .ips_builder import IPSBuilderAgent
from .profiles import CountryProfileAgent
from .terminology import TerminologyAgent, mapping_coverage
from .validator import ValidationAgent


FHIR_RESOURCE_BY_CATEGORY = {
    "condition": "Condition",
    "lab": "Observation",
    "vital": "Observation",
    "medication": "MedicationStatement",
    "allergy": "AllergyIntolerance",
}


def _audit_trace(mapped_facts: Iterable[Any]) -> List[Dict[str, Any]]:
    counters = {resource_type: 0 for resource_type in set(FHIR_RESOURCE_BY_CATEGORY.values())}
    trace: List[Dict[str, Any]] = []
    for mapped_fact in mapped_facts:
        resource_type = FHIR_RESOURCE_BY_CATEGORY.get(mapped_fact.fact.category)
        fhir_reference = None
        if resource_type:
            counters[resource_type] += 1
            prefix = {
                "Condition": "condition",
                "Observation": "observation",
                "MedicationStatement": "medication",
                "AllergyIntolerance": "allergy",
            }[resource_type]
            fhir_reference = f"https://example.org/fhir/{resource_type}/{prefix}-{counters[resource_type]}"

        known_mappings = [mapping for mapping in mapped_fact.mappings if not mapping.is_unknown]
        trace_item: Dict[str, Any] = {
            "source_text": mapped_fact.fact.source_text,
            "extracted_fact": mapped_fact.fact.text,
            "normalized_fact": mapped_fact.fact.normalized,
            "category": mapped_fact.fact.category,
            "codes": [
                {
                    "standard": mapping.standard,
                    "system": mapping.system,
                    "code": mapping.code,
                    "display": mapping.display,
                    "source": mapping.source,
                }
                for mapping in known_mappings
            ],
            "human_review_required": any(mapping.human_review_required for mapping in mapped_fact.mappings),
            "fhir_resource": resource_type,
            "fhir_reference": fhir_reference,
        }
        if mapped_fact.fact.value is not None:
            trace_item["value"] = mapped_fact.fact.value
        if mapped_fact.fact.unit:
            trace_item["unit"] = mapped_fact.fact.unit
        trace.append(trace_item)
    return trace


def run_pipeline(
    report_text: str,
    source_country: str,
    target_country: str,
    terminology_agent: Optional[TerminologyAgent] = None,
) -> Dict[str, Any]:
    extractor = ReportUnderstandingAgent()
    terminology = terminology_agent or TerminologyAgent()
    ips_builder = IPSBuilderAgent()
    profile_agent = CountryProfileAgent()
    validator = ValidationAgent()
    explainer = ExplanationAgent()

    graph = extractor.extract(report_text, source_country=source_country, target_country=target_country)
    mapped_facts = terminology.map_graph(graph)
    terminology_evidence = terminology.export_fhir_terminology_evidence()
    ips_bundle = ips_builder.build(graph, mapped_facts)
    audit_trace = _audit_trace(mapped_facts)
    profile_findings = profile_agent.check(ips_bundle, target_country=target_country)
    validation_findings = validator.validate(ips_bundle, mapped_facts)
    explanations = explainer.explain(mapped_facts, profile_findings, validation_findings)
    mapped_count, total_count = mapping_coverage(mapped_facts)
    target_country_gaps = [
        finding.to_dict()
        for finding in profile_findings
        if finding.severity in {"warning", "error"}
    ]
    internal_validation_errors = sum(1 for finding in validation_findings if finding.severity == "error")
    profile_warnings = sum(1 for finding in profile_findings if finding.severity == "warning")
    resource_count = len(ips_bundle.get("entry", []))
    mapping_coverage_value = round(mapped_count / total_count, 3) if total_count else 0.0
    quality_metrics = {
        "facts_extracted": total_count,
        "facts_mapped": mapped_count,
        "terminology_mapping_coverage": mapping_coverage_value,
        "fhir_resource_count": resource_count,
        "fhir_generation_success": internal_validation_errors == 0,
        "internal_validation_errors": internal_validation_errors,
        "official_fhir_validator_run": False,
        # Backward-compatible alias. This is internal validation, not an official
        # HL7 FHIR validator result.
        "validation_errors": internal_validation_errors,
        "unresolved_target_country_gaps": len(target_country_gaps),
        "raw_reports_shared_with_coordinator": 0,
        "source_data_limitations": [
            "Structured patient identifiers are synthetic or unavailable.",
            "Clinical event dates are unavailable unless explicitly present in the source.",
            "Medication frequency, route, and start date are unavailable when not stated.",
            "Allergy status is unknown unless stated in the source report.",
        ],
    }
    privacy_report = {
        "raw_report_leaves_local_site": False,
        "patient_identifiers_shared_with_coordinator": False,
        "fhir_bundle_shared_with_coordinator": False,
        "coordinator_receives": "none in single-report mode",
        "safe_to_demo_with_synthetic_data": True,
    }

    return {
        "input": {
            "source_country": source_country,
            "target_country": target_country,
        },
        "quality_metrics": quality_metrics,
        "privacy_report": privacy_report,
        "clinical_fact_model": graph.to_dict(),
        "audit_trace": audit_trace,
        "fhir_terminology_artifacts": terminology_evidence["fhir_terminology_artifacts"],
        "concept_maps": terminology_evidence["concept_maps"],
        "translation_results": terminology_evidence["translation_results"],
        "code_validation_results": terminology_evidence["code_validation_results"],
        "terminology_service_trace": terminology_evidence["terminology_service_trace"],
        "learned_mapping_cache": terminology_evidence["learned_mapping_cache"],
        "clinical_knowledge_graph": graph.to_dict(),
        "terminology_mappings": [mapped_fact.to_dict() for mapped_fact in mapped_facts],
        "fhir_bundle": ips_bundle,
        "target_country_gaps": target_country_gaps,
        "explanation_trace": explanations,
        # Backward-compatible keys used by earlier tests/docs.
        "metrics": {
            "facts_extracted": total_count,
            "facts_mapped": mapped_count,
            "mapping_coverage": mapping_coverage_value,
            "profile_warnings": profile_warnings,
            "internal_validation_errors": internal_validation_errors,
            "validation_errors": internal_validation_errors,
        },
        "ips_bundle": ips_bundle,
        "target_profile_report": [finding.to_dict() for finding in profile_findings],
        "validation_results": [finding.to_dict() for finding in validation_findings],
        "explanations": explanations,
    }
