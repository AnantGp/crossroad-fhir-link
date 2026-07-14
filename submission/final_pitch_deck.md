# Final Pitch Deck

This outline matches the revised 10-slide judge-facing PPTX and PDF deliverables.

## Slide 1 - Title

**Cross-Border IPS AI Agent**

Federated terminology learning + FHIR-native mappings + an International Patient Summary (IPS) Bundle.

Core thesis: local clinical language becomes coded, auditable, and exchangeable across borders.

Team: Tech Adaptive Pandit - Anant Gupta, Manish Gupta, and Gourav Gupta.

## Slide 2 - Executive Summary

**Problem:** Receiver EHRs cannot interpret every local clinical term.

**Objective:** Produce one coded, machine-readable patient summary.

**Solution:** Federated terminology learning plus FHIR terminology artifacts and FHIR IPS.

**Impact:** Auditable cross-border sharing with less manual recoding.

Core thesis: the interoperable summary travels; the terminology learning stays local.

## Slide 3 - Objective + Expected Impact

One coded summary supports a cross-border handoff:

- a FHIR IPS-style R4 document Bundle for machine-to-machine exchange;
- a target-country PDF rendered from that Bundle for human review.

Core claim:

> FHIR IPS is the cross-border machine-readable artifact; PDFs are review and presentation layers.

## Slide 4 - Solution

```text
doctor report or EHR-like note
  -> clinical fact extraction
  -> deterministic local registry
  -> federated linker on registry misses
  -> FHIR CodeSystem / ValueSet / ConceptMap
  -> FHIR IPS document Bundle
  -> receiver readiness check and human rendering
```

Every mapping retains an audit path from source phrase to canonical concept, standard code, and FHIR resource. Low-confidence predictions stop for human review and do not create trusted clinical codes.

## Slide 5 - Federated Learning

- 4 simulated sites, 768 local training phrase examples, 48 cross-site transfer probes, and 192 globally unseen examples per seed.
- Across five predetermined seeds: 48/48 federated transfer versus 47/48 local-only at every seed.
- Globally unseen evaluation is 192/192 with macro-F1 1.000 at every seed.
- All 20 receiver-by-seed comparisons are non-regressive.
- Tensor payload estimate: 48.05 KiB per client update and 1.88 MiB over five rounds.
- The coordinator receives model tensors and sample counts only.

FedAvg provides data locality, not cryptography, formal de-identification, differential privacy, or secure aggregation.

## Slide 6 - FHIR-Native Global Linker

- local `CodeSystem` represents site-specific terms;
- target `ValueSet` constrains acceptable concepts;
- `ConceptMap` publishes the local-to-standard relationship;
- local `$translate` remains prototype-simulated;
- tx.fhir.org independently accepted representative SNOMED CT, LOINC, RxNorm, and ICD-10 codes through 4/4 `$lookup` and 4/4 `$validate-code` checks.

External code validity does not prove that the source phrase was interpreted correctly. Gold labels, trace review, and clinician adjudication remain required; low-confidence mappings require human review.

## Slide 7 - IPS Validation

- 4/4 current document Bundles pass HL7 FHIR Validator 6.9.11 against the IPS 2.0.1 Bundle profile.
- 0 errors and 0 warnings.
- Two informational notes per Bundle remain visible because RxNorm ingredient codes are outside the IPS guide's recommended medication ValueSet.
- Structural/profile validation is not clinical validation or national certification.

## Slide 8 - Demonstrated Impact

The same machine-readable IPS supports four receiver ecosystems:

- USA -> India
- India -> USA
- Australia -> Europe
- Europe -> USA

Every receiver gets the same machine-readable IPS, a readable PDF, and an explicit list of readiness gaps. The deck identifies US Core STU9, ABDM R4 draft, AU Core CI, and European Patient Summary ballot checks as informative readiness checks, not national conformance.

## Slide 9 - Judge-Verifiable Difference

The prototype differs from a generic document-to-FHIR demo because it combines:

- registry-first mapping with a human-review threshold;
- FHIR `CodeSystem`, `ValueSet`, `ConceptMap`, and terminology-operation traces;
- local training with sample-weighted FedAvg and no raw reports sent to the coordinator;
- one FHIR IPS artifact with four receiver-readiness checks;
- gold-label semantic tests plus official validator evidence.

Reproducibility strip: 29 automated tests, 48/48 transfer, zero validator errors, a coordinator-payload test, and downloadable JSON evidence.

## Slide 10 - Closing Claim

Cross-Border IPS AI Agent combines semantic and data interoperability:

- federated learning aligns local terminology without centralizing raw reports;
- FHIR terminology artifacts make mappings constrained and auditable;
- FHIR IPS packages the coded summary for cross-border exchange.

Closing line:

> The interoperable summary travels. The learning stays local.

Proposed next pilot: two hospitals, 500 governed local mentions per site, independent clinician adjudication, and a live terminology server. This remains an honest synthetic prototype, not certified clinical software.
