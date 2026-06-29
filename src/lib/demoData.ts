// Embedded static demo data for Cross-Border IPS AI Agent
export type CountryCode = "USA" | "IND" | "AUS" | "EUR";

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  region: string;
}

export const COUNTRIES: Country[] = [
  { code: "USA", name: "United States", flag: "🇺🇸", region: "North America" },
  { code: "IND", name: "India", flag: "🇮🇳", region: "South Asia" },
  { code: "AUS", name: "Australia", flag: "🇦🇺", region: "Oceania" },
  { code: "EUR", name: "Europe (EU)", flag: "🇪🇺", region: "European Union" },
];

export interface SampleReport {
  id: string;
  title: string;
  country: CountryCode;
  text: string;
}

export const SAMPLE_REPORTS: SampleReport[] = [
  {
    id: "usa-001",
    title: "USA · T2DM follow-up (default)",
    country: "USA",
    text: "Synthetic USA Type 2 diabetes follow-up. A 49 year old male with T2DM and high blood pressure has A1c 7.8%. Serum creatinine 1.1 mg/dL. He takes metformin 1000 mg and lisinopril 10 mg.",
  },
  {
    id: "ind-002",
    title: "India · sugar disease review",
    country: "IND",
    text: "Synthetic India clinic note. 54 year old female, known case of sugar disease and BP. HbA1c 8.4 percent. On tab metformin 500 mg BD and tab amlodipine 5 mg OD. Fasting blood sugar 162 mg/dL.",
  },
  {
    id: "aus-003",
    title: "Australia · diabetes mellitus type 2",
    country: "AUS",
    text: "Synthetic Australia GP note. 61 yo M, diabetes mellitus type 2 and essential hypertension. Glycated haemoglobin 7.2%. eGFR 78. Metformin 1 g mane, perindopril 4 mg.",
  },
  {
    id: "eur-004",
    title: "Europe · diabète type 2 / Typ-2-Diabetes",
    country: "EUR",
    text: "Synthetic EU summary. 58 year old patient with Typ-2-Diabetes mellitus and arterielle Hypertonie. HbA1c 7.6%. Treatment: metformine 850 mg, ramipril 5 mg.",
  },
];

export interface ExtractedFact {
  phrase: string;
  category: "Condition" | "Observation" | "MedicationStatement";
  normalized: string;
  snomed?: string;
  icd10?: string;
  loinc?: string;
  rxnorm?: string;
  source: "local-registry" | "federated-linker-cache" | "federated-linker-new";
  fhirResource: "Condition" | "Observation" | "MedicationStatement";
}

export const TRACE_FACTS: ExtractedFact[] = [
  {
    phrase: "T2DM",
    category: "Condition",
    normalized: "Type 2 diabetes mellitus",
    snomed: "44054006",
    icd10: "E11",
    source: "local-registry",
    fhirResource: "Condition",
  },
  {
    phrase: "high blood pressure",
    category: "Condition",
    normalized: "Hypertension",
    snomed: "38341003",
    icd10: "I10",
    source: "local-registry",
    fhirResource: "Condition",
  },
  {
    phrase: "A1c",
    category: "Observation",
    normalized: "HbA1c (Hemoglobin A1c/Hemoglobin.total in Blood)",
    loinc: "4548-4",
    source: "local-registry",
    fhirResource: "Observation",
  },
  {
    phrase: "Serum creatinine",
    category: "Observation",
    normalized: "Creatinine [Mass/volume] in Serum or Plasma",
    loinc: "2160-0",
    source: "federated-linker-cache",
    fhirResource: "Observation",
  },
  {
    phrase: "metformin",
    category: "MedicationStatement",
    normalized: "metformin",
    rxnorm: "6809",
    source: "local-registry",
    fhirResource: "MedicationStatement",
  },
  {
    phrase: "lisinopril",
    category: "MedicationStatement",
    normalized: "lisinopril",
    rxnorm: "29046",
    source: "federated-linker-new",
    fhirResource: "MedicationStatement",
  },
];

export const METRICS = {
  mappingCoverage: "100%",
  fhirBundleType: "document (IPS-style)",
  validatorErrors: 0,
  transferAccuracy: "48 / 48",
};

export const EVIDENCE = {
  syntheticReports: 20,
  sites: 4,
  trainingExamples: 768,
  crossSiteTransfer: 48,
  globallyUnseen: 192,
  semanticTransfer: "48/48 correct",
  validatorErrors: "0 errors (USA→IND, USA→AUS, USA→EUR representative Bundles)",
};

