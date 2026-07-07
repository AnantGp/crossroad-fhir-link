# One-Page Architecture

## Chronological Flow

```text
Country source report or EHR-like note
        |
        v
Input mode decision
        |-- structured EHR input -> skip extraction
        |
        |-- free text / uncontrolled note
        v
Rule-backed extraction in prototype
future: pretrained clinical NER
        |
        v
Clinical fact model
JSON facts: condition, lab, value, medication, dose, context
        |
        v
Local terminology registry
trusted deterministic lookup for known phrases
        |
        |-- found
        |      v
        |   standard code selected
        |
        |-- not found
               v
        Federated terminology linker
        local training at USA / India / Australia / Europe
        coordinator receives model tensors + sample counts only
               |
               v
        predicted canonical concept
               |
               v
FHIR terminology layer
CodeSystem + ValueSet + ConceptMap
simulated $translate + $lookup + $validate-code
        |
        v
FHIR R4 IPS-style document Bundle
Bundle.type=document, Composition first
Condition / Observation / MedicationStatement resources
        |
        v
Target-country readiness checks
US Core / ABDM / AU Base / EU IPS-style readiness
        |
        v
Human-readable target PDF
generated from FHIR IPS Bundle
```

## What Interoperability Comes From

Semantic interoperability comes from standard terminology:

- SNOMED CT for clinical problems
- ICD-10 for diagnosis classification
- LOINC for lab observations
- RxNorm for medications
- FHIR ConceptMap for local phrase to standard concept mappings

Data interoperability comes from FHIR:

- Patient
- Condition
- Observation
- MedicationStatement
- Composition
- Bundle

## Privacy Boundary

Raw reports, local aliases, labels, identifiers, and patient-level FHIR Bundles stay local.

The federated coordinator receives:

- model tensors
- sample counts

This is data locality, not a formal privacy guarantee.
