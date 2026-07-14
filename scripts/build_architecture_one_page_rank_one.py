from __future__ import annotations

import textwrap
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
SUBMISSION = ROOT / "submission"
OUTPUT = SUBMISSION / "architecture_one_page.pdf"
LOGO = SUBMISSION / "tech-adaptive-pandit-logo.png"

PAGE_W, PAGE_H = landscape(A4)

TEAL = colors.HexColor("#0F766E")
TEAL_DARK = colors.HexColor("#075B55")
NAVY = colors.HexColor("#152632")
INK = colors.HexColor("#18242E")
MUTED = colors.HexColor("#607283")
BORDER = colors.HexColor("#D8E1E6")
PALE = colors.HexColor("#E8F3F1")
PALE_BLUE = colors.HexColor("#EAF3FA")
GREEN = colors.HexColor("#228B62")
GREEN_PALE = colors.HexColor("#E8F6EF")
AMBER = colors.HexColor("#B86100")
AMBER_PALE = colors.HexColor("#FFF3DF")
WHITE = colors.white


def wrapped_lines(text: str, width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        lines.extend(textwrap.wrap(paragraph, width=width) or [""])
    return lines


def draw_wrapped(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width_chars: int,
    *,
    font: str = "Helvetica",
    size: float = 7.2,
    color=INK,
    leading: float | None = None,
    max_lines: int = 5,
) -> None:
    c.setFillColor(color)
    c.setFont(font, size)
    text_obj = c.beginText(x, y)
    text_obj.setLeading(leading or size * 1.22)
    for line in wrapped_lines(text, width_chars)[:max_lines]:
        text_obj.textLine(line)
    c.drawText(text_obj)


def panel(c: canvas.Canvas, x: float, y: float, w: float, h: float, *, fill=WHITE, stroke=BORDER, radius: float = 7) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.9)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def section_panel(c: canvas.Canvas, x: float, y: float, w: float, h: float, title: str, subtitle: str) -> None:
    panel(c, x, y, w, h, fill=WHITE)
    c.setFillColor(PALE)
    c.roundRect(x, y + h - 38, w, 38, 7, fill=1, stroke=0)
    c.rect(x, y + h - 38, w, 8, fill=1, stroke=0)
    c.setFillColor(TEAL_DARK)
    c.setFont("Helvetica-Bold", 8.9)
    c.drawString(x + 12, y + h - 16, title)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.3)
    c.drawString(x + 12, y + h - 29, subtitle)


def node(c: canvas.Canvas, x: float, y: float, w: float, h: float, title: str, body: str, *, highlight: bool = False) -> None:
    panel(c, x, y, w, h, fill=PALE_BLUE if highlight else colors.HexColor("#F8FAFB"), stroke=colors.HexColor("#C9D7E0"), radius=5)
    c.setFillColor(TEAL_DARK if not highlight else colors.HexColor("#2D6FB7"))
    c.setFont("Helvetica-Bold", 7.4)
    c.drawString(x + 8, y + h - 13, title)
    draw_wrapped(c, body, x + 8, y + h - 25, 35, size=6.25, color=INK, leading=7.3, max_lines=3)


def arrow(c: canvas.Canvas, x1: float, y1: float, x2: float, y2: float, *, color=TEAL, width: float = 1.35) -> None:
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)
    if abs(x2 - x1) >= abs(y2 - y1):
        direction = 1 if x2 >= x1 else -1
        c.line(x2, y2, x2 - 5 * direction, y2 + 3)
        c.line(x2, y2, x2 - 5 * direction, y2 - 3)
    else:
        direction = 1 if y2 >= y1 else -1
        c.line(x2, y2, x2 - 3, y2 - 5 * direction)
        c.line(x2, y2, x2 + 3, y2 - 5 * direction)


def metric(c: canvas.Canvas, x: float, y: float, w: float, value: str, label: str, *, value_color=TEAL_DARK) -> None:
    c.setFillColor(value_color)
    c.setFont("Helvetica-Bold", 10.4)
    c.drawCentredString(x + w / 2, y + 13, value)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.25)
    c.drawCentredString(x + w / 2, y + 4, label)


