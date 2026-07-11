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
  FED_ROBUSTNESS,
  FED_SUMMARY,
  FED_SITES,
  METRICS,
  OFFICIAL_VALIDATION,
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
        <div className={`mt-0.5 text-xl font-display font-semibold leading-tight break-words ${toneClass}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">{sub}</div>}
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
  if (fact.snomed) return `SNOMED CT ${fact.snomed}`;
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
      value: "SNOMED CT + LOINC + RxNorm + ICD-10",
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

const SOURCE_FORMAT_LABEL: Record<CountryCode, string> = {
  USA: "US Patient Care Summary / C-CDA-style source PDF",
  IND: "ABDM OPConsultation-style source PDF",
  AUS: "AU Patient Summary / Clinical Note source PDF",
  EUR: "European patient-summary-style source PDF",
};

const SOURCE_REPORT_TITLE: Record<CountryCode, string> = {
  USA: "Original US doctor report",
  IND: "Original Indian doctor report",
  AUS: "Original Australian doctor report",
  EUR: "Original European doctor report",
};

const RECEIVER_REPORT_NOTES: Record<CountryCode, string[]> = {
  USA: [
    "US Core STU9-oriented readiness view; race and ethnicity are flagged because they are not present in the synthetic source note.",
    "FHIR IPS remains the exchange artifact; this is a readable clinical handover view.",
  ],
  IND: [
    "ABDM FHIR R4-oriented readiness view; ABHA identifier is flagged because no real national identifier exists for synthetic data.",
    "The receiving Indian system can store accepted ConceptMap mappings in its local learned cache for reuse.",
  ],
  AUS: [
    "AU Core 2.0.0-oriented readiness view; IHI is flagged because the synthetic patient has no real Australian identifier.",
    "Medication and lab concepts remain coded through standard terminologies for downstream EHR import.",
  ],
  EUR: [
    "European Patient Summary CI-build-oriented readiness view; member-state-specific extensions are intentionally out of scope for the demo.",
    "The report is a readable rendering of the IPS Bundle, not a claim of national certification.",
  ],
};

function Hl7InteroperabilitySpine({ activeCase, targetCountry }: { activeCase: DemoCase; targetCountry: CountryCode }) {
  const source = COUNTRIES.find((country) => country.code === activeCase.source);
  const target = COUNTRIES.find((country) => country.code === targetCountry);

  const stages = [
    {
      label: "Source country PDF",
      title: SOURCE_FORMAT_LABEL[activeCase.source],
      detail: `${source?.flag ?? ""} ${activeCase.source} human-readable clinical input`,
      icon: FileText,
    },
    {
      label: "HL7 interoperability layer",
      title: "HL7 FHIR IPS document Bundle",
      detail: "canonical machine-readable source of truth for exchange",
      icon: Package,
      featured: true,
    },
    {
      label: "Target country PDF",
      title: RECEIVER_REPORT_TITLE[targetCountry],
      detail: `${target?.flag ?? ""} ${TARGET_LABEL[targetCountry]} readable receiver rendering`,
      icon: FileCheck2,
    },
  ];

  return (
    <div className="card-surface p-3" data-testid="hl7-spine">
      <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-primary font-semibold">Why HL7 matters here</div>
          <h3 className="mt-0.5 text-sm font-semibold">Country PDFs are readable documents; HL7 FHIR IPS is the interoperable source of truth.</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            The demo converts local clinical wording into standard codes, packages them in FHIR IPS, then renders a receiver-friendly country report from that Bundle.
          </p>
        </div>
        <span className="pill pill-success"><Package className="h-3 w-3" />HL7-centered exchange</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1.15fr_auto_1fr] gap-2 items-stretch">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={stage.label} className="contents">
              <div className={`rounded-md border px-3 py-2 min-w-0 ${stage.featured ? "border-primary/40 bg-primary-soft" : "border-border bg-surface-muted"}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-7 w-7 rounded-sm flex items-center justify-center shrink-0 ${stage.featured ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold break-words">{stage.label}</div>
                    <div className="text-sm font-semibold leading-snug break-words">{stage.title}</div>
                  </div>
                </div>
                <div className="mt-1.5 text-[11px] text-muted-foreground leading-snug">{stage.detail}</div>
              </div>
              {index < stages.length - 1 && (
                <div className="hidden md:flex items-center justify-center">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  return "reported condition";
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

type PdfRgb = [number, number, number];
type PdfFont = "F1" | "F2";
type PdfColumn = { label: string; width: number };

const PDF_COLOR = {
  text: [0.12, 0.16, 0.22] as PdfRgb,
  muted: [0.38, 0.45, 0.54] as PdfRgb,
  border: [0.78, 0.83, 0.88] as PdfRgb,
  surface: [0.97, 0.98, 0.99] as PdfRgb,
  white: [1, 1, 1] as PdfRgb,
  teal: [0.04, 0.42, 0.36] as PdfRgb,
  tealDark: [0.03, 0.26, 0.24] as PdfRgb,
  tealSoft: [0.90, 0.97, 0.95] as PdfRgb,
  blueSoft: [0.91, 0.96, 1] as PdfRgb,
  warningSoft: [1, 0.96, 0.88] as PdfRgb,
};

function rgb(color: PdfRgb, mode: "rg" | "RG") {
  return `${color.map((value) => value.toFixed(3)).join(" ")} ${mode}`;
}

function pdfTextCommand(text: string, x: number, y: number, size: number, font: PdfFont, color: PdfRgb) {
  return `${rgb(color, "rg")} BT /${font} ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${escapePdfText(text)}) Tj ET`;
}

function clipPdfText(value: string, maxLength: number) {
  const cleaned = sanitizePdfText(value);
  return cleaned.length > maxLength ? `${cleaned.slice(0, Math.max(0, maxLength - 3))}...` : cleaned;
}

class ClinicalPdfBuilder {
  private readonly pageWidth = 595;
  private readonly pageHeight = 842;
  private readonly margin = 42;
  private readonly contentWidth = 511;
  private pages: string[][] = [];
  private y = 0;

  constructor(
    private readonly title: string,
    private readonly subtitle: string,
    private readonly metaLine: string,
  ) {
    this.newPage();
  }

  private current() {
    return this.pages[this.pages.length - 1];
  }

  private rect(x: number, y: number, width: number, height: number, fill?: PdfRgb, stroke?: PdfRgb) {
    if (fill) this.current().push(`${rgb(fill, "rg")} ${x.toFixed(1)} ${y.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)} re f`);
    if (stroke) this.current().push(`${rgb(stroke, "RG")} ${x.toFixed(1)} ${y.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)} re S`);
  }

  private text(text: string, x: number, y: number, size: number, font: PdfFont = "F1", color: PdfRgb = PDF_COLOR.text) {
    this.current().push(pdfTextCommand(text, x, y, size, font, color));
  }

  private newPage() {
    this.pages.push([]);
    this.rect(0, 762, this.pageWidth, 80, PDF_COLOR.teal);
    this.text(this.title, this.margin, 812, 17, "F2", PDF_COLOR.white);
    this.text(this.subtitle, this.margin, 792, 9, "F1", [0.86, 0.96, 0.94]);
    this.rect(418, 794, 132, 28, PDF_COLOR.tealDark, [0.18, 0.58, 0.52]);
    this.text("SYNTHETIC DEMO", 439, 804, 9, "F2", PDF_COLOR.white);
    this.text(this.metaLine, this.margin, 746, 8.5, "F1", PDF_COLOR.muted);
    this.rect(this.margin, 737, this.contentWidth, 0.7, PDF_COLOR.border);
    this.y = 718;
  }

  private ensureSpace(height: number) {
    if (this.y - height < 58) this.newPage();
  }

  addKeyValueGrid(items: Array<{ label: string; value: string }>) {
    const boxWidth = 247;
    const gap = 17;
    const boxHeight = 46;
    const rows = Math.ceil(items.length / 2);
    this.ensureSpace(rows * (boxHeight + 8) + 6);

    items.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = this.margin + col * (boxWidth + gap);
      const top = this.y - row * (boxHeight + 8);

      this.rect(x, top - boxHeight, boxWidth, boxHeight, PDF_COLOR.surface, PDF_COLOR.border);
      this.text(item.label.toUpperCase(), x + 10, top - 15, 7.5, "F2", PDF_COLOR.muted);
      this.text(clipPdfText(item.value, 42), x + 10, top - 32, 10.5, "F2", PDF_COLOR.text);
    });

    this.y -= rows * (boxHeight + 8) + 6;
  }

  addSection(title: string) {
    this.ensureSpace(34);
    this.rect(this.margin, this.y - 22, this.contentWidth, 24, PDF_COLOR.tealSoft, PDF_COLOR.border);
    this.text(title.toUpperCase(), this.margin + 10, this.y - 14, 9, "F2", PDF_COLOR.tealDark);
    this.y -= 36;
  }

  addParagraphBox(title: string, body: string) {
    const maxChars = 104;
    const lines = wrapPdfLine(body, maxChars);
    const height = 35 + lines.length * 12;
    this.ensureSpace(height + 12);
    this.rect(this.margin, this.y - height, this.contentWidth, height, PDF_COLOR.surface, PDF_COLOR.border);
    this.text(title, this.margin + 12, this.y - 16, 10, "F2", PDF_COLOR.text);
    lines.forEach((line, index) => {
      this.text(line, this.margin + 12, this.y - 34 - index * 12, 9, "F1", PDF_COLOR.text);
    });
    this.y -= height + 14;
  }

  addTable(title: string, columns: PdfColumn[], rows: string[][]) {
    this.addSection(title);
    const headerHeight = 22;
    const rowHeight = 31;
    const tableHeight = headerHeight + rows.length * rowHeight;
    this.ensureSpace(tableHeight + 12);

    let cursorX = this.margin;
    this.rect(this.margin, this.y - headerHeight, this.contentWidth, headerHeight, PDF_COLOR.blueSoft, PDF_COLOR.border);
    columns.forEach((column) => {
      this.text(column.label.toUpperCase(), cursorX + 6, this.y - 14, 7.2, "F2", PDF_COLOR.muted);
      cursorX += column.width;
    });

    let rowTop = this.y - headerHeight;
    rows.forEach((row) => {
      this.rect(this.margin, rowTop - rowHeight, this.contentWidth, rowHeight, PDF_COLOR.white, PDF_COLOR.border);
      cursorX = this.margin;
      row.forEach((cell, index) => {
        const column = columns[index];
        const maxChars = Math.max(10, Math.floor(column.width / 5.4));
        this.text(clipPdfText(cell, maxChars), cursorX + 6, rowTop - 19, 8.3, index === 0 ? "F2" : "F1", PDF_COLOR.text);
        cursorX += column.width;
      });
      rowTop -= rowHeight;
    });

    this.y -= tableHeight + 16;
  }

  addCallout(title: string, lines: string[], tone: "info" | "warning" = "info") {
    const wrapped = lines.flatMap((line) => wrapPdfLine(line, 98));
    const height = 31 + wrapped.length * 12;
    this.ensureSpace(height + 12);
    const fill = tone === "warning" ? PDF_COLOR.warningSoft : PDF_COLOR.tealSoft;

    this.rect(this.margin, this.y - height, this.contentWidth, height, fill, PDF_COLOR.border);
    this.text(title, this.margin + 12, this.y - 16, 10, "F2", PDF_COLOR.text);
    wrapped.forEach((line, index) => {
      this.text(line, this.margin + 12, this.y - 34 - index * 12, 8.5, "F1", PDF_COLOR.text);
    });
    this.y -= height + 14;
  }

  toBlob() {
    return buildPdfBlobFromPages(this.pages);
  }
}

function buildPdfBlobFromPages(pages: string[][]) {
  const pageHeight = 842;
  const pageWidth = 595;

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const pageObjectIds = pages.map((_, index) => 5 + index * 2);
  objects.push(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((pageCommands, index) => {
    const pageId = pageObjectIds[index];
    const contentId = pageId + 1;
    const footer = [
      `${rgb(PDF_COLOR.border, "rg")} 42 40 511 0.7 re f`,
      pdfTextCommand("Cross-Border IPS AI Agent | readable PDF generated from HL7 FHIR IPS evidence | synthetic data only", 42, 25, 7.5, "F1", PDF_COLOR.muted),
      pdfTextCommand(`Page ${index + 1} of ${pages.length}`, 510, 25, 7.5, "F1", PDF_COLOR.muted),
    ];
    const contentLines = [...pageCommands, ...footer];
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

function getPatient(activeCase: DemoCase) {
  return activeCase.ipsBundle.entry
    .map((entry) => entry.resource as DemoFhirResource)
    .find((resource) => resource.resourceType === "Patient");
}

function buildSourceReportPdfBlob(activeCase: DemoCase) {
  const sourceCountry = COUNTRIES.find((country) => country.code === activeCase.source);
  const patient = getPatient(activeCase);
  const pdf = new ClinicalPdfBuilder(
    SOURCE_REPORT_TITLE[activeCase.source],
    "Country-facing source report prepared for HL7 FHIR IPS conversion",
    `${sourceCountry?.flag ?? ""} ${sourceCountry?.name ?? activeCase.source} | ${SOURCE_FORMAT_LABEL[activeCase.source]}`,
  );

  pdf.addKeyValueGrid([
    { label: "Document role", value: "Input PDF / local doctor note" },
    { label: "Source country", value: sourceCountry?.name ?? activeCase.source },
    { label: "Patient", value: `Synthetic patient | ${patient?.gender ?? "unknown"} | DOB ${patient?.birthDate ?? "not available"}` },
    { label: "HL7 route", value: `${activeCase.source} local report -> FHIR IPS Bundle` },
  ]);
  pdf.addParagraphBox("Original doctor note", activeCase.reportText);
  pdf.addTable(
    "Clinical facts prepared for HL7 conversion",
    [
      { label: "Source phrase", width: 130 },
      { label: "Clinical meaning", width: 205 },
      { label: "Code", width: 86 },
      { label: "FHIR", width: 90 },
    ],
    activeCase.traceFacts.map((fact) => [
      fact.phrase,
      fact.normalized,
      standardCodeLabel(fact),
      fact.fhirResource,
    ]),
  );
  pdf.addCallout("HL7 interoperability boundary", [
    "This PDF is a readable source document. The exchange artifact is the HL7 FHIR IPS-style document Bundle generated from the coded facts.",
    "The target-country PDF is rendered from that Bundle for human review; it is not the machine-to-machine standard.",
  ]);
  pdf.addCallout("Scope and safety", [
    "Synthetic data only. No real patient data, no national certification, and no clinical decision-support claim.",
  ], "warning");

  return pdf.toBlob();
}

function buildReceiverReportPdfBlob(activeCase: DemoCase, targetCountry: CountryCode) {
  const resources = activeCase.ipsBundle.entry.map((entry) => entry.resource as DemoFhirResource);
  const patient = resources.find((resource) => resource.resourceType === "Patient");
  const sourceCountry = COUNTRIES.find((country) => country.code === activeCase.source);
  const target = COUNTRIES.find((country) => country.code === targetCountry);
  const byType = (resourceType: string) => resources.filter((resource) => resource.resourceType === resourceType);
  const pdf = new ClinicalPdfBuilder(
    RECEIVER_REPORT_TITLE[targetCountry],
    "Readable target-country handover generated from the HL7 FHIR IPS Bundle",
    `${sourceCountry?.flag ?? ""} ${sourceCountry?.name ?? activeCase.source} -> ${target?.flag ?? ""} ${target?.name ?? targetCountry} | ${TARGET_LABEL[targetCountry]}`,
  );

  pdf.addKeyValueGrid([
    { label: "Patient", value: `Synthetic patient | ${patient?.gender ?? "unknown"} | DOB ${patient?.birthDate ?? "not available"}` },
    { label: "Receiver view", value: TARGET_LABEL[targetCountry] },
    { label: "Source FHIR document", value: activeCase.ipsBundle.identifier.value },
    { label: "Official IPS validation", value: "4/4 Bundles | 0 errors | 0 warnings" },
  ]);
  pdf.addTable(
    "Clinical summary from FHIR IPS",
    [
      { label: "Category", width: 78 },
      { label: "Clinical fact", width: 188 },
      { label: "Value / dose", width: 94 },
      { label: "Standard code(s)", width: 151 },
    ],
    [
      ...byType("Condition").map((resource) => [
        "Problem",
        clinicalDisplay(resource),
        resourceDetail(resource),
        clinicalCodeLabels(resource).join(", "),
      ]),
      ...byType("Observation").map((resource) => [
        "Result",
        clinicalDisplay(resource),
        resourceDetail(resource),
        clinicalCodeLabels(resource).join(", "),
      ]),
      ...byType("MedicationStatement").map((resource) => [
        "Medication",
        clinicalDisplay(resource),
        resourceDetail(resource),
        clinicalCodeLabels(resource).join(", "),
      ]),
    ],
  );
  pdf.addTable(
    "Target readiness check",
    [
      { label: "Item", width: 260 },
      { label: "Status", width: 76 },
      { label: "Note", width: 175 },
    ],
    READINESS[targetCountry].map((row) => [
      row.item,
      row.status,
      "note" in row ? row.note : "Ready for demo evidence",
    ]),
  );
  pdf.addCallout("Receiver handover and scope", [
    ...RECEIVER_REPORT_NOTES[targetCountry],
    "This PDF is a human-readable rendering of a FHIR Bundle.type=document with Composition first. FHIR IPS remains the interoperable source of truth; no formal national profile certification is claimed.",
  ], "warning");

  return pdf.toBlob();
}

function downloadSourceReportPdf(activeCase: DemoCase) {
  const blob = buildSourceReportPdfBlob(activeCase);
  const url = URL.createObjectURL(blob);
  const fileName = `${activeCase.source.toLowerCase()}-source-report.pdf`;
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadReceiverReportPdf(activeCase: DemoCase, targetCountry: CountryCode) {
  const blob = buildReceiverReportPdfBlob(activeCase, targetCountry);
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

function downloadJsonFile(value: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildEvidencePack(activeCase: DemoCase, targetCountry: CountryCode) {
  return {
    project: "Cross-Border IPS AI Agent",
    route: {
      source_country: activeCase.source,
      target_country: targetCountry,
      receiver_profile_readiness: TARGET_LABEL[targetCountry],
    },
    summary: {
      synthetic_reports: EVIDENCE.syntheticReports,
      sites: EVIDENCE.sites,
      terminology_training_examples: EVIDENCE.trainingExamples,
      cross_site_transfer_examples: EVIDENCE.crossSiteTransfer,
      globally_unseen_examples: EVIDENCE.globallyUnseen,
      semantic_transfer_validation: EVIDENCE.semanticTransfer,
      validator_errors: METRICS.validatorErrors,
      validator_warnings: METRICS.validatorWarnings,
      validated_bundles: METRICS.validatedBundles,
      validator_profile: METRICS.validatorProfile,
      informational_notes_per_bundle: METRICS.validatorInfoNotesPerBundle,
      fhir_bundle_type: activeCase.ipsBundle.type,
    },
    semantic_trace: activeCase.traceFacts.map((fact) => ({
      source_phrase: fact.phrase,
      normalized_concept: fact.normalized,
      category: fact.category,
      fhir_resource: fact.fhirResource,
      codes: {
        snomed_ct: fact.snomed ?? null,
        icd_10: fact.icd10 ?? null,
        loinc: fact.loinc ?? null,
        rxnorm: fact.rxnorm ?? null,
      },
      evidence_source: fact.source,
    })),
    fhir_terminology: {
      code_system: activeCase.codeSystem,
      value_set: VALUE_SET_DIABETES,
      concept_map: activeCase.conceptMap,
      translate_result: activeCase.translateResult,
      lookup_result: activeCase.lookupResult,
      validate_code_result: activeCase.validateCodeResult,
    },
    readiness: READINESS[targetCountry],
    privacy_boundary: [
      "Raw reports stay at the local site.",
      "Phrases, labels, aliases, and patient identifiers stay local.",
      "Patient-level FHIR Bundles stay local.",
      "Coordinator receives model tensors and sample counts only.",
      "FedAvg gives data locality only; no DP-SGD or secure aggregation guarantee is claimed.",
    ],
    limitations: [
      "Synthetic data only.",
      "Rule-backed extraction in prototype; pretrained clinical NER is future work.",
      "Readiness checks only; no national profile certification.",
      "Local simulated FHIR terminology operations; live terminology servers are future work.",
    ],
    federated_benchmark: {
      configuration: {
        rounds: 5,
        seed: 42,
        hash_dimension: 1024,
        local_epochs: 10,
        batch_size: 16,
        learning_rate: 0.1,
      },
      cross_site_transfer: {
        local_only_correct: FED_SUMMARY.localOnlyCorrect,
        federated_correct: FED_SUMMARY.federatedCorrect,
        total: FED_SUMMARY.totalTransferProbes,
        receivers_without_regression: `${FED_SUMMARY.receiversWithoutRegression}/4`,
      },
      globally_unseen: {
        dictionary_accuracy: FED_SUMMARY.dictionaryGloballyUnseenAccuracy,
        local_only_average_accuracy: FED_SUMMARY.localOnlyGloballyUnseenAccuracy,
        federated_correct: FED_SUMMARY.globallyUnseenCorrect,
        total: FED_SUMMARY.globallyUnseenTotal,
        federated_macro_f1: FED_SUMMARY.globallyUnseenMacroF1,
      },
      limitation: "Five predetermined deterministic seeds on synthetic terminology examples; not clinical accuracy on real notes.",
    },
    federated_multiseed_study: {
      seeds: FED_ROBUSTNESS.seeds,
      seed_count: FED_ROBUSTNESS.seedCount,
      local_only_transfer_accuracy: {
        mean: FED_ROBUSTNESS.localOnlyTransferAccuracyMean,
        sample_stddev: FED_ROBUSTNESS.localOnlyTransferAccuracyStdDev,
      },
      federated_transfer_accuracy: {
        mean: FED_ROBUSTNESS.federatedTransferAccuracyMean,
        sample_stddev: FED_ROBUSTNESS.federatedTransferAccuracyStdDev,
      },
      globally_unseen_local_only_average_accuracy: {
        mean: FED_ROBUSTNESS.localOnlyGloballyUnseenAccuracyMean,
        sample_stddev: FED_ROBUSTNESS.localOnlyGloballyUnseenAccuracyStdDev,
      },
      globally_unseen_federated_accuracy: {
        mean: FED_ROBUSTNESS.federatedGloballyUnseenAccuracyMean,
        sample_stddev: FED_ROBUSTNESS.federatedGloballyUnseenAccuracyStdDev,
      },
      convergence_round_range: [
        FED_ROBUSTNESS.firstPerfectRoundMinimum,
        FED_ROBUSTNESS.firstPerfectRoundMaximum,
      ],
      communication_estimate: {
        model_tensor_bytes_per_update: FED_ROBUSTNESS.modelTensorBytesPerUpdate,
        coordinator_inbound_bytes: FED_ROBUSTNESS.coordinatorInboundBytes,
        two_way_model_traffic_bytes: FED_ROBUSTNESS.twoWayModelTrafficBytes,
        scope: "Tensor payload estimate only; transport and serialization overhead excluded.",
      },
    },
    official_validation: OFFICIAL_VALIDATION,
    fhir_bundle: activeCase.ipsBundle,
  };
}

function downloadFhirBundleJson(activeCase: DemoCase, targetCountry: CountryCode) {
  downloadJsonFile(
    activeCase.ipsBundle,
    `${activeCase.source.toLowerCase()}-to-${targetCountry.toLowerCase()}-fhir-ips-bundle.json`,
  );
}

function downloadEvidencePack(activeCase: DemoCase, targetCountry: CountryCode) {
  downloadJsonFile(
    buildEvidencePack(activeCase, targetCountry),
    `${activeCase.source.toLowerCase()}-to-${targetCountry.toLowerCase()}-hl7-ai-evidence-pack.json`,
  );
}

function OutputDownloadPanel({ activeCase, targetCountry }: { activeCase: DemoCase; targetCountry: CountryCode }) {
  const target = COUNTRIES.find((country) => country.code === targetCountry);

  return (
    <div className="card-surface p-4 space-y-3" data-testid="output-download-panel">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-primary" /> Final output
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Receiver PDF is generated from the HL7 FHIR IPS Bundle, which remains the interoperable machine-readable artifact.
          </p>
        </div>
        <span className="pill pill-success shrink-0">{target?.flag} {targetCountry}</span>
      </div>

      <div className="rounded-md border border-border bg-surface-muted px-3 py-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Human-readable receiver report</div>
        <div className="mt-0.5 text-sm font-medium">{RECEIVER_REPORT_TITLE[targetCountry]}</div>
        <div className="text-xs text-muted-foreground">{TARGET_LABEL[targetCountry]}</div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 justify-start text-xs"
          onClick={() => downloadReceiverReportPdf(activeCase, targetCountry)}
        >
          <Download className="h-3.5 w-3.5 mr-1.5" /> Download final {targetCountry} PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 justify-start text-xs"
          onClick={() => downloadFhirBundleJson(activeCase, targetCountry)}
        >
          <Code2 className="h-3.5 w-3.5 mr-1.5" /> Download FHIR Bundle JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 justify-start text-xs"
          onClick={() => downloadEvidencePack(activeCase, targetCountry)}
        >
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Download evidence pack
        </Button>
      </div>
    </div>
  );
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
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download final {targetCountry} PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => downloadFhirBundleJson(activeCase, targetCountry)}
          >
            <Code2 className="h-3.5 w-3.5 mr-1.5" /> Bundle JSON
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
  const [bundleResource, setBundleResource] = useState(0);
  const [lastRunLabel, setLastRunLabel] = useState<string | null>(null);

  const onReportChange = (id: string) => {
    const c = CASES[id];
    setReportId(id);
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
        <div className="px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
            <div className="h-9 w-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-semibold text-sm sm:text-[15px] leading-tight break-words">Cross-Border IPS AI Agent</div>
              <div className="text-[11px] text-muted-foreground leading-tight break-words">
                HL7 AI Challenge · Federated terminology + FHIR R4 IPS-style document Bundles
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <span className="pill pill-neutral"><Globe2 className="h-3 w-3" />4 sites</span>
            <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" />IPS 2.0.1: 0 errors</span>
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
              <Label htmlFor="source-report-select" className="text-xs text-muted-foreground">Source report</Label>
              <select
                id="source-report-select"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="source-country-select" className="text-xs text-muted-foreground">Source</Label>
                <select
                  id="source-country-select"
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
                <Label htmlFor="target-country-select" className="text-xs text-muted-foreground">Target</Label>
                <select
                  id="target-country-select"
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

            <div className="rounded-md border border-border bg-surface-muted p-3 space-y-2" data-testid="source-pdf-card">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Source PDF input</div>
                  <div className="mt-0.5 text-sm font-medium leading-snug">{SOURCE_FORMAT_LABEL[activeCase.source]}</div>
                </div>
                <span className="pill pill-info shrink-0"><FileText className="h-3 w-3" />human</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                PDF is the country-facing document. HL7 FHIR IPS below is the system-facing interoperability layer.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full text-xs"
                onClick={() => downloadSourceReportPdf(activeCase)}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download {activeCase.source} source PDF
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="source-note-preview" className="text-xs text-muted-foreground">Source note preview</Label>
              <Textarea
                id="source-note-preview"
                value={activeCase.reportText}
                readOnly
                rows={8}
                className="text-xs font-mono leading-relaxed resize-none bg-surface-muted"
              />
              <p className="text-[11px] text-muted-foreground">
                Read-only synthetic input used by the validated evidence panels.
              </p>
            </div>

            <Button
              className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
              onClick={() => setLastRunLabel(`${activeCase.label} → ${targetCountry}`)}
            >
              <Activity className="h-4 w-4 mr-1.5" /> Run pipeline
            </Button>
            {lastRunLabel && (
              <p aria-live="polite" className="rounded-md border border-[hsl(var(--success)/0.25)] bg-success-soft px-2.5 py-2 text-[11px] text-muted-foreground">
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

          <OutputDownloadPanel activeCase={activeCase} targetCountry={targetCountry} />
        </aside>

        {/* Main */}
        <main className="space-y-4 min-w-0">
          <ExchangeSummary activeCase={activeCase} targetCountry={targetCountry} />
          <Hl7InteroperabilitySpine activeCase={activeCase} targetCountry={targetCountry} />

          {/* Metrics */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricCard label="Case mapping coverage" value={METRICS.mappingCoverage} sub="6/6 facts · registry + FL" tone="success" icon={BookMarked} />
            <MetricCard label="FHIR Bundle type" value={METRICS.fhirBundleType} sub="IPS-style FHIR R4" tone="info" icon={Package} />
            <MetricCard label="Official IPS validation" value={`${METRICS.validatorErrors} errors`} sub={`${METRICS.validatorWarnings} warnings · ${METRICS.validatedBundles}/${METRICS.validatedBundles} Bundles`} tone="success" icon={ShieldCheck} />
            <MetricCard label="Synthetic transfer" value={METRICS.transferAccuracy} sub="48 receiver probes" tone="success" icon={Network} />
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
                    <span className="pill pill-info">SNOMED CT · LOINC · RxNorm · ICD-10</span>
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
                              {f.snomed && <span className="pill pill-neutral">SNOMED CT {f.snomed}</span>}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="card-surface p-4">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Perfect transfer seeds</div>
                  <div className="text-2xl font-display font-semibold mt-1">{FED_ROBUSTNESS.seedsWithPerfectTransfer} / {FED_ROBUSTNESS.seedCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">48/48 federated transfer at every configured seed.</div>
                </div>
                <div className="card-surface p-4">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Transfer gain per seed</div>
                  <div className="text-2xl font-display font-semibold mt-1 text-success">
                    +{FED_SUMMARY.federatedCorrect - FED_SUMMARY.localOnlyCorrect} correct
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {FED_SUMMARY.localOnlyCorrect} local-only → {FED_SUMMARY.federatedCorrect} federated across {FED_SUMMARY.totalTransferProbes} probes.
                  </div>
                </div>
                <div className="card-surface p-4">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Receiver-seed checks</div>
                  <div className="text-2xl font-display font-semibold mt-1">{FED_ROBUSTNESS.receiverSeedChecksWithoutRegression} / 20</div>
                  <div className="text-xs text-muted-foreground mt-1">all four receivers were non-regressive across five seeds.</div>
                </div>
                <div className="card-surface p-4">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Perfect unseen seeds</div>
                  <div className="text-2xl font-display font-semibold mt-1">{FED_ROBUSTNESS.seedsWithPerfectGloballyUnseenAccuracy} / {FED_ROBUSTNESS.seedCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">192/192 with macro-F1 1.000 at every seed.</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="card-surface p-4">
                  <h3 className="text-sm font-semibold">Five-seed robustness</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Across seeds {FED_ROBUSTNESS.seeds.join(", ")}, FedAvg transfer accuracy was 100.0% ± 0.0% versus {(FED_ROBUSTNESS.localOnlyTransferAccuracyMean * 100).toFixed(1)}% ± {(FED_ROBUSTNESS.localOnlyTransferAccuracyStdDev * 100).toFixed(1)}% local-only. Globally unseen FedAvg accuracy was 100.0% ± 0.0%; local-only averaged {(FED_ROBUSTNESS.localOnlyGloballyUnseenAccuracyMean * 100).toFixed(2)}% ± {(FED_ROBUSTNESS.localOnlyGloballyUnseenAccuracyStdDev * 100).toFixed(2)}%.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    These deterministic synthetic results show implementation stability, not clinical accuracy on real notes.
                  </p>
                </div>
                <div className="card-surface p-4">
                  <h3 className="text-sm font-semibold">Convergence & communication</h3>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div><div className="text-muted-foreground">Perfect unseen score</div><div className="font-semibold mt-0.5">Round {FED_ROBUSTNESS.firstPerfectRoundMinimum}–{FED_ROBUSTNESS.firstPerfectRoundMaximum}</div></div>
                    <div><div className="text-muted-foreground">Model tensors/update</div><div className="font-semibold mt-0.5">{(FED_ROBUSTNESS.modelTensorBytesPerUpdate / 1024).toFixed(2)} KiB</div></div>
                    <div><div className="text-muted-foreground">Five-round traffic</div><div className="font-semibold mt-0.5">{(FED_ROBUSTNESS.twoWayModelTrafficBytes / 1024 / 1024).toFixed(2)} MiB</div></div>
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">Tensor payload estimate only; transport, encryption, framing, and serialization overhead are excluded.</p>
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
                    Composition-first FHIR R4 document Bundle · {activeCase.source} → {targetCountry} ({TARGET_LABEL[targetCountry]}). All four current Bundles pass the official HL7 validator against <span className="text-success font-medium">IPS 2.0.1 with 0 errors and 0 warnings</span>.
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
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /><span><span className="font-medium">Five-seed transfer validation:</span> 48/48 federated versus 47/48 local-only at every configured seed; all 20 receiver-seed comparisons were non-regressive.</span></li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /><span><span className="font-medium">Globally unseen robustness:</span> 192/192 and macro-F1 1.000 at all five seeds; local-only averaged 94.27% ± 0.26%.</span></li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /><span><span className="font-medium">Communication estimate:</span> 48.05 KiB of model tensors per client update and 1.88 MiB total two-way tensor traffic across five rounds.</span></li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" /><span><span className="font-medium">Official HL7 validator:</span> 4/4 current Bundles pass IPS 2.0.1 with 0 errors and 0 warnings.</span></li>
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
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">Five deterministic seeds</span> improve robustness evidence but do not replace real-world external validation.</span></li>
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">Rule-backed extractor</span> in this prototype; pretrained clinical NER is future work.</span></li>
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">FedAvg gives data locality only;</span> model updates can leak information without DP-SGD or secure aggregation.</span></li>
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">Readiness checks only;</span> no national profile certification.</span></li>
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">Local simulated FHIR terminology operations;</span> live terminology servers are future work.</span></li>
                    <li className="flex gap-2"><span className="text-warning">•</span><span><span className="text-foreground font-medium">Two validator information notes per Bundle:</span> RxNorm ingredients are outside the IPS guide's recommended medication value set; IPS-preferred product coding is future work.</span></li>
                  </ul>
                </div>
              </div>

              <div className="card-surface overflow-hidden">
                <div className="p-3 border-b border-border flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-success" /> Official IPS validation
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {OFFICIAL_VALIDATION.validator} · {OFFICIAL_VALIDATION.profile}
                    </p>
                  </div>
                  <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" />4/4 passed</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Route</th><th>Errors</th><th>Warnings</th><th>Information notes</th></tr>
                    </thead>
                    <tbody>
                      {OFFICIAL_VALIDATION.routes.map((result) => (
                        <tr key={result.route}>
                          <td className="font-medium">{result.route}</td>
                          <td><span className="pill pill-success">{result.errors}</span></td>
                          <td><span className="pill pill-success">{result.warnings}</span></td>
                          <td><span className="pill pill-neutral">{result.notes}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="px-3 py-2 text-[11px] text-muted-foreground border-t border-border">
                  Information note: {OFFICIAL_VALIDATION.note} Full unedited log is included in the GitHub submission evidence.
                </p>
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
