# Evaluation and limitations

[Project overview](../README.md) · [Method](methodology.md) · [Reproduction](reproduction.md)

This guide interprets the checked-in July 2026 evidence. A result on this synthetic dataset should be reported with its dataset size, split definition, and limitations.

## Dataset construction

Source: [`data.py`](../prototype/src/ips_agent/federated/data.py).

The 20-report case study is separate from the terminology-learning corpus. It contains four local illustrative reports and an outgoing relay report for each simulated site. The examples folder also retains earlier demonstration reports.

The terminology corpus contains:

- **768 training examples:** 12 concepts × 4 sites × 16 distinct mention strings per concept/site. Mention strings use a site-specific root with category-specific templates; they are synthetic variations, not 768 independently observed clinical expressions.
- **48 transfer probes:** one per concept on each edge of India -> USA -> Australia -> Europe -> India. A probe uses a sender-trained mention in a new context, absent from the receiver's training set. It was seen by the federation.
- **192 globally unseen examples:** 12 concepts × 4 sites × 4 held-out mention strings. Their normalized mentions appear in neither training nor transfer pools.

Overlap checks require a held-out mention to share at least two character n-grams and Jaccard overlap of at least `0.05` with a same-concept training mention at its site. The current checker uses character 3- to 5-grams and does not separately verify that shared stems are distinctive across concepts. It examines mentions rather than generic context. These checks screen unsuitable synthetic examples; they do not prove learnability or clinical equivalence.

Held-out examples share stems and templates with the training distribution. "Globally unseen" refers to complete mention strings, not unseen medical concepts, languages, or hospitals. Repeating training seeds on one fixed corpus measures training variability rather than independent dataset replication. Per-round held-out metrics are recorded, so this pool should not be portrayed as a blinded external clinical test.

## Baselines and comparison

The seed-42 benchmark includes exact-dictionary, receiver-local, federated, and pooled centralized-reference evaluations. The five-seed study compares federated and local-only models on the same fixed pools.

The local-only baseline trains for 50 epochs, matching five rounds × ten local epochs. The single-seed centralized reference uses ten epochs over pooled data and is informative; it is not a compute-matched centralized upper bound. It is never used as the deployed conversion approach.

The transfer acceptance gate requires no receiver to regress and strictly more correct predictions across all 48 probes. It does not require improvement at every site. This is a regression check for the demonstration, not a statistical significance test.

## Results and their interpretation

Raw evidence: [seed-42 benchmark](../submission/federated_benchmark.json) and [five-seed study](../submission/federated_multiseed_benchmark.json).

At seeds `7`, `21`, `42`, `84`, and `126`:

- Federated transfer: **48/48** correct at every seed.
- Receiver-local transfer: **47/48** correct at every seed.
- Transfer gain: **one prediction**, equivalent to **2.08 percentage points**, with all four receivers non-regressive.
- Federated globally unseen: **192/192**, macro-F1 **1.000**, at every seed.
- Mean local-only globally unseen accuracy: **94.2708%**, sample standard deviation **0.2604 percentage points** across seeds.

The classifier metrics are category-constrained top-1 predictions. They do not count abstentions from the runtime `0.70` threshold. Precision/recall at a clinical operating point, calibration, out-of-vocabulary detection, and threshold-aware coverage/accuracy need separate evaluation.

The experiment demonstrates a small positive transfer gain on a deliberately constrained benchmark. It does not establish that FL is universally superior to local models, or that this dataset justifies a production deployment.

## Communication estimate

The linear model has 12,300 float32 parameters: 49,200 tensor bytes per update, approximately 48.05 KiB. Including the sample count and broadcasts across four sites and five rounds gives an estimated 1,968,160 bytes, approximately 1.88 MiB, of two-way model traffic.

This is a tensor-size calculation. Network transport, serialization, encryption, coordinator hosting, deployment, and operational costs were not benchmarked.

## FHIR structure and profile evidence

Raw evidence: [validator summary](../submission/official_validation/validation-summary.json), [four-route log](../submission/official_validation/ips-2.0.1-all-routes.txt), and [Python pipeline log](../submission/official_validation/prototype-usa-to-india.txt).

The recorded configuration is HL7 FHIR Validator `6.9.11`, FHIR `4.0.1`, and `hl7.fhir.uv.ips#2.0.1`, targeting the IPS Bundle profile.

The four representative routes are USA -> India, India -> USA, Australia -> Europe, and Europe -> USA. Each recorded **0 errors, 0 warnings, and 2 informational notes**. The notes concern RxNorm ingredients outside the IPS-recommended medication value set. The separately generated Python USA -> India example recorded 0 errors, 0 warnings, and 3 informational notes.

These routes differ from the terminology-transfer ring; they are representative document examples. The logs apply to those specific Bundles and the recorded profile/version. They do not validate every future output, prove extraction or clinical correctness, certify national formats, or establish that a real EHR has imported the document.

The pipeline's own `validation_errors` field is an internal check. `official_fhir_validator_run` is false for an ordinary `run_pipeline` call. Official validator evidence is a separate execution and must not be inferred from an internal success flag.

## Terminology evidence

Raw evidence: [external terminology snapshot](../submission/external_terminology_validation.json), recorded July 12, 2026.

The snapshot covers SNOMED CT `44054006`, LOINC `4548-4`, RxNorm `6809`, and ICD-10 `E11`. Each passed external `$lookup` and `$validate-code` at `https://tx.fhir.org/r4`. Returned terminology versions are preserved in the JSON.

That establishes recognition of those four target codes by the recorded server. It does not validate every code in the registry, execute phrase translation externally, or confirm that the source phrase warrants the chosen concept. Local ConceptMap operations check the curated mappings and category constraints.

## Interface and document evidence

[The click-test audit](../submission/click-test-audit.json) records four demonstrated routes and 16 downloads: source PDF, receiving PDF, FHIR JSON, and evidence JSON for each. The [downloads directory](../submission/downloads/) contains the examples, and the [screenshots directory](../submission/screenshots/) records the views.

These are July 2026 checks of a presentation app with embedded synthetic evidence. They do not establish a live hospital integration, arbitrary text conversion in the public app, or continuous availability of external services.

## Clinical and privacy limits

The [clinical review packet](../submission/clinical_review_packet.pdf) is pending independent signature. No clinician endorsement or external clinical validation is established by the repository.

Structured output, valid target codes, and a traceable mapping can still contain a clinically incorrect interpretation. Appropriate future evaluation needs independently labelled notes, ambiguous and negated examples, clinical review, a broader held-out vocabulary, and error analysis by category and site.

The simulation excludes patient records and labelled phrases from the aggregation payload. It implements no differential privacy or secure aggregation and has not measured information leakage. Current evidence supports data-local training behavior, not de-identification or a formal privacy guarantee.

## What a reviewer can conclude

The repository provides executable local training and deterministic FedAvg, a separated synthetic benchmark with a modest transfer gain, inspectable FHIR terminology artifacts, and dated IPS validation logs for representative documents. Clinical utility, multilingual robustness, real-hospital deployment, and production privacy remain research and engineering work.
