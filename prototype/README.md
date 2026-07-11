# Reproducible Python Prototype

This package contains the implementation behind the standalone judge dashboard. It is a synthetic, single-process simulation of four cross-silo clients, not a deployed hospital network.

## What Is Real

- A trainable PyTorch linear terminology classifier.
- Separate India, USA, Australia, and Europe client datasets.
- Ten local SGD epochs per client in each of five communication rounds.
- Deterministic sample-weighted FedAvg over model tensors in float64.
- A coordinator payload containing model tensors and sample count only.
- Separate cross-site transfer and globally unseen evaluation pools.
- Registry-first terminology mapping, FHIR ConceptMap evidence, learned-cache reuse, and IPS document generation.

## Reproduce

```bash
cd prototype
python3 -m venv .venv
source .venv/bin/activate
pip install -e . pytest

PYTHONPATH=src python3 -m pytest -q
PYTHONPATH=src python3 -m ips_agent.cli federated-demo \
  --rounds 5 --seed 42 --hash-dim 1024 \
  --out federated-demo.json
```

Expected checked-in benchmark for seed 42:

| Metric | Local-only | Federated |
| --- | ---: | ---: |
| Cross-site transfer | 47/48 | 48/48 |
| Globally unseen accuracy | 94.4% average | 192/192 (100%) |
| Globally unseen macro-F1 | not aggregated | 1.000 |

The curated seed-42 benchmark evidence, including per-round metrics and all transfer predictions, is recorded in [`submission/federated_benchmark.json`](../submission/federated_benchmark.json).

## Privacy Boundary

FedAvg gives data locality, not cryptographic protection or formal de-identification. Model updates can leak information. A production deployment would require secure aggregation, differential privacy, client/sample thresholds, encrypted transport, isolation, and privacy testing.

## Validation Boundary

The downloadable judge Bundles are validated in [`submission/official_validation`](../submission/official_validation). A Bundle generated directly by this Python pipeline was also checked against IPS 2.0.1 with 0 errors and 0 warnings; its log is `prototype-usa-to-india.txt`. These results establish structural/profile conformance for synthetic examples, not clinical correctness or national certification.
