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

export type FactSource = "local-registry" | "federated-linker-cache" | "federated-linker-new";

export interface ExtractedFact {
  phrase: string;
  category: "Condition" | "Observation" | "MedicationStatement";
  normalized: string;
  snomed?: string;
  icd10?: string;
  loinc?: string;
  rxnorm?: string;
  source: FactSource;
  fhirResource: "Condition" | "Observation" | "MedicationStatement";
}

export interface DemoCase {
  id: string;
  label: string;
  source: CountryCode;
  defaultTarget: CountryCode;
  reportText: string;
  traceFacts: ExtractedFact[];
  codeSystem: Record<string, unknown>;
  conceptMap: Record<string, unknown>;
  translateResult: Record<string, unknown>;
  lookupResult: Record<string, unknown>;
  validateCodeResult: Record<string, unknown>;
  bundleTitle: string;
  ipsBundle: {
    resourceType: "Bundle";
    id: string;
    meta?: { profile: string[] };
    identifier: { system: string; value: string };
    type: "document";
    timestamp: string;
    entry: Array<{ fullUrl: string; resource: Record<string, unknown> & { resourceType: string; id?: string } }>;
  };
}

// ----- USA case -----
const USA_CASE: DemoCase = {
  id: "usa-001",
  label: "USA · T2DM follow-up (default)",
  source: "USA",
  defaultTarget: "IND",
  reportText:
    "Synthetic USA Type 2 diabetes follow-up. A 49 year old male with T2DM and high blood pressure has A1c 7.8%. Serum creatinine 1.1 mg/dL. He takes metformin 1000 mg and lisinopril 10 mg.",
  traceFacts: [
    { phrase: "T2DM", category: "Condition", normalized: "Type 2 diabetes mellitus", snomed: "44054006", icd10: "E11", source: "local-registry", fhirResource: "Condition" },
    { phrase: "high blood pressure", category: "Condition", normalized: "Hypertension", snomed: "38341003", icd10: "I10", source: "local-registry", fhirResource: "Condition" },
    { phrase: "A1c 7.8%", category: "Observation", normalized: "Hemoglobin A1c/Hemoglobin.total in Blood", loinc: "4548-4", source: "local-registry", fhirResource: "Observation" },
    { phrase: "Serum creatinine 1.1 mg/dL", category: "Observation", normalized: "Creatinine [Mass/volume] in Serum or Plasma", loinc: "2160-0", source: "federated-linker-cache", fhirResource: "Observation" },
    { phrase: "metformin 1000 mg", category: "MedicationStatement", normalized: "metformin", rxnorm: "6809", source: "local-registry", fhirResource: "MedicationStatement" },
    { phrase: "lisinopril 10 mg", category: "MedicationStatement", normalized: "lisinopril", rxnorm: "29046", source: "federated-linker-new", fhirResource: "MedicationStatement" },
  ],
  codeSystem: {
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
      { code: "lisinopril", display: "lisinopril (local generic)" },
    ],
  },
  conceptMap: {
    resourceType: "ConceptMap",
    id: "local-usa-to-ips-diabetes",
    url: "https://ips-agent.demo/ConceptMap/local-usa-to-ips-diabetes",
    status: "active",
    sourceUri: "https://ips-agent.demo/CodeSystem/local-usa-diabetes-terms",
    group: [
      {
        source: "https://ips-agent.demo/CodeSystem/local-usa-diabetes-terms",
        target: "http://snomed.info/sct",
        element: [
          { code: "T2DM", display: "Type 2 diabetes mellitus (local)", target: [{ code: "44054006", display: "Diabetes mellitus type 2", equivalence: "equivalent" }] },
          { code: "HTN", display: "Hypertension (local)", target: [{ code: "38341003", display: "Hypertensive disorder", equivalence: "equivalent" }] },
        ],
      },
      {
        source: "https://ips-agent.demo/CodeSystem/local-usa-diabetes-terms",
        target: "http://loinc.org",
        element: [
          { code: "A1c", display: "Hemoglobin A1c (local)", target: [{ code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood", equivalence: "equivalent" }] },
        ],
      },
      {
        source: "https://ips-agent.demo/CodeSystem/local-usa-diabetes-terms",
        target: "http://www.nlm.nih.gov/research/umls/rxnorm",
        element: [
          { code: "metformin", display: "metformin (local)", target: [{ code: "6809", display: "metformin", equivalence: "equivalent" }] },
          { code: "lisinopril", display: "lisinopril (local)", target: [{ code: "29046", display: "lisinopril", equivalence: "equivalent" }] },
        ],
      },
    ],
  },
  translateResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: true },
      { name: "match", part: [
        { name: "equivalence", valueCode: "equivalent" },
        { name: "concept", valueCoding: { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" } },
        { name: "source", valueUri: "https://ips-agent.demo/ConceptMap/local-usa-to-ips-diabetes" },
      ]},
    ],
  },
  lookupResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "name", valueString: "LOINC" },
      { name: "display", valueString: "Hemoglobin A1c/Hemoglobin.total in Blood" },
      { name: "code", valueString: "4548-4" },
      { name: "designation", part: [{ name: "language", valueCode: "en-US" }, { name: "value", valueString: "HbA1c" }] },
    ],
  },
  validateCodeResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: true },
      { name: "message", valueString: "Code 44054006 from SNOMED CT is in ValueSet ips-diabetes-target-concepts." },
    ],
  },
  bundleTitle: "International Patient Summary — Synthetic USA T2DM",
  ipsBundle: {
    resourceType: "Bundle",
    id: "ips-bundle-demo-usa-001",
    identifier: { system: "https://ips-agent.demo/BundleIdentifier", value: "ips-bundle-demo-usa-001" },
    type: "document",
    timestamp: "2026-06-29T14:22:11Z",
    entry: [
      { fullUrl: "urn:uuid:composition-1", resource: { resourceType: "Composition", id: "composition-1", status: "final",
        type: { coding: [{ system: "http://loinc.org", code: "60591-5", display: "Patient summary Document" }] },
        subject: { reference: "urn:uuid:patient-1" }, date: "2026-06-29", author: [{ reference: "urn:uuid:org-1" }],
        title: "International Patient Summary — Synthetic USA T2DM",
        section: [
          { title: "Active Problems", entry: [{ reference: "urn:uuid:cond-t2dm" }, { reference: "urn:uuid:cond-htn" }] },
          { title: "Results", entry: [{ reference: "urn:uuid:obs-a1c" }, { reference: "urn:uuid:obs-creat" }] },
          { title: "Medications", entry: [{ reference: "urn:uuid:med-metformin" }, { reference: "urn:uuid:med-lisinopril" }] },
        ],
      }},
      { fullUrl: "urn:uuid:patient-1", resource: { resourceType: "Patient", id: "patient-1", gender: "male", birthDate: "1977-04-12",
        meta: { tag: [{ system: "https://ips-agent.demo/tags", code: "SYNTHETIC", display: "Synthetic patient" }] } } },
      { fullUrl: "urn:uuid:cond-t2dm", resource: { resourceType: "Condition", id: "cond-t2dm",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "E11", display: "Type 2 diabetes mellitus" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:cond-htn", resource: { resourceType: "Condition", id: "cond-htn",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "38341003", display: "Hypertensive disorder" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "I10", display: "Essential (primary) hypertension" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:obs-a1c", resource: { resourceType: "Observation", id: "obs-a1c", status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood" }] },
        valueQuantity: { value: 7.8, unit: "%", system: "http://unitsofmeasure.org", code: "%" }, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:obs-creat", resource: { resourceType: "Observation", id: "obs-creat", status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "2160-0", display: "Creatinine [Mass/volume] in Serum or Plasma" }] },
        valueQuantity: { value: 1.1, unit: "mg/dL", system: "http://unitsofmeasure.org", code: "mg/dL" }, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:med-metformin", resource: { resourceType: "MedicationStatement", id: "med-metformin", status: "active",
        medicationCodeableConcept: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "6809", display: "metformin" }] },
        subject: { reference: "urn:uuid:patient-1" }, dosage: [{ text: "1000 mg" }] } },
      { fullUrl: "urn:uuid:med-lisinopril", resource: { resourceType: "MedicationStatement", id: "med-lisinopril", status: "active",
        medicationCodeableConcept: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "29046", display: "lisinopril" }] },
        subject: { reference: "urn:uuid:patient-1" }, dosage: [{ text: "10 mg" }] } },
      { fullUrl: "urn:uuid:org-1", resource: { resourceType: "Organization", id: "org-1", name: "Synthetic Clinic (USA)" } },
    ],
  },
};

