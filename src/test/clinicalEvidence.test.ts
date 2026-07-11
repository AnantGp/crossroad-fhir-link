import { describe, expect, it } from "vitest";
import { CASE_LIST, FED_SUMMARY, VALUE_SET_DIABETES } from "@/lib/demoData";

type ConceptMapGroup = {
  target?: string;
  element?: Array<unknown>;
};

function collectReferences(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectReferences);
  if (!value || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, child]) => {
    if (key === "reference" && typeof child === "string") return [child];
    return collectReferences(child);
  });
}

describe("static clinical and FHIR evidence", () => {
  it("keeps demographics consistent with the synthetic report date", () => {
    const documentDate = new Date("2026-06-29T00:00:00Z");

    for (const demoCase of CASE_LIST) {
      const ageMatch = demoCase.reportText.match(/(\d{2}) (?:year old|yo)/i);
      const patient = demoCase.ipsBundle.entry.find((entry) => entry.resource.resourceType === "Patient")?.resource as
        | { birthDate?: string; gender?: string }
        | undefined;

      expect(ageMatch).not.toBeNull();
      expect(patient?.birthDate).toBeTruthy();

      const birthDate = new Date(`${patient?.birthDate}T00:00:00Z`);
      let age = documentDate.getUTCFullYear() - birthDate.getUTCFullYear();
      const birthdayPassed =
        documentDate.getUTCMonth() > birthDate.getUTCMonth() ||
        (documentDate.getUTCMonth() === birthDate.getUTCMonth() && documentDate.getUTCDate() >= birthDate.getUTCDate());
      if (!birthdayPassed) age -= 1;

      expect(age).toBe(Number(ageMatch?.[1]));
    }

    const europePatient = CASE_LIST.find((demoCase) => demoCase.source === "EUR")?.ipsBundle.entry.find(
      (entry) => entry.resource.resourceType === "Patient",
    )?.resource as { gender?: string } | undefined;
    expect(europePatient?.gender).toBe("unknown");
  });

  it("keeps every demo Bundle document-shaped and auditable", () => {
    for (const demoCase of CASE_LIST) {
      expect(demoCase.ipsBundle.resourceType).toBe("Bundle");
      expect(demoCase.ipsBundle.type).toBe("document");
      expect(demoCase.ipsBundle.identifier.value).toBe(demoCase.ipsBundle.id);
      expect(demoCase.ipsBundle.entry[0].resource.resourceType).toBe("Composition");
      expect(demoCase.ipsBundle.meta?.profile).toContain(
        "http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-uv-ips",
      );

      const resourceTypes = demoCase.ipsBundle.entry.map((entry) => entry.resource.resourceType);
      expect(resourceTypes).toContain("Patient");
      expect(resourceTypes).toContain("Condition");
      expect(resourceTypes).toContain("Observation");
      expect(resourceTypes).toContain("MedicationStatement");

      const fullUrls = new Set(demoCase.ipsBundle.entry.map((entry) => entry.fullUrl));
      for (const entry of demoCase.ipsBundle.entry) {
        expect(entry.fullUrl).toMatch(/^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(entry.resource).toHaveProperty("text.status", "generated");
        expect(entry.resource).toHaveProperty("text.div");

        for (const reference of collectReferences(entry.resource)) {
          if (reference.startsWith("urn:uuid:")) expect(fullUrls.has(reference)).toBe(true);
        }

        if (entry.resource.resourceType === "Observation") {
          expect(entry.resource).toHaveProperty("effectiveDateTime", demoCase.ipsBundle.timestamp);
          expect(entry.resource).toHaveProperty("performer");
          expect(entry.resource).toHaveProperty("category.0.coding.0.code", "laboratory");
        }

        if (entry.resource.resourceType === "Patient") {
          expect(entry.resource).toHaveProperty("name.0.use", "anonymous");
        }

        if (entry.resource.resourceType === "MedicationStatement") {
          expect(entry.resource).toHaveProperty("_effectiveDateTime.extension.0.valueCode", "unknown");
        }
      }

      const composition = demoCase.ipsBundle.entry[0].resource as { section?: Array<{ code?: { coding?: Array<{ code?: string }> } }> };
      const sectionCodes = composition.section?.map((section) => section.code?.coding?.[0]?.code);
      expect(sectionCodes).toEqual(["11450-4", "48765-2", "10160-0", "30954-2"]);
    }
  });

  it("keeps fact categories aligned with FHIR resource placement and primary code systems", () => {
    for (const demoCase of CASE_LIST) {
      for (const fact of demoCase.traceFacts) {
        expect(fact.fhirResource).toBe(fact.category);

        if (fact.category === "Condition") {
          expect(fact.snomed).toBeTruthy();
          expect(fact.icd10).toBeTruthy();
        }

        if (fact.category === "Observation") {
          expect(fact.loinc).toBeTruthy();
        }

        if (fact.category === "MedicationStatement") {
          expect(fact.rxnorm).toBeTruthy();
        }
      }
    }
  });

  it("keeps the Australian eGFR normalization visible without a validator-warning UCUM annotation", () => {
    const australia = CASE_LIST.find((demoCase) => demoCase.source === "AUS");
    const egfr = australia?.ipsBundle.entry.find((entry) => {
      const code = entry.resource.code as { coding?: Array<{ code?: string }> } | undefined;
      return code?.coding?.some((coding) => coding.code === "98979-8");
    })?.resource as { valueQuantity?: { code?: string; system?: string; unit?: string } } | undefined;

    expect(egfr?.valueQuantity?.system).toBe("http://unitsofmeasure.org");
    expect(egfr?.valueQuantity?.code).toBe("mL/min");
    expect(egfr?.valueQuantity?.unit).toBe("mL/min/1.73 m2");
  });

  it("keeps every extracted fact traceable to a coded Bundle resource", () => {
    for (const demoCase of CASE_LIST) {
      const clinicalResources = demoCase.ipsBundle.entry
        .map((entry) => entry.resource)
        .filter((resource) => ["Condition", "Observation", "MedicationStatement"].includes(resource.resourceType));

      expect(clinicalResources).toHaveLength(demoCase.traceFacts.length);

      for (const fact of demoCase.traceFacts) {
        const expectedCode = fact.snomed ?? fact.loinc ?? fact.rxnorm;
        const resource = clinicalResources.find((candidate) => {
          const codeable = candidate.resourceType === "MedicationStatement"
            ? candidate.medicationCodeableConcept
            : candidate.code;
          const coding = (codeable as { coding?: Array<{ code?: string }> } | undefined)?.coding ?? [];
          return candidate.resourceType === fact.fhirResource && coding.some((item) => item.code === expectedCode);
        });

        expect(resource, `${demoCase.id}: ${fact.phrase}`).toBeTruthy();

        if (fact.category === "Condition") {
          const coding = (resource?.code as { coding?: Array<{ code?: string }> }).coding ?? [];
          expect(coding.some((item) => item.code === fact.icd10)).toBe(true);
        }

        if (fact.category === "Observation") {
          const value = (resource?.valueQuantity as { value?: number } | undefined)?.value;
          expect(value).toBeDefined();
          expect(fact.phrase).toContain(String(value));
        }

        if (fact.category === "MedicationStatement") {
          expect(resource?.dosage).toBeTruthy();
        }
      }
    }
  });

  it("uses grouped ConceptMap targets for SNOMED, LOINC, and RxNorm", () => {
    for (const demoCase of CASE_LIST) {
      expect(demoCase.conceptMap).not.toHaveProperty("targetUri");

      const groups = demoCase.conceptMap.group as ConceptMapGroup[];
      const targets = new Set(groups.map((group) => group.target));

      expect(targets).toContain("http://snomed.info/sct");
      expect(targets).toContain("http://loinc.org");
      expect(targets).toContain("http://www.nlm.nih.gov/research/umls/rxnorm");
      expect(groups.every((group) => Array.isArray(group.element) && group.element.length > 0)).toBe(true);
    }
  });

  it("constrains the shared target ValueSet across conditions, observations, and medications", () => {
    const includes = VALUE_SET_DIABETES.compose.include;
    const systems = new Set(includes.map((entry) => entry.system));

    expect(VALUE_SET_DIABETES.id).toBe("ips-diabetes-target-concepts");
    expect(systems).toContain("http://snomed.info/sct");
    expect(systems).toContain("http://loinc.org");
    expect(systems).toContain("http://www.nlm.nih.gov/research/umls/rxnorm");
  });

  it("keeps the displayed federated gain arithmetically traceable", () => {
    expect(FED_SUMMARY.localOnlyCorrect).toBe(47);
    expect(FED_SUMMARY.federatedCorrect).toBe(48);
    expect(FED_SUMMARY.totalTransferProbes).toBe(48);
    expect(FED_SUMMARY.federatedCorrect - FED_SUMMARY.localOnlyCorrect).toBe(1);
    expect(FED_SUMMARY.globallyUnseenCorrect).toBe(192);
    expect(FED_SUMMARY.globallyUnseenMacroF1).toBe(1);
  });
});
