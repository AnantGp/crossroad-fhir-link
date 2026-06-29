import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  Code2,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const Index = () => {
  const [reportId, setReportId] = useState(SAMPLE_REPORTS[0].id);
  const report = SAMPLE_REPORTS.find((r) => r.id === reportId)!;
  const [sourceCountry, setSourceCountry] = useState<CountryCode>(report.country);
  const [targetCountry, setTargetCountry] = useState<CountryCode>("IND");
  const [reportText, setReportText] = useState(report.text);

  const onReportChange = (id: string) => {
    setReportId(id);
    const r = SAMPLE_REPORTS.find((x) => x.id === id)!;
    setReportText(r.text);
    setSourceCountry(r.country);
  };

  const readinessRows = READINESS[targetCountry];
  const [bundleResource, setBundleResource] = useState(0);

  return (
    <div className="min-h-screen bg-background">
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
              <Select value={reportId} onValueChange={onReportChange}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SAMPLE_REPORTS.map((r) => (
                    <SelectItem key={r.id} value={r.id} className="text-sm">{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Source</Label>
                <Select value={sourceCountry} onValueChange={(v) => setSourceCountry(v as CountryCode)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-sm">{c.flag} {c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Target</Label>
                <Select value={targetCountry} onValueChange={(v) => setTargetCountry(v as CountryCode)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-sm">{c.flag} {c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                Synthetic note. Editing is for demo exploration; pipeline output below uses the fixed representative trace.
              </p>
            </div>

            <Button className="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
              <Activity className="h-4 w-4 mr-1.5" /> Run pipeline
            </Button>
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
          {/* Metrics */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricCard label="Mapping coverage" value={METRICS.mappingCoverage} sub="local + federated" tone="success" icon={BookMarked} />
            <MetricCard label="FHIR Bundle type" value={METRICS.fhirBundleType} sub="IPS-style FHIR R4" tone="info" icon={Package} />
            <MetricCard label="Validator errors" value={METRICS.validatorErrors} sub="official validator" tone="success" icon={ShieldCheck} />
            <MetricCard label="Transfer accuracy" value={METRICS.transferAccuracy} sub="cross-site semantic" tone="success" icon={Network} />
          </div>

          {/* Pipeline */}
          <PipelineRail />

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
                    <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" />{TRACE_FACTS.length} facts</span>
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
                      {TRACE_FACTS.map((f) => (
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
                    <span className="pill pill-neutral">local-usa-diabetes-terms</span>
                  </div>
                  <CodeViewer value={CODE_SYSTEM_LOCAL} maxH={260} />
                </div>
                <div className="card-surface p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">ValueSet · allowed target concepts</h3>
                    <span className="pill pill-neutral">ips-diabetes-conditions</span>
                  </div>
                  <CodeViewer value={VALUE_SET_DIABETES} maxH={260} />
                </div>
                <div className="card-surface p-3 xl:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">ConceptMap · local phrase → SNOMED / LOINC</h3>
                    <span className="pill pill-info"><GitMerge className="h-3 w-3" />local → standard</span>
                  </div>
                  <CodeViewer value={CONCEPT_MAP} maxH={320} />
                </div>
                <div className="card-surface p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Simulated $translate</h3>
                    <span className="pill pill-success">equivalent</span>
                  </div>
                  <CodeViewer value={TRANSLATE_RESULT} maxH={240} />
                </div>
                <div className="card-surface p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Simulated $lookup</h3>
                    <span className="pill pill-info">LOINC 4548-4</span>
                  </div>
                  <CodeViewer value={LOOKUP_RESULT} maxH={240} />
                </div>
                <div className="card-surface p-3 xl:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Simulated $validate-code</h3>
                    <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" />valid</span>
                  </div>
                  <CodeViewer value={VALIDATE_CODE_RESULT} maxH={200} />
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
                      <code className="font-mono">"Serum creatinine"</code> not found in local registry →
                      federated linker resolves to <span className="pill pill-info">LOINC 2160-0</span> →
                      new <code className="font-mono">ConceptMap</code> entry written to local cache.
                    </div>
                  </div>
                  <div className="rounded-md border border-border p-3 bg-success-soft">
                    <div className="text-[11px] uppercase tracking-wide text-success font-semibold">Second lookup — same phrase</div>
                    <div className="mt-1 text-sm">
                      <code className="font-mono">"Serum creatinine"</code> resolved from
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
                  <h3 className="text-sm font-semibold">IPS-style FHIR R4 document Bundle</h3>
                  <p className="text-xs text-muted-foreground">
                    Composition-first document Bundle. Official validator: <span className="text-success font-medium">0 errors</span> for representative USA→IND, USA→AUS, USA→EUR Bundles.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="pill pill-info">Bundle.type = document</span>
                  <span className="pill pill-success">{IPS_BUNDLE.entry.length} entries</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-3">
                <div className="card-surface p-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-2 py-1">Resources</div>
                  <ul className="space-y-0.5">
                    {IPS_BUNDLE.entry.map((e, idx) => {
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
                    <h4 className="text-xs font-semibold mono">{(IPS_BUNDLE.entry[bundleResource].resource as { resourceType: string }).resourceType}</h4>
                    <span className="pill pill-neutral"><Code2 className="h-3 w-3" />JSON</span>
                  </div>
                  <CodeViewer value={IPS_BUNDLE.entry[bundleResource].resource} maxH={420} />
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
