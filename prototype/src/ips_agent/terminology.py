from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional, Protocol, Tuple

from .fhir_terminology import FHIRTerminologyService
from .models import ClinicalFact, CodeMapping, ClinicalKnowledgeGraph, MappedFact


SNOMED = "http://snomed.info/sct"
LOINC = "http://loinc.org"
ICD10 = "http://hl7.org/fhir/sid/icd-10"
RXNORM = "http://www.nlm.nih.gov/research/umls/rxnorm"


@dataclass(frozen=True)
class TerminologyEntry:
    standard: str
    system: str
    code: str
    display: str


@dataclass(frozen=True)
class LinkPrediction:
    canonical_concept: Optional[str]
    confidence: float
    human_review_required: bool


class TerminologyLinker(Protocol):
    """Optional learned fallback for local terms absent from the registry."""

    def predict(self, mention: str, category: str) -> LinkPrediction:
        ...


BASE_TERMINOLOGY: Dict[str, List[TerminologyEntry]] = {
    "type 2 diabetes mellitus": [
        TerminologyEntry("SNOMED CT", SNOMED, "44054006", "Type 2 diabetes mellitus"),
        TerminologyEntry("ICD-10", ICD10, "E11", "Type 2 diabetes mellitus"),
    ],
    "diabetes mellitus": [
        TerminologyEntry("SNOMED CT", SNOMED, "73211009", "Diabetes mellitus"),
        TerminologyEntry("ICD-10", ICD10, "E14", "Unspecified diabetes mellitus"),
    ],
    "hypertension": [
        TerminologyEntry("SNOMED CT", SNOMED, "38341003", "Hypertensive disorder"),
        TerminologyEntry("ICD-10", ICD10, "I10", "Essential (primary) hypertension"),
    ],
    "chronic kidney disease": [
        TerminologyEntry("SNOMED CT", SNOMED, "709044004", "Chronic kidney disease"),
        TerminologyEntry("ICD-10", ICD10, "N18", "Chronic kidney disease"),
    ],
    "dyslipidemia": [
        TerminologyEntry("SNOMED CT", SNOMED, "370992007", "Dyslipidemia"),
        TerminologyEntry("ICD-10", ICD10, "E78.5", "Hyperlipidemia, unspecified"),
    ],
    "hba1c": [
        TerminologyEntry("LOINC", LOINC, "4548-4", "Hemoglobin A1c/Hemoglobin.total in Blood"),
    ],
    "fasting plasma glucose": [
        TerminologyEntry("LOINC", LOINC, "1558-6", "Fasting glucose [Mass/volume] in Serum or Plasma"),
    ],
    "random blood glucose": [
        TerminologyEntry("LOINC", LOINC, "2339-0", "Glucose [Mass/volume] in Blood"),
    ],
    "serum creatinine": [
        TerminologyEntry("LOINC", LOINC, "2160-0", "Creatinine [Mass/volume] in Serum or Plasma"),
    ],
    "estimated glomerular filtration rate": [
        TerminologyEntry("LOINC", LOINC, "33914-3", "Glomerular filtration rate/1.73 sq M.predicted"),
    ],
    "ldl cholesterol": [
        TerminologyEntry("LOINC", LOINC, "13457-7", "Cholesterol in LDL [Mass/volume] in Serum or Plasma"),
    ],
    "urine albumin creatinine ratio": [
        TerminologyEntry("LOINC", LOINC, "9318-7", "Albumin/Creatinine [Mass Ratio] in Urine"),
    ],
    "blood pressure": [
        TerminologyEntry("LOINC", LOINC, "85354-9", "Blood pressure panel with all children optional"),
    ],
    "metformin": [
        TerminologyEntry("RxNorm", RXNORM, "6809", "Metformin"),
    ],
    "insulin": [
        TerminologyEntry("RxNorm", RXNORM, "5856", "Insulin"),
    ],
    "lisinopril": [
        TerminologyEntry("RxNorm", RXNORM, "29046", "Lisinopril"),
    ],
    "atorvastatin": [
        TerminologyEntry("RxNorm", RXNORM, "83367", "Atorvastatin"),
    ],
    "empagliflozin": [
        TerminologyEntry("RxNorm", RXNORM, "1545653", "Empagliflozin"),
    ],
    "sitagliptin": [
        TerminologyEntry("RxNorm", RXNORM, "593411", "Sitagliptin"),
    ],
    "no known drug allergies": [
        TerminologyEntry("SNOMED CT", SNOMED, "716186003", "No known allergy"),
    ],
    "penicillin": [
        TerminologyEntry("SNOMED CT", SNOMED, "91936005", "Allergy to penicillin"),
    ],
}


