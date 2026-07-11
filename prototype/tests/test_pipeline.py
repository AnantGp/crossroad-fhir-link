from __future__ import annotations

from pathlib import Path

from ips_agent.pipeline import run_pipeline


BASE = Path(__file__).resolve().parents[1]


def test_pipeline_generates_ips_bundle() -> None:
    report = (BASE / "examples" / "reports" / "india_diabetes_report.txt").read_text(encoding="utf-8")
    output = run_pipeline(report, source_country="India", target_country="USA")

    assert "fhir_bundle" in output
    assert "clinical_fact_model" in output
    assert "audit_trace" in output
    assert "target_country_gaps" in output
    assert "explanation_trace" in output
    assert "privacy_report" in output
    assert "quality_metrics" in output
    assert output["privacy_report"]["raw_report_leaves_local_site"] is False
    assert output["ips_bundle"]["resourceType"] == "Bundle"
    assert output["ips_bundle"]["type"] == "document"
    assert output["ips_bundle"]["entry"][0]["resource"]["resourceType"] == "Composition"
    resource_types = {entry["resource"]["resourceType"] for entry in output["ips_bundle"]["entry"]}
    assert "Composition" in resource_types
    assert "Patient" in resource_types
    assert "Condition" in resource_types
    assert "Observation" in resource_types
    assert output["metrics"]["facts_extracted"] >= 5
    assert output["metrics"]["internal_validation_errors"] == 0
    assert output["quality_metrics"]["official_fhir_validator_run"] is False


def test_usa_report_trace_uses_body_source_text_and_safer_fhir_references() -> None:
    report = (BASE / "examples" / "reports" / "usa_local_1.txt").read_text(encoding="utf-8")
    output = run_pipeline(report, source_country="USA", target_country="Europe")

    diabetes_trace = next(item for item in output["audit_trace"] if item["normalized_fact"] == "type 2 diabetes mellitus")
    assert diabetes_trace["source_text"] == "T2DM"
    assert diabetes_trace["fhir_resource"] == "Condition"
    assert diabetes_trace["fhir_reference"] == "https://example.org/fhir/Condition/condition-1"

    bundle = output["fhir_bundle"]
    composition = bundle["entry"][0]["resource"]
    assert composition["author"][0]["reference"] == "https://example.org/fhir/Organization/demo-source-organization"
    all_references = []
    for resource in (entry["resource"] for entry in bundle["entry"]):
        if resource.get("resourceType") == "Composition":
            all_references.append(resource["subject"]["reference"])
            all_references.extend(author["reference"] for author in resource["author"])
            for section in resource["section"]:
                all_references.extend(entry["reference"] for entry in section.get("entry", []))
        if resource.get("resourceType") == "DiagnosticReport":
            all_references.append(resource["subject"]["reference"])
            all_references.extend(result["reference"] for result in resource.get("result", []))
        if resource.get("resourceType") == "Condition":
            all_references.append(resource["subject"]["reference"])
            assert "recordedDate" not in resource
        if resource.get("resourceType") == "Observation":
            all_references.append(resource["subject"]["reference"])
            assert "effectiveDateTime" not in resource
        if resource.get("resourceType") == "MedicationStatement":
            all_references.append(resource["subject"]["reference"])
            assert "effectiveDateTime" not in resource

    full_urls = {entry["fullUrl"] for entry in bundle["entry"]}
    assert all(reference in full_urls for reference in all_references)


def test_us_profile_flags_expected_gaps() -> None:
    report = (BASE / "examples" / "reports" / "india_diabetes_report.txt").read_text(encoding="utf-8")
    output = run_pipeline(report, source_country="India", target_country="USA")
    codes = {finding["code"] for finding in output["target_profile_report"]}

    assert "RACE_ETHNICITY_UNAVAILABLE" in codes
    assert "ENCOUNTER_LOCATION_UNAVAILABLE" in codes



def test_australia_and_europe_profile_checks_are_readiness_only() -> None:
    report = (BASE / "examples" / "reports" / "relay_usa_to_australia.txt").read_text(encoding="utf-8")
    australia = run_pipeline(report, source_country="USA", target_country="Australia")
    europe = run_pipeline(report, source_country="USA", target_country="Europe")

    australia_codes = {finding["code"] for finding in australia["target_profile_report"]}
    europe_codes = {finding["code"] for finding in europe["target_profile_report"]}
    assert "AU_CORE_READINESS_ONLY" in australia_codes
    assert "EUROPEAN_PATIENT_SUMMARY_READINESS_ONLY" in europe_codes
