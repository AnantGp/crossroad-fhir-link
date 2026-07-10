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
  -> simulated $translate / $lookup / $validate-code
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
- Final technical audit: [final_technical_audit.md](final_technical_audit.md)
- Demo video asset: [video_asset.md](video_asset.md)
- Screenshots: [screenshots/](screenshots/)
- Downloaded route evidence: [downloads/](downloads/)

Generated PDFs:

- `architecture_one_page.pdf`
- `final_pitch_deck.pdf`
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
