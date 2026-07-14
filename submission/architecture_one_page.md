# Cross-Border IPS AI Agent: One-Page Architecture

## Objective

Convert a country-specific Type 2 diabetes report into a machine-readable, universally coded, auditable FHIR R4 IPS-style patient summary for cross-border exchange.

The FHIR IPS Bundle is the interoperable artifact. Source and target PDFs are human-readable renderings.

## Evidence Snapshot

- 4 simulated sites: India, USA, Australia, and Europe.
- 768 local terminology training mentions.
- 48/48 cross-site transfer mappings for the federated model versus 47/48 for local-only models at all five deterministic seeds.
- 192/192 globally unseen synthetic examples, macro-F1 1.000.
- 4/4 representative Bundles passed HL7 FHIR Validator 6.9.11 against IPS 2.0.1 with 0 errors and 0 warnings.

## Architecture

### 1. Local Clinical Site

```text
Structured EHR -----------------------------> Clinical fact model

Free-text or uncontrolled note
        |
        v
Rule-backed extraction in the prototype ----> Clinical fact model
                                                |
                                                v
                                      Local terminology registry
                                         |                 |
                                      registry hit     registry miss
                                         |                 |
                                         v                 v
                                    trusted mapping   federated linker
```

Each fact retains its source span, category, value, unit, medication dose, and context. A federated prediction below 0.70 confidence is unresolved and sent for human review; no clinical code is emitted.

### 2. Semantic Interoperability

```text
Local source term
        |
        v
FHIR CodeSystem + category-constrained ValueSet
        |
        v
FHIR ConceptMap + simulated $translate
        |
        v
$lookup + $validate-code
        |
        v
SNOMED CT / ICD-10 / LOINC / RxNorm coding
```

Code validity is not the same as semantic correctness. The prototype evaluates predicted concepts against synthetic gold labels and exposes traceability; independent clinician review is still required for a production claim.

### 3. Data Interoperability

```text
Coded facts
    |
    v
IPS-style FHIR R4 document Bundle
Bundle.type = document; Composition is first
    |
    v
Patient / Condition / Observation / MedicationStatement / Organization
    |
    v
Receiver readiness checks
US Core STU9 / ABDM R4 draft / AU Core CI / European Patient Summary ballot
    |
    v
Human-readable target PDF generated from the Bundle
```

Readiness checks are not national-profile certification.

## Genuine Federated Learning Loop

```text
India / USA / Australia / Europe
        |
        v
Local SGD on each site's private terminology examples
        |
        v
Weight update + sample count sent to coordinator
        |
        v
Sample-count-weighted FedAvg
        |
        v
Global model broadcast to all sites
        |
        +------------------------ next round
```

The coordinator payload contains model tensors and sample counts only. Raw reports, aliases, labels, identifiers, and patient-level FHIR Bundles are not sent to the coordinator. The measured payload is 48.05 KiB per client update and 1.88 MiB of two-way model traffic across five rounds.

FedAvg provides data locality, not cryptography, de-identification, or a formal privacy guarantee. Model updates may leak information without secure aggregation, differential privacy, and privacy auditing.

## Trace Example

```text
synthetic phrase: "madhumeha type 2"
        -> canonical concept: Type 2 diabetes mellitus
        -> SNOMED CT 44054006 / ICD-10 E11
        -> FHIR Condition
```

## Claim Boundary

Proven in this prototype: synthetic federated benchmark behavior, FHIR-native terminology artifacts, official validator evidence, and downloadable route outputs.

Not claimed: clinical accuracy, national certification, formal privacy, production readiness, real-world EHR integration, or completed independent clinician sign-off.
