# Final Pitch Deck

## Slide 1 - Title

**Cross-Border IPS AI Agent**

Federated FHIR terminology alignment for diabetes reports.

## Slide 2 - Problem

Clinical information cannot travel safely across systems if local phrases are ambiguous.

Examples:

- USA: `T2DM`
- India: `sugar disease`
- Australia: `raised BP`
- Europe: `Typ-2-Diabetes`

The problem is not only document format. It is semantic meaning.

## Slide 3 - Why HL7

HL7 gives the exchange layer.

FHIR IPS gives the patient-summary document shape. FHIR terminology resources give auditable mappings.

Our claim:

> FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.

## Slide 4 - Solution

The system converts a local diabetes report into:

- extracted clinical facts
- standard terminology codes
- FHIR ConceptMap evidence
- FHIR R4 IPS-style document Bundle
- target-country readiness report

## Slide 5 - Federated Learning Role

Each country/site trains a terminology linker locally.

The coordinator receives only:

- model tensors
- sample counts

It does not receive raw reports, aliases, labels, identifiers, or patient-level FHIR Bundles.

## Slide 6 - Evidence

- 20 synthetic reports
- 4 sites
- 768 terminology training examples
- 48 cross-site transfer examples
- 192 globally unseen examples
- 48/48 semantic transfer examples correct
- 0 validator errors for representative Bundles

## Slide 7 - Demo

The judge can test:

- USA -> India
- India -> USA
- Australia -> Europe
- Europe -> USA

For each route:

- source PDF download
- final country PDF download
- FHIR Bundle JSON download
- evidence pack download

## Slide 8 - Honest Limits

- Synthetic data only
- Rule-backed extraction in prototype
- Simulated terminology operations
- Readiness checks only, not certification
- FedAvg gives data locality only, not formal privacy

Production next steps:

- live terminology servers
- pretrained clinical NER
- formal IPS validation
- secure aggregation
- DP-SGD

## Slide 9 - Final Claim

Cross-Border IPS AI Agent addresses semantic and data interoperability together.

Federated learning resolves local terminology without centralizing raw reports. FHIR terminology artifacts make mappings auditable. FHIR IPS packages the result into a standards-based international patient summary.
