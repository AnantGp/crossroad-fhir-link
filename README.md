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
- 48/48 cross-site transfer mappings correct in the synthetic validation set.
- Representative IPS-style Bundles show official validator evidence with 0 errors.
- 4/4 judge routes click-tested: USA -> India, India -> USA, Australia -> Europe, Europe -> USA.
- 16/16 route downloads verified: source PDF, final PDF, FHIR JSON, evidence JSON.

## Demo Links

- Deployed demo: https://crossroad-fhir-link-three.vercel.app
- Demo video: https://crossroad-fhir-link-three.vercel.app/cross-border-ips-ai-agent-demo.mp4
- Submission pack: [submission/README.md](submission/README.md)

## Honest Scope

This is a standards-focused prototype using synthetic data only.

- No real patient data is used.
- No national profile certification is claimed.
- Readiness checks are not conformance certification.
- Extraction is rule-backed; pretrained clinical NER is future work.
- FHIR terminology operations are simulated locally; live terminology servers are future work.
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
```

See [submission/click-test-audit.json](submission/click-test-audit.json).