// ----- India case -----
const IND_CASE: DemoCase = {
  id: "ind-002",
  label: "India · sugar disease review",
  source: "IND",
  defaultTarget: "USA",
  reportText:
    "Synthetic India clinic note. 54 year old female, known case of sugar disease and high BP. HbA1c 8.4 percent. On tab metformin 500 mg BD and tab amlodipine 5 mg OD. Fasting blood sugar 162 mg/dL.",
  traceFacts: [
    { phrase: "sugar disease", category: "Condition", normalized: "Type 2 diabetes mellitus", snomed: "44054006", icd10: "E11", source: "federated-linker-cache", fhirResource: "Condition" },
    { phrase: "high BP", category: "Condition", normalized: "Hypertension", snomed: "38341003", icd10: "I10", source: "local-registry", fhirResource: "Condition" },
    { phrase: "HbA1c 8.4 percent", category: "Observation", normalized: "Hemoglobin A1c/Hemoglobin.total in Blood", loinc: "4548-4", source: "local-registry", fhirResource: "Observation" },
    { phrase: "Fasting blood sugar 162 mg/dL", category: "Observation", normalized: "Glucose [Mass/volume] in Serum or Plasma --fasting", loinc: "1558-6", source: "federated-linker-cache", fhirResource: "Observation" },
    { phrase: "tab metformin 500 mg BD", category: "MedicationStatement", normalized: "metformin", rxnorm: "6809", source: "local-registry", fhirResource: "MedicationStatement" },
    { phrase: "tab amlodipine 5 mg OD", category: "MedicationStatement", normalized: "amlodipine", rxnorm: "17767", source: "federated-linker-new", fhirResource: "MedicationStatement" },
  ],
  codeSystem: {
    resourceType: "CodeSystem",
    id: "local-ind-diabetes-terms",
    url: "https://ips-agent.demo/CodeSystem/local-ind-diabetes-terms",
    version: "0.1.0",
    name: "LocalINDDiabetesTerms",
    status: "active",
    content: "complete",
    concept: [
      { code: "sugar-disease", display: "Sugar disease (local lay term, IN)" },
      { code: "BP", display: "high BP / hypertension (local abbrev., IN)" },
      { code: "HbA1c", display: "HbA1c (local abbrev.)" },
      { code: "FBS", display: "Fasting blood sugar (local abbrev., IN)" },
      { code: "tab-metformin", display: "tab metformin (local prescription form)" },
      { code: "tab-amlodipine", display: "tab amlodipine (local prescription form)" },
    ],
  },
  conceptMap: {
    resourceType: "ConceptMap",
    id: "local-ind-to-ips-diabetes",
    url: "https://ips-agent.demo/ConceptMap/local-ind-to-ips-diabetes",
    status: "active",
    sourceUri: "https://ips-agent.demo/CodeSystem/local-ind-diabetes-terms",
    group: [
      {
        source: "https://ips-agent.demo/CodeSystem/local-ind-diabetes-terms",
        target: "http://snomed.info/sct",
        element: [
          { code: "sugar-disease", display: "Sugar disease (IN)", target: [{ code: "44054006", display: "Diabetes mellitus type 2", equivalence: "equivalent" }] },
          { code: "BP", display: "high BP (IN)", target: [{ code: "38341003", display: "Hypertensive disorder", equivalence: "equivalent" }] },
        ],
      },
      {
        source: "https://ips-agent.demo/CodeSystem/local-ind-diabetes-terms",
        target: "http://loinc.org",
        element: [
          { code: "HbA1c", display: "HbA1c (IN)", target: [{ code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood", equivalence: "equivalent" }] },
          { code: "FBS", display: "Fasting blood sugar (IN)", target: [{ code: "1558-6", display: "Fasting glucose [Mass/volume] in Serum or Plasma", equivalence: "equivalent" }] },
        ],
      },
      {
        source: "https://ips-agent.demo/CodeSystem/local-ind-diabetes-terms",
        target: "http://www.nlm.nih.gov/research/umls/rxnorm",
        element: [
          { code: "tab-metformin", display: "tab metformin (IN)", target: [{ code: "6809", display: "metformin", equivalence: "equivalent" }] },
          { code: "tab-amlodipine", display: "tab amlodipine (IN)", target: [{ code: "17767", display: "amlodipine", equivalence: "equivalent" }] },
        ],
      },
    ],
  },
  translateResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: true },
      { name: "match", part: [
        { name: "equivalence", valueCode: "equivalent" },
        { name: "concept", valueCoding: { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" } },
        { name: "source", valueUri: "https://ips-agent.demo/ConceptMap/local-ind-to-ips-diabetes" },
      ]},
    ],
  },
  lookupResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "name", valueString: "LOINC" },
      { name: "display", valueString: "Fasting glucose [Mass/volume] in Serum or Plasma" },
      { name: "code", valueString: "1558-6" },
      { name: "designation", part: [{ name: "language", valueCode: "en-IN" }, { name: "value", valueString: "Fasting blood sugar (FBS)" }] },
    ],
  },
  validateCodeResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: true },
      { name: "message", valueString: "Code 44054006 from SNOMED CT is in ValueSet ips-diabetes-target-concepts." },
    ],
  },
  bundleTitle: "International Patient Summary — Synthetic India T2DM",
  ipsBundle: {
    resourceType: "Bundle",
    id: "ips-bundle-demo-ind-002",
    identifier: { system: "https://ips-agent.demo/BundleIdentifier", value: "ips-bundle-demo-ind-002" },
    type: "document",
    timestamp: "2026-06-29T14:22:11Z",
    entry: [
      { fullUrl: "urn:uuid:composition-1", resource: { resourceType: "Composition", id: "composition-1", status: "final",
        type: { coding: [{ system: "http://loinc.org", code: "60591-5", display: "Patient summary Document" }] },
        subject: { reference: "urn:uuid:patient-1" }, date: "2026-06-29", author: [{ reference: "urn:uuid:org-1" }],
        title: "International Patient Summary — Synthetic India T2DM",
        section: [
          { title: "Active Problems", entry: [{ reference: "urn:uuid:cond-t2dm" }, { reference: "urn:uuid:cond-htn" }] },
          { title: "Results", entry: [{ reference: "urn:uuid:obs-a1c" }, { reference: "urn:uuid:obs-fbs" }] },
          { title: "Medications", entry: [{ reference: "urn:uuid:med-metformin" }, { reference: "urn:uuid:med-amlodipine" }] },
        ],
      }},
      { fullUrl: "urn:uuid:patient-1", resource: { resourceType: "Patient", id: "patient-1", gender: "female", birthDate: "1971-09-03",
        meta: { tag: [{ system: "https://ips-agent.demo/tags", code: "SYNTHETIC", display: "Synthetic patient" }] } } },
      { fullUrl: "urn:uuid:cond-t2dm", resource: { resourceType: "Condition", id: "cond-t2dm",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "E11", display: "Type 2 diabetes mellitus" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:cond-htn", resource: { resourceType: "Condition", id: "cond-htn",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "38341003", display: "Hypertensive disorder" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "I10", display: "Essential (primary) hypertension" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:obs-a1c", resource: { resourceType: "Observation", id: "obs-a1c", status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood" }] },
        valueQuantity: { value: 8.4, unit: "%", system: "http://unitsofmeasure.org", code: "%" }, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:obs-fbs", resource: { resourceType: "Observation", id: "obs-fbs", status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "1558-6", display: "Fasting glucose [Mass/volume] in Serum or Plasma" }] },
        valueQuantity: { value: 162, unit: "mg/dL", system: "http://unitsofmeasure.org", code: "mg/dL" }, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:med-metformin", resource: { resourceType: "MedicationStatement", id: "med-metformin", status: "active",
        medicationCodeableConcept: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "6809", display: "metformin" }] },
        subject: { reference: "urn:uuid:patient-1" }, dosage: [{ text: "500 mg BD" }] } },
      { fullUrl: "urn:uuid:med-amlodipine", resource: { resourceType: "MedicationStatement", id: "med-amlodipine", status: "active",
        medicationCodeableConcept: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "17767", display: "amlodipine" }] },
        subject: { reference: "urn:uuid:patient-1" }, dosage: [{ text: "5 mg OD" }] } },
      { fullUrl: "urn:uuid:org-1", resource: { resourceType: "Organization", id: "org-1", name: "Synthetic Clinic (India)" } },
    ],
  },
};

