# 3-5 Minute Demo Script

## 0:00-0:25 - Aim

This is **Cross-Border IPS AI Agent**, a Type 2 diabetes interoperability case study for the HL7 AI Challenge.

The aim is to make a local doctor report usable across borders by converting it into a machine-readable, universally coded, HL7 FHIR IPS-style patient summary.

The core claim is:

> FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.

## 0:25-0:55 - Problem Statement

A patient may travel from one country to another, but clinical language does not travel cleanly.

For the same diabetes concept, one site may say `T2DM`, another may say `sugar disease`, another may say `madhumeha type 2`, and another may say `DM2`.

Humans can often infer the meaning. Receiver EHR systems need standard codes and predictable resources.

## 0:55-1:25 - What We Built

The demo follows one chronological flow:

```text
doctor report
  -> clinical facts
  -> terminology mapping
  -> federated linker for local phrase misses
  -> FHIR ConceptMap validation
  -> FHIR IPS document Bundle
  -> target-country report and readiness gaps
```

The source can be an EHR-like note, a PDF-like clinical note, or free text. Structured EHR input can skip extraction. Free text uses rule-backed extraction in this prototype.

## 1:25-1:55 - Proof 1: Machine-Readable

The final machine-readable artifact is the FHIR IPS-style Bundle.

The demo asserts:

- `Bundle.type = document`
- `Composition` is the first entry
- clinical facts become FHIR `Condition`, `Observation`, `MedicationStatement`, and related resources
- all four current Bundles pass the official HL7 validator against IPS 2.0.1 with 0 errors and 0 warnings

The PDF is useful for a human reader, but the FHIR Bundle is the exchange artifact.

## 1:55-2:25 - Proof 2: Universal Coding

The clinical trace shows source phrase -> canonical concept -> standard code -> FHIR resource.

Examples:

- `T2DM` -> Type 2 diabetes mellitus -> SNOMED CT `44054006` / ICD-10 `E11` -> `Condition`
- `A1c` -> HbA1c -> LOINC `4548-4` -> `Observation`
- `metformin` -> RxNorm `6809` -> `MedicationStatement`

This is the semantic interoperability layer.

## 2:25-3:00 - Proof 3: Federated Terminology Learning

Federated learning is used for data-local terminology learning.

Each site trains locally on country-specific terminology examples. For example:

- USA: `T2DM`, `type 2 diabetes`, `adult-onset diabetes`
- India: `sugar disease`, `madhumeha type 2`, `known case of diabetes`
- Australia: `type 2 DM`, `T2 diabetes`
- Europe: `diabetes mellitus type II`, `DM2`

The coordinator receives model tensors and sample counts only. It does not receive raw reports, identifiers, labels, aliases, or patient-level FHIR Bundles.

Important limitation: FedAvg gives data locality only. It is not cryptography and not formal de-identification.

## 3:00-3:30 - Proof 4: FHIR-Native Global Linker

The model can predict a mapping, but HL7 makes the mapping auditable.

The demo expresses accepted mappings using:

- local `CodeSystem`
- target `ValueSet`
- `ConceptMap`
- simulated `$translate`
- simulated `$lookup`
- simulated `$validate-code`

This is why the solution is HL7-native instead of just an AI text converter.

## 3:30-4:00 - Proof 5: Cross-Border Sharing

The same IPS-style FHIR Bundle can be used across USA, India, Australia, and Europe routes.

The app renders a target-country PDF for human review and shows receiver readiness gaps, such as ABDM readiness for India or US Core readiness for the USA.

These are readiness checks only, not national profile certification.

## 4:00-4:30 - Evidence

The evidence shown in the demo is synthetic validation evidence:

- 20 synthetic reports
- 4 country sites
- 768 terminology training mentions
- 192 globally unseen examples
- across five deterministic seeds, 48/48 federated transfer mappings versus 47/48 local-only, a measured gain of one correct mapping per seed
- 192/192 globally unseen mappings with macro-F1 1.000 at every seed; local-only mean accuracy is 94.27% with 0.26 percentage-point sample standard deviation
- estimated model traffic is 48.05 KiB of model tensors per client update and 1.88 MiB two-way across five rounds
- all four current Bundles show official IPS 2.0.1 validator evidence with 0 errors and 0 warnings
- two informational medication-terminology notes per Bundle remain visible

These are deterministic five-seed synthetic results, not evidence of clinical accuracy on real notes.

## 4:30-5:00 - Benefit and Closing

The benefit is practical:

- the patient summary can be understood across borders
- the receiving hospital gets coded FHIR resources, not ambiguous text
- local terminology learning does not centralize raw reports
- auditors can trace source phrase -> concept -> code -> FHIR resource

Final claim:

> Cross-Border IPS AI Agent combines semantic interoperability and data interoperability. Federated learning aligns local terminology, FHIR terminology artifacts make mappings auditable, and FHIR IPS packages the result into a standards-based patient summary for cross-border exchange.
