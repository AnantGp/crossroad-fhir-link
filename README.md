# Cross-Border IPS AI Agent

HL7 AI Challenge judge demo for a four-country Type 2 diabetes interoperability case study.

The project demonstrates how a local doctor report can be converted into a coded HL7 FHIR R4 IPS-style document Bundle, then rendered as a target-country readable report. The core claim is precise:

> FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.

## Links

- Deployed demo: https://crossroad-fhir-link-three.vercel.app
- GitHub repo: https://github.com/AnantGp/crossroad-fhir-link
- Submission pack: [submission/README.md](submission/README.md)

## What It Shows

- Four synthetic sites: USA, India, Australia, Europe
- Diabetes case study with local phrases such as `T2DM`, `sugar disease`, `raised BP`, and `Typ-2-Diabetes`
- Local terminology registry lookup first
- Federated terminology linker for registry misses
- FHIR-native terminology layer using CodeSystem, ValueSet, ConceptMap, and simulated `$translate`, `$lookup`, `$validate-code`
- FHIR R4 IPS-style document Bundle with `Bundle.type=document` and Composition first
- Target-country readiness checks for US Core, ABDM, AU Base, and EU IPS-style receivers
- Downloadable source PDF, target PDF, FHIR Bundle JSON, and evidence pack JSON

## Honest Scope

This is a judge-facing prototype using synthetic data only.

- It does not use real patient data.
- It does not claim national profile certification.
- It does not claim formal privacy guarantees.
- FedAvg gives data locality only; model updates can leak information without DP-SGD or secure aggregation.
- Extraction is rule-backed in the prototype; pretrained clinical NER is future work.
- FHIR terminology operations are simulated locally; live terminology servers are future work.

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

Latest audit:

- 4/4 routes click-tested
- 16/16 downloads verified
- FHIR Bundle JSON shape verified
- evidence and limitations visible
- 0 browser console errors in automated audit

See [submission/click-test-audit.json](submission/click-test-audit.json).
