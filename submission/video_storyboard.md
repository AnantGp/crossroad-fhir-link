# Final Video Storyboard

Project: **Cross-Border IPS AI Agent**

Purpose: a clean 3-5 minute judge-facing walkthrough that explains the aim, problem, solution, proof, and benefit of the HL7 AI Challenge submission.

Core claim:

> FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.

## Claim Boundaries

Say:

- IPS-style FHIR R4 document Bundle.
- Official HL7 validator evidence: all four current Bundles pass IPS 2.0.1 with 0 errors and 0 warnings.
- Readiness checks, not national profile certification.
- FedAvg gives data locality only.
- Synthetic validation evidence.

Do not say:

- Certified national conversion.
- Fully private federated learning.
- FedAvg de-identifies patient data.
- Production clinical decision support.

## Scene Plan

| Scene | Screen Title | Visual | What It Proves |
| --- | --- | --- | --- |
| 01 | Global Journey Of Patient Information | USA -> India dashboard | Aim: local diabetes report becomes a machine-readable cross-border summary. |
| 02 | Local Clinical Language Does Not Travel Cleanly | Local phrase mapping graphic | Problem: T2DM, sugar disease, madhumeha type 2, and DM2 can mean the same condition. |
| 03 | One Local Report To One Cross-Border Summary | USA -> India dashboard | Objective: PDF is the readable view; FHIR IPS is the interoperable artifact. |
| 04 | Report To FHIR IPS In One Pipeline | Pipeline diagram | Solution flow: report, facts, terminology, ConceptMap, FHIR IPS, readiness. |
| 05 | FedAvg Learns Local Terms Without Centralizing Reports | Federated learning diagram | Data-local learning proof: coordinator receives model tensors and sample counts only. |
| 06 | FHIR Terminology Makes AI Mappings Auditable | CodeSystem / ValueSet / ConceptMap graphic | HL7-native linker proof: mapping is auditable, not a hidden AI guess. |
| 07 | Local Words Become Accepted Healthcare Codes | Clinical trace table | Universal coding proof: SNOMED CT, ICD-10, LOINC, RxNorm, and FHIR resources. |
| 08 | FHIR IPS Packages The Coded Patient Summary | USA -> India FHIR Bundle screenshot | Machine-readable proof: Bundle.type=document and Composition first. |
| 09 | The Same FHIR IPS Supports Different Receivers | Australia -> Europe FHIR Bundle screenshot | Cross-border sharing proof: one machine-readable IPS supports different receiver views. |
| 10 | Evidence Shown In The Demo | Evidence screenshot | Evidence: 20 reports, 768 mentions, 48/48 federated transfer versus 47/48 local-only, 192/192 globally unseen in the seeded synthetic benchmark, and 4/4 IPS 2.0.1 validations with 0 errors and 0 warnings. |
| 11 | What Changes For Patient, Hospital, And Auditor | Final claim visual | Benefit: cross-border understandability, coded resources, local data, traceability. |
| 12 | Honest prototype, clear production path | Limitations panel | Scope: synthetic data, no certification, no formal privacy guarantee. |

## Exact Visual Evidence To Use

- `submission/screenshots/usa-to-india-dashboard.png`
- `submission/screenshots/usa-to-india-fhir-bundle.png`
- `submission/screenshots/australia-to-europe-fhir-bundle.png`
- `submission/screenshots/europe-to-usa-evidence.png`
- Generated internal diagrams from `scripts/build_demo_video.py`:
  - pipeline
  - local phrase mapping
  - federated learning
  - FHIR terminology layer
  - clinical trace
  - final claim
  - limitations

## Audio Sync Plan

When the ElevenLabs MP3 arrives:

```bash
cp "/path/to/new-elevenlabs-audio.mp3" submission/elevenlabs_voiceover.mp3
python3 scripts/build_demo_video.py --voiceover submission/elevenlabs_voiceover.mp3
cp submission/cross-border-ips-ai-agent-demo.mp4 public/cross-border-ips-ai-agent-demo.mp4
```

The script allocates slide durations from narration length, so the visuals remain synchronized with the final MP3 without manual editing.
