from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional, Sequence, Tuple

from .models import CodeMapping


SNOMED = "http://snomed.info/sct"
LOINC = "http://loinc.org"
ICD10 = "http://hl7.org/fhir/sid/icd-10"
RXNORM = "http://www.nlm.nih.gov/research/umls/rxnorm"


FHIR_BASE = "https://example.org/fhir"

CATEGORY_ALLOWED_SYSTEMS: Dict[str, Tuple[str, ...]] = {
    "condition": (SNOMED, ICD10),
    "allergy": (SNOMED,),
    "lab": (LOINC,),
    "vital": (LOINC,),
    "medication": (RXNORM,),
}


@dataclass(frozen=True)
class LearnedMapping:
    source_site: str
    category: str
    mention: str
    normalized_mention: str
    canonical_concept: str
    confidence: float
    mappings: Tuple[CodeMapping, ...]
    concept_map_id: str
    source_system: str
    source_code: str
    validation_status: str
    learned_at: str
    human_review_required: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_site": self.source_site,
            "category": self.category,
            "mention": self.mention,
            "normalized_mention": self.normalized_mention,
            "canonical_concept": self.canonical_concept,
            "confidence": round(self.confidence, 6),
            "mappings": [mapping.to_dict() for mapping in self.mappings],
            "concept_map_id": self.concept_map_id,
            "source_system": self.source_system,
            "source_code": self.source_code,
            "validation_status": self.validation_status,
            "learned_at": self.learned_at,
            "human_review_required": self.human_review_required,
        }


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "local-term"


def _site_slug(site: str) -> str:
    return _slug(site or "local-site")


def _cache_key(source_site: str, category: str, mention: str) -> Tuple[str, str, str]:
    return (_site_slug(source_site), category.lower().strip(), " ".join(mention.lower().strip().split()))


