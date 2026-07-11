from __future__ import annotations

import hashlib
import math
import re
from typing import Dict, Iterable, List, Mapping, Sequence

import torch
from torch import nn

from ..terminology import LinkPrediction
from .data import CATEGORY_TO_CONCEPTS, CONCEPTS, normalize_mention


CONCEPTS_BY_INDEX: List[str] = [concept.canonical for concept in CONCEPTS]
CONCEPT_INDEX: Dict[str, int] = {concept: index for index, concept in enumerate(CONCEPTS_BY_INDEX)}
CATEGORY_TO_INDICES: Dict[str, List[int]] = {
    category: [CONCEPT_INDEX[concept] for concept in concepts]
    for category, concepts in CATEGORY_TO_CONCEPTS.items()
}


def _feature_index_and_sign(feature: str, dimension: int) -> tuple[int, float]:
    digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
    value = int.from_bytes(digest, "big")
    return value % dimension, 1.0 if value & 1 else -1.0


def _features(mention: str) -> Iterable[str]:
    normalized = normalize_mention(mention)
    words = normalized.split()
    for word in words:
        yield f"word:{word}"
    for left, right in zip(words, words[1:]):
        yield f"word:{left}_{right}"
    framed = f"^{normalized.replace(' ', '_')}$"
    for size in range(3, 6):
        for start in range(max(0, len(framed) - size + 1)):
            yield f"char:{framed[start:start + size]}"


def hashed_features(mention: str, dimension: int) -> torch.Tensor:
    vector = torch.zeros(dimension, dtype=torch.float32)
    for feature in _features(mention):
        index, sign = _feature_index_and_sign(feature, dimension)
        vector[index] += sign
    norm = torch.linalg.vector_norm(vector)
    # A modest fixed scale gives the linear head enough logit separation for the
    # 0.70 human-review threshold while retaining deterministic normalized inputs.
    return (vector / norm) * 4.0 if norm > 0 else vector


class TerminologyClassifier(nn.Module):
    def __init__(self, input_dimension: int) -> None:
        super().__init__()
        self.linear = nn.Linear(input_dimension, len(CONCEPTS_BY_INDEX))

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.linear(features)


def masked_logits(logits: torch.Tensor, categories: Sequence[str]) -> torch.Tensor:
    masked = torch.full_like(logits, -1.0e9)
    for row, category in enumerate(categories):
        indices = CATEGORY_TO_INDICES.get(category)
        if not indices:
            raise ValueError(f"Unsupported terminology category: {category}")
        masked[row, indices] = logits[row, indices]
    return masked


class FederatedTerminologyLinker:
    """Inference adapter used only after deterministic registry lookup misses."""

    def __init__(self, model: TerminologyClassifier, input_dimension: int, threshold: float = 0.70) -> None:
        self.model = model.cpu().eval()
        self.input_dimension = input_dimension
        self.threshold = threshold

    def predict(self, mention: str, category: str) -> LinkPrediction:
        if category not in CATEGORY_TO_INDICES:
            return LinkPrediction(
                canonical_concept=None,
                confidence=0.0,
                human_review_required=True,
            )
        with torch.no_grad():
            features = hashed_features(mention, self.input_dimension).unsqueeze(0)
            logits = masked_logits(self.model(features), [category])
            probabilities = torch.softmax(logits, dim=1)[0]
            confidence, index = torch.max(probabilities, dim=0)
        value = float(confidence.item())
        canonical = CONCEPTS_BY_INDEX[int(index.item())]
        return LinkPrediction(
            canonical_concept=canonical if value >= self.threshold else None,
            confidence=round(value, 6),
            human_review_required=value < self.threshold,
        )
