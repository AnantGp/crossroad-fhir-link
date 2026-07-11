from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List

from .models import MappedFact


@dataclass
class ValidationFinding:
    severity: str
    code: str
    message: str

    def to_dict(self) -> Dict[str, str]:
        return {
            "severity": self.severity,
            "code": self.code,
            "message": self.message,
        }


class ValidationAgent:
    def validate(self, bundle: Dict[str, Any], mapped_facts: Iterable[MappedFact]) -> List[ValidationFinding]:
        findings: List[ValidationFinding] = []

        if bundle.get("resourceType") != "Bundle":
            findings.append(ValidationFinding("error", "NOT_A_BUNDLE", "FHIR output is not a Bundle."))
        if bundle.get("type") != "document":
            findings.append(ValidationFinding("warning", "NOT_DOCUMENT_BUNDLE", "IPS-style output should be a document Bundle."))

        resources = [entry.get("resource", {}) for entry in bundle.get("entry", [])]
        resource_types = {resource.get("resourceType") for resource in resources}
        composition_first = bool(resources and resources[0].get("resourceType") == "Composition")
        findings.append(ValidationFinding(
            "ok" if composition_first else "error",
            "COMPOSITION_FIRST_ENTRY" if composition_first else "COMPOSITION_NOT_FIRST_ENTRY",
            "Composition is the first entry in the document Bundle."
            if composition_first
            else "A FHIR document Bundle must place Composition in its first entry.",
        ))
        for resource_type in ["Composition", "Patient"]:
            findings.append(ValidationFinding(
                "ok" if resource_type in resource_types else "error",
                f"{resource_type.upper()}_{'FOUND' if resource_type in resource_types else 'MISSING'}",
                f"{resource_type} resource {'found' if resource_type in resource_types else 'missing'}.",
            ))

        unknown_count = 0
        for mapped_fact in mapped_facts:
            if any(mapping.is_unknown for mapping in mapped_fact.mappings):
                unknown_count += 1
        findings.append(ValidationFinding(
            "warning" if unknown_count else "ok",
            "UNKNOWN_MAPPINGS" if unknown_count else "ALL_FACTS_MAPPED",
            f"{unknown_count} extracted fact(s) could not be mapped to a known terminology code." if unknown_count else "All extracted facts have terminology mappings.",
        ))

        unsupported = self._unsupported_generated_resources(resources)
        findings.append(ValidationFinding(
            "error" if unsupported else "ok",
            "UNSUPPORTED_GENERATED_FACTS" if unsupported else "NO_UNSUPPORTED_FACTS",
            f"{unsupported} generated resource(s) lack source-backed coding/text." if unsupported else "Generated clinical resources are source-backed.",
        ))
        return findings

    def _unsupported_generated_resources(self, resources: List[Dict[str, Any]]) -> int:
        unsupported = 0
        for resource in resources:
            resource_type = resource.get("resourceType")
            if resource_type == "Condition" and not resource.get("code", {}).get("text"):
                unsupported += 1
            if resource_type == "Observation" and not resource.get("code", {}).get("text"):
                unsupported += 1
            if resource_type == "MedicationStatement" and not resource.get("medicationCodeableConcept", {}).get("text"):
                unsupported += 1
        return unsupported