// ----- Australia case -----
const AUS_CASE: DemoCase = {
  id: "aus-003",
  label: "Australia · diabetes mellitus type 2",
  source: "AUS",
  defaultTarget: "EUR",
  reportText:
    "Synthetic Australia GP note. 61 yo M, T2 diabetes and raised BP (essential hypertension). HbA1c 7.2%. eGFR 78 mL/min/1.73m2. Metformin XR 1 g mane, perindopril 4 mg.",
  traceFacts: [
    { phrase: "T2 diabetes", category: "Condition", normalized: "Type 2 diabetes mellitus", snomed: "44054006", icd10: "E11", source: "local-registry", fhirResource: "Condition" },
    { phrase: "raised BP", category: "Condition", normalized: "Hypertension", snomed: "38341003", icd10: "I10", source: "federated-linker-cache", fhirResource: "Condition" },
    { phrase: "HbA1c 7.2%", category: "Observation", normalized: "Hemoglobin A1c/Hemoglobin.total in Blood", loinc: "4548-4", source: "local-registry", fhirResource: "Observation" },
    { phrase: "eGFR 78", category: "Observation", normalized: "Glomerular filtration rate [Volume Rate/Area] in Serum, Plasma or Blood by Creatinine-based formula (CKD-EPI 2021)/1.73 sq M", loinc: "98979-8", source: "federated-linker-cache", fhirResource: "Observation" },
    { phrase: "Metformin XR 1 g mane", category: "MedicationStatement", normalized: "metformin; extended release noted in source", rxnorm: "6809", source: "local-registry", fhirResource: "MedicationStatement" },
    { phrase: "perindopril 4 mg", category: "MedicationStatement", normalized: "perindopril", rxnorm: "54552", source: "federated-linker-new", fhirResource: "MedicationStatement" },
  ],
  codeSystem: {
    resourceType: "CodeSystem",
    id: "local-aus-diabetes-terms",
    url: "https://ips-agent.demo/CodeSystem/local-aus-diabetes-terms",
    version: "0.1.0",
    name: "LocalAUSDiabetesTerms",
    status: "active",
    content: "complete",
    concept: [
      { code: "T2-diabetes", display: "T2 diabetes (local abbrev., AU)" },
      { code: "raised-BP", display: "raised BP (local phrase, AU)" },
      { code: "HbA1c", display: "Glycated haemoglobin / HbA1c (AU spelling)" },
      { code: "eGFR", display: "estimated GFR (local abbrev.)" },
      { code: "metformin-XR", display: "metformin XR (modified release)" },
      { code: "perindopril", display: "perindopril (PBS generic)" },
    ],
  },
  conceptMap: {
    resourceType: "ConceptMap",
    id: "local-aus-to-ips-diabetes",
    url: "https://ips-agent.demo/ConceptMap/local-aus-to-ips-diabetes",
    status: "active",
    sourceUri: "https://ips-agent.demo/CodeSystem/local-aus-diabetes-terms",
    group: [
      { source: "https://ips-agent.demo/CodeSystem/local-aus-diabetes-terms", target: "http://snomed.info/sct",
        element: [
          { code: "T2-diabetes", display: "T2 diabetes (AU)", target: [{ code: "44054006", display: "Diabetes mellitus type 2", equivalence: "equivalent" }] },
          { code: "raised-BP", display: "raised BP (AU)", target: [{ code: "38341003", display: "Hypertensive disorder", equivalence: "equivalent" }] },
        ]},
      { source: "https://ips-agent.demo/CodeSystem/local-aus-diabetes-terms", target: "http://loinc.org",
        element: [
          { code: "HbA1c", display: "Glycated haemoglobin (AU)", target: [{ code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood", equivalence: "equivalent" }] },
          { code: "eGFR", display: "eGFR (AU)", target: [{ code: "98979-8", display: "Glomerular filtration rate [Volume Rate/Area] in Serum, Plasma or Blood by Creatinine-based formula (CKD-EPI 2021)/1.73 sq M", equivalence: "equivalent" }] },
        ]},
      { source: "https://ips-agent.demo/CodeSystem/local-aus-diabetes-terms", target: "http://www.nlm.nih.gov/research/umls/rxnorm",
        element: [
          { code: "metformin-XR", display: "metformin XR (AU)", target: [{ code: "6809", display: "metformin", equivalence: "equivalent" }] },
          { code: "perindopril", display: "perindopril (AU)", target: [{ code: "54552", display: "perindopril", equivalence: "equivalent" }] },
        ]},
    ],
  },
  translateResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: true },
      { name: "match", part: [
        { name: "equivalence", valueCode: "equivalent" },
        { name: "concept", valueCoding: { system: "http://loinc.org", code: "98979-8", display: "Glomerular filtration rate [Volume Rate/Area] in Serum, Plasma or Blood by Creatinine-based formula (CKD-EPI 2021)/1.73 sq M" } },
        { name: "source", valueUri: "https://ips-agent.demo/ConceptMap/local-aus-to-ips-diabetes" },
      ]},
    ],
  },
  lookupResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "name", valueString: "LOINC" },
      { name: "display", valueString: "Hemoglobin A1c/Hemoglobin.total in Blood" },
      { name: "code", valueString: "4548-4" },
      { name: "designation", part: [{ name: "language", valueCode: "en-AU" }, { name: "value", valueString: "Glycated haemoglobin" }] },
    ],
  },
  validateCodeResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: true },
      { name: "message", valueString: "Code 44054006 from SNOMED CT is in ValueSet ips-diabetes-target-concepts." },
    ],
  },
  bundleTitle: "International Patient Summary — Synthetic Australia T2DM",
  ipsBundle: {
    resourceType: "Bundle",
    id: "ips-bundle-demo-aus-003",
    identifier: { system: "https://ips-agent.demo/BundleIdentifier", value: "ips-bundle-demo-aus-003" },
    type: "document",
    timestamp: "2026-06-29T14:22:11Z",
    entry: [
      { fullUrl: "urn:uuid:composition-1", resource: { resourceType: "Composition", id: "composition-1", status: "final",
        type: { coding: [{ system: "http://loinc.org", code: "60591-5", display: "Patient summary Document" }] },
        subject: { reference: "urn:uuid:patient-1" }, date: "2026-06-29", author: [{ reference: "urn:uuid:org-1" }],
        title: "International Patient Summary — Synthetic Australia T2DM",
        section: [
          { title: "Active Problems", entry: [{ reference: "urn:uuid:cond-t2dm" }, { reference: "urn:uuid:cond-htn" }] },
          { title: "Results", entry: [{ reference: "urn:uuid:obs-a1c" }, { reference: "urn:uuid:obs-egfr" }] },
          { title: "Medications", entry: [{ reference: "urn:uuid:med-metformin" }, { reference: "urn:uuid:med-perindopril" }] },
        ],
      }},
      { fullUrl: "urn:uuid:patient-1", resource: { resourceType: "Patient", id: "patient-1", gender: "male", birthDate: "1965-02-19",
        meta: { tag: [{ system: "https://ips-agent.demo/tags", code: "SYNTHETIC", display: "Synthetic patient" }] } } },
      { fullUrl: "urn:uuid:cond-t2dm", resource: { resourceType: "Condition", id: "cond-t2dm",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "E11", display: "Type 2 diabetes mellitus" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:cond-htn", resource: { resourceType: "Condition", id: "cond-htn",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "38341003", display: "Hypertensive disorder" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "I10", display: "Essential (primary) hypertension" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:obs-a1c", resource: { resourceType: "Observation", id: "obs-a1c", status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood" }] },
        valueQuantity: { value: 7.2, unit: "%", system: "http://unitsofmeasure.org", code: "%" }, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:obs-egfr", resource: { resourceType: "Observation", id: "obs-egfr", status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "98979-8", display: "Glomerular filtration rate [Volume Rate/Area] in Serum, Plasma or Blood by Creatinine-based formula (CKD-EPI 2021)/1.73 sq M" }] },
        // LOINC 98979-8 carries the 1.73 m2 normalization; the validator discourages annotations in the UCUM code.
        valueQuantity: { value: 78, unit: "mL/min/1.73 m2", system: "http://unitsofmeasure.org", code: "mL/min" }, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:med-metformin", resource: { resourceType: "MedicationStatement", id: "med-metformin", status: "active",
        medicationCodeableConcept: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "6809", display: "metformin" }] },
        subject: { reference: "urn:uuid:patient-1" }, dosage: [{ text: "1 g mane; modified release noted in source" }] } },
      { fullUrl: "urn:uuid:med-perindopril", resource: { resourceType: "MedicationStatement", id: "med-perindopril", status: "active",
        medicationCodeableConcept: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "54552", display: "perindopril" }] },
        subject: { reference: "urn:uuid:patient-1" }, dosage: [{ text: "4 mg" }] } },
      { fullUrl: "urn:uuid:org-1", resource: { resourceType: "Organization", id: "org-1", name: "Synthetic Clinic (Australia)" } },
    ],
  },
};

