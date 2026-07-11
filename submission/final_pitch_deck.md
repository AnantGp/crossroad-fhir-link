# Final Pitch Deck

## Slide 1 - Title

**Cross-Border IPS AI Agent**

Federated FHIR terminology alignment for cross-border Type 2 diabetes summaries.

## Slide 2 - Aim

Make a local diabetes report usable across borders by converting it into a machine-readable, universally coded, HL7 FHIR IPS-style patient summary.

Core claim:

> FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.

## Slide 3 - Problem Statement

Local clinical language blocks interoperability.

Examples for the same concept:

- USA: `T2DM`, `adult-onset diabetes`
- India: `sugar disease`, `madhumeha type 2`
- Australia: `type 2 DM`, `T2 diabetes`
- Europe: `DM2`, `diabetes mellitus type II`

The problem is not only document format. It is semantic meaning plus machine-readable exchange.

## Slide 4 - Solution Flow

```text
doctor report
  -> clinical fact extraction
  -> local registry lookup
  -> federated terminology linker
  -> FHIR ConceptMap validation
  -> FHIR IPS document Bundle
  -> target-country report and readiness gaps
```

## Slide 5 - Machine-Readable Proof

The final exchange artifact is an IPS-style FHIR R4 document Bundle:

- `Bundle.type=document`
- `Composition` first
- `Condition`, `Observation`, `MedicationStatement`, and related resources
- official HL7 validation: 4/4 current Bundles pass IPS 2.0.1 with 0 errors and 0 warnings

## Slide 6 - Universal Coding Proof

Local clinical terms are normalized into accepted healthcare codes:

- conditions: SNOMED CT and ICD-10
- labs: LOINC
- medications: RxNorm
- exchange structure: FHIR resources

## Slide 7 - Federated Learning Role

Each country/site trains a terminology linker locally.

The coordinator receives only:

- model tensors
- sample counts

It does not receive:

- raw reports
- patient identifiers
- labels or aliases
- patient-level FHIR Bundles

FedAvg gives data locality only; it is not cryptography or formal de-identification.

## Slide 8 - FHIR-Native Global Linker

The model predicts candidate mappings, but HL7 makes them auditable:

- local `CodeSystem`
- target `ValueSet`
- `ConceptMap`
- simulated `$translate`
- simulated `$lookup`
- simulated `$validate-code`

## Slide 9 - Cross-Border Sharing

The same FHIR IPS can support USA, India, Australia, and Europe routes.

For each route, the judge can download:

- source country PDF
- final target-country PDF
- FHIR Bundle JSON
- evidence pack JSON

Readiness checks are shown, but no national certification is claimed.

## Slide 10 - Evidence

- 20 synthetic reports
- 4 country sites
- 768 terminology training mentions
- 192 globally unseen examples
- 48/48 cross-site transfer examples correct versus 47/48 local-only, a FedAvg gain of +1
- 192/192 globally unseen mappings correct with macro-F1 1.000 on the separate seeded synthetic set
- 0 errors and 0 warnings across all four current IPS 2.0.1 Bundle-profile validations
- 2 informational notes per Bundle: RxNorm ingredients are outside the IPS guide's recommended medication value set

All model metrics are deterministic single-seed synthetic results, not clinical performance claims.

## Slide 11 - Honest Limits

- Synthetic data only
- Rule-backed extraction in prototype
- Simulated terminology operations
- Readiness checks only, not certification
- No formal privacy guarantee without secure aggregation, DP-SGD, thresholds, and auditing

## Slide 12 - Final Claim

Cross-Border IPS AI Agent combines semantic interoperability and data interoperability.

Federated learning aligns local terminology without centralizing raw reports. FHIR terminology artifacts make mappings auditable. FHIR IPS packages the result into a standards-based patient summary for cross-border exchange.
