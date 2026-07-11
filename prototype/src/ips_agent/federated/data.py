from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, Iterable, List, Mapping, Sequence, Tuple


SITES: Tuple[str, ...] = ("India", "USA", "Australia", "Europe")
RELAY_EDGES: Tuple[Tuple[str, str], ...] = (
    ("India", "USA"),
    ("USA", "Australia"),
    ("Australia", "Europe"),
    ("Europe", "India"),
)


@dataclass(frozen=True)
class TerminologyConcept:
    canonical: str
    category: str


CONCEPTS: Tuple[TerminologyConcept, ...] = (
    TerminologyConcept("type 2 diabetes mellitus", "condition"),
    TerminologyConcept("hypertension", "condition"),
    TerminologyConcept("chronic kidney disease", "condition"),
    TerminologyConcept("dyslipidemia", "condition"),
    TerminologyConcept("hba1c", "lab"),
    TerminologyConcept("fasting plasma glucose", "lab"),
    TerminologyConcept("estimated glomerular filtration rate", "lab"),
    TerminologyConcept("ldl cholesterol", "lab"),
    TerminologyConcept("metformin", "medication"),
    TerminologyConcept("insulin", "medication"),
    TerminologyConcept("lisinopril", "medication"),
    TerminologyConcept("atorvastatin", "medication"),
)

CONCEPT_TO_CATEGORY = {concept.canonical: concept.category for concept in CONCEPTS}
CATEGORY_TO_CONCEPTS: Dict[str, Tuple[str, ...]] = {
    category: tuple(concept.canonical for concept in CONCEPTS if concept.category == category)
    for category in sorted({concept.category for concept in CONCEPTS})
}


@dataclass(frozen=True)
class TerminologyExample:
    id: str
    owner_site: str
    split: str
    category: str
    canonical_concept: str
    mention: str
    context: str
    source_report_id: str
    receiver_site: str | None = None

    def to_dict(self) -> Dict[str, str | None]:
        return {
            "id": self.id,
            "owner_site": self.owner_site,
            "split": self.split,
            "category": self.category,
            "canonical_concept": self.canonical_concept,
            "mention": self.mention,
            "context": self.context,
            "source_report_id": self.source_report_id,
            "receiver_site": self.receiver_site,
        }


@dataclass(frozen=True)
class ExamplePools:
    training_by_site: Mapping[str, Tuple[TerminologyExample, ...]]
    transfer_by_receiver: Mapping[str, Tuple[TerminologyExample, ...]]
    globally_unseen: Tuple[TerminologyExample, ...]

    @property
    def all_training(self) -> Tuple[TerminologyExample, ...]:
        return tuple(
            example
            for site in SITES
            for example in self.training_by_site[site]
        )

    @property
    def all_transfer(self) -> Tuple[TerminologyExample, ...]:
        return tuple(
            example
            for site in SITES
            for example in self.transfer_by_receiver[site]
        )