// ----- Europe case -----
const EUR_CASE: DemoCase = {
  id: "eur-004",
  label: "Europe · Typ-2-Diabetes / diabète type 2",
  source: "EUR",
  defaultTarget: "USA",
  reportText:
    "Synthetic EU summary. 58 year old patient with Typ-2-Diabetes mellitus (type 2 diabetes) and arterielle Hypertonie (arterial hypertension). Glycated haemoglobin 7.6%. Creatinine 1.0 mg/dL. Treatment: metformine 850 mg, ramipril 5 mg.",
  traceFacts: [
    { phrase: "Typ-2-Diabetes / type 2 diabetes", category: "Condition", normalized: "Type 2 diabetes mellitus", snomed: "44054006", icd10: "E11", source: "federated-linker-cache", fhirResource: "Condition" },
    { phrase: "arterielle Hypertonie / arterial hypertension", category: "Condition", normalized: "Hypertension", snomed: "38341003", icd10: "I10", source: "federated-linker-cache", fhirResource: "Condition" },
    { phrase: "Glycated haemoglobin 7.6%", category: "Observation", normalized: "Hemoglobin A1c/Hemoglobin.total in Blood", loinc: "4548-4", source: "local-registry", fhirResource: "Observation" },
    { phrase: "Creatinine 1.0 mg/dL", category: "Observation", normalized: "Creatinine [Mass/volume] in Serum or Plasma", loinc: "2160-0", source: "local-registry", fhirResource: "Observation" },
    { phrase: "metformine 850 mg", category: "MedicationStatement", normalized: "metformin", rxnorm: "6809", source: "federated-linker-cache", fhirResource: "MedicationStatement" },
    { phrase: "ramipril 5 mg", category: "MedicationStatement", normalized: "ramipril", rxnorm: "35296", source: "federated-linker-new", fhirResource: "MedicationStatement" },
  ],
  codeSystem: {
    resourceType: "CodeSystem",
    id: "local-eur-diabetes-terms",
    url: "https://ips-agent.demo/CodeSystem/local-eur-diabetes-terms",
    version: "0.1.0",
    name: "LocalEURDiabetesTerms",
    status: "active",
    content: "complete",
    concept: [
      { code: "Typ-2-Diabetes", display: "Typ-2-Diabetes mellitus (DE)" },
      { code: "diabete-type-2", display: "diabète de type 2 (FR)" },
      { code: "arterielle-Hypertonie", display: "arterielle Hypertonie (DE) / arterial hypertension" },
      { code: "glycated-haemoglobin", display: "Glycated haemoglobin (EN-GB)" },
      { code: "creatinine", display: "Creatinine (EU)" },
      { code: "metformine", display: "metformine (FR generic)" },
      { code: "ramipril", display: "ramipril (EU generic)" },
    ],
  },
  conceptMap: {
    resourceType: "ConceptMap",
    id: "local-eur-to-ips-diabetes",
    url: "https://ips-agent.demo/ConceptMap/local-eur-to-ips-diabetes",
    status: "active",
    sourceUri: "https://ips-agent.demo/CodeSystem/local-eur-diabetes-terms",
    group: [
      { source: "https://ips-agent.demo/CodeSystem/local-eur-diabetes-terms", target: "http://snomed.info/sct",
        element: [
          { code: "Typ-2-Diabetes", display: "Typ-2-Diabetes (DE)", target: [{ code: "44054006", display: "Diabetes mellitus type 2", equivalence: "equivalent" }] },
          { code: "diabete-type-2", display: "diabète de type 2 (FR)", target: [{ code: "44054006", display: "Diabetes mellitus type 2", equivalence: "equivalent" }] },
          { code: "arterielle-Hypertonie", display: "arterielle Hypertonie (DE)", target: [{ code: "38341003", display: "Hypertensive disorder", equivalence: "equivalent" }] },
        ]},
      { source: "https://ips-agent.demo/CodeSystem/local-eur-diabetes-terms", target: "http://loinc.org",
        element: [
          { code: "glycated-haemoglobin", display: "Glycated haemoglobin (EN-GB)", target: [{ code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood", equivalence: "equivalent" }] },
          { code: "creatinine", display: "Creatinine (EU)", target: [{ code: "2160-0", display: "Creatinine [Mass/volume] in Serum or Plasma", equivalence: "equivalent" }] },
        ]},
      { source: "https://ips-agent.demo/CodeSystem/local-eur-diabetes-terms", target: "http://www.nlm.nih.gov/research/umls/rxnorm",
        element: [
          { code: "metformine", display: "metformine (FR)", target: [{ code: "6809", display: "metformin", equivalence: "equivalent" }] },
          { code: "ramipril", display: "ramipril (EU)", target: [{ code: "35296", display: "ramipril", equivalence: "equivalent" }] },
        ]},
    ],
  },
  translateResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: true },
      { name: "match", part: [
        { name: "equivalence", valueCode: "equivalent" },
        { name: "concept", valueCoding: { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" } },
        { name: "source", valueUri: "https://ips-agent.demo/ConceptMap/local-eur-to-ips-diabetes" },
      ]},
    ],
  },
  lookupResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "name", valueString: "LOINC" },
      { name: "display", valueString: "Hemoglobin A1c/Hemoglobin.total in Blood" },
      { name: "code", valueString: "4548-4" },
      { name: "designation", part: [{ name: "language", valueCode: "en-GB" }, { name: "value", valueString: "Glycated haemoglobin" }] },
    ],
  },
  validateCodeResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: true },
      { name: "message", valueString: "Code 44054006 from SNOMED CT is in ValueSet ips-diabetes-target-concepts." },
    ],
  },
  bundleTitle: "International Patient Summary — Synthetic EU T2DM",
  ipsBundle: {
    resourceType: "Bundle",
    id: "ips-bundle-demo-eur-004",
    identifier: { system: "https://ips-agent.demo/BundleIdentifier", value: "ips-bundle-demo-eur-004" },
    type: "document",
    timestamp: "2026-06-29T14:22:11Z",
    entry: [
      { fullUrl: "urn:uuid:composition-1", resource: { resourceType: "Composition", id: "composition-1", status: "final",
        type: { coding: [{ system: "http://loinc.org", code: "60591-5", display: "Patient summary Document" }] },
        subject: { reference: "urn:uuid:patient-1" }, date: "2026-06-29", author: [{ reference: "urn:uuid:org-1" }],
        title: "International Patient Summary — Synthetic EU T2DM",
        section: [
          { title: "Active Problems", entry: [{ reference: "urn:uuid:cond-t2dm" }, { reference: "urn:uuid:cond-htn" }] },
          { title: "Results", entry: [{ reference: "urn:uuid:obs-a1c" }, { reference: "urn:uuid:obs-creat" }] },
          { title: "Medications", entry: [{ reference: "urn:uuid:med-metformin" }, { reference: "urn:uuid:med-ramipril" }] },
        ],
      }},
      { fullUrl: "urn:uuid:patient-1", resource: { resourceType: "Patient", id: "patient-1", gender: "unknown", birthDate: "1967-11-30",
        meta: { tag: [{ system: "https://ips-agent.demo/tags", code: "SYNTHETIC", display: "Synthetic patient" }] } } },
      { fullUrl: "urn:uuid:cond-t2dm", resource: { resourceType: "Condition", id: "cond-t2dm",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "E11", display: "Type 2 diabetes mellitus" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:cond-htn", resource: { resourceType: "Condition", id: "cond-htn",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "38341003", display: "Hypertensive disorder" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "I10", display: "Essential (primary) hypertension" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:obs-a1c", resource: { resourceType: "Observation", id: "obs-a1c", status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood" }] },
        valueQuantity: { value: 7.6, unit: "%", system: "http://unitsofmeasure.org", code: "%" }, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:obs-creat", resource: { resourceType: "Observation", id: "obs-creat", status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "2160-0", display: "Creatinine [Mass/volume] in Serum or Plasma" }] },
        valueQuantity: { value: 1.0, unit: "mg/dL", system: "http://unitsofmeasure.org", code: "mg/dL" }, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:med-metformin", resource: { resourceType: "MedicationStatement", id: "med-metformin", status: "active",
        medicationCodeableConcept: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "6809", display: "metformin" }] },
        subject: { reference: "urn:uuid:patient-1" }, dosage: [{ text: "850 mg" }] } },
      { fullUrl: "urn:uuid:med-ramipril", resource: { resourceType: "MedicationStatement", id: "med-ramipril", status: "active",
        medicationCodeableConcept: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "35296", display: "ramipril" }] },
        subject: { reference: "urn:uuid:patient-1" }, dosage: [{ text: "5 mg" }] } },
      { fullUrl: "urn:uuid:org-1", resource: { resourceType: "Organization", id: "org-1", name: "Synthetic Clinic (EU)" } },
    ],
  },
};

