# Method and architecture

[Project overview](../README.md) · [Evaluation](evaluation.md) · [Reproduction](reproduction.md)

## Research question and intended use

The project investigates whether local terminology examples can improve a shared terminology classifier without pooling those examples at the training coordinator, and whether the resulting mappings can be represented transparently in HL7 FHIR.

The case study concerns Type 2 diabetes and related conditions, tests, and medications across four simulated sites: India, USA, Australia, and Europe. Site labels describe synthetic vocabularies, not comprehensive national language datasets. Europe is a simulated ecosystem rather than a country.

The expected benefit is more consistent, inspectable patient-summary exchange. The project has not measured reductions in clinical errors, staff time, or costs in a hospital.

## Two workflows

**Learning:** local mention/label examples -> local classifier training -> model tensors and sample counts -> FedAvg -> shared terminology model.

**Conversion:** local report -> clinical facts -> registry/cache lookup -> optional learned fallback -> FHIR terminology artifacts -> IPS-style Bundle -> readable report and readiness findings.

FedAvg operates on classifier parameters. It does not operate on patient identities, PDFs, FHIR resources, or Bundles. The receiving report is an output of the conversion workflow, not a second de-identification Bundle.

## Clinical extraction and fact model

[`ReportUnderstandingAgent`](../prototype/src/ips_agent/extractor.py) uses regular expressions and deterministic rules for the supported synthetic text slice. It is not a pretrained clinical NER system. It extracts categories, mention text, source text, measurement values/units, and available patient attributes.

[`ClinicalFactModel`](../prototype/src/ips_agent/models.py) stores the patient fields and fact list as JSON-compatible data. The legacy name `ClinicalKnowledgeGraph` is an alias retained for compatibility; there is no graph database or graph-learning stage.

The implemented `run_pipeline` entry point accepts text. A production structured-EHR adapter could supply already structured facts, but a general structured-EHR ingestion/bypass path is not implemented here. PDF downloads in the presentation app are renderings of representative cases; they are not evidence of general PDF parsing or OCR.

Rule coverage, negation, clinical temporality, dosage interpretation, and multilingual extraction require external evaluation. In particular, an ambiguous phrase such as `sugar disease` cannot independently establish Type 2 diabetes.

## Terminology resolution

[`TerminologyAgent`](../prototype/src/ips_agent/terminology.py) normalizes the extracted mention and applies a curated alias dictionary. It then looks for that canonical key in a local dictionary of code mappings.

For an unmapped phrase, it checks the site's learned mapping cache. If that also misses and a `TerminologyLinker` was supplied, it predicts a canonical concept within the fact category. A registry miss can reflect ambiguity, extraction error, or an unsupported concept as well as local wording.

The learned head has a fixed vocabulary of 12 concepts:

- Conditions: Type 2 diabetes mellitus, hypertension, chronic kidney disease, dyslipidemia.
- Labs: HbA1c, fasting plasma glucose, estimated glomerular filtration rate, LDL cholesterol.
- Medications: metformin, insulin, lisinopril, atorvastatin.

The deterministic registry covers additional terms. A learned prediction selects a known concept and reuses its registered codes; it cannot invent a new SNOMED CT, LOINC, RxNorm, or ICD-10 code.

The category mask is applied before softmax, argmax, and the confidence check. Below `0.70`, the linker returns no canonical concept and requests human review. This threshold is not a calibrated probability of clinical correctness. An unfamiliar phrase can still be classified incorrectly with high confidence.

## Federated training

Implementation: [`training.py`](../prototype/src/ips_agent/federated/training.py) and [`linker.py`](../prototype/src/ips_agent/federated/linker.py).

The input representation uses normalized mention text only. It combines word unigrams/bigrams and character 3- to 5-grams, hashed deterministically with BLAKE2b into 1,024 signed features, then normalized and scaled. The stored context string is not a model input.

