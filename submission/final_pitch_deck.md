# Final Pitch Deck

This outline matches the 10-slide PPTX and PDF deliverables.

## Slide 1 - Title

**Cross-Border IPS AI Agent**

Federated, FHIR-native terminology alignment for cross-border Type 2 diabetes summaries.

## Slide 2 - Problem

Local clinical meaning gets lost before the document crosses a border.

- `T2DM`, `sugar disease`, `madhumeha type 2`, and `DM2` may refer to the same condition.
- A readable PDF does not provide machine-readable semantic interoperability.
- Receiver systems need standard terminology plus a predictable exchange structure.

## Slide 3 - Solution

One local report becomes two synchronized outputs:

- a FHIR IPS-style R4 document Bundle for machine-to-machine exchange;
- a target-country PDF rendered from that Bundle for human review.

Core claim:

> FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.

## Slide 4 - Architecture

```text
doctor report or EHR-like note
  -> clinical fact extraction
  -> deterministic local registry
  -> federated linker on registry misses
  -> FHIR CodeSystem / ValueSet / ConceptMap
  -> FHIR IPS document Bundle
  -> receiver readiness check and human rendering
```

Every transformation retains an audit path from source phrase to meaning, code, and FHIR resource.

## Slide 5 - Federated Learning

- 4 simulated sites, 768 training mentions, 48 cross-site transfer probes, and 192 globally unseen examples.
- Across five seeds: 48/48 federated transfer versus 47/48 local-only.
- All 20 receiver-by-seed comparisons are non-regressive.
- Tensor payload estimate: 48.05 KiB per client update and 1.88 MiB over five rounds.
- The coordinator receives model tensors and sample counts only.

FedAvg provides data locality, not cryptography, formal de-identification, differential privacy, or secure aggregation.

## Slide 6 - FHIR-Native Linker

- local `CodeSystem` represents site-specific terms;
- target `ValueSet` constrains acceptable concepts;
- `ConceptMap` publishes the local-to-standard relationship;
- local `$translate` remains prototype-simulated;
- tx.fhir.org independently accepted representative SNOMED CT, LOINC, RxNorm, and ICD-10 codes through 4/4 `$lookup` and 4/4 `$validate-code` checks.

External code validity does not prove that the source phrase was interpreted correctly. Low-confidence mappings require human review.

## Slide 7 - IPS Validation

- 4/4 current document Bundles pass HL7 FHIR Validator 6.9.11 against the IPS 2.0.1 Bundle profile.
- 0 errors and 0 warnings.
- Two informational notes per Bundle remain visible because RxNorm ingredient codes are outside the IPS guide's recommended medication ValueSet.
- Structural/profile validation is not clinical validation or national certification.

## Slide 8 - Cross-Border Evidence

The same machine-readable summary supports four receiver journeys:

- USA -> India
- India -> USA
- Australia -> Europe
- Europe -> USA

Every route exposes a source PDF, receiver PDF, FHIR Bundle JSON, evidence JSON, and readiness gaps. Readiness comparisons do not claim national conformance.

## Slide 9 - Reproducibility

- 16/16 frontend behavior and evidence tests pass.
- 13/13 Python pipeline and FedAvg tests pass.
- 16/16 route downloads were click-tested.
- Five-seed evidence reproduces exactly from the checked-in command.
- Official IPS validator logs and external terminology responses are included without editing.
- An independent clinical review packet is supplied but remains pending until completed and signed.

## Slide 10 - Closing Claim

Cross-Border IPS AI Agent combines semantic and data interoperability:

- federated learning aligns local terminology without centralizing raw reports;
- FHIR terminology artifacts make mappings constrained and auditable;
- FHIR IPS packages the coded summary for cross-border exchange.

This is an honest synthetic prototype with a clear production path, not certified clinical software.