# Each pair is (locally trained root, globally unseen root). The dataset is
# synthetic, but the roots use realistic clinical shorthand and spelling styles.
SITE_ROOTS: Mapping[str, Mapping[str, Tuple[str, str]]] = {
    "India": {
        "type 2 diabetes mellitus": ("madhumeha type 2", "madhumeha t2 diabetic"),
        "hypertension": ("uccha BP hypertension", "raised BP hypertension"),
        "chronic kidney disease": ("chronic kidney rog", "kidney chronic rog"),
        "dyslipidemia": ("lipid asantulan dyslipidemia", "dyslipid lipid asantulan"),
        "hba1c": ("glyco HbA1c", "glycated glyco Hb"),
        "fasting plasma glucose": ("fasting sugar glucose", "fasting glycemic glucose"),
        "estimated glomerular filtration rate": ("renal function eGFR", "renal function GFR estimate"),
        "ldl cholesterol": ("cholesterol LDL", "LDL cholesterol test"),
        "metformin": ("metformin dava", "metformin medicine"),
        "insulin": ("insulin dava", "insulin medicine"),
        "lisinopril": ("lisinopril BP dava", "lisinopril medicine"),
        "atorvastatin": ("atorvastatin lipid dava", "atorvastatin medicine"),
    },
    "USA": {
        "type 2 diabetes mellitus": ("adult type 2 diabetes", "type two diabetic disease"),
        "hypertension": ("high BP hypertension", "hypertensive BP disorder"),
        "chronic kidney disease": ("CKD kidney condition", "chronic renal kidney disease"),
        "dyslipidemia": ("high lipid dyslipidemia", "lipid disorder dyslipidemia"),
        "hba1c": ("A1C glycated test", "hemoglobin A1C result"),
        "fasting plasma glucose": ("fasting blood glucose", "fasting glucose serum"),
        "estimated glomerular filtration rate": ("estimated GFR renal", "eGFR kidney estimate"),
        "ldl cholesterol": ("LDL-C cholesterol", "LDL cholesterol panel"),
        "metformin": ("metformin therapy", "metformin treatment"),
        "insulin": ("insulin therapy", "insulin treatment"),
        "lisinopril": ("lisinopril therapy", "lisinopril treatment"),
        "atorvastatin": ("atorvastatin therapy", "atorvastatin treatment"),
    },
    "Australia": {
        "type 2 diabetes mellitus": ("type 2 DM condition", "type two DM disorder"),
        "hypertension": ("elevated BP hypertension", "elevated BP HTN disorder"),
        "chronic kidney disease": ("renal CKD condition", "chronic kidney function disease"),
        "dyslipidemia": ("lipid disorder hyperlipidemia", "dyslipid lipid condition"),
        "hba1c": ("HbA1c glycaemic", "glycated Hb A1c"),
        "fasting plasma glucose": ("fasting BGL glucose", "fasting blood glucose level"),
        "estimated glomerular filtration rate": ("eGFR renal rate", "estimated renal GFR"),
        "ldl cholesterol": ("LDL cholesterol lipids", "LDL lipid panel"),
        "metformin": ("metformin medication", "metformin medicine"),
        "insulin": ("insulin medication", "insulin medicine"),
        "lisinopril": ("lisinopril BP medicine", "lisinopril medication"),
        "atorvastatin": ("atorvastatin lipid medicine", "atorvastatin medication"),
    },
    "Europe": {
        "type 2 diabetes mellitus": ("diabetes type II", "type II diabetes condition"),
        "hypertension": ("arterial hypertension", "hypertensive arterial disorder"),
        "chronic kidney disease": ("chronic renal disease", "renal chronic kidney condition"),
        "dyslipidemia": ("lipid metabolism dyslipidemia", "dyslipid metabolism disorder"),
        "hba1c": ("glycated haemoglobin", "haemoglobin A1c"),
        "fasting plasma glucose": ("fasting glycaemia glucose", "fasting serum glucose"),
        "estimated glomerular filtration rate": ("renal filtration eGFR", "estimated renal filtration"),
        "ldl cholesterol": ("LDL cholesterol serum", "LDL serum lipids"),
        "metformin": ("metformin medicament", "metformin medicine"),
        "insulin": ("insulin medicament", "insulin medicine"),
        "lisinopril": ("lisinopril antihypertensive", "lisinopril medicine"),
        "atorvastatin": ("atorvastatin cholesterol medicament", "atorvastatin lipid tablet"),
    },
}

_TRAINING_TEMPLATES = {
    "condition": (
        "{root}", "documented {root}", "active {root}", "history of {root}",
        "known {root}", "ongoing {root}", "confirmed {root}", "clinical {root}",
        "managed {root}", "follow up for {root}", "established {root}", "problem {root}",
        "current {root}", "assessment {root}", "recorded {root}", "chronic {root}",
    ),
    "lab": (
        "{root}", "recent {root}", "measured {root}", "reported {root}",
        "laboratory {root}", "test {root}", "result for {root}", "value for {root}",
        "fasting {root}", "serial {root}", "monitoring {root}", "screening {root}",
        "follow up {root}", "reviewed {root}", "clinical {root}", "documented {root}",
    ),
    "medication": (
        "{root}", "current {root}", "taking {root}", "ongoing {root}",
        "prescribed {root}", "regular {root}", "active {root}", "continued {root}",
        "daily {root}", "listed {root}", "medication {root}", "treatment {root}",
        "therapy with {root}", "recorded {root}", "reviewed {root}", "maintenance {root}",
    ),
}

_UNSEEN_TEMPLATES = {
    "condition": ("{root}", "documented {root}", "known {root}", "reviewed {root}"),
    "lab": ("{root}", "recent {root}", "measured {root}", "result for {root}"),
    "medication": ("{root}", "current {root}", "taking {root}", "prescribed {root}"),
}


def normalize_mention(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.lower()))


def character_ngrams(value: str, minimum: int = 3, maximum: int = 5) -> set[str]:
    normalized = normalize_mention(value).replace(" ", "_")
    framed = f"^{normalized}$"
    return {
        framed[start:start + size]
        for size in range(minimum, maximum + 1)
        for start in range(max(0, len(framed) - size + 1))
    }


def ngram_jaccard(left: str, right: str) -> float:
    left_ngrams = character_ngrams(left)
    right_ngrams = character_ngrams(right)
    union = left_ngrams | right_ngrams
    return len(left_ngrams & right_ngrams) / len(union) if union else 0.0


def _context(site: str, category: str, mention: str) -> str:
    return f"Synthetic {site} {category} documentation: {mention}."


def _slug(value: str) -> str:
    return normalize_mention(value).replace(" ", "-")


