from __future__ import annotations

import textwrap
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
SUBMISSION = ROOT / "submission"

TEAL = colors.HexColor("#0B6F61")
TEAL_DARK = colors.HexColor("#073F3A")
TEAL_SOFT = colors.HexColor("#EAF7F4")
BLUE_SOFT = colors.HexColor("#EDF6FF")
INK = colors.HexColor("#1E293B")
MUTED = colors.HexColor("#64748B")
BORDER = colors.HexColor("#CBD5E1")


def wrap(text: str, width: int = 78) -> list[str]:
    return textwrap.wrap(text, width=width) or [""]


def draw_header(c: canvas.Canvas, title: str, subtitle: str, page_width: float, page_height: float) -> None:
    c.setFillColor(TEAL)
    c.rect(0, page_height - 72, page_width, 72, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(40, page_height - 34, title)
    c.setFont("Helvetica", 9)
    c.drawString(40, page_height - 52, subtitle)


def draw_box(c: canvas.Canvas, x: float, y: float, w: float, h: float, title: str, body: str, fill=colors.white) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(BORDER)
    c.roundRect(x, y, w, h, 7, fill=1, stroke=1)
    c.setFillColor(TEAL_DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 9, y + h - 16, title)
    c.setFillColor(INK)
    c.setFont("Helvetica", 7.2)
    text = c.beginText(x + 9, y + h - 31)
    for line in wrap(body, 42)[:4]:
        text.textLine(line)
    c.drawText(text)


def draw_arrow(c: canvas.Canvas, x1: float, y1: float, x2: float, y2: float) -> None:
    c.setStrokeColor(TEAL)
    c.setLineWidth(1.4)
    c.line(x1, y1, x2, y2)
    if x2 >= x1:
        c.line(x2, y2, x2 - 5, y2 + 3)
        c.line(x2, y2, x2 - 5, y2 - 3)
    else:
        c.line(x2, y2, x2 + 5, y2 + 3)
        c.line(x2, y2, x2 + 5, y2 - 3)


def build_architecture_pdf() -> None:
    path = SUBMISSION / "architecture_one_page.pdf"
    c = canvas.Canvas(str(path), pagesize=landscape(A4))
    w, h = landscape(A4)
    draw_header(
        c,
        "Cross-Border IPS AI Agent - Architecture",
        "FHIR IPS is the interoperable artifact; PDFs are human-readable renderings.",
        w,
        h,
    )

    boxes = [
        (36, 445, 152, 70, "1. Source Report", "Country PDF, EHR-like note, or free-text doctor note."),
        (222, 445, 152, 70, "2. Extraction", "Structured EHR skips extraction; free text uses rule-backed extraction in prototype."),
        (408, 445, 152, 70, "3. Clinical Facts", "JSON fact model: condition, lab, value, medication, dose, context."),
        (594, 445, 152, 70, "4. Local Registry", "Trusted deterministic lookup for known phrases and local aliases."),
        (594, 320, 152, 70, "5. FL Linker", "Registry misses go to federated terminology linker trained locally per site."),
        (408, 320, 152, 70, "6. FHIR Terminology", "CodeSystem, ValueSet, ConceptMap, translate, lookup, validate-code."),
        (222, 320, 152, 70, "7. FHIR IPS Bundle", "Bundle.type=document, Composition first, coded FHIR resources."),
        (36, 320, 152, 70, "8. Target Output", "Readiness checks plus human-readable target-country PDF."),
    ]
    for i, (x, y, bw, bh, title, body) in enumerate(boxes):
        draw_box(c, x, y, bw, bh, title, body, TEAL_SOFT if i in [5, 6] else colors.white)

    arrow_points = [
        (188, 480, 222, 480),
        (374, 480, 408, 480),
        (560, 480, 594, 480),
        (670, 445, 670, 390),
        (594, 355, 560, 355),
        (408, 355, 374, 355),
        (222, 355, 188, 355),
    ]
    for p in arrow_points:
        draw_arrow(c, *p)

    c.setFillColor(BLUE_SOFT)
    c.setStrokeColor(BORDER)
    c.roundRect(36, 175, 710, 96, 7, fill=1, stroke=1)
    c.setFillColor(TEAL_DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(52, 246, "Interoperability and privacy evidence")
    c.setFillColor(INK)
    c.setFont("Helvetica", 8.5)
    lines = [
        "Semantic interoperability: SNOMED CT, ICD-10, LOINC, RxNorm, and FHIR ConceptMap.",
        "Data interoperability: Patient, Condition, Observation, MedicationStatement, Composition, and Bundle.",
        "Federated privacy boundary: raw reports, labels, aliases, identifiers, and patient-level Bundles stay local.",
        "Coordinator receives model tensors and sample counts only. FedAvg is data locality, not formal privacy.",
    ]
    y = 228
    for line in lines:
        c.drawString(52, y, line)
        y -= 16

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawString(36, 28, "Submission scope: synthetic data, readiness checks only, no national certification, no clinical decision-support claim.")
    c.save()


SLIDES = [
    ("Cross-Border IPS AI Agent", "Federated FHIR terminology alignment for cross-border Type 2 diabetes summaries."),
    ("Aim", "Make a local diabetes report usable across borders by converting it into a machine-readable, universally coded, HL7 FHIR IPS-style patient summary. FHIR IPS is the interoperable artifact; PDFs are human-readable renderings."),
    ("Problem Statement", "Local clinical language blocks interoperability. T2DM, sugar disease, madhumeha type 2, type 2 DM, and DM2 may refer to the same concept, but receiver systems need standard codes and predictable FHIR resources."),
    ("Solution Flow", "Doctor report -> clinical fact extraction -> local registry lookup -> federated terminology linker -> FHIR ConceptMap validation -> FHIR IPS document Bundle -> target-country report and readiness gaps."),
    ("Machine-Readable Proof", "The final exchange artifact is a FHIR R4 document Bundle with Bundle.type=document, Composition first, coded resources, and official IPS 2.0.1 validation across all four routes: 0 errors and 0 warnings."),
    ("Universal Coding Proof", "Local clinical terms are normalized into accepted healthcare codes: SNOMED CT and ICD-10 for conditions, LOINC for labs, RxNorm for medications, and FHIR resources for exchange structure."),
    ("Federated Learning Role", "Each country/site trains a terminology linker locally. The coordinator receives model tensors and sample counts only; it does not receive raw reports, identifiers, labels, aliases, or patient-level FHIR Bundles."),
    ("FHIR-Native Global Linker", "The model predicts candidate mappings, HL7 makes them auditable through CodeSystem, ValueSet, and ConceptMap, and tx.fhir.org independently checks representative target codes through lookup and validate-code."),
    ("Cross-Border Sharing", "The same FHIR IPS can support USA, India, Australia, and Europe routes. Judges can download source PDF, target PDF, FHIR Bundle JSON, and evidence pack JSON. Readiness checks are not certification."),
    ("Evidence", "Across five deterministic seeds, the model produces 48/48 federated transfer versus 47/48 local-only and 192/192 globally unseen predictions. Estimated two-way tensor traffic is 1.88 MiB across five rounds. All 4 IPS 2.0.1 Bundle-profile validations have 0 errors and 0 warnings."),
    ("Honest Limits", "Synthetic data only. Rule-backed extraction. Local ConceptMap translation remains simulated. External code checks are representative. Independent clinical review is pending. FedAvg gives data locality only."),
    ("Final Claim", "Cross-Border IPS AI Agent combines semantic interoperability and data interoperability. Federated learning aligns local terminology, FHIR terminology artifacts make mappings auditable, and FHIR IPS packages the result for cross-border exchange."),
]


def build_pitch_deck_pdf() -> None:
    path = SUBMISSION / "final_pitch_deck.pdf"
    c = canvas.Canvas(str(path), pagesize=landscape(A4))
    w, h = landscape(A4)
    screenshot = SUBMISSION / "screenshots" / "usa-to-india-dashboard.png"
    for index, (title, body) in enumerate(SLIDES, start=1):
        draw_header(c, title, f"Cross-Border IPS AI Agent | Slide {index} of {len(SLIDES)}", w, h)
        c.setFillColor(INK)
        c.setFont("Helvetica", 18 if index == 1 else 14)
        text = c.beginText(58, h - 140)
        text.setLeading(23)
        for line in wrap(body, 74):
            text.textLine(line)
        c.drawText(text)

        if index == 7 and screenshot.exists():
            c.drawImage(str(screenshot), 58, 75, width=420, height=250, preserveAspectRatio=True, anchor="sw")
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 8)
            c.drawString(500, 290, "Dashboard screenshot from automated click-test.")

        c.setFillColor(TEAL_SOFT)
        c.setStrokeColor(BORDER)
        c.roundRect(535, 110, 220, 155, 7, fill=1, stroke=1)
        c.setFillColor(TEAL_DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(552, 238, "Judge-facing wording")
        c.setFillColor(INK)
        c.setFont("Helvetica", 8.4)
        note = "FHIR IPS is the interoperable artifact; PDFs are human-readable renderings."
        t = c.beginText(552, 218)
        t.setLeading(14)
        for line in wrap(note, 34):
            t.textLine(line)
        c.drawText(t)
        c.showPage()
    c.save()


def build_markdown_pdf(source: Path, dest: Path, title: str) -> None:
    styles = getSampleStyleSheet()
    story = []
    doc = SimpleDocTemplate(str(dest), pagesize=A4, rightMargin=45, leftMargin=45, topMargin=50, bottomMargin=45)
    story.append(Paragraph(title, styles["Title"]))
    story.append(Spacer(1, 0.18 * inch))
    for raw in source.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line:
            story.append(Spacer(1, 0.08 * inch))
        elif line.startswith("#"):
            story.append(Paragraph(line.lstrip("# ").strip(), styles["Heading2"]))
        elif line.startswith("- "):
            story.append(Paragraph(f"&bull; {line[2:]}", styles["BodyText"]))
        elif line.startswith(">"):
            story.append(Paragraph(f"<i>{line.lstrip('> ').strip()}</i>", styles["BodyText"]))
        elif line.startswith("```"):
            continue
        else:
            story.append(Paragraph(line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), styles["BodyText"]))
    doc.build(story)


def main() -> None:
    SUBMISSION.mkdir(exist_ok=True)
    build_architecture_pdf()
    build_pitch_deck_pdf()
    build_markdown_pdf(SUBMISSION / "demo_script.md", SUBMISSION / "demo_script.pdf", "Demo Script")
    build_markdown_pdf(SUBMISSION / "final_technical_audit.md", SUBMISSION / "final_technical_audit.pdf", "Final Technical Audit")


if __name__ == "__main__":
    main()
