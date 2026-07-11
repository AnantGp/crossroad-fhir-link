from __future__ import annotations

import uuid
from datetime import datetime, timezone
from html import escape
from typing import Any, Dict, Iterable, List

from .models import ClinicalFactModel, CodeMapping, MappedFact


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def _coding(mapping: CodeMapping) -> Dict[str, str]:
    return {
        "system": mapping.system,
        "code": mapping.code,
        "display": mapping.display,
    }


def _known_codings(mappings: Iterable[CodeMapping]) -> List[Dict[str, str]]:
    return [_coding(mapping) for mapping in mappings if not mapping.is_unknown]


def _reference(resource: Dict[str, Any]) -> str:
    return f"https://example.org/fhir/{resource['resourceType']}/{resource['id']}"


def _narrative(text: str) -> Dict[str, str]:
    return {
        "status": "generated",
        "div": f'<div xmlns="http://www.w3.org/1999/xhtml">{escape(text)}</div>',
    }


def _data_absent_reason(reason: str = "unknown") -> Dict[str, Any]:
    return {
        "extension": [{
            "url": "http://hl7.org/fhir/StructureDefinition/data-absent-reason",
            "valueCode": reason,
        }]
    }


class IPSBuilderAgent:
    """Builds an IPS-style FHIR R4 Bundle from the canonical graph."""

    def build(self, graph: ClinicalFactModel, mapped_facts: Iterable[MappedFact]) -> Dict[str, Any]:
        patient_id = graph.patient.get("id", "demo-patient")
        patient = self._patient(patient_id, graph)
        organization = self._organization(graph)
        patient_ref = _reference(patient)
        organization_ref = _reference(organization)
        resources: List[Dict[str, Any]] = [patient, organization]

        conditions = [mf for mf in mapped_facts if mf.fact.category == "condition"]
        labs = [mf for mf in mapped_facts if mf.fact.category == "lab"]
        vitals = [mf for mf in mapped_facts if mf.fact.category == "vital"]
        medications = [mf for mf in mapped_facts if mf.fact.category == "medication"]
        allergies = [mf for mf in mapped_facts if mf.fact.category == "allergy"]

        for idx, item in enumerate(conditions, 1):
            resources.append(self._condition(item, patient_ref, idx))
        for idx, item in enumerate([*labs, *vitals], 1):
            resources.append(self._observation(item, patient_ref, organization_ref, idx))
        for idx, item in enumerate(medications, 1):
            resources.append(self._medication_statement(item, patient_ref, idx))
        for idx, item in enumerate(allergies, 1):
            resources.append(self._allergy(item, patient_ref, idx))

        diagnostic_report = self._diagnostic_report(
            patient_ref,
            organization_ref,
            [r for r in resources if r["resourceType"] == "Observation"],
        )
        resources.append(diagnostic_report)
        resources.insert(0, self._composition(patient_ref, organization_ref, resources, graph))

        return {
            "resourceType": "Bundle",
            "id": _id("ips-bundle"),
            "type": "document",
            "timestamp": _now(),
            "identifier": {
                "system": "urn:cross-border-ips-agent",
                "value": f"{graph.source_country}-to-{graph.target_country}",
            },
            "entry": [
                {
                    "fullUrl": _reference(resource),
                    "resource": resource,
                }
                for resource in resources
            ],
        }

    def _patient(self, patient_id: str, graph: ClinicalFactModel) -> Dict[str, Any]:
        patient: Dict[str, Any] = {
            "resourceType": "Patient",
            "id": patient_id,
            "text": _narrative("Synthetic demo patient. Real patient identifiers are unavailable in the source report."),
            "active": True,
            "name": [{"use": "anonymous", "text": "Synthetic Demo Patient"}],
        }
        if "sex" in graph.patient:
            patient["gender"] = graph.patient["sex"]
        patient["_birthDate"] = _data_absent_reason("unknown")
        return patient

    def _organization(self, graph: ClinicalFactModel) -> Dict[str, Any]:
        return {
            "resourceType": "Organization",
            "id": "demo-source-organization",
            "text": _narrative(f"Synthetic source organization for {graph.source_country}."),
            "name": f"Synthetic {graph.source_country} source organization",
        }

    def _composition(
        self,
        patient_ref: str,
        organization_ref: str,
        resources: List[Dict[str, Any]],
        graph: ClinicalFactModel,
    ) -> Dict[str, Any]:
        section_map = {
            "Problems": ("11450-4", "Problem list - Reported", ["Condition"]),
            "Allergies": ("48765-2", "Allergies and adverse reactions Document", ["AllergyIntolerance"]),
            "Medications": ("10160-0", "History of Medication use Narrative", ["MedicationStatement"]),
            "Results": ("30954-2", "Relevant diagnostic tests/laboratory data note", ["Observation", "DiagnosticReport"]),
        }
        sections = []
        for title, (section_code, section_display, resource_types) in section_map.items():
            entries = [
                {"reference": _reference(resource)}
                for resource in resources
                if resource["resourceType"] in resource_types
            ]
            section: Dict[str, Any] = {
                "title": title,
                "code": {
                    "coding": [{
                        "system": "http://loinc.org",
                        "code": section_code,
                        "display": section_display,
                    }]
                },
                "text": _narrative(
                    f"{title} section generated from the source report."
                    if entries
                    else f"No source information was available for the {title.lower()} section."
                ),
            }
            if entries:
                section["entry"] = entries
            else:
                section["emptyReason"] = {
                    "coding": [{
                        "system": "http://terminology.hl7.org/CodeSystem/list-empty-reason",
                        "code": "unavailable",
                        "display": "Unavailable",
                    }],
                    "text": "No source information was available for this section.",
                }
            sections.append(section)
        return {
            "resourceType": "Composition",
            "id": _id("composition"),
            "text": _narrative(f"International Patient Summary from {graph.source_country} to {graph.target_country}."),
            "status": "final",
            "type": {
                "coding": [{
                    "system": "http://loinc.org",
                    "code": "60591-5",
                    "display": "Patient summary Document",
                }]
            },
            "subject": {"reference": patient_ref},
            "author": [{"reference": organization_ref}],
            "date": _now(),
            "title": f"International Patient Summary: {graph.source_country} to {graph.target_country}",
            "section": sections,
        }

    def _condition(self, item: MappedFact, patient_ref: str, idx: int) -> Dict[str, Any]:
        snomed = item.primary_mapping("SNOMED CT")
        icd = item.primary_mapping("ICD-10")
        codings = _known_codings([snomed])
        if not icd.is_unknown:
            codings.append(_coding(icd))
        code: Dict[str, Any] = {"text": item.fact.text}
        if codings:
            code["coding"] = codings
        return {
            "resourceType": "Condition",
            "id": f"condition-{idx}",
            "text": _narrative(f"Condition extracted from source text: {item.fact.source_text}."),
            "clinicalStatus": {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                    "code": "active",
                }]
            },
            "code": code,
            "subject": {"reference": patient_ref},
        }

    def _observation(self, item: MappedFact, patient_ref: str, organization_ref: str, idx: int) -> Dict[str, Any]:
        mapping = item.primary_mapping("LOINC")
        code: Dict[str, Any] = {"text": item.fact.text}
        if not mapping.is_unknown:
            code["coding"] = [_coding(mapping)]
        resource: Dict[str, Any] = {
            "resourceType": "Observation",
            "id": f"observation-{idx}",
            "text": _narrative(f"Observation extracted from source text: {item.fact.source_text}."),
            "status": "final",
            "category": [{
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                    "code": "laboratory" if item.fact.category == "lab" else "vital-signs",
                }]
            }],
            "code": code,
            "subject": {"reference": patient_ref},
            "performer": [{"reference": organization_ref}],
            "_effectiveDateTime": _data_absent_reason("unknown"),
        }
        if item.fact.normalized == "blood pressure":
            resource["component"] = [
                {
                    "code": {"text": "Systolic blood pressure"},
                    "valueQuantity": {
                        "value": item.fact.attributes.get("systolic"),
                        "unit": "mmHg",
                        "system": "http://unitsofmeasure.org",
                        "code": "mm[Hg]",
                    },
                },
                {
                    "code": {"text": "Diastolic blood pressure"},
                    "valueQuantity": {
                        "value": item.fact.attributes.get("diastolic"),
                        "unit": "mmHg",
                        "system": "http://unitsofmeasure.org",
                        "code": "mm[Hg]",
                    },
                },
            ]
        elif item.fact.value is not None:
            resource["valueQuantity"] = {
                "value": item.fact.value,
                "unit": item.fact.unit,
                "system": "http://unitsofmeasure.org",
                "code": item.fact.unit,
            }
        else:
            resource["valueString"] = item.fact.text
        return resource

    def _medication_statement(self, item: MappedFact, patient_ref: str, idx: int) -> Dict[str, Any]:
        mapping = item.primary_mapping("RxNorm")
        medication: Dict[str, Any] = {"text": item.fact.text}
        if not mapping.is_unknown:
            medication["coding"] = [_coding(mapping)]
        resource: Dict[str, Any] = {
            "resourceType": "MedicationStatement",
            "id": f"medication-{idx}",
            "text": _narrative(
                f"Medication extracted from source text: {item.fact.source_text}. "
                "Frequency, route, and start date were not available unless explicitly stated."
            ),
            "status": "active",
            "medicationCodeableConcept": medication,
            "subject": {"reference": patient_ref},
            "_effectiveDateTime": _data_absent_reason("unknown"),
        }
        if "dose_value" in item.fact.attributes:
            resource["dosage"] = [{
                "text": "Dose value extracted; frequency, route, and start date were not available in the source report.",
                "doseAndRate": [{
                    "doseQuantity": {
                        "value": item.fact.attributes["dose_value"],
                        "unit": item.fact.attributes.get("dose_unit", "mg"),
                    }
                }]
            }]
        return resource

    def _allergy(self, item: MappedFact, patient_ref: str, idx: int) -> Dict[str, Any]:
        mapping = item.primary_mapping("SNOMED CT")
        resource: Dict[str, Any] = {
            "resourceType": "AllergyIntolerance",
            "id": f"allergy-{idx}",
            "text": _narrative(f"Allergy information extracted from source text: {item.fact.source_text}."),
            "patient": {"reference": patient_ref},
        }
        code: Dict[str, Any] = {"text": item.fact.text}
        if not mapping.is_unknown:
            code["coding"] = [_coding(mapping)]
        if item.fact.normalized == "no known drug allergies":
            resource["code"] = code
            resource["code"]["text"] = "No known drug allergies"
            resource["clinicalStatus"] = {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                    "code": "inactive",
                }]
            }
        else:
            resource["code"] = code
            resource["clinicalStatus"] = {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                    "code": "active",
                }]
            }
        return resource

    def _diagnostic_report(
        self,
        patient_ref: str,
        organization_ref: str,
        observations: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        return {
            "resourceType": "DiagnosticReport",
            "id": _id("diagnostic-report"),
            "text": _narrative("System-generated grouping of extracted diabetes summary observations."),
            "status": "final",
            "code": {"text": "System-generated grouping of extracted diabetes summary results"},
            "subject": {"reference": patient_ref},
            "performer": [{"reference": organization_ref}],
            "_effectiveDateTime": _data_absent_reason("unknown"),
            "conclusion": "Generated from source report observations; not an original laboratory report.",
            "result": [
                {"reference": _reference(observation)}
                for observation in observations
            ],
        }