class FHIRTerminologyService:
    """Local FHIR-native terminology service facade for demo mappings.

    It simulates FHIR terminology operations in-process. It does not replace a
    production terminology server; it creates auditable FHIR resources around
    registry-backed and federated mappings.
    """

    def __init__(
        self,
        authoritative_terminology: Mapping[str, Sequence[Any]],
        confidence_threshold: float = 0.70,
    ) -> None:
        self.authoritative_terminology = authoritative_terminology
        self.confidence_threshold = confidence_threshold
        self._known_codes = {
            (entry.system, entry.code)
            for entries in authoritative_terminology.values()
            for entry in entries
        }
        self._learned_cache: MutableMapping[Tuple[str, str, str], LearnedMapping] = {}
        self._concept_maps: MutableMapping[str, Dict[str, Any]] = {}
        self._code_systems: MutableMapping[str, Dict[str, Any]] = {}
        self._value_sets: MutableMapping[str, Dict[str, Any]] = {}

    def lookup_cache(self, source_site: str, category: str, mention: str) -> Optional[LearnedMapping]:
        return self._learned_cache.get(_cache_key(source_site, category, mention))

    def translate_from_cache(self, source_site: str, category: str, mention: str) -> Optional[Dict[str, Any]]:
        learned = self.lookup_cache(source_site, category, mention)
        if not learned:
            return None
        return self._translation_result(learned, source="local learned FHIR ConceptMap cache")

    def accept_federated_mapping(
        self,
        *,
        source_site: str,
        category: str,
        mention: str,
        canonical_concept: str,
        confidence: float,
        entries: Sequence[TerminologyEntry],
    ) -> Tuple[Optional[LearnedMapping], Dict[str, Any], List[Dict[str, Any]]]:
        mappings = tuple(
            CodeMapping(
                standard=entry.standard,
                system=entry.system,
                code=entry.code,
                display=entry.display,
                source="federated terminology linker + FHIR ConceptMap",
                confidence=confidence,
            )
            for entry in entries
        )
        validations = [self.validate_code(mapping, category) for mapping in mappings]
        accepted = bool(mappings) and confidence >= self.confidence_threshold and all(item["result"] for item in validations)
        source_system = self._local_code_system_url(source_site)
        source_code = _slug(mention)
        concept_map_id = f"conceptmap-{_site_slug(source_site)}-{category}-{source_code}"
        learned: Optional[LearnedMapping] = None

        if accepted:
            learned = LearnedMapping(
                source_site=source_site,
                category=category,
                mention=mention,
                normalized_mention=" ".join(mention.lower().strip().split()),
                canonical_concept=canonical_concept,
                confidence=confidence,
                mappings=mappings,
                concept_map_id=concept_map_id,
                source_system=source_system,
                source_code=source_code,
                validation_status="validated",
                learned_at=_now(),
                human_review_required=False,
            )
            self._learned_cache[_cache_key(source_site, category, mention)] = learned
            self._upsert_code_system(source_site, source_code, mention)
            self._value_sets[category] = self._build_value_set(category)
            self._concept_maps[concept_map_id] = self._build_concept_map(learned)

        translation = (
            self._translation_result(learned, source="federated linker + generated FHIR ConceptMap")
            if learned
            else self._failed_translation(source_site, category, mention, canonical_concept, confidence)
        )
        return learned, translation, validations

    def validate_code(self, mapping: CodeMapping, category: str) -> Dict[str, Any]:
        allowed_systems = CATEGORY_ALLOWED_SYSTEMS.get(category, ())
        allowed = mapping.system in allowed_systems and (mapping.system, mapping.code) in self._known_codes
        return {
            "operation": "$validate-code",
            "category": category,
            "system": mapping.system,
            "code": mapping.code,
            "display": mapping.display,
            "result": allowed,
            "message": (
                "Code is allowed for this category and exists in the trusted registry."
                if allowed
                else "Code is not allowed for this category or is absent from the trusted registry."
            ),
        }

    def lookup(self, mapping: CodeMapping) -> Dict[str, Any]:
        found = (mapping.system, mapping.code) in self._known_codes
        return {
            "operation": "$lookup",
            "system": mapping.system,
            "code": mapping.code,
            "display": mapping.display,
            "result": found,
        }

    def artifacts_for_run(self, concept_map_ids: Iterable[str]) -> Dict[str, List[Dict[str, Any]]]:
        ids = tuple(dict.fromkeys(concept_map_ids))
        concept_maps = [self._concept_maps[item] for item in ids if item in self._concept_maps]
        source_systems = {
            group["source"]
            for concept_map in concept_maps
            for group in concept_map.get("group", [])
        }
        categories = {
            concept_map.get("extension", [{}])[0].get("valueString")
            for concept_map in concept_maps
            if concept_map.get("extension")
        }
        return {
            "code_systems": [
                self._code_systems[system]
                for system in sorted(source_systems)
                if system in self._code_systems
            ],
            "value_sets": [
                self._value_sets[category]
                for category in sorted(item for item in categories if item)
                if category in self._value_sets
            ],
            "concept_maps": concept_maps,
        }

    def cache_entries(self) -> List[Dict[str, Any]]:
        return [entry.to_dict() for _, entry in sorted(self._learned_cache.items())]

    def _local_code_system_url(self, source_site: str) -> str:
        return f"{FHIR_BASE}/CodeSystem/{_site_slug(source_site)}-local-diabetes-terms"

    def _build_code_system(self, source_site: str, source_code: str, display: str) -> Dict[str, Any]:
        site = _site_slug(source_site)
        return {
            "resourceType": "CodeSystem",
            "id": f"{site}-local-diabetes-terms",
            "url": self._local_code_system_url(source_site),
            "status": "active",
            "content": "fragment",
            "name": f"{site.title().replace('-', '')}LocalDiabetesTerms",
            "title": f"{source_site} local diabetes terms",
            "concept": [{
                "code": source_code,
                "display": display,
            }],
        }

    def _upsert_code_system(self, source_site: str, source_code: str, display: str) -> None:
        source_system = self._local_code_system_url(source_site)
        if source_system not in self._code_systems:
            self._code_systems[source_system] = self._build_code_system(source_site, source_code, display)
            return
        concepts = self._code_systems[source_system].setdefault("concept", [])
        if not any(concept.get("code") == source_code for concept in concepts):
            concepts.append({"code": source_code, "display": display})

    def _build_value_set(self, category: str) -> Dict[str, Any]:
        systems = CATEGORY_ALLOWED_SYSTEMS.get(category, ())
        includes = []
        for system in systems:
            codes = sorted(
                {entry.code for entries in self.authoritative_terminology.values() for entry in entries if entry.system == system}
            )
            includes.append({"system": system, "concept": [{"code": code} for code in codes]})
        return {
            "resourceType": "ValueSet",
            "id": f"allowed-{category}-codes",
            "url": f"{FHIR_BASE}/ValueSet/allowed-{category}-codes",
            "status": "active",
            "name": f"Allowed{category.title()}Codes",
            "title": f"Allowed {category} codes for cross-border diabetes mapping",
            "compose": {"include": includes},
        }

    def _build_concept_map(self, learned: LearnedMapping) -> Dict[str, Any]:
        groups = []
        for mapping in learned.mappings:
            groups.append({
                "source": learned.source_system,
                "target": mapping.system,
                "element": [{
                    "code": learned.source_code,
                    "display": learned.mention,
                    "target": [{
                        "code": mapping.code,
                        "display": mapping.display,
                        "equivalence": "equivalent",
                    }],
                }],
            })
        return {
            "resourceType": "ConceptMap",
            "id": learned.concept_map_id,
            "url": f"{FHIR_BASE}/ConceptMap/{learned.concept_map_id}",
            "status": "active",
            "name": learned.concept_map_id.replace("-", "_"),
            "title": f"{learned.source_site} local term to standard terminology mapping",
            "extension": [{
                "url": f"{FHIR_BASE}/StructureDefinition/mapping-category",
                "valueString": learned.category,
            }],
            "sourceUri": learned.source_system,
            "targetUri": f"{FHIR_BASE}/ValueSet/allowed-{learned.category}-codes",
            "group": groups,
        }

    def _translation_result(self, learned: LearnedMapping, source: str) -> Dict[str, Any]:
        return {
            "operation": "$translate",
            "source": source,
            "source_site": learned.source_site,
            "category": learned.category,
            "source_system": learned.source_system,
            "source_code": learned.source_code,
            "source_display": learned.mention,
            "canonical_concept": learned.canonical_concept,
            "concept_map_id": learned.concept_map_id,
            "result": True,
            "match": [
                {
                    "equivalence": "equivalent",
                    "concept": {
                        "system": mapping.system,
                        "code": mapping.code,
                        "display": mapping.display,
                    },
                }
                for mapping in learned.mappings
            ],
        }

    def _failed_translation(
        self,
        source_site: str,
        category: str,
        mention: str,
        canonical_concept: str,
        confidence: float,
    ) -> Dict[str, Any]:
        return {
            "operation": "$translate",
            "source": "federated linker + generated FHIR ConceptMap",
            "source_site": source_site,
            "category": category,
            "source_display": mention,
            "canonical_concept": canonical_concept,
            "confidence": round(confidence, 6),
            "result": False,
            "message": "Mapping was not accepted because confidence or code validation failed.",
        }
