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
  ipsBundle: { resourceType: "Bundle"; id: string; type: "document"; timestamp: string; entry: Array<{ fullUrl: string; resource: Record<string, unknown> & { resourceType: string; id?: string } }> };
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
    targetUri: "http://snomed.info/sct",
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
      { name: "message", valueString: "Code 44054006 from SNOMED CT is in ValueSet ips-diabetes-conditions." },
    ],
  },
  bundleTitle: "International Patient Summary — Synthetic USA T2DM",
  ipsBundle: {
    resourceType: "Bundle",
    id: "ips-bundle-demo-usa-001",
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
      { fullUrl: "urn:uuid:patient-1", resource: { resourceType: "Patient", id: "patient-1", gender: "male", birthDate: "1976-04-12",
        meta: { tag: [{ system: "https://ips-agent.demo/tags", code: "SYNTHETIC", display: "Synthetic patient" }] } } },
      { fullUrl: "urn:uuid:cond-t2dm", resource: { resourceType: "Condition", id: "cond-t2dm",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "E11", display: "Type 2 diabetes mellitus" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:cond-htn", resource: { resourceType: "Condition", id: "cond-htn",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "38341003", display: "Hypertensive disorder" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "I10", display: "Essential hypertension" },
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
    "Synthetic India clinic note. 54 year old female, known case of sugar disease and BP. HbA1c 8.4 percent. On tab metformin 500 mg BD and tab amlodipine 5 mg OD. Fasting blood sugar 162 mg/dL.",
  traceFacts: [
    { phrase: "sugar disease", category: "Condition", normalized: "Type 2 diabetes mellitus", snomed: "44054006", icd10: "E11", source: "federated-linker-cache", fhirResource: "Condition" },
    { phrase: "BP", category: "Condition", normalized: "Hypertension", snomed: "38341003", icd10: "I10", source: "local-registry", fhirResource: "Condition" },
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
      { code: "BP", display: "BP / raised BP (local abbrev., IN)" },
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
    targetUri: "http://snomed.info/sct",
    group: [
      {
        source: "https://ips-agent.demo/CodeSystem/local-ind-diabetes-terms",
        target: "http://snomed.info/sct",
        element: [
          { code: "sugar-disease", display: "Sugar disease (IN)", target: [{ code: "44054006", display: "Diabetes mellitus type 2", equivalence: "equivalent" }] },
          { code: "BP", display: "BP (IN)", target: [{ code: "38341003", display: "Hypertensive disorder", equivalence: "equivalent" }] },
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
      { name: "message", valueString: "Code 44054006 from SNOMED CT is in ValueSet ips-diabetes-conditions." },
    ],
  },
  bundleTitle: "International Patient Summary — Synthetic India T2DM",
  ipsBundle: {
    resourceType: "Bundle",
    id: "ips-bundle-demo-ind-002",
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
          { system: "http://hl7.org/fhir/sid/icd-10", code: "I10", display: "Essential hypertension" },
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
    { phrase: "eGFR 78", category: "Observation", normalized: "Glomerular filtration rate/1.73 sq M.predicted [Vol Rate/Area] in Serum or Plasma by Creatinine-based formula (CKD-EPI 2021)", loinc: "98979-8", source: "federated-linker-cache", fhirResource: "Observation" },
    { phrase: "Metformin XR 1 g mane", category: "MedicationStatement", normalized: "metformin (extended release)", rxnorm: "860975", source: "local-registry", fhirResource: "MedicationStatement" },
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
    targetUri: "http://snomed.info/sct",
    group: [
      { source: "https://ips-agent.demo/CodeSystem/local-aus-diabetes-terms", target: "http://snomed.info/sct",
        element: [
          { code: "T2-diabetes", display: "T2 diabetes (AU)", target: [{ code: "44054006", display: "Diabetes mellitus type 2", equivalence: "equivalent" }] },
          { code: "raised-BP", display: "raised BP (AU)", target: [{ code: "38341003", display: "Hypertensive disorder", equivalence: "equivalent" }] },
        ]},
      { source: "https://ips-agent.demo/CodeSystem/local-aus-diabetes-terms", target: "http://loinc.org",
        element: [
          { code: "HbA1c", display: "Glycated haemoglobin (AU)", target: [{ code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood", equivalence: "equivalent" }] },
          { code: "eGFR", display: "eGFR (AU)", target: [{ code: "98979-8", display: "Glomerular filtration rate predicted by CKD-EPI 2021", equivalence: "equivalent" }] },
        ]},
    ],
  },
  translateResult: {
    resourceType: "Parameters",
    parameter: [
      { name: "result", valueBoolean: true },
      { name: "match", part: [
        { name: "equivalence", valueCode: "equivalent" },
        { name: "concept", valueCoding: { system: "http://loinc.org", code: "98979-8", display: "Glomerular filtration rate predicted by CKD-EPI 2021" } },
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
      { name: "message", valueString: "Code 44054006 from SNOMED CT is in ValueSet ips-diabetes-conditions." },
    ],
  },
  bundleTitle: "International Patient Summary — Synthetic Australia T2DM",
  ipsBundle: {
    resourceType: "Bundle",
    id: "ips-bundle-demo-aus-003",
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
      { fullUrl: "urn:uuid:patient-1", resource: { resourceType: "Patient", id: "patient-1", gender: "male", birthDate: "1964-02-19",
        meta: { tag: [{ system: "https://ips-agent.demo/tags", code: "SYNTHETIC", display: "Synthetic patient" }] } } },
      { fullUrl: "urn:uuid:cond-t2dm", resource: { resourceType: "Condition", id: "cond-t2dm",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "E11", display: "Type 2 diabetes mellitus" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:cond-htn", resource: { resourceType: "Condition", id: "cond-htn",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "38341003", display: "Hypertensive disorder" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "I10", display: "Essential hypertension" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:obs-a1c", resource: { resourceType: "Observation", id: "obs-a1c", status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "4548-4", display: "Hemoglobin A1c/Hemoglobin.total in Blood" }] },
        valueQuantity: { value: 7.2, unit: "%", system: "http://unitsofmeasure.org", code: "%" }, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:obs-egfr", resource: { resourceType: "Observation", id: "obs-egfr", status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "98979-8", display: "Glomerular filtration rate predicted by CKD-EPI 2021" }] },
        valueQuantity: { value: 78, unit: "mL/min/{1.73_m2}", system: "http://unitsofmeasure.org", code: "mL/min/{1.73_m2}" }, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:med-metformin", resource: { resourceType: "MedicationStatement", id: "med-metformin", status: "active",
        medicationCodeableConcept: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "860975", display: "metformin extended release" }] },
        subject: { reference: "urn:uuid:patient-1" }, dosage: [{ text: "1 g mane (modified release)" }] } },
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
    targetUri: "http://snomed.info/sct",
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
      { name: "message", valueString: "Code 44054006 from SNOMED CT is in ValueSet ips-diabetes-conditions." },
    ],
  },
  bundleTitle: "International Patient Summary — Synthetic EU T2DM",
  ipsBundle: {
    resourceType: "Bundle",
    id: "ips-bundle-demo-eur-004",
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
      { fullUrl: "urn:uuid:patient-1", resource: { resourceType: "Patient", id: "patient-1", gender: "other", birthDate: "1967-11-30",
        meta: { tag: [{ system: "https://ips-agent.demo/tags", code: "SYNTHETIC", display: "Synthetic patient" }] } } },
      { fullUrl: "urn:uuid:cond-t2dm", resource: { resourceType: "Condition", id: "cond-t2dm",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "44054006", display: "Diabetes mellitus type 2" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "E11", display: "Type 2 diabetes mellitus" },
        ]}, subject: { reference: "urn:uuid:patient-1" } } },
      { fullUrl: "urn:uuid:cond-htn", resource: { resourceType: "Condition", id: "cond-htn",
        code: { coding: [
          { system: "http://snomed.info/sct", code: "38341003", display: "Hypertensive disorder" },
          { system: "http://hl7.org/fhir/sid/icd-10", code: "I10", display: "Essential hypertension" },
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

export const CASES: Record<string, DemoCase> = {
  [USA_CASE.id]: USA_CASE,
  [IND_CASE.id]: IND_CASE,
  [AUS_CASE.id]: AUS_CASE,
  [EUR_CASE.id]: EUR_CASE,
};

export const CASE_LIST: DemoCase[] = [USA_CASE, IND_CASE, AUS_CASE, EUR_CASE];

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
  validatorErrors: "0 errors across representative cross-border Bundles",
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

// ValueSet stays shared (target IPS profile concepts)
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

export const FED_SITES = [
  { code: "USA", samples: 192, transferAcc: "12/12", localOnlyAcc: "9/12" },
  { code: "IND", samples: 192, transferAcc: "12/12", localOnlyAcc: "8/12" },
  { code: "AUS", samples: 192, transferAcc: "12/12", localOnlyAcc: "10/12" },
  { code: "EUR", samples: 192, transferAcc: "12/12", localOnlyAcc: "9/12" },
];

export const READINESS = {
  USA: [
    { item: "US Core Patient profile fields", status: "ready" as const },
    { item: "Race/ethnicity extensions", status: "gap" as const, note: "Optional in demo; not in synthetic source" },
  ],
  IND: [
    { item: "ABDM HealthRecordBundle alignment", status: "ready" as const },
    { item: "ABHA identifier presence", status: "gap" as const, note: "No real identifier; synthetic only" },
  ],
  AUS: [
    { item: "AU Base Patient alignment", status: "ready" as const },
    { item: "IHI identifier", status: "gap" as const, note: "Not available for synthetic patient" },
  ],
  EUR: [
    { item: "IPS UV profile alignment (resource shape)", status: "ready" as const },
    { item: "National extensions (per Member State)", status: "gap" as const, note: "Member-state extensions out of scope for demo" },
  ],
} as const;

export const TARGET_LABEL: Record<CountryCode, string> = {
  USA: "US Core / IPS-style receiver",
  IND: "ABDM HealthRecordBundle receiver",
  AUS: "AU Base / IPS-style receiver",
  EUR: "EU IPS UV receiver",
};