export const PIPELINE_STEPS = [
  { key: "report", label: "Report", icon: "FileText" },
  { key: "facts", label: "Facts", icon: "Sparkles" },
  { key: "terminology", label: "Terminology", icon: "BookMarked" },
  { key: "federated", label: "Federated Linker", icon: "Network" },
  { key: "conceptmap", label: "FHIR ConceptMap", icon: "GitMerge" },
  { key: "bundle", label: "FHIR IPS Bundle", icon: "Package" },
  { key: "readiness", label: "Readiness / Validation", icon: "ShieldCheck" },
] as const;

// FHIR terminology artifacts (representative)
export const CODE_SYSTEM_LOCAL = {
  resourceType: "CodeSystem",
  id: "local-usa-diabetes-terms",
  url: "https://ips-agent.demo/CodeSystem/local-usa-diabetes-terms",
  version: "0.1.0",
  name: "LocalUSADiabetesTerms",
  status: "active",
  content: "complete",
  concept: [
    { code: "T2DM", display: "Type 2 diabetes mellitus (local abbrev.)" },
    { code: "HTN", display: "Hypertension (local abbrev.)" },
    { code: "A1c", display: "Hemoglobin A1c (local abbrev.)" },
    { code: "metformin", display: "metformin (local generic)" },
  ],
};

export const VALUE_SET_DIABETES = {
  resourceType: "ValueSet",
  id: "ips-diabetes-conditions",
  url: "https://ips-agent.demo/ValueSet/ips-diabetes-conditions",
  status: "active",
  compose: {
    include: [
      {
        system: "http://snomed.info/sct",
        concept: [
          { code: "44054006", display: "Diabetes mellitus type 2" },
          { code: "38341003", display: "Hypertensive disorder" },
        ],
      },
    ],
  },
};

