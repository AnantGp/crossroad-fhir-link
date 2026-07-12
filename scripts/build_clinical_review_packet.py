#!/usr/bin/env python3
"""Build an unsigned independent clinical review packet from route evidence."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = ROOT / "submission" / "downloads"
ROUTE_FILES = (
    DOWNLOADS / "usa-to-india-evidence-pack.json",
    DOWNLOADS / "india-to-usa-evidence-pack.json",
    DOWNLOADS / "australia-to-europe-evidence-pack.json",
    DOWNLOADS / "europe-to-usa-evidence-pack.json",
)


def _primary_code(codes: Dict[str, Any]) -> str:
    ordered = (
        ("SNOMED CT", codes.get("snomed_ct")),
        ("LOINC", codes.get("loinc")),
        ("RxNorm", codes.get("rxnorm")),
        ("ICD-10", codes.get("icd_10")),
    )
    return " | ".join(f"{system} {code}" for system, code in ordered if code)


def load_rows() -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    for evidence_path in ROUTE_FILES:
        evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
        route = evidence["route"]
        route_label = f"{route['source_country']} -> {route['target_country']}"
        for trace in evidence["semantic_trace"]:
            rows.append({
                "route": route_label,
                "source_phrase": trace["source_phrase"],
                "predicted_meaning": trace["normalized_concept"],
                "category": trace["category"],
                "standard_codes": _primary_code(trace["codes"]),
                "fhir_resource": trace["fhir_resource"],
                "mapping_evidence": trace["evidence_source"],
                "review_correct": "",
                "review_comment": "",
            })
    return rows


def write_csv(rows: Iterable[Dict[str, str]], out_path: Path) -> None:
    fieldnames = [
        "route",
        "source_phrase",
        "predicted_meaning",
        "category",
        "standard_codes",
        "fhir_resource",
        "mapping_evidence",
        "review_correct",
        "review_comment",
    ]
    with out_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _footer(canvas: Any, document: Any) -> None:
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(15 * mm, 8 * mm, "Cross-Border IPS AI Agent | Independent review packet | Synthetic data")
    canvas.drawRightString(282 * mm, 8 * mm, f"Page {document.page}")
    canvas.restoreState()


def write_pdf(rows: List[Dict[str, str]], out_path: Path) -> None:
    page_size = landscape(A4)
    document = SimpleDocTemplate(
        str(out_path),
        pagesize=page_size,
        rightMargin=12 * mm,
        leftMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=14 * mm,
        title="Independent Clinical and Terminology Review Packet",
        author="Cross-Border IPS AI Agent team",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="PacketTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0F766E"),
        alignment=TA_LEFT,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="PacketHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#16313A"),
        spaceBefore=4,
        spaceAfter=5,
    ))
    styles.add(ParagraphStyle(
        name="PacketBody",
        parent=styles["BodyText"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
        spaceAfter=4,
    ))
    cell = ParagraphStyle(
        "PacketCell",
        parent=styles["BodyText"],
        fontSize=7.2,
        leading=9,
        textColor=colors.HexColor("#1E293B"),
    )
    cell_center = ParagraphStyle(
        "PacketCellCenter",
        parent=cell,
        alignment=TA_CENTER,
    )
    story: List[Any] = []
    story.append(Paragraph("Independent Clinical and Terminology Review Packet", styles["PacketTitle"]))
    story.append(Paragraph(
        "<b>Status: PENDING INDEPENDENT REVIEW.</b> This packet is not an endorsement until a qualified reviewer completes and signs it.",
        styles["PacketBody"],
    ))
    story.append(Spacer(1, 2 * mm))
    scope_data = [
        [Paragraph("Review objective", cell), Paragraph("Determine whether each synthetic source phrase was interpreted correctly, assigned an appropriate standard code, and placed in the appropriate FHIR resource.", cell)],
        [Paragraph("Case study", cell), Paragraph("Four synthetic Type 2 diabetes exchanges: USA to India, India to USA, Australia to Europe, and Europe to USA.", cell)],
        [Paragraph("Not in scope", cell), Paragraph("Production certification, treatment recommendations, privacy certification, and validation on real patients.", cell)],
        [Paragraph("Reviewer action", cell), Paragraph("Mark each row Correct, Incorrect, or Needs clarification; add a correction when needed; then complete the attestation page.", cell)],
    ]
    scope_table = Table(scope_data, colWidths=[38 * mm, 220 * mm])
    scope_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E6F4F1")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(scope_table)
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Five questions for every row", styles["PacketHeading"]))
    story.append(Paragraph(
        "1. Does the source phrase support the predicted clinical meaning? &nbsp;&nbsp; "
        "2. Is the terminology code appropriate? &nbsp;&nbsp; "
        "3. Are values and units preserved? &nbsp;&nbsp; "
        "4. Is the FHIR resource type appropriate? &nbsp;&nbsp; "
        "5. Would ambiguity require human review?",
        styles["PacketBody"],
    ))
    story.append(PageBreak())

    for route_index, route in enumerate(dict.fromkeys(row["route"] for row in rows)):
        route_rows = [row for row in rows if row["route"] == route]
        story.append(Paragraph(f"Route review: {route}", styles["PacketHeading"]))
        story.append(Paragraph(
            "The source report and receiver rendering are synthetic. Review the semantic chain; do not infer that a valid code alone proves the source phrase was mapped correctly.",
            styles["PacketBody"],
        ))
        table_data = [[
            Paragraph("Source phrase", cell_center),
            Paragraph("Predicted meaning", cell_center),
            Paragraph("Standard code(s)", cell_center),
            Paragraph("FHIR", cell_center),
            Paragraph("Correct?", cell_center),
            Paragraph("Correction / comment", cell_center),
        ]]
        for row in route_rows:
            table_data.append([
                Paragraph(row["source_phrase"], cell),
                Paragraph(row["predicted_meaning"], cell),
                Paragraph(row["standard_codes"], cell),
                Paragraph(row["fhir_resource"], cell),
                Paragraph("[ ] Yes<br/>[ ] No<br/>[ ] Clarify", cell),
                Paragraph("", cell),
            ])
        table = Table(
            table_data,
            colWidths=[42 * mm, 58 * mm, 52 * mm, 30 * mm, 27 * mm, 49 * mm],
            repeatRows=1,
            rowHeights=[9 * mm] + [22 * mm] * len(route_rows),
        )
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F766E")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#94A3B8")),
            ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 1), (-1, -1), 5),
        ]))
        story.append(table)
        if route_index < 3:
            story.append(PageBreak())

    story.append(PageBreak())
    story.append(Paragraph("Independent reviewer attestation", styles["PacketTitle"]))
    attestation = [
        ["Reviewer name", ""],
        ["Clinical / terminology credentials", ""],
        ["Organization", ""],
        ["Email or professional profile", ""],
        ["Conflicts of interest", ""],
        ["Rows reviewed", "____ / 24"],
        ["Rows accepted without correction", "____ / 24"],
        ["Overall verdict", "[ ] Appropriate for synthetic demonstration   [ ] Revise before use   [ ] Unable to conclude"],
        ["Signature and date", ""],
    ]
    attestation_table = Table(
        [[Paragraph(str(left), cell), Paragraph(str(right), cell)] for left, right in attestation],
        colWidths=[58 * mm, 200 * mm],
        rowHeights=[12 * mm, 16 * mm, 12 * mm, 12 * mm, 16 * mm, 10 * mm, 10 * mm, 18 * mm, 18 * mm],
    )
    attestation_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E6F4F1")),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#94A3B8")),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(attestation_table)
    story.append(Spacer(1, 5 * mm))
    story.append(KeepTogether([
        Paragraph("Required reviewer statement", styles["PacketHeading"]),
        Paragraph(
            "I reviewed the synthetic evidence identified above. My assessment applies only to the reviewed examples and does not constitute certification, regulatory approval, or validation for clinical deployment.",
            styles["PacketBody"],
        ),
    ]))
    document.build(story, onFirstPage=_footer, onLaterPages=_footer)


def main() -> None:
    rows = load_rows()
    if len(rows) != 24:
        raise RuntimeError(f"Expected 24 review rows, found {len(rows)}")
    csv_path = ROOT / "submission" / "clinical_review_checklist.csv"
    pdf_path = ROOT / "submission" / "clinical_review_packet.pdf"
    write_csv(rows, csv_path)
    write_pdf(rows, pdf_path)
    print(f"Wrote {csv_path} and {pdf_path} with {len(rows)} review rows")


if __name__ == "__main__":
    main()
