# Cross-Border IPS AI Agent: Supporting Evidence

Tech Adaptive Pandit

Team: Anant Gupta, Manish Gupta, Gourav Gupta

## Start Here

1. Open `architecture_one_page.pdf` for the complete architecture, federated-learning boundary, trace example, evidence metrics, and claim boundary.
2. Open `final_technical_audit.pdf` for the final engineering and submission-readiness audit.
3. Review the raw evidence files below for reproducible details.

## Package Contents

- `architecture_one_page.pdf`: judge-facing architecture and evidence summary.
- `final_technical_audit.pdf`: technical audit and honest deployment limitations.
- `federated_multiseed_benchmark.json`: five-seed federated, local-only, centralized-reference, and globally unseen metrics.
- `external_terminology_validation.json`: representative external terminology lookup and code-validation results.
- `click-test-audit.json`: browser route and download verification results.
- `validation-summary.json`: machine-readable FHIR/IPS validation summary.
- `ips-2.0.1-all-routes.txt`: unedited HL7 FHIR Validator output for all four representative routes.
- `prototype-usa-to-india.txt`: unedited validator output from the reproducible Python pipeline example.

## Headline Evidence

- Four simulated terminology sites: India, USA, Australia, and Europe.
- 768 local terminology training mentions.
- 48/48 cross-site transfer predictions for the federated model versus 47/48 for local-only models at all five deterministic seeds.
- 192/192 globally unseen synthetic examples, macro-F1 1.000.
- Four representative Bundles passed HL7 FHIR Validator 6.9.11 against IPS 2.0.1 with 0 errors and 0 warnings.

The all-routes validator output contains two informational notes per route concerning IPS-preferred medication coding. These are neither errors nor warnings, and they remain visible as a transparent production consideration.

Terminology-operation boundary: the prototype's FHIR ConceptMap `$translate` operation is executed locally and simulated for the demo. The external tx.fhir.org evidence covers representative `$lookup` and `$validate-code` checks only; it is not evidence that `$translate` was externally executed or that the predicted semantic mapping is clinically correct.

## Claim Boundary

This is a synthetic standards-based prototype. The evidence does not establish clinical accuracy, national-profile certification, formal privacy, production readiness, real-world EHR integration, or completed independent clinician sign-off.

FedAvg keeps the demonstrated training data local to each simulated site, but it is not cryptography or de-identification. Production use would require secure aggregation, differential privacy, transport security, governance, and privacy testing.

## Links

- Demo: https://crossroad-fhir-link-three.vercel.app
- Source repository (private backup): https://github.com/AnantGp/crossroad-fhir-link
- Complete source package submitted separately: `crossroad-fhir-link-source-2026-07-14.zip`
