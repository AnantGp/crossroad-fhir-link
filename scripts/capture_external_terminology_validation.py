#!/usr/bin/env python3
"""Capture a patient-free terminology validation snapshot from tx.fhir.org."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict
from urllib.parse import urlencode
from urllib.request import Request, urlopen


DEFAULT_ENDPOINT = "https://tx.fhir.org/r4"
REPRESENTATIVE_CODES = (
    {
        "terminology": "SNOMED CT",
        "system": "http://snomed.info/sct",
        "code": "44054006",
        "expected_display": "Diabetes mellitus type II",
        "use": "Type 2 diabetes condition",
    },
    {
        "terminology": "LOINC",
        "system": "http://loinc.org",
        "code": "4548-4",
        "expected_display": "Hemoglobin A1c/Hemoglobin.total in Blood",
        "use": "HbA1c observation",
    },
    {
        "terminology": "RxNorm",
        "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
        "code": "6809",
        "expected_display": "metformin",
        "use": "Metformin medication ingredient",
    },
    {
        "terminology": "ICD-10",
        "system": "http://hl7.org/fhir/sid/icd-10",
        "code": "E11",
        "expected_display": "Type 2 diabetes mellitus",
        "use": "Type 2 diabetes classification",
    },
)


def _get_json(url: str, timeout: float) -> Dict[str, Any]:
    request = Request(
        url,
        headers={
            "Accept": "application/fhir+json",
            "User-Agent": "Cross-Border-IPS-AI-Agent/1.0 terminology-evidence",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _parameter_value(resource: Dict[str, Any], name: str) -> Any:
    for parameter in resource.get("parameter", []):
        if parameter.get("name") != name:
            continue
        value_key = next((key for key in parameter if key.startswith("value")), None)
        return parameter.get(value_key) if value_key else None
    return None


def capture(endpoint: str, timeout: float, checked_at: str | None = None) -> Dict[str, Any]:
    checks = []
    for concept in REPRESENTATIVE_CODES:
        query = urlencode({"system": concept["system"], "code": concept["code"]})
        lookup_url = f"{endpoint.rstrip('/')}/CodeSystem/$lookup?{query}"
        validate_url = f"{endpoint.rstrip('/')}/CodeSystem/$validate-code?{query}"
        lookup = _get_json(lookup_url, timeout)
        validation = _get_json(validate_url, timeout)

        lookup_display = _parameter_value(lookup, "display")
        validation_display = _parameter_value(validation, "display")
        valid = _parameter_value(validation, "result") is True
        if lookup.get("resourceType") != "Parameters" or validation.get("resourceType") != "Parameters":
            raise RuntimeError(f"Unexpected FHIR response for {concept['terminology']} {concept['code']}")
        if not valid:
            raise RuntimeError(f"$validate-code rejected {concept['terminology']} {concept['code']}")
        if lookup_display != concept["expected_display"] or validation_display != concept["expected_display"]:
            raise RuntimeError(
                f"Unexpected display for {concept['terminology']} {concept['code']}: "
                f"lookup={lookup_display!r}, validate={validation_display!r}"
            )

        checks.append({
            **concept,
            "lookup": {
                "operation": "$lookup",
                "result": True,
                "display": lookup_display,
                "version": _parameter_value(lookup, "version"),
            },
            "validate_code": {
                "operation": "$validate-code",
                "result": valid,
                "display": validation_display,
                "version": _parameter_value(validation, "version"),
            },
        })

    timestamp = checked_at or datetime.now(timezone.utc).isoformat(timespec="seconds")
    return {
        "evidence_type": "external FHIR terminology-service snapshot",
        "checked_at": timestamp,
        "endpoint": endpoint,
        "fhir_version": "R4",
        "summary": {
            "representative_codes_checked": len(checks),
            "lookup_passed": sum(int(item["lookup"]["result"]) for item in checks),
            "validate_code_passed": sum(int(item["validate_code"]["result"]) for item in checks),
        },
        "checks": checks,
        "privacy": "Only terminology system/code pairs were sent; no report text, patient identifiers, or FHIR patient Bundles were transmitted.",
        "scope": (
            "This independently verifies that the representative target codes are recognized by the external FHIR terminology server. "
            "It does not validate source-phrase extraction, prove that every semantic mapping is clinically correct, or provide certification."
        ),
        "translation_note": (
            "The prototype's local-phrase translation uses its own FHIR ConceptMap. The public server evidence covers $lookup and "
            "$validate-code only; no claim is made that tx.fhir.org executed the local ConceptMap $translate."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    parser.add_argument("--timeout", type=float, default=45.0)
    parser.add_argument("--checked-at", help="Optional fixed ISO timestamp for a reproducible evidence artifact.")
    parser.add_argument("--out", type=Path, default=Path("submission/external_terminology_validation.json"))
    args = parser.parse_args()

    payload = capture(args.endpoint, args.timeout, args.checked_at)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(
        f"Validated {payload['summary']['validate_code_passed']}/{payload['summary']['representative_codes_checked']} "
        f"representative codes via {args.endpoint}; wrote {args.out}"
    )


if __name__ == "__main__":
    main()