def build_example_pools() -> ExamplePools:
    training: Dict[str, List[TerminologyExample]] = {site: [] for site in SITES}
    unseen: List[TerminologyExample] = []
    training_mentions: Dict[Tuple[str, str], List[str]] = {}

    for site in SITES:
        for concept_index, concept in enumerate(CONCEPTS):
            trained_root, unseen_root = SITE_ROOTS[site][concept.canonical]
            trained_mentions = [template.format(root=trained_root) for template in _TRAINING_TEMPLATES[concept.category]]
            unseen_mentions = [template.format(root=unseen_root) for template in _UNSEEN_TEMPLATES[concept.category]]
            if len(set(trained_mentions)) != 16 or len(set(unseen_mentions)) != 4:
                raise ValueError(f"Synthetic mentions must be distinct for {site} / {concept.canonical}.")
            training_mentions[(site, concept.canonical)] = trained_mentions
            for index, mention in enumerate(trained_mentions):
                training[site].append(TerminologyExample(
                    id=f"train-{_slug(site)}-{concept_index}-{index}",
                    owner_site=site,
                    split="train",
                    category=concept.category,
                    canonical_concept=concept.canonical,
                    mention=mention,
                    context=_context(site, concept.category, mention),
                    source_report_id=f"{_slug(site)}-local-{index % 4 + 1}",
                ))
            for index, mention in enumerate(unseen_mentions):
                unseen.append(TerminologyExample(
                    id=f"unseen-{_slug(site)}-{concept_index}-{index}",
                    owner_site=site,
                    split="global_unseen",
                    category=concept.category,
                    canonical_concept=concept.canonical,
                    mention=mention,
                    context=_context(site, concept.category, mention),
                    source_report_id=f"{_slug(site)}-relay",
                ))

    transfer: Dict[str, List[TerminologyExample]] = {site: [] for site in SITES}
    for source, receiver in RELAY_EDGES:
        for concept_index, concept in enumerate(CONCEPTS):
            mention = training_mentions[(source, concept.canonical)][0]
            transfer[receiver].append(TerminologyExample(
                id=f"transfer-{_slug(source)}-to-{_slug(receiver)}-{concept_index}",
                owner_site=source,
                split="cross_site_transfer",
                category=concept.category,
                canonical_concept=concept.canonical,
                mention=mention,
                context=f"Incoming synthetic relay report from {source}: {mention}.",
                source_report_id=f"{_slug(source)}-relay",
                receiver_site=receiver,
            ))

    pools = ExamplePools(
        training_by_site={site: tuple(training[site]) for site in SITES},
        transfer_by_receiver={site: tuple(transfer[site]) for site in SITES},
        globally_unseen=tuple(unseen),
    )
    validate_example_pools(pools)
    return pools


def validate_example_pools(pools: ExamplePools) -> None:
    all_training_mentions = {normalize_mention(example.mention) for example in pools.all_training}
    transfer_mentions = {normalize_mention(example.mention) for example in pools.all_transfer}
    unseen_mentions = {normalize_mention(example.mention) for example in pools.globally_unseen}
    if all_training_mentions & unseen_mentions or transfer_mentions & unseen_mentions:
        raise ValueError("Globally unseen mentions must not occur in training or transfer pools.")
    if len(pools.all_training) != 768 or len(pools.globally_unseen) != 192 or len(pools.all_transfer) != 48:
        raise ValueError("Synthetic pool sizes do not match the case-study design.")

    for transfer in pools.all_transfer:
        source_mentions = {
            normalize_mention(example.mention)
            for example in pools.training_by_site[transfer.owner_site]
            if example.canonical_concept == transfer.canonical_concept
        }
        receiver_mentions = {
            normalize_mention(example.mention)
            for example in pools.training_by_site[transfer.receiver_site or ""]
        }
        if normalize_mention(transfer.mention) not in source_mentions:
            raise ValueError("Transfer terms must occur in the sending site's training data.")
        if normalize_mention(transfer.mention) in receiver_mentions:
            raise ValueError("Transfer terms must be absent from the receiving site's training data.")

    for unseen in pools.globally_unseen:
        source_examples = [
            example
            for example in pools.training_by_site[unseen.owner_site]
            if example.canonical_concept == unseen.canonical_concept
        ]
        overlap_ok = any(
            len(character_ngrams(unseen.mention) & character_ngrams(example.mention)) >= 2
            and ngram_jaccard(unseen.mention, example.mention) >= 0.05
            for example in source_examples
        )
        if not overlap_ok:
            raise ValueError(
                f"Globally unseen mention has insufficient same-concept n-gram overlap: {unseen.id}."
            )


def data_summary(pools: ExamplePools) -> Dict[str, int]:
    return {
        "sites": len(SITES),
        "canonical_concepts": len(CONCEPTS),
        "training_examples": len(pools.all_training),
        "globally_unseen_examples": len(pools.globally_unseen),
        "cross_site_transfer_examples": len(pools.all_transfer),
    }
