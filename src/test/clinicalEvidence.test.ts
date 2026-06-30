import { describe, expect, it } from "vitest";
import { CASE_LIST, VALUE_SET_DIABETES } from "@/lib/demoData";

type ConceptMapGroup = {
  target?: string;
  element?: Array<unknown>;
};

describe("static clinical and FHIR evidence", () => {
  it("keeps every demo Bundle document-shaped and auditable", () => {
    for (const demoCase of CASE_LIST) {
      expect(demoCase.ipsBundle.resourceType).toBe("Bundle");
      expect(demoCase.ipsBundle.type).toBe("document");
      expect(demoCase.ipsBundle.identifier.value).toBe(demoCase.ipsBundle.id);
      expect(demoCase.ipsBundle.entry[0].resource.resourceType).toBe("Composition");

      const resourceTypes = demoCase.ipsBundle.entry.map((entry) => entry.resource.resourceType);
      expect(resourceTypes).toContain("Patient");
      expect(resourceTypes).toContain("Condition");
      expect(resourceTypes).toContain("Observation");
      expect(resourceTypes).toContain("MedicationStatement");
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
});
