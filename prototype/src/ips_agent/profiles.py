from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass
class ProfileFinding:
    profile: str
    severity: str
    code: str
    message: str

    def to_dict(self) -> Dict[str, str]:
        return {
            "profile": self.profile,
            "severity": self.severity,
            "code": self.code,
            "message": self.message,
        }


def _resources(bundle: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [entry.get("resource", {}) for entry in bundle.get("entry", [])]


def _has_resource(bundle: Dict[str, Any], resource_type: str) -> bool:
    return any(resource.get("resourceType") == resource_type for resource in _resources(bundle))


def _medications_missing_dosage(bundle: Dict[str, Any]) -> int:
    count = 0
    for resource in _resources(bundle):
        if resource.get("resourceType") == "MedicationStatement" and not resource.get("dosage"):
            count += 1
    return count


class CountryProfileAgent:
    """Checks target readiness without claiming full IG conformance."""

    def check(self, bundle: Dict[str, Any], target_country: str) -> List[ProfileFinding]:
        findings: List[ProfileFinding] = []
        findings.extend(self._universal_ips(bundle))

        target = target_country.lower()
        if target in {"usa", "us", "united states", "united states of america"}:
            findings.extend(self._us_core_readiness(bundle))
        elif target in {"india", "bharat"}:
            findings.extend(self._india_abdm_readiness(bundle))
        elif target in {"australia", "au"}:
            findings.extend(self._australia_au_core_readiness(bundle))
        elif target in {"europe", "eu", "european union"}:
            findings.extend(self._european_patient_summary_readiness(bundle))
        else:
            findings.append(ProfileFinding(
                profile="target-profile",
                severity="warning",
                code="PROFILE_NOT_IMPLEMENTED",
                message=f"No country-specific checker implemented for {target_country}; universal IPS checks only.",
            ))
        return findings

    def _universal_ips(self, bundle: Dict[str, Any]) -> List[ProfileFinding]:
        findings: List[ProfileFinding] = []
        required = ["Composition", "Patient"]
        for resource_type in required:
            findings.append(ProfileFinding(
                profile="universal_ips",
                severity="ok" if _has_resource(bundle, resource_type) else "error",
                code=f"{resource_type.upper()}_{'PRESENT' if _has_resource(bundle, resource_type) else 'MISSING'}",
                message=f"{resource_type} resource {'is present' if _has_resource(bundle, resource_type) else 'is missing'}.",
            ))

        for section_type in ["Condition", "MedicationStatement", "Observation", "AllergyIntolerance"]:
            findings.append(ProfileFinding(
                profile="universal_ips",
                severity="ok" if _has_resource(bundle, section_type) else "warning",
                code=f"{section_type.upper()}_{'PRESENT' if _has_resource(bundle, section_type) else 'MISSING'}",
                message=f"{section_type} {'available' if _has_resource(bundle, section_type) else 'not found in source report'}.",
            ))
        return findings

    def _us_core_readiness(self, bundle: Dict[str, Any]) -> List[ProfileFinding]:
        missing_dosage = _medications_missing_dosage(bundle)
        return [
            ProfileFinding(
                profile="us_core_readiness",
                severity="warning",
                code="RACE_ETHNICITY_UNAVAILABLE",
                message="Race/ethnicity is not available in the synthetic source report; flag as target-profile gap rather than inventing it.",
            ),
            ProfileFinding(
                profile="us_core_readiness",
                severity="warning" if missing_dosage else "ok",
                code="MEDICATION_DOSAGE_GAP" if missing_dosage else "MEDICATION_DOSAGE_PRESENT",
                message=f"{missing_dosage} medication(s) missing dosage details." if missing_dosage else "Medication dosage details are present where medications were found.",
            ),
            ProfileFinding(
                profile="us_core_readiness",
                severity="warning",
                code="ENCOUNTER_LOCATION_UNAVAILABLE",
                message="Encounter location is not available in the source report.",
            ),
        ]

    def _india_abdm_readiness(self, bundle: Dict[str, Any]) -> List[ProfileFinding]:
        return [
            ProfileFinding(
                profile="india_abdm_readiness",
                severity="warning",
                code="ABHA_ID_UNAVAILABLE",
                message="ABHA identifier is not available in the synthetic source report.",
            ),
            ProfileFinding(
                profile="india_abdm_readiness",
                severity="warning",
                code="FACILITY_IDENTIFIER_UNAVAILABLE",
                message="Facility identifier is not available in the source report.",
            ),
            ProfileFinding(
                profile="india_abdm_readiness",
                severity="warning",
                code="ABDM_DRAFT_READINESS_ONLY",
                message="This is an ABDM draft-guide readiness check, not a formal ABDM conformance result.",
            ),
        ]

    def _australia_au_core_readiness(self, bundle: Dict[str, Any]) -> List[ProfileFinding]:
        return [
            ProfileFinding(
                profile="au_core_readiness",
                severity="warning",
                code="AU_PATIENT_IDENTIFIER_UNAVAILABLE",
                message="An Australian patient identifier is not available in the synthetic source report.",
            ),
            ProfileFinding(
                profile="au_core_readiness",
                severity="warning",
                code="AU_ORGANIZATION_IDENTIFIER_UNAVAILABLE",
                message="An Australian provider or organisation identifier is not available in the source report.",
            ),
            ProfileFinding(
                profile="au_core_readiness",
                severity="warning",
                code="AU_CORE_READINESS_ONLY",
                message="This check references AU Core 2.0.0 trial-use material and does not claim formal AU Core conformance.",
            ),
        ]

    def _european_patient_summary_readiness(self, bundle: Dict[str, Any]) -> List[ProfileFinding]:
        return [
            ProfileFinding(
                profile="european_patient_summary_readiness",
                severity="warning",
                code="EU_PATIENT_IDENTIFIER_UNAVAILABLE",
                message="A receiving-European-system patient identifier is not available in the synthetic source report.",
            ),
            ProfileFinding(
                profile="european_patient_summary_readiness",
                severity="warning",
                code="EU_LANGUAGE_PREFERENCE_UNAVAILABLE",
                message="Language preference and translation metadata are not available in the source report.",
            ),
            ProfileFinding(
                profile="european_patient_summary_readiness",
                severity="warning",
                code="EUROPEAN_PATIENT_SUMMARY_READINESS_ONLY",
                message="This check references the European Patient Summary continuous build and does not claim conformance.",
            ),
        ]
