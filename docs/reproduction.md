# Reproduction guide

[Project overview](../README.md) · [Method](methodology.md) · [Evaluation](evaluation.md)

## Choose what to run

The React application presents embedded synthetic evidence. The Python package runs the terminology-learning experiment and clinical-text pipeline. The optional FastAPI service exposes that Python pipeline. Running the presentation app does not automatically start or train the Python model.

Prerequisites: Git, Node.js 20 with npm, and Python 3.10 or later. Python CI uses 3.11. PyTorch runs on CPU for the demonstrated experiment. Dependency installation needs internet access.

```bash
git clone https://github.com/AnantGp/crossroad-fhir-link.git
cd crossroad-fhir-link
git rev-parse HEAD
```

Record the SHA with any reported result. The implementation submitted in July 2026 is commit `88f58bfc2d6a1752b6bfa962cc0508f7008faea0`; later documentation updates explain that snapshot. Python dependencies specify minimum versions rather than a frozen environment, so record your installed versions as well.

## Presentation app

From the repository root:

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. The source/target selectors choose representative cases and readiness views. Text edits do not invoke arbitrary clinical extraction through a backend. The downloaded PDFs are readable case renderings; FHIR JSON is the machine-readable exchange artifact.

Frontend verification:

```bash
npm test
npm run lint
npm run build
```

The checked-in frontend tests cover selection behavior and clinical/evidence presentation. They do not run the official FHIR validator.

## Python environment and tests

From the repository root:

```bash
cd prototype
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e . pytest
python -m pip show torch
python -m pytest -q
```

Tests exercise pipeline behavior, Bundle shape, category constraints, low-confidence review, ConceptMap/cache reuse, dataset pools, FedAvg, and transfer behavior. These are engineering tests, not a substitute for independent clinical review or the external validator.

## Convert one report

Run this from `prototype/` after activating the environment:

```bash
python -m ips_agent.cli run examples/reports/usa_local_1.txt \
  --source USA --target India --out outputs/usa-to-india.json
```

The JSON includes `clinical_fact_model`, `terminology_mappings`, `audit_trace`, `fhir_bundle`, readiness findings, and internal validation results. A plain `run` uses the registry-first pipeline without training or injecting a federated linker. The federated demonstration below trains and supplies the learned fallback.

## Run FedAvg and the relay case study

```bash
python -m ips_agent.cli federated-demo \
  --rounds 5 --seed 42 --hash-dim 1024 \
  --out outputs/federated-demo.json
```

This builds the separate training/transfer/globally-unseen pools, trains the four simulated clients and coordinator, evaluates baselines, runs relay examples, and demonstrates learned ConceptMap cache reuse. Its JSON contains synthetic mentions and labels for local inspection; that evidence output is different from the aggregation payload.

Compare the output with [`federated_benchmark.json`](../submission/federated_benchmark.json). Expected recorded transfer counts are 48/48 federated and 47/48 local-only. Consult the [evaluation guide](evaluation.md) before interpreting the metrics.

For the five-seed study:

```bash
python -m ips_agent.cli federated-study \
  --rounds 5 --seeds 7 21 42 84 126 --hash-dim 1024 \
  --out outputs/federated-study.json
```

Compare with [`federated_multiseed_benchmark.json`](../submission/federated_multiseed_benchmark.json). Preserve any changed configuration and library versions; do not overwrite the historical evidence to conceal a difference.

## Optional local API

From `prototype/`, with the environment active:

```bash
uvicorn ips_agent.api:app --host 127.0.0.1 --port 8000
```

Inspect `http://127.0.0.1:8000/docs` or `http://127.0.0.1:8000/api/health`. `POST /api/pipeline` accepts `report_text`, `source_country`, and `target_country`. It uses the single-report registry-first pipeline; the public React presentation is not wired to this endpoint.

The evidence endpoints read locally generated files under `prototype/outputs/submission_pack/`. They return 404 until the corresponding pack exists. To generate a pack:

```bash
python -m ips_agent.cli submission-pack --out outputs/submission_pack
```

## Official FHIR validation

The official validator is a separate Java tool. The July 2026 [validation summary](../submission/official_validation/validation-summary.json) records the validator version, FHIR version, IPS package, and profile used for the stored logs.

To create new pack outputs with an official validator available locally, replace `/path/to/validator_cli.jar` with its actual location:

```bash
python -m ips_agent.cli submission-pack --out outputs/submission_pack \
  --validator-jar /path/to/validator_cli.jar
```

Java, the validator JAR, and its terminology/package downloads are not bundled. Preserve logs and package versions when reporting a new run. The pipeline's internal validation fields are not an official validator result. External terminology checks in the repository are dated snapshots rather than a continuous production service.
