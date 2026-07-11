from __future__ import annotations

import re
from typing import Dict, Iterable, List, Optional, Pattern, Tuple

from .models import ClinicalFact, ClinicalFactModel


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _clinical_body(report_text: str) -> str:
    lines = report_text.splitlines()
    non_empty = [line.strip() for line in lines if line.strip()]
    if len(non_empty) > 1 and non_empty[0].lower().startswith("synthetic "):
        return "\n".join(non_empty[1:])
    return report_text


def _dedupe(facts: Iterable[ClinicalFact]) -> List[ClinicalFact]:
    seen = set()
    result: List[ClinicalFact] = []
    for fact in facts:
        key = (fact.category, fact.normalized, fact.value, fact.unit)
        if key not in seen:
            seen.add(key)
            result.append(fact)
    return result


def _overlaps(span: Tuple[int, int], spans: Iterable[Tuple[int, int]]) -> bool:
    start, end = span
    return any(start < used_end and end > used_start for used_start, used_end in spans)


def _prune_generic_diabetes(facts: Iterable[ClinicalFact]) -> List[ClinicalFact]:
    facts_list = list(facts)
    specific_diabetes = {
        "type 2 diabetes mellitus",
        "sugar disease",
        "madhumeha",
    }
    has_specific = any(fact.category == "condition" and fact.normalized in specific_diabetes for fact in facts_list)
    if not has_specific:
        return facts_list
    return [
        fact
        for fact in facts_list
        if not (fact.category == "condition" and fact.normalized == "diabetes mellitus")
    ]


def _phrase_fact(category: str, normalized: str, phrase: str, source: str, confidence: float = 0.92) -> ClinicalFact:
    return ClinicalFact(
        category=category,
        text=phrase,
        normalized=normalized,
        source_text=source,
        confidence=confidence,
    )


