from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ClinicalFact:
    category: str
    text: str
    normalized: str
    source_text: str
    value: Optional[float] = None
    unit: Optional[str] = None
    confidence: float = 1.0
    attributes: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        data: Dict[str, Any] = {
            "category": self.category,
            "text": self.text,
            "normalized": self.normalized,
            "source_text": self.source_text,
            "confidence": self.confidence,
            "attributes": self.attributes,
        }
        if self.value is not None:
            data["value"] = self.value
        if self.unit:
            data["unit"] = self.unit
        return data


@dataclass
class CodeMapping:
    standard: str
    system: str
    code: str
    display: str
    source: str
    confidence: float = 1.0
    is_unknown: bool = False
    human_review_required: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "standard": self.standard,
            "system": self.system,
            "code": self.code,
            "display": self.display,
            "source": self.source,
            "confidence": self.confidence,
            "is_unknown": self.is_unknown,
            "human_review_required": self.human_review_required,
        }


@dataclass
class MappedFact:
    fact: ClinicalFact
    mappings: List[CodeMapping] = field(default_factory=list)

    def primary_mapping(self, standard: Optional[str] = None) -> CodeMapping:
        candidates = self.mappings
        if standard:
            candidates = [m for m in candidates if m.standard == standard]
        if candidates:
            return candidates[0]
        return CodeMapping(
            standard=standard or "unknown",
            system="urn:unknown",
            code="unknown",
            display=self.fact.text,
            source="unmapped",
            confidence=0.0,
            is_unknown=True,
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fact": self.fact.to_dict(),
            "mappings": [mapping.to_dict() for mapping in self.mappings],
        }


@dataclass
class ClinicalFactModel:
    source_country: str
    target_country: str
    patient: Dict[str, Any]
    facts: List[ClinicalFact]

    def by_category(self, category: str) -> List[ClinicalFact]:
        return [fact for fact in self.facts if fact.category == category]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_country": self.source_country,
            "target_country": self.target_country,
            "patient": self.patient,
            "facts": [fact.to_dict() for fact in self.facts],
        }


# Backward-compatible name retained for older docs/tests/imports. The prototype
# now presents this structure as a fact model, not a graph database.
ClinicalKnowledgeGraph = ClinicalFactModel
