# Cross-Border IPS AI Agent

HL7 AI Challenge judge demo for a four-country Type 2 diabetes interoperability case study.

## Aim

Make a local diabetes report usable across borders by turning it into a machine-readable, universally coded, HL7 FHIR IPS-style patient summary.

Core claim:

> FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.

## Problem Statement

A patient may travel from one country to another, but clinical language does not travel cleanly:

- USA notes may say `T2DM` or `adult-onset diabetes`.
- India notes may say `sugar disease` or `madhumeha type 2`.
- Australia notes may say `type 2 DM`.
- Europe notes may say `DM2` or `diabetes mellitus type II`.

Humans can often infer the meaning, but receiver EHR systems need standard codes and predictable resources.

## What We Built

A judge-facing prototype that converts synthetic Type 2 diabetes reports into:

- extracted clinical facts;
- standard terminology codes;
- FHIR ConceptMap evidence;
- an IPS-style FHIR R4 document Bundle;
- a target-country readable PDF;
- receiver readiness gaps for USA, India, Australia, and Europe.

## How It Works

```text
Doctor report or EHR-like note
  -> clinical fact extraction
  -> local terminology registry lookup
  -> federated terminology linker for registry misses
  -> FHIR CodeSystem / ValueSet / ConceptMap
  -> simulated $translate / $lookup / $validate-code
  -> FHIR R4 IPS-style document Bundle
  -> target-country PDF and readiness report
```

## Why Federated Learning Is Used

Federated learning is used for data-local terminology learning.

Each country/site trains on its own local phrase examples. The coordinator receives model tensors and sample counts only; it does not receive raw reports, labels, aliases, identifiers, or patient-level FHIR Bundles.

Important: FedAvg gives data locality only. It is not cryptography, not formal de-identification, and not a complete privacy guarantee without secure aggregation, DP-SGD, minimum sample thresholds, and privacy auditing.

## Evidence

- 20 synthetic reports across 4 country sites.
- 768 terminology training mentions.
- 192 globally unseen terminology examples.
- 48/48 cross-site transfer mappings correct versus 47/48 for local-only, a measured FedAvg gain of +1.
- 192/192 globally unseen mappings correct with macro-F1 1.000 versus 94.4% average local-only accuracy.
- All four current Bundles pass HL7 FHIR Validator 6.9.11 against IPS 2.0.1 with 0 errors and 0 warnings; each has two informational notes because RxNorm ingredients are outside the IPS guide's recommended medication value set.
- 4/4 judge routes click-tested: USA -> India, India -> USA, Australia -> Europe, Europe -> USA.
- 16/16 route downloads verified: source PDF, final PDF, FHIR JSON, evidence JSON.

## Demo Links

- Deployed demo: https://crossroad-fhir-link-three.vercel.app
- Demo video: https://crossroad-fhir-link-three.vercel.app/cross-border-ips-ai-agent-demo.mp4
- Submission pack: [submission/README.md](submission/README.md)

## Reproducible Core

The deployed Vite app is a standalone judge-facing presentation with embedded synthetic evidence. The trainable model, client-local SGD loop, deterministic FedAvg coordinator, dataset builder, FHIR pipeline, and Python tests are checked in under [`prototype/`](prototype/README.md).

```bash
cd prototype
pip install -e . pytest
PYTHONPATH=src python3 -m pytest -q
PYTHONPATH=src python3 -m ips_agent.cli federated-demo --rounds 5 --seed 42 --hash-dim 1024
```

The exact seed-42 result is stored in [`submission/federated_benchmark.json`](submission/federated_benchmark.json). The full official IPS validator output is stored in [`submission/official_validation/`](submission/official_validation/README.md).

## Readiness Baselines

Checked on July 11, 2026. These references guide the receiver-gap display; the app does not claim conformance to them.

- [US Core 9.0.0 (STU9)](https://hl7.org/fhir/us/core/STU9/)
- [ABDM FHIR R4 7.0.0 draft build](https://www.nrces.in/preview/ndhm/)
- [AU Core 2.0.0 trial-use release](https://hl7.org.au/fhir/core/2.0.0/)
- [HL7 Europe Patient Summary continuous build](https://build.fhir.org/ig/hl7-eu/eps/)
- [HL7 FHIR International Patient Summary](https://hl7.org/fhir/uv/ips/)

## Honest Scope

This is a standards-focused prototype using synthetic data only.

- No real patient data is used.
- No national profile certification is claimed.
- Readiness checks are not conformance certification.
- Extraction is rule-backed; pretrained clinical NER is future work.
- FHIR terminology operations are simulated locally; live terminology servers are future work.
- Federated metrics are from a deterministic single-seed synthetic benchmark; they do not prove clinical accuracy on real notes.
- Production privacy requires secure aggregation, DP-SGD, sample thresholds, and privacy auditing.

## Local Run

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run build
npm run lint

cd prototype
PYTHONPATH=src python3 -m pytest -q
```

See [submission/click-test-audit.json](submission/click-test-audit.json).