class ReportUnderstandingAgent:
    """Rule-backed clinical extraction agent for the demo slice.

    This intentionally stays deterministic so validation and judge review are easy.
    An LLM can later replace or assist this layer without changing the downstream contract.
    """

    CONDITION_PATTERNS: List[Tuple[str, Pattern[str]]] = [
        ("madhumeha type 2", re.compile(r"\b(madhumeha\s+type\s*2)\b", re.I)),
        ("sugar disease", re.compile(r"\b(sugar disease)\b", re.I)),
        ("madhumeha", re.compile(r"\b(madhumeha)\b", re.I)),
        ("type 2 diabetes mellitus", re.compile(r"\b(type\s*2 diabetes|t2dm|diabetes mellitus type 2)\b", re.I)),
        ("diabetes mellitus", re.compile(r"\b(diabetes mellitus|diabetes)\b", re.I)),
        ("hypertension", re.compile(r"\b(hypertension|high blood pressure)\b", re.I)),
        ("chronic kidney disease", re.compile(r"\b(chronic kidney disease|ckd)\b", re.I)),
        ("dyslipidemia", re.compile(r"\b(dyslipidemia|hyperlipidemia|high cholesterol)\b", re.I)),
    ]

    MEDICATION_PATTERNS: List[Tuple[str, Pattern[str]]] = [
        ("metformin", re.compile(r"\bmetformin\b(?:\s*(\d+(?:\.\d+)?)\s*mg)?", re.I)),
        ("insulin", re.compile(r"\binsulin\b", re.I)),
        ("lisinopril", re.compile(r"\blisinopril\b(?:\s*(\d+(?:\.\d+)?)\s*mg)?", re.I)),
        ("atorvastatin", re.compile(r"\batorvastatin\b(?:\s*(\d+(?:\.\d+)?)\s*mg)?", re.I)),
        ("empagliflozin", re.compile(r"\bempagliflozin\b(?:\s*(\d+(?:\.\d+)?)\s*mg)?", re.I)),
        ("sitagliptin", re.compile(r"\bsitagliptin\b(?:\s*(\d+(?:\.\d+)?)\s*mg)?", re.I)),
    ]

    LAB_PATTERNS: List[Tuple[str, str, Pattern[str]]] = [
        ("glyco hb", "%", re.compile(r"\b(glyco hb)[^\d]{0,20}(\d+(?:\.\d+)?)\s*%?", re.I)),
        ("renal function egfr", "mL/min/1.73m2", re.compile(r"\b(renal function e?gfr)[^\d]{0,20}(\d+(?:\.\d+)?)\s*(?:mL/min/1\.73m2|ml/min)?", re.I)),
        ("cholesterol ldl", "mg/dL", re.compile(r"\b(cholesterol ldl)[^\d]{0,20}(\d+(?:\.\d+)?)\s*(?:mg/dl|mg/dL)?", re.I)),
        ("hba1c", "%", re.compile(r"\b(?:hba1c|a1c|glycated h(?:ae|e)moglobin)[^\d]{0,20}(\d+(?:\.\d+)?)\s*%?", re.I)),
        ("fasting plasma glucose", "mg/dL", re.compile(r"\b(?:fasting plasma glucose|fasting glucose|fpg|blood sugar fasting)[^\d]{0,20}(\d+(?:\.\d+)?)\s*(?:mg/dl|mg/dL)?", re.I)),
        ("random blood glucose", "mg/dL", re.compile(r"\b(?:random glucose|random blood glucose|rbs|random blood sugar)[^\d]{0,20}(\d+(?:\.\d+)?)\s*(?:mg/dl|mg/dL)?", re.I)),
        ("serum creatinine", "mg/dL", re.compile(r"\b(?:serum creatinine|creatinine)[^\d]{0,20}(\d+(?:\.\d+)?)\s*(?:mg/dl|mg/dL)?", re.I)),
        ("estimated glomerular filtration rate", "mL/min/1.73m2", re.compile(r"\b(?:egfr|e-gfr|gfr)[^\d]{0,20}(\d+(?:\.\d+)?)\s*(?:mL/min/1\.73m2|ml/min)?", re.I)),
        ("ldl cholesterol", "mg/dL", re.compile(r"\b(?:ldl|ldl cholesterol)[^\d]{0,20}(\d+(?:\.\d+)?)\s*(?:mg/dl|mg/dL)?", re.I)),
        ("urine albumin creatinine ratio", "mg/g", re.compile(r"\b(?:uacr|urine albumin creatinine ratio|urine acr)[^\d]{0,20}(\d+(?:\.\d+)?)\s*(?:mg/g)?", re.I)),
    ]

    BP_PATTERN = re.compile(r"\b(?:bp|blood pressure)[^\d]{0,12}(\d{2,3})\s*/\s*(\d{2,3})\b", re.I)
    AGE_PATTERN = re.compile(r"\b(\d{1,3})\s*(?:year|yr)s?\s*old\b", re.I)
    SEX_PATTERN = re.compile(r"\b(male|female|man|woman)\b", re.I)

    def extract(self, report_text: str, source_country: str, target_country: str) -> ClinicalFactModel:
        text = _clean(_clinical_body(report_text))
        facts: List[ClinicalFact] = []

        patient = {
            "id": "demo-patient",
            "source_country": source_country,
        }

        age_match = self.AGE_PATTERN.search(text)
        if age_match:
            patient["age"] = int(age_match.group(1))

        sex_match = self.SEX_PATTERN.search(text)
        if sex_match:
            raw = sex_match.group(1).lower()
            patient["sex"] = "female" if raw in {"female", "woman"} else "male"

        used_condition_spans: List[Tuple[int, int]] = []
        for normalized, pattern in self.CONDITION_PATTERNS:
            for match in pattern.finditer(text):
                if _overlaps(match.span(), used_condition_spans):
                    continue
                used_condition_spans.append(match.span())
                facts.append(_phrase_fact("condition", normalized, match.group(1), match.group(0)))

        for normalized, pattern in self.MEDICATION_PATTERNS:
            for match in pattern.finditer(text):
                attrs: Dict[str, object] = {}
                if match.lastindex and match.group(1):
                    attrs["dose_value"] = float(match.group(1))
                    attrs["dose_unit"] = "mg"
                facts.append(
                    ClinicalFact(
                        category="medication",
                        text=match.group(0),
                        normalized=normalized,
                        source_text=match.group(0),
                        confidence=0.93,
                        attributes=attrs,
                    )
                )

        used_lab_spans: List[Tuple[int, int]] = []
        for normalized, unit, pattern in self.LAB_PATTERNS:
            for match in pattern.finditer(text):
                if _overlaps(match.span(), used_lab_spans):
                    continue
                used_lab_spans.append(match.span())
                value_group = match.lastindex or 1
                value = float(match.group(value_group))
                facts.append(
                    ClinicalFact(
                        category="lab",
                        text=f"{normalized}: {value} {unit}",
                        normalized=normalized,
                        value=value,
                        unit=unit,
                        source_text=match.group(0),
                        confidence=0.95,
                    )
                )

        for match in self.BP_PATTERN.finditer(text):
            facts.append(
                ClinicalFact(
                    category="vital",
                    text=f"blood pressure: {match.group(1)}/{match.group(2)} mmHg",
                    normalized="blood pressure",
                    source_text=match.group(0),
                    value=float(match.group(1)),
                    unit="mmHg",
                    confidence=0.95,
                    attributes={"systolic": int(match.group(1)), "diastolic": int(match.group(2))},
                )
            )

        lowered = text.lower()
        if re.search(r"\b(no known drug allergies|nkda)\b", lowered):
            facts.append(_phrase_fact("allergy", "no known drug allergies", "No known drug allergies", "No known drug allergies"))
        else:
            allergy_match = re.search(r"\b(?:allergy|allergic) to ([a-zA-Z][a-zA-Z\s-]{2,30})", text, re.I)
            if allergy_match:
                substance = allergy_match.group(1).strip().rstrip(".")
                facts.append(_phrase_fact("allergy", substance.lower(), f"Allergy to {substance}", allergy_match.group(0)))

        return ClinicalFactModel(
            source_country=source_country,
            target_country=target_country,
            patient=patient,
            facts=_prune_generic_diabetes(_dedupe(facts)),
        )