BASE_ALIASES: Dict[str, str] = {
    "t2dm": "type 2 diabetes mellitus",
    "diabetes mellitus type 2": "type 2 diabetes mellitus",
    "a1c": "hba1c",
    "glycated hemoglobin": "hba1c",
    "glycated haemoglobin": "hba1c",
    "blood sugar fasting": "fasting plasma glucose",
    "fpg": "fasting plasma glucose",
    "rbs": "random blood glucose",
    "random blood sugar": "random blood glucose",
    "egfr": "estimated glomerular filtration rate",
    "uacr": "urine albumin creatinine ratio",
    "nkda": "no known drug allergies",
}


def normalize_term(term: str, aliases: Mapping[str, str]) -> str:
    key = " ".join(term.lower().strip().split())
    return aliases.get(key, key)


@dataclass
class TerminologyAgent:
    terminology: MutableMapping[str, List[TerminologyEntry]] = field(default_factory=lambda: dict(BASE_TERMINOLOGY))
    aliases: MutableMapping[str, str] = field(default_factory=lambda: dict(BASE_ALIASES))
    linker: Optional[TerminologyLinker] = None
    fhir_terminology: Optional[FHIRTerminologyService] = None
    _translation_results: List[Dict[str, Any]] = field(default_factory=list, init=False)
    _code_validation_results: List[Dict[str, Any]] = field(default_factory=list, init=False)
    _terminology_service_trace: List[Dict[str, Any]] = field(default_factory=list, init=False)
    _run_concept_map_ids: List[str] = field(default_factory=list, init=False)

    def __post_init__(self) -> None:
        if self.fhir_terminology is None:
            self.fhir_terminology = FHIRTerminologyService(self.terminology)

    def reset_run_evidence(self) -> None:
        self._translation_results = []
        self._code_validation_results = []
        self._terminology_service_trace = []
        self._run_concept_map_ids = []

    def add_alias(self, alias: str, canonical: str) -> None:
        alias_key = " ".join(alias.lower().strip().split())
        canonical_key = " ".join(canonical.lower().strip().split())
        if canonical_key in self.terminology:
            self.aliases[alias_key] = canonical_key

    def map_fact(self, fact: ClinicalFact, source_site: str = "local-site") -> MappedFact:
        canonical = normalize_term(fact.normalized, self.aliases)
        entries = self.terminology.get(canonical, [])
        mapping_source = "local terminology registry"
        confidence = fact.confidence
        review_required = False
        cached_mappings: Optional[List[CodeMapping]] = None

        if not entries and self.fhir_terminology:
            cached = self.fhir_terminology.lookup_cache(source_site, fact.category, fact.normalized)
            if cached:
                translation = self.fhir_terminology.translate_from_cache(source_site, fact.category, fact.normalized)
                if translation:
                    self._translation_results.append(translation)
                self._run_concept_map_ids.append(cached.concept_map_id)
                cached_mappings = [
                    CodeMapping(
                        standard=mapping.standard,
                        system=mapping.system,
                        code=mapping.code,
                        display=mapping.display,
                        source="local learned FHIR ConceptMap cache",
                        confidence=cached.confidence,
                    )
                    for mapping in cached.mappings
                ]
                for mapping in cached_mappings:
                    self._code_validation_results.append(self.fhir_terminology.validate_code(mapping, fact.category))
                self._terminology_service_trace.append({
                    "event": "learned_cache_hit",
                    "source_site": source_site,
                    "category": fact.category,
                    "mention": fact.normalized,
                    "canonical_concept": cached.canonical_concept,
                    "concept_map_id": cached.concept_map_id,
                })

        if cached_mappings is not None:
            return MappedFact(fact=fact, mappings=cached_mappings)

        if not entries and self.linker:
            self._terminology_service_trace.append({
                "event": "registry_miss",
                "source_site": source_site,
                "category": fact.category,
                "mention": fact.normalized,
            })
            prediction = self.linker.predict(fact.normalized, fact.category)
            self._terminology_service_trace.append({
                "event": "federated_prediction",
                "source_site": source_site,
                "category": fact.category,
                "mention": fact.normalized,
                "canonical_concept": prediction.canonical_concept,
                "confidence": round(prediction.confidence, 6),
                "human_review_required": prediction.human_review_required,
            })
            if prediction.canonical_concept and not prediction.human_review_required:
                canonical = prediction.canonical_concept
                entries = self.terminology.get(canonical, [])
                mapping_source = "federated terminology linker"
                confidence = prediction.confidence
                if entries and self.fhir_terminology:
                    learned, translation, validations = self.fhir_terminology.accept_federated_mapping(
                        source_site=source_site,
                        category=fact.category,
                        mention=fact.normalized,
                        canonical_concept=canonical,
                        confidence=confidence,
                        entries=entries,
                    )
                    self._translation_results.append(translation)
                    self._code_validation_results.extend(validations)
                    if learned:
                        mapping_source = "federated terminology linker + FHIR ConceptMap"
                        self._run_concept_map_ids.append(learned.concept_map_id)
                        self._terminology_service_trace.append({
                            "event": "concept_map_created",
                            "source_site": source_site,
                            "category": fact.category,
                            "mention": fact.normalized,
                            "canonical_concept": canonical,
                            "concept_map_id": learned.concept_map_id,
                        })
                        self._terminology_service_trace.append({
                            "event": "learned_cache_updated",
                            "source_site": source_site,
                            "category": fact.category,
                            "mention": fact.normalized,
                            "concept_map_id": learned.concept_map_id,
                        })
                    else:
                        entries = []
                        review_required = True
                        self._terminology_service_trace.append({
                            "event": "fhir_terminology_validation_failed",
                            "source_site": source_site,
                            "category": fact.category,
                            "mention": fact.normalized,
                            "canonical_concept": canonical,
                        })
            else:
                review_required = True
                confidence = prediction.confidence

        mappings = [
            CodeMapping(
                standard=entry.standard,
                system=entry.system,
                code=entry.code,
                display=entry.display,
                source=mapping_source,
                confidence=confidence,
            )
            for entry in entries
        ]
        if not mappings:
            mappings.append(
                CodeMapping(
                    standard="unknown",
                    system="urn:unknown",
                    code="unknown",
                    display=fact.text,
                    source=(
                        "federated terminology linker: human review required"
                        if review_required
                        else "unmapped"
                    ),
                    confidence=confidence if review_required else 0.0,
                    is_unknown=True,
                    human_review_required=review_required,
                )
            )
        return MappedFact(fact=fact, mappings=mappings)

    def map_graph(self, graph: ClinicalKnowledgeGraph) -> List[MappedFact]:
        self.reset_run_evidence()
        return [self.map_fact(fact, source_site=graph.source_country) for fact in graph.facts]

    def export_aliases(self) -> Dict[str, str]:
        return dict(self.aliases)

    def export_fhir_terminology_evidence(self) -> Dict[str, Any]:
        artifacts = (
            self.fhir_terminology.artifacts_for_run(self._run_concept_map_ids)
            if self.fhir_terminology
            else {"code_systems": [], "value_sets": [], "concept_maps": []}
        )
        return {
            "fhir_terminology_artifacts": artifacts,
            "concept_maps": artifacts["concept_maps"],
            "translation_results": list(self._translation_results),
            "code_validation_results": list(self._code_validation_results),
            "terminology_service_trace": list(self._terminology_service_trace),
            "learned_mapping_cache": self.fhir_terminology.cache_entries() if self.fhir_terminology else [],
        }


def mapping_coverage(mapped_facts: Iterable[MappedFact]) -> Tuple[int, int]:
    total = 0
    mapped = 0
    for mapped_fact in mapped_facts:
        total += 1
        if not any(mapping.is_unknown for mapping in mapped_fact.mappings):
            mapped += 1
    return mapped, total
