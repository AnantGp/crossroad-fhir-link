# Official HL7 Validation Evidence

All four current demo Bundles were validated on 2026-07-11 with HL7 FHIR Validator 6.9.11 against FHIR R4 and the International Patient Summary 2.0.1 Bundle profile.

## Result

| Route | Errors | Warnings | Information notes |
| --- | ---: | ---: | ---: |
| USA to India | 0 | 0 | 2 |
| India to USA | 0 | 0 | 2 |
| Australia to Europe | 0 | 0 | 2 |
| Europe to USA | 0 | 0 | 2 |

Each informational note states that an RxNorm ingredient code is not in the IPS guide's recommended medication value set. This is not a validation error or warning, but it is retained as a transparent production gap: a deployed system should add an IPS-preferred medication/product coding where available.

The complete unedited validator output is in `ips-2.0.1-all-routes.txt`.

The reproducible Python pipeline was separately run for a USA-to-India synthetic report. Its generated Bundle also passed IPS 2.0.1 with 0 errors and 0 warnings; the validator reported three informational notes (two RxNorm value-set recommendations and one draft DiagnosticReport status CodeSystem reference). The unedited output is in `prototype-usa-to-india.txt`.

## Reproduce

```bash
java -Xmx4g -jar validator_cli.jar \
  submission/downloads/usa-to-india-fhir-bundle.json \
  submission/downloads/india-to-usa-fhir-bundle.json \
  submission/downloads/australia-to-europe-fhir-bundle.json \
  submission/downloads/europe-to-usa-fhir-bundle.json \
  -version 4.0.1 \
  -ig hl7.fhir.uv.ips#2.0.1 \
  -profile http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips
```

This evidence supports structural and profile conformance of the synthetic Bundles. It does not certify clinical correctness, national-profile certification, production privacy, or real-world EHR integration.
