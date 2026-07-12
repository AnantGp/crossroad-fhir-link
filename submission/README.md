# HL7 AI Challenge Submission Pack

Project: **Cross-Border IPS AI Agent**

## Aim

Make a local diabetes report usable across borders by converting it into a machine-readable, universally coded, HL7 FHIR IPS-style patient summary.

## Problem Statement

Different countries and EHR ecosystems use different clinical wording, report habits, and terminology conventions. A phrase such as `T2DM`, `sugar disease`, `madhumeha type 2`, or `DM2` may refer to the same clinical concept, but a receiver system needs standard codes and predictable FHIR resources.

## Solution

Cross-Border IPS AI Agent addresses semantic and data interoperability together:

```text
Doctor report or EHR-like note
  -> clinical fact extraction
  -> local terminology registry lookup
  -> federated terminology linker for registry misses
  -> FHIR CodeSystem / ValueSet / ConceptMap
  -> local ConceptMap $translate
  -> external FHIR $lookup / $validate-code snapshot
  -> FHIR R4 IPS-style document Bundle
  -> target-country PDF and readiness report
```

FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.

## Benefit

- Patient journey: a diabetes summary can be understood across borders.
- Hospital journey: the receiver gets coded FHIR resources, not ambiguous text.
- Standards journey: mappings are auditable through FHIR terminology artifacts.
- Privacy posture: local terminology learning keeps raw reports and identifiers at the site.

## Primary Links

- Deployed judge demo: https://crossroad-fhir-link-three.vercel.app
- GitHub repository: https://github.com/AnantGp/crossroad-fhir-link
- Demo video: https://crossroad-fhir-link-three.vercel.app/cross-border-ips-ai-agent-demo.mp4
- Deadline target: July 15, 2026

## Asset Index

- Click-test audit: [click-test-audit.json](click-test-audit.json)
- Demo script: [demo_script.md](demo_script.md)
- Architecture one-pager: [architecture_one_page.md](architecture_one_page.md)
- Final pitch deck source: [final_pitch_deck.md](final_pitch_deck.md)
- Editable final pitch deck: [final_pitch_deck.pptx](final_pitch_deck.pptx)
- Final technical audit: [final_technical_audit.md](final_technical_audit.md)
- Submission form answers: [submission_form_answers.md](submission_form_answers.md)
- Reproducible Python/FL implementation: [../prototype/README.md](../prototype/README.md)
- Federated benchmark output: [federated_benchmark.json](federated_benchmark.json)
- Five-seed robustness study: [federated_multiseed_benchmark.json](federated_multiseed_benchmark.json)
- External terminology validation: [external_terminology_validation.json](external_terminology_validation.json)
- Independent review packet (pending signature): [clinical_review_packet.pdf](clinical_review_packet.pdf)
- Editable independent review checklist: [clinical_review_checklist.csv](clinical_review_checklist.csv)
- Official IPS validation logs: [official_validation/](official_validation/README.md)
- Demo video asset: [video_asset.md](video_asset.md)
- Screenshots: [screenshots/](screenshots/)
- Downloaded route evidence: [downloads/](downloads/)
- Compact supporting-evidence upload: [supporting_evidence.zip](supporting_evidence.zip)

Generated PDFs:

- `architecture_one_page.pdf`
- `final_pitch_deck.pdf`
- `final_pitch_deck.pptx`
- `demo_script.pdf`
- `final_technical_audit.pdf`

Video:

- Local MP4: `cross-border-ips-ai-agent-demo.mp4`
- Public deploy path: `https://crossroad-fhir-link-three.vercel.app/cross-border-ips-ai-agent-demo.mp4`
- Voiceover source: `elevenlabs_voiceover.mp3`

## Click-Tested Routes

| Route | Source PDF | Final PDF | FHIR JSON | Evidence JSON |
|---|---:|---:|---:|---:|
| USA -> India | verified | verified | verified | verified |
| India -> USA | verified | verified | verified | verified |
| Australia -> Europe | verified | verified | verified | verified |
| Europe -> USA | verified | verified | verified | verified |

All four checked-in Bundles pass HL7 FHIR Validator 6.9.11 against the IPS 2.0.1 Bundle profile with 0 errors and 0 warnings. Each Bundle retains two informational RxNorm value-set recommendations. Across five deterministic seeds, the synthetic FL study is 48/48 federated transfer versus 47/48 local-only and 192/192 globally unseen predictions with macro-F1 1.000 at every seed. A patient-free tx.fhir.org snapshot also records 4/4 successful `$lookup` and 4/4 successful `$validate-code` operations for representative SNOMED CT, LOINC, RxNorm, and ICD-10 codes.

The clinical review packet is deliberately marked **PENDING INDEPENDENT REVIEW**. Do not claim external clinical validation unless a qualified reviewer completes and signs it.

Receiver-gap labels were checked on July 11, 2026 against US Core 9.0.0 (STU9), the ABDM FHIR R4 7.0.0 draft build, AU Core 2.0.0 trial-use, and the HL7 Europe Patient Summary continuous build. They remain readiness-only comparisons, not profile validation or certification.

## Claim Discipline

Use:

- "FHIR IPS is the interoperable artifact; PDFs are human-readable renderings."
- "Readiness checks, not national profile certification."
- "FedAvg gives data locality only."
- "Synthetic validation evidence."

Avoid:

- "Certified national conversion."
- "Fully private federated learning."
- "FedAvg de-identifies patient data."
- "Production-ready clinical decision support."
