# 3-5 Minute Demo Script

## 0:00-0:25 - Opening

Hello, this is **Cross-Border IPS AI Agent**, a Type 2 diabetes interoperability case study for the HL7 AI Challenge.

The problem is simple: a doctor report written in one country may not be immediately understandable by another country's EHR ecosystem because local phrases, abbreviations, and terminology conventions differ.

Our core design principle is:

> FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.

## 0:25-0:55 - Input Report

On the left, I select a synthetic source report. For example, the USA report contains phrases like `T2DM`, `high blood pressure`, `A1c`, and `metformin`.

The source can be a PDF-like clinical note or an EHR-like note. In this prototype, extraction is rule-backed. In production, this layer can be replaced with a pretrained clinical NER model or skipped when the EHR input is already structured.

## 0:55-1:30 - Clinical Trace

The Clinical Trace tab shows the audit path:

source phrase -> normalized clinical meaning -> standard code -> FHIR resource.

For example:

- `T2DM` becomes Type 2 diabetes mellitus
- it maps to SNOMED CT `44054006` and ICD-10 `E11`
- it becomes a FHIR `Condition`

Labs such as HbA1c become FHIR `Observation` resources using LOINC. Medications become `MedicationStatement` resources using RxNorm.

## 1:30-2:05 - Terminology Layer

The terminology step checks the local registry first. If a known local phrase exists, it is mapped deterministically.

If the local registry misses a phrase, the federated terminology linker predicts the canonical concept. The accepted mapping is then represented through FHIR-native terminology artifacts:

- CodeSystem for local site terms
- ValueSet for allowed target concepts
- ConceptMap for local phrase to standard code
- simulated `$translate`, `$lookup`, and `$validate-code`

This is why HL7 is central. The model can learn a mapping, but FHIR terminology resources make it exchangeable, auditable, and standards-aligned.

## 2:05-2:45 - Federated Learning

The Federated Learning tab shows four sites: USA, India, Australia, and Europe.

Each site trains locally on country-specific terminology examples. The coordinator receives only model tensors and sample counts, not raw reports, aliases, labels, identifiers, or patient-level FHIR Bundles.

FedAvg aggregates model updates so sites benefit from each other's terminology variation without centralizing raw clinical text.

Important limitation: FedAvg gives data locality only. It is not cryptography and it is not a formal privacy guarantee. Production deployment would need secure aggregation, DP-SGD, minimum sample thresholds, and privacy auditing.

## 2:45-3:30 - FHIR IPS Bundle

The FHIR IPS Bundle tab shows the actual interoperable artifact.

The Bundle is `type=document`, the first resource is Composition, and the clinical facts are packaged into Patient, Condition, Observation, MedicationStatement, Organization, and related resources.

The final target-country PDF is generated from this FHIR IPS Bundle. The PDF is useful for human review, but the machine-readable exchange artifact remains the FHIR Bundle.

## 3:30-4:05 - Target Country Readiness

When I change the target country, the receiver view and readiness checks change.

For India, the demo shows ABDM-style readiness gaps such as missing ABHA identifier. For the USA, it shows US Core readiness notes. For Australia and Europe, it labels checks as readiness-only, not certification.

This prevents overclaiming while still showing how the same IPS artifact supports cross-border interpretation.

## 4:05-4:35 - Evidence

The Evidence tab shows:

- 20 synthetic reports
- 4 sites
- 768 terminology training examples
- 48 cross-site transfer examples
- 192 globally unseen examples
- semantic transfer validation: 48/48 correct
- official validator evidence: 0 errors for representative Bundles

The demo also exposes limitations: synthetic data, rule-backed extraction, no formal privacy guarantee, no national certification, and simulated terminology operations.

## 4:35-5:00 - Closing

In summary, this project combines semantic interoperability and data interoperability.

Federated learning helps align local terminology without centralizing raw data. FHIR terminology resources make those mappings auditable. FHIR IPS packages the result into a standards-based patient summary for cross-border exchange.

The result is not just "AI converts text to FHIR." It is a federated, FHIR-native terminology alignment layer for cross-border IPS generation.