A PyTorch linear layer predicts 12 class logits. Each site performs SGD on its local labelled examples. Defaults are ten epochs per round, batch size 16, learning rate 0.1, and five communication rounds.

For local dataset size `n_i`, total participating size `N`, and locally trained parameters `w_i`, the server computes:

```text
w_global_next = sum_i (n_i / N) * w_i
```

The implementation sorts clients and state keys, accumulates weighted tensors in float64, and casts back to model dtype. Shuffle seeds depend on base seed, site index, round, and epoch. Tests verify weight changes, aggregation tolerance, masking, and dataset separation.

All clients and the coordinator run in one Python process with distinct local datasets. This implements local optimization and FedAvg for a simulation; it does not deploy a network of hospital clients. Training data is not pooled for FedAvg. The centralized model is an offline reference only.

## What is shared

The aggregation input consists of model tensors and sample counts. Diagnostic output also identifies the simulated site and records final local loss. The experiment emits local evidence containing synthetic mentions and expected labels for inspection; those evidence files must not be confused with the aggregation payload.

Raw report text, phrase examples, labels, aliases, patient identifiers, and patient-level Bundles are excluded from the demonstrated aggregation payload. Model updates may still reveal training information. FedAvg does not de-identify records or provide a formal privacy guarantee. Secure aggregation, differential privacy, transport protections, and privacy attacks are outside the current implementation.

## FHIR terminology layer

[`FHIRTerminologyService`](../prototype/src/ips_agent/fhir_terminology.py) is an in-process facade:

- `CodeSystem` identifies locally defined terms and their codes.
- `ValueSet` describes allowed target codes for a category.
- `ConceptMap` records a mapping from a local term to registered target coding.
- Local `$translate`, `$lookup`, and `$validate-code` simulations expose translation and registry checks.

The facade accepts a learned mapping when its confidence meets the threshold and its target coding passes local registry/category checks. It records the confidence, timestamp, mapping source, validation status, and ConceptMap identifier. Reusing the same service/agent instance allows a later lookup to hit its in-memory learned cache. No persistent cross-process cache is implemented, and authoritative terminologies are not modified.

The separately recorded tx.fhir.org snapshot checks four representative target codes using external `$lookup` and `$validate-code`. It does not execute the local phrase `$translate` externally or prove that a model-selected concept matches the source meaning.

## FHIR document and receiving ecosystem

[`IPSBuilderAgent`](../prototype/src/ips_agent/ips_builder.py) packages coded facts into a FHIR R4 document Bundle. `Bundle.type` is `document`, and the first entry is `Composition`. Depending on the source, other resources include `Patient`, `Organization`, `Condition`, `Observation`, `MedicationStatement`, `AllergyIntolerance`, and `DiagnosticReport`.

SNOMED CT supports clinical concept coding, ICD-10 provides condition classification, LOINC identifies laboratory observations, and RxNorm identifies demonstrated medications/ingredients. The same category may carry more than one coding. A valid code is not sufficient evidence for clinical equivalence; ingredient coding is also less specific than product-and-dose coding.

The source-to-fact-to-code-to-resource trace is built by [`pipeline.py`](../prototype/src/ips_agent/pipeline.py). It supports review of what the software did. Independent source-grounded labels or clinical review are needed to assess whether the interpretation was correct.

Country-oriented PDFs are readable views of the case. Readiness findings reference the July 2026 baselines for US Core STU9, ABDM R4 draft material, AU Core 2.0.0, and the HL7 Europe Patient Summary build. Those comparisons are not formal national-profile validation or a guarantee that a receiving EHR will import the document.

## Meaning of "agents" in this implementation

The Python pipeline composes named components for report understanding, terminology, IPS building, country checks, validation, and explanations. These are ordinary cooperating Python components. The terminology classifier is trainable; the prototype does not run an autonomous LLM-agent planning system.

The public React/Vite demo displays embedded case evidence. The Python package executes extraction, terminology resolution, training, and document construction. The optional FastAPI service exposes the Python pipeline, but the public presentation app does not invoke it.
