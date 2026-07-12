# HL7 AI Challenge 2026 - Submission Form Answers

Use these answers in the official form. Replace the bracketed personal details before submitting.

## Project Title

Cross-Border IPS AI Agent

## Team Name

Cross-Border IPS AI Agent Team

## Team Participants

[List every participant, role, and organization. Identify the technical lead, clinical/terminology reviewer, and presentation lead.]

## Applicant Details

- First name: [required]
- Last name: [required]
- Email: [required]
- Phone: [required]
- City: [required]
- Country/Region: India
- HL7 membership status: [Member or Non-Member]

## Preferred Evaluation Category

Efficiency and Effectiveness

Rationale: the solution streamlines standards-based clinical data sharing by resolving local terminology and producing a machine-readable international patient summary.

## Solution Summary

Cross-Border IPS AI Agent addresses semantic and data interoperability for international patient summaries. A local Type 2 diabetes report or EHR-like note is converted into traceable clinical facts, mapped to standard terminology, and packaged as an IPS-style FHIR R4 document Bundle. Known terms resolve through a deterministic registry; unknown local expressions are handled by a federated terminology linker trained across four simulated sites without centralizing raw reports. Accepted mappings are represented through FHIR CodeSystem, ValueSet, and ConceptMap artifacts. The FHIR IPS Bundle is the machine-readable exchange artifact, while source- and receiver-country PDFs are human-readable renderings. The prototype demonstrates USA, India, Australia, and Europe routes. Across five deterministic synthetic seeds, federated transfer is 48/48 versus 47/48 local-only, and globally unseen accuracy is 192/192. All four current Bundles pass HL7 FHIR Validator 6.9.11 against IPS 2.0.1 with zero errors and zero warnings. A patient-free tx.fhir.org snapshot also records 4/4 successful FHIR `$lookup` and `$validate-code` checks for representative SNOMED CT, LOINC, RxNorm, and ICD-10 codes. This is an honest synthetic prototype, not certified clinical software.

## Core Features And Functionalities

1. Structured-input bypass and rule-backed extraction for synthetic free-text clinical notes.
2. Traceable clinical fact model preserving source phrase, predicted meaning, values, units, and resource placement.
3. Deterministic terminology registry with a federated fallback for unknown local phrases.
4. Genuine PyTorch local training and sample-weighted FedAvg across four simulated sites.
5. FHIR-native terminology artifacts: local CodeSystem, constrained ValueSet, and auditable ConceptMap.
6. External FHIR terminology evidence using tx.fhir.org `$lookup` and `$validate-code` for representative target codes.
7. IPS-style FHIR R4 document Bundle with Composition first and coded Condition, Observation, MedicationStatement, Patient, and Organization resources.
8. Official FHIR Validator and IPS 2.0.1 evidence for all four representative routes.
9. Receiver-readiness comparisons for US Core, ABDM FHIR R4, AU Core, and the European Patient Summary, without claiming national certification.
10. Downloadable source PDF, receiver PDF, FHIR Bundle JSON, and evidence JSON for every route.
11. Explicit privacy boundary: reports and patient-level Bundles stay local; FedAvg is described as data locality, not cryptography or formal de-identification.
12. Full audit path from source phrase to canonical concept, terminology code, and FHIR resource.

## Target Audiences

Hospital interoperability teams, health information exchanges, EHR vendors, national digital-health programs, terminology-service teams, cross-border care networks, clinical informaticians, and patients who need portable international summaries.

## AI Capability Type

Combination

Rationale: the system combines a predictive federated terminology classifier with orchestrated extraction, terminology, validation, FHIR-building, readiness, and explanation components.

## AI Solution Impact Areas

- Clinical Delivery Efficiency
- Patient/Caregiver Experience
- Clinical Quality Improvement

## Implementation Readiness

Prototype

Do not select Pilot, Ready for Deployment, or In Production. The current evidence uses synthetic data and simulated sites.

## Required PDF

Upload: `submission/final_pitch_deck.pdf`

## Video URL

https://crossroad-fhir-link-three.vercel.app/cross-border-ips-ai-agent-demo.mp4

No password is required.

## Supporting Documents

Recommended upload order, subject to the form's file-count and size limits:

1. `submission/final_technical_audit.pdf`
2. `submission/architecture_one_page.pdf`
3. `submission/clinical_review_packet.pdf` only after it is completed and signed
4. `submission/supporting_evidence.zip` if only one supporting upload is accepted
5. `submission_pack.zip` if a full source-and-evidence ZIP is accepted

Never upload the unsigned clinical review packet as evidence of endorsement. It is a review instrument until signed.

## Source Code Repository

https://github.com/AnantGp/crossroad-fhir-link

The repository must be made accessible to judges before submission. A private URL without granted reviewer access is not sufficient evidence.

## Demo URL

https://crossroad-fhir-link-three.vercel.app

## Claim Discipline

Use:

- FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.
- Federated learning provides data-local terminology learning.
- External terminology checks verify representative code recognition only.
- Readiness comparison, not national profile certification.
- Synthetic prototype with reproducible evidence.

Do not use:

- Fully private federated learning.
- FedAvg de-identifies patient data.
- Certified cross-country conversion.
- Clinically validated, unless the independent review is actually completed and signed.
- Production-ready or in production.

## Final Confirmation Checklist

- [ ] Personal and team details completed.
- [ ] Repository accessible to judges.
- [ ] Pitch deck PDF uploaded.
- [ ] Public video URL opened in a private/incognito browser.
- [ ] Supporting evidence uploaded within form limits.
- [ ] Clinical review is either signed or clearly described as pending.
- [ ] Originality, challenge-rules, and promotional-use confirmations reviewed and accepted by the applicant.
- [ ] Submission confirmation page/email saved.