function escapeNarrative(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rewriteBundleReferences(value: unknown, referenceMap: Map<string, string>): unknown {
  if (typeof value === "string") return referenceMap.get(value) ?? value;
  if (Array.isArray(value)) return value.map((item) => rewriteBundleReferences(item, referenceMap));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, rewriteBundleReferences(child, referenceMap)]),
  );
}

function narrativeLabel(resource: Record<string, unknown> & { resourceType: string; id?: string }) {
  const code = resource.code as { coding?: Array<{ display?: string }> } | undefined;
  const medication = resource.medicationCodeableConcept as { coding?: Array<{ display?: string }> } | undefined;
  const title = typeof resource.title === "string" ? resource.title : undefined;
  const name = typeof resource.name === "string" ? resource.name : undefined;
  const display = code?.coding?.[0]?.display ?? medication?.coding?.[0]?.display;

  return title ?? name ?? display ?? `${resource.resourceType} ${resource.id ?? "resource"}`;
}

const IPS_PROFILE_BY_RESOURCE: Record<string, string> = {
  Composition: "http://hl7.org/fhir/uv/ips/StructureDefinition/Composition-uv-ips",
  Patient: "http://hl7.org/fhir/uv/ips/StructureDefinition/Patient-uv-ips",
  Condition: "http://hl7.org/fhir/uv/ips/StructureDefinition/Condition-uv-ips",
  Observation: "http://hl7.org/fhir/uv/ips/StructureDefinition/Observation-results-laboratory-pathology-uv-ips",
  MedicationStatement: "http://hl7.org/fhir/uv/ips/StructureDefinition/MedicationStatement-uv-ips",
  Organization: "http://hl7.org/fhir/uv/ips/StructureDefinition/Organization-uv-ips",
};

