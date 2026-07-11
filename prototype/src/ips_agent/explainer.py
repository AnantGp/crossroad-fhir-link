from __future__ import annotations

from typing import Dict, Iterable, List

from .models import MappedFact
from .profiles import ProfileFinding
from .validator import ValidationFinding


class ExplanationAgent:
    def explain(
        self,
        mapped_facts: Iterable[MappedFact],
        profile_findings: Iterable[ProfileFinding],
        validation_findings: Iterable[ValidationFinding],
    ) -> List[Dict[str, str]]:
        explanations: List[Dict[str, str]] = []
        for mapped_fact in mapped_facts:
            mapping_text = ", ".join(
                f"{mapping.standard} {mapping.code}" for mapping in mapped_fact.mappings if not mapping.is_unknown
            )
            if mapping_text:
                message = (
                    f"'{mapped_fact.fact.source_text}' was normalized as '{mapped_fact.fact.normalized}' "
                    f"and mapped to {mapping_text}."
                )
            else:
                message = (
                    f"'{mapped_fact.fact.source_text}' was extracted, but no safe terminology mapping was found; "
                    "the system marks it as uncertain instead of inventing a code."
                )
            explanations.append({"type": "mapping", "message": message})

        for finding in profile_findings:
            if finding.severity in {"warning", "error"}:
                explanations.append({
                    "type": "profile_gap",
                    "message": f"{finding.profile}: {finding.message}",
                })

        for finding in validation_findings:
            if finding.severity == "error":
                explanations.append({
                    "type": "validation_error",
                    "message": finding.message,
                })
        return explanations
