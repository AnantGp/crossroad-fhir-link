# Final Technical Audit

Audit date: July 7, 2026

Deployed demo: https://crossroad-fhir-link-three.vercel.app

## Automated Click-Test Result

Status: PASS

Routes tested:

- USA -> India
- India -> USA
- Australia -> Europe
- Europe -> USA

For each route, the audit verified:

- selected source and target state match the UI
- Clinical Trace renders
- FHIR IPS Bundle tab renders
- Evidence & Limitations tab renders
- source PDF downloads as a valid PDF
- final target-country PDF downloads as a valid PDF
- FHIR Bundle JSON downloads and parses
- evidence pack JSON downloads and parses
- FHIR Bundle JSON has `resourceType=Bundle`
- FHIR Bundle JSON has `type=document`
- first Bundle entry is `Composition`

Audit file: [click-test-audit.json](click-test-audit.json)

## UI Status

No broken route was detected in the automated browser audit.

Screenshots were captured for:

- each route dashboard
- each route FHIR Bundle view
- each route evidence view
- mobile dashboard smoke test

## Claim Check

Approved wording:

- "FHIR IPS is the interoperable artifact; PDFs are human-readable renderings."
- "Readiness checks only; no national profile certification claimed."
- "FedAvg gives data locality only; model updates can leak information without DP-SGD or secure aggregation."

Avoided wording:

- "certified national conversion"
- "fully private federated learning"
- "production-ready clinical decision support"

## Evidence Consistency

Metrics shown in the UI match the downloadable evidence pack:

- 20 synthetic reports
- 4 sites
- 768 terminology training examples
- 48 cross-site transfer examples
- 192 globally unseen examples
- five-seed semantic transfer validation: 48/48 federated versus 47/48 local-only at every seed (+1 per seed)
- globally unseen robustness: 192/192 and macro-F1 1.000 at every seed; local-only mean 94.27% with 0.26 percentage-point sample standard deviation
- communication estimate: 48.05 KiB of model tensors per client update and 1.88 MiB two-way tensor traffic across five rounds
- official HL7 FHIR Validator 6.9.11 against IPS 2.0.1: 4/4 Bundles, 0 errors, 0 warnings
- informational notes: 2 per Bundle because RxNorm ingredients are outside the IPS guide's recommended medication value set

The model metrics cover five predetermined deterministic seeds, but they remain synthetic results and are not clinical performance evidence.

## Remaining Submission Risks

These should be stated openly to judges:

- data is synthetic
- extraction is rule-backed
- terminology operations are simulated
- national checks are readiness-only
- FL does not provide formal privacy without additional safeguards

## Final Freeze Recommendation

Freeze implementation now unless a critical bug appears.

Focus remaining time on:

- demo video
- narrative clarity
- final submission form
- Q&A preparation