function sectionNarrative(label: string) {
  return {
    status: "generated",
    div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeNarrative(label)}</div>`,
  };
}

function finalizeDemoCase(demoCase: DemoCase, caseIndex: number): DemoCase {
  const referenceMap = new Map(
    demoCase.ipsBundle.entry.map((entry, entryIndex) => {
      const suffix = `${caseIndex + 1}${String(entryIndex + 1).padStart(11, "0")}`;
      return [entry.fullUrl, `urn:uuid:00000000-0000-4000-8000-${suffix}`];
    }),
  );
  const organizationEntry = demoCase.ipsBundle.entry.find((entry) => entry.resource.resourceType === "Organization");
  const organizationReference = organizationEntry ? referenceMap.get(organizationEntry.fullUrl) : undefined;

  const entry = demoCase.ipsBundle.entry.map((sourceEntry) => {
    const resource = rewriteBundleReferences(sourceEntry.resource, referenceMap) as Record<string, unknown> & {
      resourceType: string;
      id?: string;
    };

    resource.meta = { profile: [IPS_PROFILE_BY_RESOURCE[resource.resourceType]] };

    resource.text = {
      status: "generated",
      div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeNarrative(narrativeLabel(resource))}</div>`,
    };

    if (resource.resourceType === "Observation") {
      resource.effectiveDateTime = demoCase.ipsBundle.timestamp;
      if (organizationReference) resource.performer = [{ reference: organizationReference }];
      resource.category = [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "laboratory",
          display: "Laboratory",
        }],
      }];
    }

    if (resource.resourceType === "Patient") {
      resource.active = true;
      resource.name = [{ use: "anonymous", text: "Synthetic Demo Patient" }];
    }

    if (resource.resourceType === "MedicationStatement") {
      resource._effectiveDateTime = {
        extension: [{
          url: "http://hl7.org/fhir/StructureDefinition/data-absent-reason",
          valueCode: "unknown",
        }],
      };
    }

    if (resource.resourceType === "Composition") {
      const sections = resource.section as Array<Record<string, unknown>>;
      const problems = sections.find((section) => section.title === "Active Problems") ?? {};
      const results = sections.find((section) => section.title === "Results") ?? {};
      const medications = sections.find((section) => section.title === "Medications") ?? {};

      resource.section = [
        {
          ...problems,
          title: "Problems",
          code: { coding: [{ system: "http://loinc.org", code: "11450-4", display: "Problem list - Reported" }] },
          text: sectionNarrative("Problems section generated from the synthetic source report."),
        },
        {
          title: "Allergies",
          code: { coding: [{ system: "http://loinc.org", code: "48765-2", display: "Allergies and adverse reactions Document" }] },
          text: sectionNarrative("No allergy information was available in the synthetic source report."),
          emptyReason: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/list-empty-reason",
              code: "unavailable",
              display: "Unavailable",
            }],
            text: "No source information was available for this section.",
          },
        },
        {
          ...medications,
          title: "Medications",
          code: { coding: [{ system: "http://loinc.org", code: "10160-0", display: "History of Medication use Narrative" }] },
          text: sectionNarrative("Medications section generated from the synthetic source report."),
        },
        {
          ...results,
          title: "Results",
          code: { coding: [{ system: "http://loinc.org", code: "30954-2", display: "Relevant diagnostic tests/laboratory data note" }] },
          text: sectionNarrative("Results section generated from the synthetic source report."),
        },
      ];
    }

    return {
      fullUrl: referenceMap.get(sourceEntry.fullUrl) ?? sourceEntry.fullUrl,
      resource,
    };
  });

  return {
    ...demoCase,
    ipsBundle: {
      ...demoCase.ipsBundle,
      meta: { profile: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips"] },
      entry,
    },
  };
}

