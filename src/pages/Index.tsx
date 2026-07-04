import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Download,
  FileCheck2,
  FileText,
  GitMerge,
  Globe2,
  Layers,
  Lock,
  Network,
  Package,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  CASES,
  CASE_LIST,
  COUNTRIES,
  CountryCode,
  EVIDENCE,
  FED_SITES,
  METRICS,
  PIPELINE_STEPS,
  READINESS,
  TARGET_LABEL,
  VALUE_SET_DIABETES,
} from "@/lib/demoData";
import type { DemoCase, ExtractedFact } from "@/lib/demoData";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText, Sparkles, BookMarked, Network, GitMerge, Package, ShieldCheck,
};

function MetricCard({
  label, value, sub, tone = "neutral", icon: Icon,
}: { label: string; value: string | number; sub?: string; tone?: "neutral" | "success" | "info" | "warning"; icon: React.ComponentType<{ className?: string }> }) {
  const toneClass = {
    neutral: "text-foreground",
    success: "text-success",
    info: "text-info",
    warning: "text-warning-foreground",
  }[tone];
  return (
    <div className="card-surface p-4 flex items-start gap-3 min-w-0">
      <div className="rounded-md bg-primary-soft p-2 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
        <div className={`mt-0.5 text-xl font-display font-semibold leading-tight truncate ${toneClass}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  );
}

function PipelineRail() {
  return (
    <div className="card-surface p-3 overflow-x-auto">
      <ol className="flex items-center gap-1 min-w-max">
        {PIPELINE_STEPS.map((step, i) => {
          const Icon = ICONS[step.icon];
          return (
            <li key={step.key} className="flex items-center gap-1">
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-2.5 py-1.5">
                <div className="h-5 w-5 rounded-sm bg-primary-soft text-primary flex items-center justify-center">
                  <Icon className="h-3 w-3" />
                </div>
                <span className="text-xs font-medium whitespace-nowrap">
                  <span className="text-muted-foreground mr-1">{String(i + 1).padStart(2, "0")}</span>
                  {step.label}
                </span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CodeViewer({ value, maxH = 420 }: { value: unknown; maxH?: number }) {
  const text = useMemo(() => JSON.stringify(value, null, 2), [value]);
  return (
    <pre className="code-block" style={{ maxHeight: maxH }}>
      <code>{text}</code>
    </pre>
  );
}

function SourcePill({ source }: { source: "local-registry" | "federated-linker-cache" | "federated-linker-new" }) {
  if (source === "local-registry") return <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" />local registry</span>;
  if (source === "federated-linker-cache") return <span className="pill pill-info"><Layers className="h-3 w-3" />federated · cache</span>;
  return <span className="pill pill-warning"><Sparkles className="h-3 w-3" />federated · new</span>;
}

function standardCodeLabel(fact: ExtractedFact) {
  if (fact.loinc) return `LOINC ${fact.loinc}`;
  if (fact.rxnorm) return `RxNorm ${fact.rxnorm}`;
  if (fact.snomed) return `SNOMED ${fact.snomed}`;
  if (fact.icd10) return `ICD-10 ${fact.icd10}`;
  return "standard code";
}

function lookupCodeLabel(result: Record<string, unknown>) {
  const params = result.parameter;
  if (!Array.isArray(params)) return "$lookup";

  const codeParam = params.find((p) => typeof p === "object" && p && "name" in p && p.name === "code");
  const nameParam = params.find((p) => typeof p === "object" && p && "name" in p && p.name === "name");
  const code = codeParam && "valueString" in codeParam ? String(codeParam.valueString) : "";
  const name = nameParam && "valueString" in nameParam ? String(nameParam.valueString) : "";

  return [name, code].filter(Boolean).join(" ") || "$lookup";
}

function countryDisplay(code: CountryCode) {
  const country = COUNTRIES.find((c) => c.code === code);
  return country ? `${country.flag} ${country.name}` : code;
}

function ExchangeSummary({ activeCase, targetCountry }: { activeCase: DemoCase; targetCountry: CountryCode }) {
  return (
    <div className="card-surface p-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Current exchange route</div>
        <div className="mt-0.5 flex items-center gap-2 text-base font-display font-semibold">
          <span className="truncate">{countryDisplay(activeCase.source)}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">{countryDisplay(targetCountry)}</span>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <span className="pill pill-info">semantic interoperability</span>
        <span className="pill pill-success">FHIR document exchange</span>
        <span className="pill pill-neutral">{TARGET_LABEL[targetCountry]}</span>
      </div>
    </div>
  );
}

function ClinicalQaStrip({ activeCase }: { activeCase: DemoCase }) {
  const compositionFirst = activeCase.ipsBundle.entry[0]?.resource.resourceType === "Composition";
  const items = [
    {
      icon: ClipboardCheck,
      label: "Source-to-fact",
      value: `${activeCase.traceFacts.length} retained facts`,
      detail: "source phrases stay visible for audit",
    },
    {
      icon: BookMarked,
      label: "Fact-to-code",
      value: "SNOMED + LOINC + RxNorm + ICD-10",
      detail: "registry first, federated linker on misses",
    },
    {
      icon: Package,
      label: "Code-to-FHIR",
      value: "Condition / Observation / MedicationStatement",
      detail: "clinical facts placed into expected resources",
    },
    {
      icon: FileCheck2,
      label: "Document proof",
      value: compositionFirst ? "Composition first + identifier" : "needs review",
      detail: "Bundle.type=document with a persistent document id",
    },
  ];

  return (
    <div className="card-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold">End-to-end clinical QA path</h3>
          <p className="text-xs text-muted-foreground">What makes the Bundle medically reviewable, not just structurally valid.</p>
        </div>
        <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" />traceable</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-md border border-border bg-surface-muted px-3 py-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-sm bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold truncate">{item.label}</span>
              </div>
              <div className="mt-1 text-sm font-semibold leading-snug">{item.value}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{item.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type FhirCoding = { system?: string; code?: string; display?: string };
type CodeableLike = { coding?: FhirCoding[] };
type DemoFhirResource = Record<string, unknown> & {
  resourceType: string;
  id?: string;
  code?: CodeableLike;
  medicationCodeableConcept?: CodeableLike;
  valueQuantity?: { value?: string | number; unit?: string; code?: string };
  dosage?: Array<{ text?: string }>;
  gender?: string;
  birthDate?: string;
};

const RECEIVER_REPORT_TITLE: Record<CountryCode, string> = {
  USA: "Final US receiver report",
  IND: "Final Indian receiver report",
  AUS: "Final Australian receiver report",
  EUR: "Final European receiver report",
};

const RECEIVER_REPORT_NOTES: Record<CountryCode, string[]> = {
  USA: [
    "US Core readiness view; race and ethnicity are flagged because they are not present in the synthetic source note.",
    "FHIR IPS remains the exchange artifact; this is a readable clinical handover view.",
  ],
  IND: [
    "ABDM readiness view; ABHA identifier is flagged because no real national identifier exists for synthetic data.",
    "The receiving Indian system can store accepted ConceptMap mappings in its local learned cache for reuse.",
  ],
  AUS: [
    "AU Base readiness view; IHI is flagged because the synthetic patient has no real Australian identifier.",
    "Medication and lab concepts remain coded through standard terminologies for downstream EHR import.",
  ],
  EUR: [
    "European IPS readiness view; member-state-specific extensions are intentionally out of scope for the demo.",
    "The report is a readable rendering of the IPS Bundle, not a claim of national certification.",
  ],
};

function systemLabel(system?: string) {
  if (!system) return "Code";
  if (system.includes("snomed")) return "SNOMED CT";
  if (system.includes("loinc")) return "LOINC";
  if (system.includes("rxnorm")) return "RxNorm";
  if (system.includes("icd-10")) return "ICD-10";
  return system;
}

function getCodings(resource: DemoFhirResource) {
  const codeable = resource.resourceType === "MedicationStatement" ? resource.medicationCodeableConcept : resource.code;
  return codeable?.coding ?? [];
}

function clinicalDisplay(resource: DemoFhirResource) {
  return getCodings(resource)[0]?.display ?? resource.id ?? resource.resourceType;
}

function clinicalCodeLabels(resource: DemoFhirResource) {
  return getCodings(resource)
    .filter((coding) => coding.code)
    .map((coding) => `${systemLabel(coding.system)} ${coding.code}`);
}

function resourceDetail(resource: DemoFhirResource) {
  if (resource.resourceType === "Observation" && resource.valueQuantity?.value !== undefined) {
    const unit = resource.valueQuantity.unit ?? resource.valueQuantity.code ?? "";
    return `${resource.valueQuantity.value}${unit ? ` ${unit}` : ""}`;
  }

  if (resource.resourceType === "MedicationStatement") {
    return resource.dosage?.map((dose) => dose.text).filter(Boolean).join("; ") || "active";
  }

  return "active problem";
}

function sanitizePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return sanitizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapPdfLine(value: string, maxLength = 92) {
  const words = sanitizePdfText(value).split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function buildReceiverReportLines(activeCase: DemoCase, targetCountry: CountryCode) {
  const resources = activeCase.ipsBundle.entry.map((entry) => entry.resource as DemoFhirResource);
  const patient = resources.find((resource) => resource.resourceType === "Patient");
  const sourceCountry = COUNTRIES.find((country) => country.code === activeCase.source);
  const target = COUNTRIES.find((country) => country.code === targetCountry);
  const byType = (resourceType: string) => resources.filter((resource) => resource.resourceType === resourceType);

  const lines: string[] = [
    RECEIVER_REPORT_TITLE[targetCountry],
    "Cross-Border IPS AI Agent",
    `Route: ${sourceCountry?.name ?? activeCase.source} to ${target?.name ?? targetCountry}`,
    `Receiver format: ${TARGET_LABEL[targetCountry]}`,
    `Source FHIR document: ${activeCase.ipsBundle.identifier.value}`,
    "FHIR Bundle.type: document",
    "",
    "Patient",
    `Synthetic patient | ${patient?.gender ?? "unknown"} | DOB ${patient?.birthDate ?? "not available"}`,
    "",
    "Problems",
    ...byType("Condition").map((resource) => `${clinicalDisplay(resource)} | ${clinicalCodeLabels(resource).join(", ")} | ${resourceDetail(resource)}`),
    "",
    "Results",
    ...byType("Observation").map((resource) => `${clinicalDisplay(resource)} | ${resourceDetail(resource)} | ${clinicalCodeLabels(resource).join(", ")}`),
    "",
    "Medications",
    ...byType("MedicationStatement").map((resource) => `${clinicalDisplay(resource)} | ${resourceDetail(resource)} | ${clinicalCodeLabels(resource).join(", ")}`),
    "",
    "Receiver handover notes",
    ...RECEIVER_REPORT_NOTES[targetCountry].map((note) => `- ${note}`),
    "",
    "Scope",
    "Readable receiver report generated from the FHIR IPS-style Bundle. Readiness-only rendering; no national certification claimed.",
  ];

  return lines.flatMap((line) => wrapPdfLine(line));
}

function buildPdfBlob(lines: string[]) {
  const pageHeight = 842;
  const pageWidth = 595;
  const marginX = 50;
  const startY = 790;
  const lineHeight = 15;
  const linesPerPage = 48;
  const pages: string[][] = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const pageObjectIds = pages.map((_, index) => 5 + index * 2);
  objects.push(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((pageLines, index) => {
    const pageId = pageObjectIds[index];
    const contentId = pageId + 1;
    const contentLines = [
      "BT",
      `/F2 14 Tf ${lineHeight} TL ${marginX} ${startY} Td`,
      `(${escapePdfText(pageLines[0] ?? "Receiver Report")}) Tj`,
      `/F1 10 Tf`,
      ...pageLines.slice(1).map((line) => `T* (${escapePdfText(line)}) Tj`),
      "ET",
    ];
    const stream = contentLines.join("\n");

    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  const pdfParts = ["%PDF-1.4\n"];
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(pdfParts.join("").length);
    pdfParts.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefStart = pdfParts.join("").length;
  pdfParts.push(`xref\n0 ${objects.length + 1}\n`);
  pdfParts.push("0000000000 65535 f \n");
  offsets.slice(1).forEach((offset) => {
    pdfParts.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  pdfParts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob(pdfParts, { type: "application/pdf" });
}

function downloadReceiverReportPdf(activeCase: DemoCase, targetCountry: CountryCode) {
  const lines = buildReceiverReportLines(activeCase, targetCountry);
  const blob = buildPdfBlob(lines);
  const url = URL.createObjectURL(blob);
  const fileName = `${activeCase.source.toLowerCase()}-to-${targetCountry.toLowerCase()}-receiver-report.pdf`;
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ReceiverReport({ activeCase, targetCountry }: { activeCase: DemoCase; targetCountry: CountryCode }) {
  const resources = activeCase.ipsBundle.entry.map((entry) => entry.resource as DemoFhirResource);
  const patient = resources.find((resource) => resource.resourceType === "Patient");
  const conditions = resources.filter((resource) => resource.resourceType === "Condition");
  const observations = resources.filter((resource) => resource.resourceType === "Observation");
  const medications = resources.filter((resource) => resource.resourceType === "MedicationStatement");
  const sourceCountry = COUNTRIES.find((country) => country.code === activeCase.source);
  const target = COUNTRIES.find((country) => country.code === targetCountry);

  const sections = [
    { title: "Problems", resources: conditions },
    { title: "Results", resources: observations },
    { title: "Medications", resources: medications },
  ];

  return (
    <div className="card-surface overflow-hidden" data-testid="receiver-report">
      <div className="p-3 border-b border-border flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-primary" /> {RECEIVER_REPORT_TITLE[targetCountry]}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Human-readable receiver view generated from the FHIR IPS Bundle. The Bundle remains the source of truth for system exchange.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="pill pill-info">{sourceCountry?.flag} {activeCase.source} source</span>
          <span className="pill pill-success">{target?.flag} {targetCountry} receiver</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => downloadReceiverReportPdf(activeCase, targetCountry)}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download {targetCountry} PDF
          </Button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="rounded-md border border-border bg-surface-muted px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Patient</div>
            <div className="mt-1 text-sm font-medium">Synthetic patient</div>
            <div className="text-xs text-muted-foreground">{patient?.gender ?? "unknown"} · DOB {patient?.birthDate ?? "not available"}</div>
          </div>
          <div className="rounded-md border border-border bg-surface-muted px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Receiver format</div>
            <div className="mt-1 text-sm font-medium">{TARGET_LABEL[targetCountry]}</div>
            <div className="text-xs text-muted-foreground">readiness-only rendering, not certification</div>
          </div>
          <div className="rounded-md border border-border bg-surface-muted px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Source document</div>
            <div className="mt-1 text-sm font-medium">{activeCase.ipsBundle.identifier.value}</div>
            <div className="text-xs text-muted-foreground">FHIR Bundle.type=document</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {sections.map((section) => (
            <div key={section.title} className="rounded-md border border-border overflow-hidden">
              <div className="bg-surface-muted px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                {section.title}
              </div>
              <div className="divide-y divide-border">
                {section.resources.map((resource) => (
                  <div key={resource.id} className="px-3 py-2">
                    <div className="text-sm font-medium">{clinicalDisplay(resource)}</div>
                    <div className="text-xs text-muted-foreground">{resourceDetail(resource)}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {clinicalCodeLabels(resource).map((label) => (
                        <span key={label} className="pill pill-neutral">{label}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-[hsl(var(--warning)/0.35)] bg-warning-soft px-3 py-2">
          <div className="text-[11px] uppercase tracking-wide text-warning-foreground font-semibold">Receiver handover notes</div>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground list-disc pl-4">
            {RECEIVER_REPORT_NOTES[targetCountry].map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  const [reportId, setReportId] = useState(CASE_LIST[0].id);
  const activeCase = CASES[reportId] ?? CASE_LIST[0];
  const [targetCountry, setTargetCountry] = useState<CountryCode>(activeCase.defaultTarget);
  const [reportText, setReportText] = useState(activeCase.reportText);
  const [bundleResource, setBundleResource] = useState(0);
  const [lastRunLabel, setLastRunLabel] = useState<string | null>(null);

  const onReportChange = (id: string) => {
    const c = CASES[id];
    setReportId(id);
    setReportText(c.reportText);
    setTargetCountry(c.defaultTarget);
    setBundleResource(0);
    setLastRunLabel(null);
  };

  const onSourceCountryChange = (country: CountryCode) => {
    const nextCase = CASE_LIST.find((c) => c.source === country);
    if (nextCase) onReportChange(nextCase.id);
  };

  const readinessRows = READINESS[targetCountry];
  const cacheFact =
    activeCase.traceFacts.find((f) => f.source === "federated-linker-new") ??
    activeCase.traceFacts.find((f) => f.source === "federated-linker-cache") ??
    activeCase.traceFacts[0];
  const lookupLabel = lookupCodeLabel(activeCase.lookupResult);
  const valueSetId = (VALUE_SET_DIABETES as { id?: string }).id ?? "target ValueSet";

  return (
    <div
      className="min-h-screen bg-background"
      data-testid="active-case-state"
      data-case-id={activeCase.id}
      data-code-system-id={(activeCase.codeSystem as { id?: string }).id}
      data-bundle-id={activeCase.ipsBundle.id}
      data-source-country={activeCase.source}
      data-target-country={targetCountry}
    >
      {/* Top bar */}
      <header className="border-b border-border bg-surface">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-semibold text-[15px] leading-tight truncate">Cross-Border IPS AI Agent</div>
              <div className="text-[11px] text-muted-foreground leading-tight truncate">
                HL7 AI Challenge · Federated terminology + FHIR R4 IPS-style document Bundles
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="pill pill-neutral"><Globe2 className="h-3 w-3" />4 sites</span>
            <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" />Validator: 0 errors</span>
            <span className="pill pill-info"><ShieldCheck className="h-3 w-3" />Synthetic data only</span>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 py-4 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
        {/* Left panel */}
        <aside className="space-y-3">
          <div className="card-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Input</h2>
              <span className="pill pill-neutral">step 01</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Source report</Label>
              <select
                data-testid="source-report-select"
                value={reportId}
                onChange={(e) => onReportChange(e.target.value)}
                className="select-control"
              >
                {CASE_LIST.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Source</Label>
                <select
                  data-testid="source-country-select"
                  value={activeCase.source}
                  onChange={(e) => onSourceCountryChange(e.target.value as CountryCode)}
                  className="select-control"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Target</Label>
                <select
                  data-testid="target-country-select"
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value as CountryCode)}
                  className="select-control"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Report text (editable)</Label>
              <Textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={8}
                className="text-xs font-mono leading-relaxed resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                Synthetic note. Text edits are exploratory; evidence panels use the selected validated case.
              </p>
            </div>

            <Button
              className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
              onClick={() => setLastRunLabel(`${activeCase.label} → ${targetCountry}`)}
            >
              <Activity className="h-4 w-4 mr-1.5" /> Run pipeline
            </Button>
            {lastRunLabel && (
              <p className="rounded-md border border-[hsl(var(--success)/0.25)] bg-success-soft px-2.5 py-2 text-[11px] text-muted-foreground">
                Pipeline refreshed for <span className="font-medium text-foreground">{lastRunLabel}</span>. Static outputs remain tied to the validated synthetic evidence.
              </p>
            )}
          </div>

          <div className="card-surface p-4 space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Privacy boundary</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>Raw reports stay at the local site.</li>
              <li>Phrases, labels, aliases stay local.</li>
              <li>Patient identifiers stay local.</li>
              <li>Patient-level FHIR Bundles stay local.</li>
              <li>Coordinator receives <span className="text-foreground font-medium">model tensors + sample counts only</span>.</li>
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-4 min-w-0">
          <ExchangeSummary activeCase={activeCase} targetCountry={targetCountry} />

          {/* Metrics */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricCard label="Mapping coverage" value={METRICS.mappingCoverage} sub="local + federated" tone="success" icon={BookMarked} />
            <MetricCard label="FHIR Bundle type" value={METRICS.fhirBundleType} sub="IPS-style FHIR R4" tone="info" icon={Package} />
            <MetricCard label="Validator errors" value={METRICS.validatorErrors} sub="official validator" tone="success" icon={ShieldCheck} />
            <MetricCard label="Transfer accuracy" value={METRICS.transferAccuracy} sub="cross-site semantic" tone="success" icon={Network} />
          </div>

          {/* Pipeline */}
          <PipelineRail />
          <ClinicalQaStrip activeCase={activeCase} />

          {/* Tabs */}
          <Tabs defaultValue="trace" className="space-y-3">
            <TabsList className="bg-surface-muted border border-border h-auto p-1 flex flex-wrap gap-1">
              <TabsTrigger value="trace" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Clinical Trace
              </TabsTrigger>
              <TabsTrigger value="terminology" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <BookMarked className="h-3.5 w-3.5 mr-1.5" /> FHIR Terminology
              </TabsTrigger>
              <TabsTrigger value="federated" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Network className="h-3.5 w-3.5 mr-1.5" /> Federated Learning
              </TabsTrigger>
              <TabsTrigger value="bundle" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Package className="h-3.5 w-3.5 mr-1.5" /> FHIR IPS Bundle
              </TabsTrigger>
              <TabsTrigger value="evidence" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Evidence & Limitations
              </TabsTrigger>
            </TabsList>

            {/* Trace */}
            <TabsContent value="trace" className="space-y-3 mt-0">
              <div className="card-surface overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-semibold">Clinical fact extraction → terminology binding</h3>
                    <p className="text-xs text-muted-foreground">Rule-backed extractor (prototype). Pretrained clinical NER is future work.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" />{activeCase.traceFacts.length} facts</span>
                    <span className="pill pill-info">SNOMED · LOINC · RxNorm · ICD-10</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Phrase</th>
                        <th>Normalized concept</th>
                        <th>Code(s)</th>
                        <th>FHIR resource</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCase.traceFacts.map((f) => (
                        <tr key={f.phrase} className="hover:bg-surface-muted">
                          <td className="font-mono text-xs">{f.phrase}</td>
                          <td>{f.normalized}</td>
                          <td className="text-xs">
                            <div className="flex flex-wrap gap-1">
                              {f.snomed && <span className="pill pill-neutral">SNOMED {f.snomed}</span>}
                              {f.loinc && <span className="pill pill-neutral">LOINC {f.loinc}</span>}
                              {f.rxnorm && <span className="pill pill-neutral">RxNorm {f.rxnorm}</span>}
                              {f.icd10 && <span className="pill pill-neutral">ICD-10 {f.icd10}</span>}
                            </div>
                          </td>
                          <td className="text-xs"><span className="pill pill-info">{f.fhirResource}</span></td>
                          <td><SourcePill source={f.source} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Terminology */}
            <TabsContent value="terminology" className="space-y-3 mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <div className="card-surface p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">CodeSystem · local site terms</h3>
                    <span className="pill pill-neutral">{(activeCase.codeSystem as { id?: string }).id}</span>
                  </div>
                  <CodeViewer value={activeCase.codeSystem} maxH={260} />
                </div>
                <div className="card-surface p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">ValueSet · allowed target concepts</h3>
                    <span className="pill pill-neutral">{valueSetId}</span>
                  </div>
                  <CodeViewer value={VALUE_SET_DIABETES} maxH={260} />
                </div>
                <div className="card-surface p-3 xl:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">ConceptMap · local phrase → standard terminology</h3>
                    <span className="pill pill-info"><GitMerge className="h-3 w-3" />local → standard</span>
                  </div>
                  <CodeViewer value={activeCase.conceptMap} maxH={320} />
                </div>
                <div className="card-surface p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Simulated $translate</h3>
                    <span className="pill pill-success">equivalent</span>
                  </div>
                  <CodeViewer value={activeCase.translateResult} maxH={240} />
                </div>
                <div className="card-surface p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Simulated $lookup</h3>
                    <span className="pill pill-info">{lookupLabel}</span>
                  </div>
                  <CodeViewer value={activeCase.lookupResult} maxH={240} />
                </div>
                <div className="card-surface p-3 xl:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Simulated $validate-code</h3>
                    <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" />valid</span>
                  </div>
                  <CodeViewer value={activeCase.validateCodeResult} maxH={200} />
                </div>
              </div>

              <div className="card-surface p-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Learned mapping cache reuse
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-md border border-border p-3 bg-surface-muted">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">First lookup — unknown phrase</div>
                    <div className="mt-1 text-sm">
                      <code className="font-mono">"{cacheFact.phrase}"</code> not found in local registry →
                      federated linker resolves to <span className="pill pill-info">{standardCodeLabel(cacheFact)}</span> →
                      new <code className="font-mono">ConceptMap</code> entry written to local cache.
                    </div>
                  </div>
                  <div className="rounded-md border border-border p-3 bg-success-soft">
                    <div className="text-[11px] uppercase tracking-wide text-success font-semibold">Second lookup — same phrase</div>
                    <div className="mt-1 text-sm">
                      <code className="font-mono">"{cacheFact.phrase}"</code> resolved from
                      <span className="pill pill-success ml-1"><CheckCircle2 className="h-3 w-3" />local learned cache</span>
                      — no federated round-trip.
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Federated */}
            <TabsContent value="federated" className="space-y-3 mt-0">
              <div className="card-surface p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Network className="h-4 w-4 text-primary" /> FedAvg topology — 4 sites
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <div className="grid grid-cols-2 gap-2">
                    {FED_SITES.map((s) => {
                      const c = COUNTRIES.find((x) => x.code === s.code)!;
                      return (
                        <div key={s.code} className="rounded-md border border-border p-2.5 bg-surface-muted">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{c.flag} {s.code}</span>
                            <span className="pill pill-neutral">{s.samples} samples</span>
                          </div>
                          <div className="mt-1.5 text-[11px] text-muted-foreground">local train · keeps raw data</div>
                          <div className="mt-1 flex gap-1 flex-wrap">
                            <span className="pill pill-success">transfer {s.transferAcc}</span>
                            <span className="pill pill-neutral">local-only {s.localOnlyAcc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex md:flex-col items-center justify-center gap-1 text-muted-foreground">
                    <div className="text-[10px] uppercase tracking-wide">tensors +</div>
                    <div className="text-[10px] uppercase tracking-wide">sample counts</div>
                    <ChevronRight className="h-5 w-5 hidden md:block rotate-0" />
                    <ChevronRight className="h-5 w-5 md:hidden" />
                  </div>
                  <div className="rounded-md border-2 border-primary/30 p-4 bg-primary-soft">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                        <GitMerge className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">FedAvg Coordinator</div>
                        <div className="text-[11px] text-muted-foreground">aggregates model updates only</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-foreground/80 space-y-1.5">
                      <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-success" /> receives model tensors</div>
                      <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-success" /> receives sample counts</div>
                      <div className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-destructive" /> no raw reports</div>
                      <div className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-destructive" /> no labels, aliases, identifiers</div>
                      <div className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-destructive" /> no patient-level FHIR Bundles</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="card-surface p-4">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Transfer non-regression</div>
                  <div className="text-2xl font-display font-semibold mt-1">48 / 48</div>
                  <div className="text-xs text-muted-foreground mt-1">no receiver regressed vs local-only baseline.</div>
                </div>
                <div className="card-surface p-4">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Aggregate transfer Δ</div>
                  <div className="text-2xl font-display font-semibold mt-1 text-success">+12.5%</div>
                  <div className="text-xs text-muted-foreground mt-1">cross-site mean improvement over local-only.</div>
                </div>
                <div className="card-surface p-4">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Globally unseen (reported separately)</div>
                  <div className="text-2xl font-display font-semibold mt-1">{EVIDENCE.globallyUnseen}</div>
                  <div className="text-xs text-muted-foreground mt-1">held-out phrases unseen by any site.</div>
                </div>
              </div>

              <div className="card-surface p-4 border-l-4 border-l-warning">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold">Privacy caveat.</span>{" "}
                    <span className="text-muted-foreground">
                      FedAvg gives data locality only; model updates can leak information without DP-SGD or secure aggregation. No formal privacy guarantee is claimed in this demo.
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Bundle */}
            <TabsContent value="bundle" className="space-y-3 mt-0">
              <div className="card-surface p-3 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-sm font-semibold">{activeCase.bundleTitle}</h3>
                  <p className="text-xs text-muted-foreground">
                    Composition-first IPS-style FHIR R4 document Bundle · {activeCase.source} → {targetCountry} ({TARGET_LABEL[targetCountry]}). Representative cross-border Bundles pass the official validator with <span className="text-success font-medium">0 errors</span>.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="pill pill-info">Bundle.type = document</span>
                  <span className="pill pill-success">identifier present</span>
                  <span className="pill pill-success">{activeCase.ipsBundle.entry.length} entries</span>
                </div>
              </div>

              <ReceiverReport activeCase={activeCase} targetCountry={targetCountry} />

              <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-3">
                <div className="card-surface p-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-2 py-1">Resources</div>
                  <ul className="space-y-0.5">
                    {activeCase.ipsBundle.entry.map((e, idx) => {
                      const active = idx === bundleResource;
                      const r = e.resource as { resourceType: string; id?: string };
                      return (
                        <li key={idx}>
                          <button
                            onClick={() => setBundleResource(idx)}
                            className={`w-full text-left px-2 py-1.5 rounded-sm text-xs flex items-center justify-between gap-2 ${active ? "bg-primary-soft text-primary font-medium" : "hover:bg-surface-muted"}`}
                          >
                            <span className="truncate">{r.resourceType}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{r.id}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="card-surface p-3 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold mono">{(activeCase.ipsBundle.entry[bundleResource].resource as { resourceType: string }).resourceType}</h4>
                    <span className="pill pill-neutral"><Code2 className="h-3 w-3" />JSON</span>
                  </div>
                  <CodeViewer value={activeCase.ipsBundle.entry[bundleResource].resource} maxH={420} />
                </div>
              </div>

              <div className="card-surface p-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Target readiness · {COUNTRIES.find((c) => c.code === targetCountry)?.flag} {targetCountry}
                </h3>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Item</th><th>Status</th><th>Note</th></tr>
                    </thead>
                    <tbody>
                      {readinessRows.map((r, i) => (
                        <tr key={i}>
                          <td>{r.item}</td>
                          <td>
                            {r.status === "ready"
                              ? <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" />ready</span>
                              : <span className="pill pill-warning"><AlertTriangle className="h-3 w-3" />gap</span>}
                          </td>
                          <td className="text-xs text-muted-foreground">{("note" in r ? r.note : "—") as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Readiness checks only; no national profile certification claimed.</p>
              </div>
            </TabsContent>

            {/* Evidence */}
            <TabsContent value="evidence" className="space-y-3 mt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {[
                  { label: "Synthetic reports", v: EVIDENCE.syntheticReports },
                  { label: "Sites", v: EVIDENCE.sites },
                  { label: "Training examples", v: EVIDENCE.trainingExamples },
                  { label: "Cross-site transfer", v: EVIDENCE.crossSiteTransfer },
                  { label: "Globally unseen", v: EVIDENCE.globallyUnseen },
                  { label: "Semantic transfer", v: "48/48" },
                ].map((m) => (
                  <div key={m.label} className="card-surface p-3">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{m.label}</div>
                    <div className="text-xl font-display font-semibold mt-0.5">{m.v}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="card-surface p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" /> What this demo evidences
                  </h3>
                  <ul className="mt-2 text-sm space-y-2">
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /><span><span className="font-medium">Semantic mapping validation:</span> 48/48 cross-site terminology examples mapped correctly.</span></li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /><span><span className="font-medium">Official validator:</span> 0 errors for USA→India, USA→Australia, and USA→Europe representative IPS-style Bundles.</span></li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /><span><span className="font-medium">FHIR-native terminology layer:</span> CodeSystem, ValueSet, ConceptMap + simulated $translate / $lookup / $validate-code.</span></li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /><span><span className="font-medium">Medical placement check:</span> conditions, observations, and medications land in the expected FHIR resource types.</span></li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /><span><span className="font-medium">Privacy boundary:</span> coordinator receives only model tensors and sample counts.</span></li>
                  </ul>
                </div>

                <div className="card-surface p-4 border-l-4 border-l-warning">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" /> Limitations & honest scope
                  </h3>
                  <ul className="mt-2 text-sm space-y-2 text-muted-foreground">
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">Synthetic data only.</span> No real patients, no production EHR integration.</span></li>
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">Rule-backed extractor</span> in this prototype; pretrained clinical NER is future work.</span></li>
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">FedAvg gives data locality only;</span> model updates can leak information without DP-SGD or secure aggregation.</span></li>
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">Readiness checks only;</span> no national profile certification.</span></li>
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">Local simulated FHIR terminology operations;</span> live terminology servers are future work.</span></li>
                    <li className="flex gap-2"><span className="text-warning">•</span><span>No formal privacy guarantee. No clinical decision support claim.</span></li>
                  </ul>
                </div>
              </div>

              <div className="card-surface overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-semibold">Clinical validation chain</h3>
                    <p className="text-xs text-muted-foreground">The selected case keeps the audit path from source phrase to standard code to FHIR resource.</p>
                  </div>
                  <span className="pill pill-info"><FileCheck2 className="h-3 w-3" />source → fact → code → resource</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Source phrase</th>
                        <th>Predicted clinical meaning</th>
                        <th>Primary code</th>
                        <th>FHIR placement</th>
                        <th>Mapping evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCase.traceFacts.map((fact) => (
                        <tr key={`${fact.phrase}-evidence`}>
                          <td className="font-mono text-xs">{fact.phrase}</td>
                          <td>{fact.normalized}</td>
                          <td className="text-xs"><span className="pill pill-neutral">{standardCodeLabel(fact)}</span></td>
                          <td className="text-xs"><span className="pill pill-info">{fact.fhirResource}</span></td>
                          <td><SourcePill source={fact.source} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card-surface p-4">
                <h3 className="text-sm font-semibold">Wording the demo commits to</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {[
                    "IPS-style FHIR R4 document Bundle with official validator evidence (not certified production IPS).",
                    "Readiness checks (not national profile certification).",
                    "FedAvg gives data locality only; model updates can leak information without DP-SGD or secure aggregation.",
                    "Rule-backed extraction in prototype; pretrained clinical NER is future work.",
                  ].map((t) => (
                    <div key={t} className="rounded-md border border-border bg-surface-muted px-3 py-2">{t}</div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <footer className="text-[11px] text-muted-foreground py-2">
            Cross-Border IPS AI Agent · HL7 AI Challenge · static judge-facing demo · synthetic data · no live backend.
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Index;