def build() -> None:
    SUBMISSION.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=landscape(A4))
    c.setTitle("Cross-Border IPS AI Agent - Architecture and Evidence")
    c.setAuthor("Tech Adaptive Pandit")
    c.setSubject("HL7 AI Challenge 2026 supporting architecture")

    # Header
    c.setFillColor(TEAL_DARK)
    c.rect(0, PAGE_H - 70, PAGE_W, 70, fill=1, stroke=0)
    if LOGO.exists():
        c.drawImage(str(LOGO), 28, PAGE_H - 59, width=44, height=44, preserveAspectRatio=True, mask="auto")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(84, PAGE_H - 31, "Cross-Border IPS AI Agent")
    c.setFont("Helvetica", 9)
    c.drawString(84, PAGE_H - 49, "Federated terminology alignment + FHIR-native trust + validated IPS-style delivery")
    c.setFont("Helvetica-Bold", 8.5)
    c.drawRightString(PAGE_W - 28, PAGE_H - 28, "TECH ADAPTIVE PANDIT")
    c.setFont("Helvetica", 7.2)
    c.drawRightString(PAGE_W - 28, PAGE_H - 44, "Anant Gupta | Manish Gupta | Gourav Gupta")
    c.setFillColor(colors.HexColor("#A8D8D3"))
    c.setFont("Helvetica", 6.5)
    c.drawRightString(PAGE_W - 28, PAGE_H - 58, "Efficiency & Effectiveness | Synthetic Type 2 diabetes case study")

    # Evidence strip
    c.setFillColor(colors.HexColor("#F3F7F8"))
    c.rect(0, 489, PAGE_W, 34, fill=1, stroke=0)
    metric(c, 24, 494, 130, "4 sites", "India | USA | Australia | Europe")
    metric(c, 164, 494, 130, "768", "local terminology mentions")
    metric(c, 304, 494, 150, "48/48", "federated vs 47/48 local-only")
    metric(c, 464, 494, 150, "192/192", "globally unseen | macro-F1 1.000")
    metric(c, 624, 494, 190, "4/4 | 0 errors", "IPS 2.0.1 validator | 0 warnings", value_color=GREEN)

    # Architecture panels
    section_panel(c, 28, 266, 252, 208, "1 | LOCAL CLINICAL SITE", "FL training records stay at the site")
    section_panel(c, 296, 266, 252, 208, "2 | SEMANTIC INTEROPERABILITY", "FHIR terminology makes mapping auditable")
    section_panel(c, 564, 266, 250, 208, "3 | DATA INTEROPERABILITY", "FHIR IPS is the exchange artifact")

    # Panel 1 nodes and branch
    node(c, 42, 397, 224, 47, "INPUT MODE", "Structured EHR -> direct facts\nFree text -> rule-backed extraction")
    arrow(c, 154, 397, 154, 382)
    node(c, 42, 335, 224, 47, "CLINICAL FACT MODEL", "Source span retained with condition, lab, value, medication, dose, and context")
    c.setStrokeColor(TEAL)
    c.setLineWidth(1.2)
    c.line(154, 335, 154, 321)
    c.line(92, 321, 216, 321)
    arrow(c, 92, 321, 92, 310)
    arrow(c, 216, 321, 216, 310)
    node(c, 42, 283, 101, 27, "REGISTRY HIT", "Trusted code", highlight=False)
    node(c, 153, 283, 113, 27, "REGISTRY MISS", "Federated linker", highlight=True)
    c.setFillColor(AMBER)
    c.setFont("Helvetica-Bold", 5.9)
    c.drawCentredString(154, 273, "Confidence <0.70: human review; no clinical code emitted")

    # Panel 2 nodes
    node(c, 310, 397, 224, 47, "LOCAL CODESYSTEM + VALUESET", "Represent source phrase and constrain target concepts by clinical category")
    arrow(c, 422, 397, 422, 382)
    node(c, 310, 335, 224, 47, "CONCEPTMAP + $TRANSLATE", "Publish source-to-target mapping, equivalence, provenance, and confidence")
    arrow(c, 422, 335, 422, 320)
    node(c, 310, 283, 224, 37, "$LOOKUP + $VALIDATE-CODE", "Check target-code existence and allowed ValueSet membership")
    c.setFillColor(AMBER)
    c.setFont("Helvetica-Bold", 5.75)
    c.drawCentredString(422, 273, "Code-valid does not mean semantically correct: gold labels + clinician review")

    # Panel 3 nodes
    node(c, 578, 397, 222, 47, "FHIR IPS DOCUMENT BUNDLE", "Bundle.type=document | Composition first | persistent identifier")
    arrow(c, 689, 397, 689, 382)
    node(c, 578, 335, 222, 47, "CODED FHIR RESOURCES", "Patient | Condition | Observation | MedicationStatement | Organization")
    arrow(c, 689, 335, 689, 320)
    node(c, 578, 283, 222, 37, "RECEIVER READINESS", "US Core STU9 | ABDM R4 draft | AU Core CI | EPS ballot")
    c.setFillColor(TEAL_DARK)
    c.setFont("Helvetica-Bold", 5.9)
    c.drawCentredString(689, 273, "PDF = human rendering; FHIR IPS = interoperable artifact")

    arrow(c, 280, 374, 296, 374, color=TEAL_DARK, width=1.8)
    arrow(c, 548, 374, 564, 374, color=TEAL_DARK, width=1.8)

    # Federated learning inset
    panel(c, 28, 107, 388, 148, fill=colors.HexColor("#F8FAFB"))
    c.setFillColor(TEAL_DARK)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(42, 237, "GENUINE FEDERATED TERMINOLOGY LEARNING")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.8)
    c.drawString(42, 224, "Each simulated site trains locally; the coordinator never receives reports or patient-level Bundles.")

    sites = [(42, "INDIA"), (94, "USA"), (146, "AUSTRALIA"), (216, "EUROPE")]
    for x, label in sites:
        w = 44 if label in {"INDIA", "USA"} else 62
        panel(c, x, 178, w, 27, fill=PALE, stroke=colors.HexColor("#B9D8D4"), radius=4)
        c.setFillColor(TEAL_DARK)
        c.setFont("Helvetica-Bold", 6.0)
        c.drawCentredString(x + w / 2, 190, label)
        c.setFont("Helvetica", 5.0)
        c.drawCentredString(x + w / 2, 181, "local SGD")
        c.setStrokeColor(colors.HexColor("#A6C3C0"))
        c.setLineWidth(0.9)
        c.line(x + w / 2, 178, 292, 166)

    panel(c, 292, 145, 104, 45, fill=NAVY, stroke=NAVY, radius=5)
    c.setFillColor(colors.HexColor("#9ED8D1"))
    c.setFont("Helvetica-Bold", 6.3)
    c.drawCentredString(344, 175, "FEDAVG COORDINATOR")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(344, 161, "weighted parameters")
    c.setFont("Helvetica", 5.8)
    c.drawCentredString(344, 151, "sample-count weighting")

    c.setFillColor(INK)
    c.setFont("Helvetica", 6.6)
    c.drawString(42, 153, "Round loop: local SGD -> weight update -> FedAvg -> global model broadcast")
    c.drawString(42, 141, "Upload payload: model tensors + sample count only")
    c.drawString(42, 129, "48.05 KiB/client update | 1.88 MiB two-way traffic across 5 rounds")
    c.setFillColor(AMBER)
    c.setFont("Helvetica-Bold", 6.1)
    c.drawString(42, 115, "Data locality, not cryptography: updates may leak without secure aggregation or differential privacy.")

    # Trace and validation inset
    panel(c, 430, 107, 384, 148, fill=colors.HexColor("#F8FAFB"))
    c.setFillColor(TEAL_DARK)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(444, 237, "ONE TRACE, TWO VALIDATION LAYERS")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.8)
    c.drawString(444, 224, "Semantic mapping is tested separately from FHIR structure/profile validation.")

    trace_nodes = [
        (444, 176, 80, "SYNTHETIC SOURCE", "madhumeha type 2"),
        (534, 176, 92, "CONCEPT", "Type 2 diabetes mellitus"),
        (636, 176, 90, "CODES", "SNOMED 44054006\nICD-10 E11"),
        (736, 176, 62, "FHIR", "Condition"),
    ]
    for index, (x, y, w, title, body) in enumerate(trace_nodes):
        panel(c, x, y, w, 35, fill=WHITE, stroke=BORDER, radius=4)
        c.setFillColor(MUTED)
        c.setFont("Helvetica-Bold", 5.6)
        c.drawString(x + 6, y + 23, title)
        draw_wrapped(c, body, x + 6, y + 13, 24, font="Helvetica-Bold", size=6.1, color=INK, leading=6.8, max_lines=2)
        if index < len(trace_nodes) - 1:
            arrow(c, x + w, y + 17, trace_nodes[index + 1][0], y + 17, color=MUTED, width=0.9)

    c.setFillColor(INK)
    c.setFont("Helvetica", 6.5)
    c.drawString(444, 151, "Semantic evidence: 48/48 transfer at all 5 seeds; 192/192 globally unseen; macro-F1 1.000.")
    c.drawString(444, 137, "FHIR evidence: 4/4 Bundles pass Validator 6.9.11 against IPS 2.0.1 with 0 errors and 0 warnings.")
    c.drawString(444, 123, "Terminology snapshot: representative SNOMED CT, LOINC, RxNorm, and ICD-10 codes pass 4/4 checks.")

    # Claim boundary and links
    c.setFillColor(AMBER_PALE)
    c.setStrokeColor(colors.HexColor("#E9C58A"))
    c.roundRect(28, 45, 786, 46, 6, fill=1, stroke=1)
    c.setFillColor(AMBER)
    c.setFont("Helvetica-Bold", 7.3)
    c.drawString(42, 76, "CLAIM BOUNDARY")
    c.setFillColor(INK)
    c.setFont("Helvetica", 6.6)
    c.drawString(119, 76, "Proven here: synthetic FL benchmark, FHIR-native artifacts, official validator evidence, and downloadable route outputs.")
    c.drawString(42, 61, "Not claimed: clinical accuracy, national certification, formal privacy, production readiness, or completed independent clinician sign-off.")

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.4)
    c.drawString(28, 23, "Demo: https://crossroad-fhir-link-three.vercel.app")
    c.drawRightString(PAGE_W - 28, 23, "Source: https://github.com/AnantGp/crossroad-fhir-link")
    c.save()


if __name__ == "__main__":
    build()
    print(OUTPUT)