export const CASE_LIST: DemoCase[] = [USA_CASE, IND_CASE, AUS_CASE, EUR_CASE].map(finalizeDemoCase);

export const CASES: Record<string, DemoCase> = Object.fromEntries(
  CASE_LIST.map((demoCase) => [demoCase.id, demoCase]),
);

export const METRICS = {
  mappingCoverage: "100%",
  fhirBundleType: "document",
  validatorErrors: 0,
  validatorWarnings: 0,
  validatedBundles: 4,
  validatorProfile: "IPS 2.0.1",
  validatorInfoNotesPerBundle: 2,
  transferAccuracy: "48 / 48",
};

export const EVIDENCE = {
  syntheticReports: 20,
  sites: 4,
  robustnessSeeds: 5,
  trainingExamples: 768,
  crossSiteTransfer: 48,
  globallyUnseen: 192,
  semanticTransfer: "48/48 correct",
  validatorEvidence: "4/4 current Bundles pass IPS 2.0.1 with 0 errors and 0 warnings; 2 informational RxNorm preference notes per Bundle",
};

export const OFFICIAL_VALIDATION = {
  validator: "HL7 FHIR Validator 6.9.11",
  profile: "IPS 2.0.1 Bundle profile",
  routes: [
    { route: "USA → India", errors: 0, warnings: 0, notes: 2 },
    { route: "India → USA", errors: 0, warnings: 0, notes: 2 },
    { route: "Australia → Europe", errors: 0, warnings: 0, notes: 2 },
    { route: "Europe → USA", errors: 0, warnings: 0, notes: 2 },
  ],
  note: "RxNorm ingredient codes are outside the IPS guide's recommended medication value set.",
};