export const CONCEPT_MAP = {
  resourceType: "ConceptMap",
  id: "local-to-ips-diabetes",
  url: "https://ips-agent.demo/ConceptMap/local-to-ips-diabetes",
  status: "active",
  sourceUri: "https://ips-agent.demo/CodeSystem/local-usa-diabetes-terms",
  targetUri: "http://snomed.info/sct",
  group: [
    {
      source: "https://ips-agent.demo/CodeSystem/local-usa-diabetes-terms",
      target: "http://snomed.info/sct",
      element: [
        {
          code: "T2DM",
          display: "Type 2 diabetes mellitus (local)",
          target: [{ code: "44054006", display: "Diabetes mellitus type 2", equivalence: "equivalent" }],
        },
        {
          code: "HTN",
          display: "Hypertension (local)",
          target: [{ code: "38341003", display: "Hypertensive disorder", equivalence: "equivalent" }],
        },
      ],
    },
    {
      source: "https://ips-agent.demo/CodeSystem/local-usa-diabetes-terms",
      target: "http://loinc.org",
      element: [
        {
          code: "A1c",
          display: "Hemoglobin A1c (local)",
          target: [{ code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood", equivalence: "equivalent" }],
        },
      ],
    },
  ],
};

export const TRANSLATE_RESULT = {
  resourceType: "Parameters",
  parameter: [
    { name: "result", valueBoolean: true },
    {
      name: "match",
      part: [
        { name: "equivalence", valueCode: "equivalent" },
        {
          name: "concept",
          valueCoding: {
            system: "http://snomed.info/sct",
            code: "44054006",
            display: "Diabetes mellitus type 2",
          },
        },
        { name: "source", valueUri: "https://ips-agent.demo/ConceptMap/local-to-ips-diabetes" },
      ],
    },
  ],
};

export const LOOKUP_RESULT = {
  resourceType: "Parameters",
  parameter: [
    { name: "name", valueString: "LOINC" },
    { name: "display", valueString: "Hemoglobin A1c/Hemoglobin.total in Blood" },
    { name: "code", valueString: "4548-4" },
    {
      name: "designation",
      part: [
        { name: "language", valueCode: "en-US" },
        { name: "value", valueString: "HbA1c" },
      ],
    },
  ],
};

export const VALIDATE_CODE_RESULT = {
  resourceType: "Parameters",
  parameter: [
    { name: "result", valueBoolean: true },
    { name: "message", valueString: "Code 44054006 from SNOMED CT is in ValueSet ips-diabetes-conditions." },
  ],
};

// Federated learning sites
export const FED_SITES = [
  { code: "USA", samples: 192, transferAcc: "12/12", localOnlyAcc: "9/12" },
  { code: "IND", samples: 192, transferAcc: "12/12", localOnlyAcc: "8/12" },
  { code: "AUS", samples: 192, transferAcc: "12/12", localOnlyAcc: "10/12" },
  { code: "EUR", samples: 192, transferAcc: "12/12", localOnlyAcc: "9/12" },
];

export const IPS_BUNDLE = {
  resourceType: "Bundle",
  id: "ips-bundle-demo-usa-001",
  type: "document",
  timestamp: "2026-06-29T14:22:11Z",
  entry: [
    {
      fullUrl: "urn:uuid:composition-1",
      resource: {
        resourceType: "Composition",
        id: "composition-1",
        status: "final",
        type: {
          coding: [
            { system: "http://loinc.org", code: "60591-5", display: "Patient summary Document" },
          ],
        },
        subject: { reference: "urn:uuid:patient-1" },
        date: "2026-06-29",
        author: [{ reference: "urn:uuid:org-1" }],
        title: "International Patient Summary — Synthetic USA T2DM",
        section: [
          { title: "Active Problems", entry: [{ reference: "urn:uuid:cond-t2dm" }, { reference: "urn:uuid:cond-htn" }] },
          { title: "Results", entry: [{ reference: "urn:uuid:obs-a1c" }] },
          { title: "Medications", entry: [{ reference: "urn:uuid:med-metformin" }, { reference: "urn:uuid:med-lisinopril" }] },
        ],
      },
    },
    {
      fullUrl: "urn:uuid:patient-1",
      resource: {
        resourceType: "Patient",
        id: "patient-1",
        gender: "male",
        birthDate: "1976-04-12",
        meta: { tag: [{ system: "https://ips-agent.demo/tags", code: "SYNTHETIC", display: "Synthetic patient" }] },
      },
    },
    {
      fullUrl: "urn:uuid:cond-t2dm",
      resource: {
        resourceType: "Condition",
        id: "cond-t2dm",
        clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
        code: {
          coding: [
            { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" },
            { system: "http://hl7.org/fhir/sid/icd-10", code: "E11", display: "Type 2 diabetes mellitus" },
          ],
        },
        subject: { reference: "urn:uuid:patient-1" },
      },
    },
    {
      fullUrl: "urn:uuid:cond-htn",
      resource: {
        resourceType: "Condition",
        id: "cond-htn",
        code: {
          coding: [
            { system: "http://snomed.info/sct", code: "38341003", display: "Hypertensive disorder" },
            { system: "http://hl7.org/fhir/sid/icd-10", code: "I10", display: "Essential hypertension" },
          ],
        },
        subject: { reference: "urn:uuid:patient-1" },
      },
    },
    {
      fullUrl: "urn:uuid:obs-a1c",
      resource: {
        resourceType: "Observation",
        id: "obs-a1c",
        status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood" }] },
        valueQuantity: { value: 7.8, unit: "%", system: "http://unitsofmeasure.org", code: "%" },
        subject: { reference: "urn:uuid:patient-1" },
      },
    },
    {
      fullUrl: "urn:uuid:med-metformin",
      resource: {
        resourceType: "MedicationStatement",
        id: "med-metformin",
        status: "active",
        medicationCodeableConcept: {
          coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "6809", display: "metformin" }],
        },
        subject: { reference: "urn:uuid:patient-1" },
        dosage: [{ text: "1000 mg" }],
      },
    },
    {
      fullUrl: "urn:uuid:med-lisinopril",
      resource: {
        resourceType: "MedicationStatement",
        id: "med-lisinopril",
        status: "active",
        medicationCodeableConcept: {
          coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "29046", display: "lisinopril" }],
        },
        subject: { reference: "urn:uuid:patient-1" },
        dosage: [{ text: "10 mg" }],
      },
    },
    {
      fullUrl: "urn:uuid:diag-1",
      resource: {
        resourceType: "DiagnosticReport",
        id: "diag-1",
        status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "11502-2", display: "Laboratory report" }] },
        subject: { reference: "urn:uuid:patient-1" },
        result: [{ reference: "urn:uuid:obs-a1c" }],
      },
    },
    {
      fullUrl: "urn:uuid:org-1",
      resource: { resourceType: "Organization", id: "org-1", name: "Synthetic Clinic (USA)" },
    },
  ],
};

export const READINESS = {
  USA: [
    { item: "US Core Patient profile fields", status: "ready" },
    { item: "Race/ethnicity extensions", status: "gap", note: "Optional in demo; not in synthetic source" },
  ],
  IND: [
    { item: "ABDM HealthRecordBundle alignment", status: "ready" },
    { item: "ABHA identifier presence", status: "gap", note: "No real identifier; synthetic only" },
  ],
  AUS: [
    { item: "AU Base Patient alignment", status: "ready" },
    { item: "IHI identifier", status: "gap", note: "Not available for synthetic patient" },
  ],
  EUR: [
    { item: "IPS UV profile alignment (resource shape)", status: "ready" },
    { item: "National extensions (per MS)", status: "gap", note: "Member-state extensions out of scope for demo" },
  ],
} as const;