export const EXTERNAL_TERMINOLOGY_VALIDATION = {
  checkedAt: "2026-07-12T03:49:58Z",
  endpoint: "https://tx.fhir.org/r4",
  fhirVersion: "R4",
  checks: [
    {
      terminology: "SNOMED CT",
      system: "http://snomed.info/sct",
      code: "44054006",
      display: "Diabetes mellitus type II",
      version: "2025-02-01 International Edition",
      lookupPassed: true,
      validateCodePassed: true,
    },
    {
      terminology: "LOINC",
      system: "http://loinc.org",
      code: "4548-4",
      display: "Hemoglobin A1c/Hemoglobin.total in Blood",
      version: "2.82",
      lookupPassed: true,
      validateCodePassed: true,
    },
    {
      terminology: "RxNorm",
      system: "http://www.nlm.nih.gov/research/umls/rxnorm",
      code: "6809",
      display: "metformin",
      version: "2026-03-02",
      lookupPassed: true,
      validateCodePassed: true,
    },
    {
      terminology: "ICD-10",
      system: "http://hl7.org/fhir/sid/icd-10",
      code: "E11",
      display: "Type 2 diabetes mellitus",
      version: "2019-covid-expanded",
      lookupPassed: true,
      validateCodePassed: true,
    },
  ],
  scope: "External evidence verifies that representative target codes are recognized. It does not prove source-phrase extraction or clinical mapping correctness.",
  translationNote: "Local phrase translation still uses the prototype's own FHIR ConceptMap; tx.fhir.org executed $lookup and $validate-code only, not the local $translate.",
};

export const PIPELINE_STEPS = [
  { key: "report", label: "Report", icon: "FileText" },
  { key: "facts", label: "Facts", icon: "Sparkles" },
  { key: "terminology", label: "Terminology", icon: "BookMarked" },
  { key: "federated", label: "FL Linker", icon: "Network" },
  { key: "conceptmap", label: "ConceptMap", icon: "GitMerge" },
  { key: "bundle", label: "IPS Bundle", icon: "Package" },
  { key: "readiness", label: "Readiness", icon: "ShieldCheck" },
] as const;

// ValueSet stays shared across sites and constrains target concepts by category.
export const VALUE_SET_DIABETES = {
  resourceType: "ValueSet",
  id: "ips-diabetes-target-concepts",
  url: "https://ips-agent.demo/ValueSet/ips-diabetes-target-concepts",
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
      {
        system: "http://loinc.org",
        concept: [
          { code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood" },
          { code: "2160-0", display: "Creatinine [Mass/volume] in Serum or Plasma" },
          { code: "1558-6", display: "Fasting glucose [Mass/volume] in Serum or Plasma" },
          { code: "98979-8", display: "Glomerular filtration rate [Volume Rate/Area] in Serum, Plasma or Blood by Creatinine-based formula (CKD-EPI 2021)/1.73 sq M" },
        ],
      },
      {
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        concept: [
          { code: "6809", display: "metformin" },
          { code: "29046", display: "lisinopril" },
          { code: "17767", display: "amlodipine" },
          { code: "54552", display: "perindopril" },
          { code: "35296", display: "ramipril" },
        ],
      },
    ],
  },
};

export const FED_SITES = [
  { code: "USA", samples: 192, transferAcc: "12/12", localOnlyAcc: "12/12" },
  { code: "IND", samples: 192, transferAcc: "12/12", localOnlyAcc: "12/12" },
  { code: "AUS", samples: 192, transferAcc: "12/12", localOnlyAcc: "12/12" },
  { code: "EUR", samples: 192, transferAcc: "12/12", localOnlyAcc: "11/12" },
];

const correctCount = (ratio: string) => Number(ratio.split("/")[0]);

export const FED_SUMMARY = {
  localOnlyCorrect: FED_SITES.reduce((total, site) => total + correctCount(site.localOnlyAcc), 0),
  federatedCorrect: FED_SITES.reduce((total, site) => total + correctCount(site.transferAcc), 0),
  totalTransferProbes: FED_SITES.reduce((total, site) => total + Number(site.transferAcc.split("/")[1]), 0),
  receiversWithoutRegression: 4,
  globallyUnseenCorrect: 192,
  globallyUnseenTotal: 192,
  globallyUnseenMacroF1: 1,
  localOnlyGloballyUnseenAccuracy: 0.94401,
  dictionaryGloballyUnseenAccuracy: 0,
};

export const FED_ROBUSTNESS = {
  seeds: [7, 21, 42, 84, 126],
  seedCount: 5,
  localOnlyTransferAccuracyMean: 0.979167,
  localOnlyTransferAccuracyStdDev: 0,
  federatedTransferAccuracyMean: 1,
  federatedTransferAccuracyStdDev: 0,
  localOnlyGloballyUnseenAccuracyMean: 0.942708,
  localOnlyGloballyUnseenAccuracyStdDev: 0.002604,
  federatedGloballyUnseenAccuracyMean: 1,
  federatedGloballyUnseenAccuracyStdDev: 0,
  seedsWithPerfectTransfer: 5,
  seedsWithPerfectGloballyUnseenAccuracy: 5,
  receiverSeedChecksWithoutRegression: 20,
  firstPerfectRoundMinimum: 1,
  firstPerfectRoundMaximum: 2,
  modelTensorBytesPerUpdate: 49200,
  twoWayModelTrafficBytes: 1968160,
  coordinatorInboundBytes: 984160,
};

export const READINESS = {
  USA: [
    { item: "US Core STU9-oriented patient fields", status: "ready" as const },
    { item: "Race/ethnicity extensions", status: "gap" as const, note: "Optional in demo; not in synthetic source" },
  ],
  IND: [
    { item: "ABDM FHIR R4-oriented document/resource shape", status: "ready" as const },
    { item: "ABHA identifier presence", status: "gap" as const, note: "No real identifier; synthetic only" },
  ],
  AUS: [
    { item: "AU Core 2.0.0-oriented patient fields", status: "ready" as const },
    { item: "IHI identifier", status: "gap" as const, note: "Not available for synthetic patient" },
  ],
  EUR: [
    { item: "European Patient Summary CI-build-oriented resource shape", status: "ready" as const },
    { item: "National extensions (per Member State)", status: "gap" as const, note: "Member-state extensions out of scope for demo" },
  ],
} as const;

export const TARGET_LABEL: Record<CountryCode, string> = {
  USA: "US Core STU9 readiness view",
  IND: "ABDM FHIR R4 readiness view",
  AUS: "AU Core 2.0.0 readiness view",
  EUR: "European Patient Summary CI-build readiness view",
};
