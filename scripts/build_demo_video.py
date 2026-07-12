#!/usr/bin/env python3
"""Build a local judge-facing demo video from submission screenshots.

The generated video is intentionally conservative: no stock footage, no
unsupported claims, and captions are burned into every slide.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import textwrap
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SUBMISSION = ROOT / "submission"
SCREENSHOTS = SUBMISSION / "screenshots"
BUILD_DIR = SUBMISSION / "generated_video"
FRAMES = BUILD_DIR / "frames"
AUDIO = BUILD_DIR / "audio"
CLIPS = BUILD_DIR / "clips"
OUT = SUBMISSION / "cross-border-ips-ai-agent-demo.mp4"
DEFAULT_SUBTITLE_SCRIPT = SUBMISSION / "elevenlabs_v3_tagged_script.txt"

WIDTH = 1920
HEIGHT = 1080

BG = "#f7faf9"
INK = "#17231f"
MUTED = "#62756e"
SOFT = "#e6efec"
CARD = "#ffffff"
BORDER = "#d6e1dd"
TEAL = "#0f766e"
TEAL_DARK = "#115e59"
BLUE = "#2563eb"
AMBER = "#b45309"
GREEN = "#15803d"
CODE_BG = "#12201d"


@dataclass(frozen=True)
class Slide:
    title: str
    eyebrow: str
    narration: str
    bullets: list[str]
    visual: str
    screenshot: str | None = None
    route: str | None = None


SLIDES = [
    Slide(
        eyebrow="Aim",
        title="Global Journey Of Patient Information",
        visual="screenshot",
        screenshot="usa-to-india-dashboard.png",
        route="USA -> India",
        bullets=[
            "Objective: convert a local diabetes report into a cross-border patient summary.",
            "PDF is the human-readable view.",
            "FHIR IPS Bundle is the machine-readable interoperability artifact.",
            "Four-country case study: USA, India, Australia, Europe.",
        ],
        narration=(
            "This demo is about the global journey of patient information. The objective is "
            "to turn a local diabetes report into a machine-readable, universally coded, "
            "cross-border patient summary. The PDF is only the human-readable view; the FHIR "
            "IPS Bundle is the interoperable artifact."
        ),
    ),
    Slide(
        eyebrow="Problem",
        title="Local Clinical Language Does Not Travel Cleanly",
        visual="mentions",
        bullets=[
            "A report may be readable to a human but unusable to another EHR.",
            "T2DM, sugar disease, madhumeha type 2, and DM2 can mean the same condition.",
            "Receiver systems need standard codes.",
            "Receiver systems also need predictable HL7 FHIR structure.",
        ],
        narration=(
            "The problem is semantic and technical at the same time. A doctor may write T2DM, "
            "sugar disease, madhumeha type 2, or DM2. Humans can guess the meaning, but a "
            "receiver EHR needs standard codes and a predictable HL7 FHIR structure."
        ),
    ),
    Slide(
        eyebrow="Objective",
        title="One Local Report To One Cross-Border Summary",
        visual="screenshot",
        screenshot="usa-to-india-dashboard.png",
        route="USA -> India",
        bullets=[
            "Input: local doctor report or EHR-like note.",
            "Output: universally coded patient summary.",
            "PDF remains a readable rendering.",
            "FHIR IPS remains the system-to-system artifact.",
        ],
        narration=(
            "Our objective is to convert a local diabetes report into a machine-readable, "
            "universally coded, cross-border patient summary. The PDF is only the human-readable "
            "view. The real interoperable artifact is the FHIR IPS-style document Bundle."
        ),
    ),
    Slide(
        eyebrow="Solution",
        title="Report To FHIR IPS In One Pipeline",
        visual="pipeline",
        bullets=[
            "Structured EHR input can be used directly.",
            "Free text uses prototype clinical fact extraction.",
            "Known phrases resolve through the local registry.",
            "Unknown local phrases go to the federated terminology linker.",
        ],
        narration=(
            "Our solution follows a clear pipeline. We take a doctor report or EHR-like note. "
            "If the input is already structured, we can use it directly. If it is free text, "
            "the prototype extracts clinical facts first. Then we map local clinical phrases "
            "to standard medical concepts. Known phrases are resolved through a local "
            "terminology registry. Unknown local phrases go to a federated terminology linker."
        ),
    ),
    Slide(
        eyebrow="Proof 1: Data-Local Learning",
        title="FedAvg Learns Local Terms Without Centralizing Reports",
        visual="federated",
        bullets=[
            "Each country trains locally on its own terminology examples.",
            "Coordinator receives model tensors and sample counts only.",
            "Raw reports, identifiers, labels, aliases, and patient Bundles stay local.",
            "FedAvg is not cryptography and not formal de-identification.",
        ],
        narration=(
            "Federated learning is used for data locality and scale. Each country can train on "
            "its local phrase examples without sending raw reports, identifiers, labels, aliases, "
            "or patient Bundles to a central server. The coordinator receives model tensors and "
            "sample counts only. This is not cryptography and not formal de-identification."
        ),
    ),
    Slide(
        eyebrow="Proof 2: FHIR-Native Linker",
        title="FHIR Terminology Makes AI Mappings Auditable",
        visual="terminology",
        bullets=[
            "Local term is represented in a local CodeSystem.",
            "Allowed targets are constrained through a ValueSet.",
            "Accepted local mapping is published as a FHIR ConceptMap.",
            "tx.fhir.org checks representative targets with $lookup and $validate-code.",
        ],
        narration=(
            "The global linker is FHIR native. A local phrase is represented in a local CodeSystem, "
            "allowed targets are constrained by a ValueSet, and the mapping is published as a "
            "FHIR ConceptMap. Translate, lookup, and validate-code operations make the mapping "
            "auditable instead of being a hidden AI guess."
        ),
    ),
    Slide(
        eyebrow="Proof 3: Universal Coding",
        title="Local Words Become Accepted Healthcare Codes",
        visual="trace",
        bullets=[
            "Conditions use SNOMED CT and ICD-10.",
            "Lab observations use LOINC.",
            "Medications use RxNorm.",
            "Coded facts are placed into the correct FHIR resources.",
        ],
        narration=(
            "Universal coding is the bridge from local language to computable healthcare data. "
            "Conditions use SNOMED CT and ICD-10, lab results use LOINC, medications use RxNorm, "
            "and those coded facts are placed into the correct FHIR resources."
        ),
    ),
    Slide(
        eyebrow="Proof 4: IPS Builder",
        title="FHIR IPS Packages The Coded Patient Summary",
        visual="screenshot",
        screenshot="usa-to-india-fhir-bundle.png",
        route="USA -> India",
        bullets=[
            "Bundle.type = document.",
            "Composition is the first entry.",
            "Resources include Patient, Condition, Observation, MedicationStatement, and Organization.",
            "The Bundle is the machine-readable exchange artifact.",
        ],
        narration=(
            "After coding, the FHIR IPS Builder packages the patient summary into an IPS-style "
            "FHIR R4 document Bundle. The Bundle has type document, Composition as the first "
            "entry, and coded resources such as Patient, Condition, Observation, MedicationStatement, "
            "and Organization."
        ),
    ),
    Slide(
        eyebrow="Proof 5: Cross-Border Sharing",
        title="The Same FHIR IPS Supports Different Receivers",
        visual="screenshot",
        screenshot="australia-to-europe-fhir-bundle.png",
        route="Australia -> Europe",
        bullets=[
            "FHIR IPS is the shared machine-readable source of truth.",
            "Country PDFs are receiver-friendly renderings, not the interoperability layer.",
            "Readiness checks are shown for US Core, ABDM, AU Core, and European Patient Summary.",
            "No national profile certification is claimed.",
        ],
        narration=(
            "The cross-border part comes from FHIR IPS. The same machine-readable Bundle can be "
            "sent to another ecosystem, while the target PDF is only a human-readable rendering. "
            "The app also shows receiver readiness gaps for US Core, ABDM, AU Core, and the "
            "European Patient Summary, without claiming national certification."
        ),
    ),
    Slide(
        eyebrow="Evidence",
        title="Evidence Shown In The Demo",
        visual="screenshot",
        screenshot="external-terminology-validation.png",
        route="External FHIR terminology snapshot",
        bullets=[
            "Five seeds: 48/48 federated versus 47/48 local-only transfer.",
            "192/192 globally unseen synthetic examples at every seed.",
            "All 4 Bundles pass IPS 2.0.1: 0 errors, 0 warnings.",
            "External FHIR terminology snapshot: 4/4 lookup + validate-code.",
        ],
        narration=(
            "The evidence is intentionally visible. The demo has 20 synthetic reports across four "
            "sites, 768 terminology training mentions, 192 globally unseen examples, 48 out of 48 "
            "cross-site transfer mappings correct in the synthetic validation set, and official "
            "official IPS 2.0.1 validation showing zero errors and zero warnings for all four current Bundles."
        ),
    ),
    Slide(
        eyebrow="Benefit",
        title="What Changes For Patient, Hospital, And Auditor",
        visual="closing",
        bullets=[
            "Patient journey: summary can be understood across borders.",
            "Hospital journey: receiver gets codes and FHIR resources, not ambiguous text.",
            "Privacy posture: local data stays local during terminology learning.",
            "Audit journey: source phrase -> concept -> code -> FHIR resource remains traceable.",
        ],
        narration=(
            "The benefit is practical. A patient summary can be understood across borders. A "
            "hospital receives coded FHIR resources instead of ambiguous text. Local data stays "
            "local during terminology learning. And an auditor can follow the trace from source "
            "phrase, to concept, to standard code, to FHIR resource."
        ),
    ),
    Slide(
        eyebrow="Closing / Limitations",
        title="Honest prototype, clear production path",
        visual="limits",
        bullets=[
            "Synthetic data only; independent clinical review is pending.",
            "Rule-backed extraction; pretrained clinical NER is future work.",
            "Local ConceptMap translation is simulated; external code checks are representative only.",
            "Production privacy needs DP-SGD, secure aggregation, sample thresholds, and auditing.",
        ],
        narration=(
            "The closing claim is precise. This is an honest synthetic prototype, not certified "
            "production software. But the architecture is standards based: federated learning "
            "aligns local terminology, FHIR terminology artifacts make mappings auditable, and "
            "FHIR IPS packages the result for cross-border exchange."
        ),
    ),
]


def require_binary(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise SystemExit(f"Missing required binary: {name}")
    return path


def font(size: int, bold: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    candidates = []
    if mono:
        candidates = [
            "/System/Library/Fonts/SFNSMono.ttf",
            "/System/Library/Fonts/Supplemental/Menlo.ttc",
            "/System/Library/Fonts/Monaco.ttf",
        ]
    elif bold:
        candidates = [
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
        ]
    else:
        candidates = [
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


FONT_EYEBROW = font(30, bold=True)
FONT_TITLE = font(58, bold=True)
FONT_H2 = font(34, bold=True)
FONT_BODY = font(31)
FONT_BODY_BOLD = font(31, bold=True)
FONT_SMALL = font(24)
FONT_SMALL_BOLD = font(24, bold=True)
FONT_CODE = font(26, mono=True)


def rounded(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], fill: str, outline: str = BORDER, radius: int = 24, width: int = 2) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def fitted_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, start: int = 58, minimum: int = 40) -> ImageFont.FreeTypeFont:
    for size in range(start, minimum - 1, -2):
        candidate = font(size, bold=True)
        if text_size(draw, text, candidate)[0] <= max_width:
            return candidate
    return font(minimum, bold=True)


def wrap_text(text: str, fnt: ImageFont.FreeTypeFont, max_width: int, draw: ImageDraw.ImageDraw) -> list[str]:
    lines = []
    for para in text.split("\n"):
        if not para:
            lines.append("")
            continue
        words = para.split()
        line = ""
        for word in words:
            test = f"{line} {word}".strip()
            if text_size(draw, test, fnt)[0] <= max_width:
                line = test
            else:
                if line:
                    lines.append(line)
                line = word
        if line:
            lines.append(line)
    return lines


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int],
    fnt: ImageFont.FreeTypeFont,
    fill: str,
    max_width: int,
    line_gap: int = 10,
) -> int:
    x, y = xy
    for line in wrap_text(text, fnt, max_width, draw):
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + line_gap
    return y


def draw_pill(draw: ImageDraw.ImageDraw, text: str, x: int, y: int, fill: str, text_fill: str, outline: str | None = None) -> int:
    tw, th = text_size(draw, text, FONT_SMALL_BOLD)
    pad_x = 22
    pad_y = 10
    box = (x, y, x + tw + pad_x * 2, y + th + pad_y * 2)
    draw.rounded_rectangle(box, radius=22, fill=fill, outline=outline or fill, width=2)
    draw.text((x + pad_x, y + pad_y - 2), text, font=FONT_SMALL_BOLD, fill=text_fill)
    return box[2]


def paste_screenshot(canvas: Image.Image, screenshot: str, box: tuple[int, int, int, int]) -> None:
    src = Image.open(SCREENSHOTS / screenshot).convert("RGB")
    x1, y1, x2, y2 = box
    target_w = x2 - x1
    target_h = y2 - y1
    # Crop long screenshots toward the top where the dashboard context lives.
    ratio = target_w / target_h
    sw, sh = src.size
    crop_h = min(sh, int(sw / ratio))
    crop = src.crop((0, 0, sw, crop_h))
    crop = ImageOps.contain(crop, (target_w, target_h), Image.Resampling.LANCZOS)
    bg = Image.new("RGB", (target_w, target_h), "#f8fbfa")
    bg.paste(crop, ((target_w - crop.width) // 2, (target_h - crop.height) // 2))
    canvas.paste(bg, (x1, y1))


def draw_header(draw: ImageDraw.ImageDraw, slide: Slide, index: int) -> None:
    draw.text((82, 58), slide.eyebrow.upper(), font=FONT_EYEBROW, fill=TEAL_DARK)
    title_font = fitted_font(draw, slide.title, 1360)
    draw.text((82, 98), slide.title, font=title_font, fill=INK)
    draw_pill(draw, f"{index + 1:02d}/{len(SLIDES):02d}", 1660, 68, "#e6f4f1", TEAL_DARK, "#cce6df")
    draw_pill(draw, "Synthetic demo data", 1510, 125, "#eaf2ff", BLUE, "#d5e4ff")
    draw.line((82, 178, 1838, 178), fill=BORDER, width=2)


def draw_bullet_panel(draw: ImageDraw.ImageDraw, bullets: list[str]) -> None:
    rounded(draw, (82, 235, 710, 925), CARD)
    draw.text((124, 278), "What judges should notice", font=FONT_H2, fill=INK)
    y = 345
    for bullet in bullets:
        draw.ellipse((126, y + 9, 144, y + 27), fill=TEAL)
        y = draw_wrapped(draw, bullet, (164, y), FONT_BODY, INK, 485, 11) + 22
    draw_pill(draw, "No production certification claimed", 122, 850, "#fff7ed", AMBER, "#fed7aa")


def draw_screenshot_visual(canvas: Image.Image, draw: ImageDraw.ImageDraw, slide: Slide) -> None:
    rounded(draw, (750, 235, 1838, 925), CARD)
    if slide.route:
        draw_pill(draw, slide.route, 792, 270, "#e6f4f1", TEAL_DARK, "#cce6df")
    paste_screenshot(canvas, slide.screenshot or "usa-to-india-dashboard.png", (792, 325, 1796, 882))
    draw.rounded_rectangle((792, 325, 1796, 882), radius=16, outline=BORDER, width=2)


def draw_pipeline_visual(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (750, 235, 1838, 925), CARD)
    steps = [
        ("Report", "local note or EHR"),
        ("Facts", "clinical JSON"),
        ("Terminology", "codes + meanings"),
        ("FHIR IPS", "document Bundle"),
        ("Readiness", "target gaps"),
    ]
    x = 810
    y = 440
    for i, (label, note) in enumerate(steps):
        rounded(draw, (x, y, x + 178, y + 130), "#eef8f5", "#cce6df", 18)
        draw.text((x + 24, y + 30), label, font=FONT_SMALL_BOLD, fill=TEAL_DARK)
        draw_wrapped(draw, note, (x + 24, y + 66), FONT_SMALL, MUTED, 130, 6)
        if i < len(steps) - 1:
            draw.line((x + 178, y + 65, x + 222, y + 65), fill=TEAL, width=5)
            draw.polygon([(x + 222, y + 65), (x + 207, y + 55), (x + 207, y + 75)], fill=TEAL)
        x += 230
    draw_wrapped(
        draw,
        "The model is not the exchange format. HL7/FHIR is the exchange format; the AI layer resolves local semantic variation before packaging.",
        (815, 650),
        FONT_BODY,
        INK,
        940,
        10,
    )


def draw_trace_visual(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (750, 235, 1838, 925), CARD)
    headers = ["Source", "Canonical concept", "Standard code", "FHIR resource"]
    xs = [790, 1030, 1320, 1610]
    y = 285
    for x, h in zip(xs, headers):
        draw.text((x, y), h.upper(), font=FONT_SMALL_BOLD, fill=MUTED)
    rows = [
        ("T2DM", "Type 2 diabetes mellitus", "SNOMED 44054006\nICD-10 E11", "Condition"),
        ("A1c", "HbA1c", "LOINC 4548-4", "Observation"),
        ("metformin", "metformin", "RxNorm 6809", "MedicationStatement"),
    ]
    y = 340
    for row in rows:
        draw.line((790, y - 22, 1790, y - 22), fill=SOFT, width=2)
        for x, cell in zip(xs, row):
            draw_wrapped(draw, cell, (x, y), FONT_SMALL_BOLD if x == xs[0] else FONT_SMALL, INK, 230, 8)
        y += 145
    draw_pill(draw, "Traceability: source text -> fact -> code -> resource", 790, 800, "#e6f4f1", TEAL_DARK, "#cce6df")


def draw_terminology_visual(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (750, 235, 1838, 925), CARD)
    boxes = [
        ("Local CodeSystem", "site-specific terms"),
        ("ValueSet", "allowed target concepts"),
        ("ConceptMap", "local term -> standard code"),
        ("$translate", "resolve mapping"),
        ("$lookup", "explain code"),
        ("$validate-code", "accept or review"),
    ]
    positions = [(805, 290), (1155, 290), (1505, 290), (805, 570), (1155, 570), (1505, 570)]
    for (title, desc), (x, y) in zip(boxes, positions):
        rounded(draw, (x, y, x + 285, y + 155), "#f8fbfa", BORDER, 18)
        draw.text((x + 24, y + 30), title, font=FONT_SMALL_BOLD, fill=INK)
        draw_wrapped(draw, desc, (x + 24, y + 72), FONT_SMALL, MUTED, 225, 8)
    draw.line((1090, 368, 1155, 368), fill=TEAL, width=4)
    draw.line((1440, 368, 1505, 368), fill=TEAL, width=4)
    draw.line((950, 445, 950, 570), fill=TEAL, width=4)
    draw.line((1300, 445, 1300, 570), fill=TEAL, width=4)
    draw.line((1650, 445, 1650, 570), fill=TEAL, width=4)
    draw_pill(draw, "HL7-native global linker", 805, 790, "#e6f4f1", TEAL_DARK, "#cce6df")


def draw_mentions_visual(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (750, 235, 1838, 925), CARD)
    draw.text((805, 285), "Canonical concept", font=FONT_SMALL_BOLD, fill=MUTED)
    draw.text((805, 325), "Type 2 diabetes mellitus", font=FONT_H2, fill=INK)
    draw_pill(draw, "SNOMED CT 44054006", 805, 380, "#e6f4f1", TEAL_DARK, "#cce6df")
    draw_pill(draw, "ICD-10 E11", 1115, 380, "#eaf2ff", BLUE, "#d5e4ff")
    draw_pill(draw, "FHIR Condition", 1295, 380, "#f0fdf4", GREEN, "#bbf7d0")

    rows = [
        ("USA", "T2DM, type 2 diabetes, adult-onset diabetes"),
        ("India", "sugar disease, madhumeha type 2, known case of diabetes"),
        ("Australia", "type 2 DM, T2 diabetes, diabetic type two"),
        ("Europe", "diabetes mellitus type II, DM2, type II diabetes"),
    ]
    y = 485
    for country, mentions in rows:
        rounded(draw, (805, y, 1785, y + 78), "#f8fbfa", BORDER, 16)
        draw.text((835, y + 24), country, font=FONT_SMALL_BOLD, fill=TEAL_DARK)
        draw_wrapped(draw, mentions, (1030, y + 23), FONT_SMALL, INK, 690, 6)
        y += 96

    draw.line((1294, 430, 1294, 485), fill=TEAL, width=4)
    draw.polygon([(1294, 485), (1282, 468), (1306, 468)], fill=TEAL)
    draw_pill(draw, "Local phrases -> canonical concept -> universal code", 805, 835, "#e6f4f1", TEAL_DARK, "#cce6df")


def draw_federated_visual(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (750, 235, 1838, 925), CARD)
    center = (1294, 568)
    sites = [("USA", 880, 330), ("IND", 1540, 330), ("AUS", 880, 720), ("EUR", 1540, 720)]
    for name, x, y in sites:
        rounded(draw, (x - 95, y - 55, x + 95, y + 55), "#eef8f5", "#cce6df", 22)
        draw.text((x - 38, y - 18), name, font=FONT_H2, fill=TEAL_DARK)
        draw.line((x, y + (55 if y < center[1] else -55), center[0], center[1]), fill="#9ab7ae", width=4)
    draw.ellipse((center[0] - 135, center[1] - 135, center[0] + 135, center[1] + 135), fill=CODE_BG, outline="#23423b", width=4)
    draw.text((center[0] - 67, center[1] - 36), "FedAvg", font=FONT_H2, fill="#d9fff5")
    draw.text((center[0] - 99, center[1] + 12), "tensors + counts", font=FONT_SMALL, fill="#a7cfc4")
    draw_pill(draw, "No raw reports", 810, 830, "#dcfce7", GREEN, "#bbf7d0")
    draw_pill(draw, "No labels or aliases", 1040, 830, "#dcfce7", GREEN, "#bbf7d0")
    draw_pill(draw, "No patient Bundles", 1310, 830, "#dcfce7", GREEN, "#bbf7d0")
    draw_pill(draw, "Not cryptography", 1575, 830, "#fff7ed", AMBER, "#fed7aa")


def draw_limits_visual(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (750, 235, 1838, 925), CARD)
    items = [
        ("Synthetic data", "No real patient records are used."),
        ("Prototype extractor", "Rule-backed today; clinical NER is future work."),
        ("Readiness checks", "No national certification is claimed."),
        ("Privacy", "FedAvg needs DP-SGD and secure aggregation for stronger guarantees."),
    ]
    y = 300
    for title, desc in items:
        rounded(draw, (810, y, 1778, y + 120), "#f8fbfa", BORDER, 18)
        draw.text((850, y + 28), title, font=FONT_BODY_BOLD, fill=INK)
        draw_wrapped(draw, desc, (850, y + 68), FONT_SMALL, MUTED, 840, 8)
        y += 145


def draw_closing_visual(draw: ImageDraw.ImageDraw) -> None:
    rounded(draw, (750, 235, 1838, 925), CODE_BG, "#23423b")
    draw.text((815, 305), "Final claim", font=FONT_H2, fill="#d9fff5")
    statement = (
        "A federated, FHIR-native terminology alignment layer that converts local diabetes "
        "reports into validated IPS-style FHIR R4 document Bundles for cross-border exchange."
    )
    draw_wrapped(draw, statement, (815, 370), font(44, bold=True), "#ffffff", 910, 14)
    y = 635
    for text in ["Semantic interoperability: local phrase -> canonical concept -> standard code", "Data interoperability: standard code -> FHIR resource -> IPS Bundle", "Human readability: target-country PDF generated from the Bundle"]:
        draw.ellipse((842, y + 14, 860, y + 32), fill="#86efac")
        draw_wrapped(draw, text, (885, y + 2), FONT_BODY, "#e6fff8", 845, 9)
        y += 80


def render_slide(slide: Slide, index: int) -> Path:
    canvas = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(canvas)
    draw_header(draw, slide, index)
    draw_bullet_panel(draw, slide.bullets)
    if slide.visual == "screenshot":
        draw_screenshot_visual(canvas, draw, slide)
    elif slide.visual == "pipeline":
        draw_pipeline_visual(draw)
    elif slide.visual == "trace":
        draw_trace_visual(draw)
    elif slide.visual == "terminology":
        draw_terminology_visual(draw)
    elif slide.visual == "mentions":
        draw_mentions_visual(draw)
    elif slide.visual == "federated":
        draw_federated_visual(draw)
    elif slide.visual == "limits":
        draw_limits_visual(draw)
    elif slide.visual == "closing":
        draw_closing_visual(draw)
    else:
        raise ValueError(f"Unknown visual type: {slide.visual}")

    draw.text((82, 1008), "Cross-Border IPS AI Agent · HL7 AI Challenge · synthetic evidence · no live patient data", font=FONT_SMALL, fill=MUTED)
    frame_path = FRAMES / f"slide_{index + 1:02d}.png"
    canvas.save(frame_path, "PNG")
    return frame_path


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, cwd=ROOT)


def ffprobe_duration(path: Path) -> float:
    output = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ],
        text=True,
    )
    return float(json.loads(output)["format"]["duration"])


def say_audio(slide: Slide, index: int, rate: int) -> Path:
    audio_path = AUDIO / f"slide_{index + 1:02d}.aiff"
    run(["say", "-v", "Samantha", "-r", str(rate), "-o", str(audio_path), slide.narration])
    return audio_path


def make_clip(frame: Path, audio: Path, index: int) -> Path:
    clip_path = CLIPS / f"clip_{index + 1:02d}.mp4"
    duration = ffprobe_duration(audio) + 0.4
    run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-loop",
            "1",
            "-i",
            str(frame),
            "-i",
            str(audio),
            "-t",
            f"{duration:.3f}",
            "-r",
            "30",
            "-vf",
            "format=yuv420p",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-shortest",
            str(clip_path),
        ]
    )
    return clip_path


def slide_voiceover_durations(total_duration: float, narrations: list[str] | None = None) -> list[float]:
    """Allocate one continuous voiceover across slides using narration length."""
    narration_source = narrations or [slide.narration for slide in SLIDES]
    weights = [max(1, len(narration.split())) for narration in narration_source]
    target_duration = total_duration + 0.6
    total_weight = sum(weights)
    return [target_duration * weight / total_weight for weight in weights]


def strip_voice_tags(text: str) -> str:
    return re.sub(r"\[[^\]]+\]\s*", "", text).strip()


def load_subtitle_script(path: Path) -> list[str] | None:
    if not path.exists():
        return None
    blocks = [strip_voice_tags(block) for block in re.split(r"\n\s*\n", path.read_text(encoding="utf-8"))]
    blocks = [block for block in blocks if block]
    if len(blocks) != len(SLIDES):
        print(f"Subtitle script ignored: expected {len(SLIDES)} blocks, found {len(blocks)}")
        return None
    return blocks


def subtitle_reading_text(text: str) -> str:
    replacements = {
        "T two D M": "T2DM",
        "D M 2": "DM2",
        "H L 7 F H I R": "HL7 FHIR",
        "F H I R I P S": "FHIR IPS",
        "F H I R R4": "FHIR R4",
        "F H I R": "FHIR",
        "I P S": "IPS",
        "SNOMED C T": "SNOMED CT",
        "I C D 10": "ICD-10",
        "A B D M": "ABDM",
        "A I": "AI",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return text


def split_sentences(text: str) -> list[str]:
    text = subtitle_reading_text(text)
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [part.strip() for part in parts if part.strip()]


def chunk_sentence(sentence: str, max_words: int = 11) -> list[str]:
    words = sentence.split()
    if len(words) <= max_words:
        return [sentence]
    chunks = []
    for i in range(0, len(words), max_words):
        chunks.append(" ".join(words[i : i + max_words]))
    return chunks


def wrap_subtitle(text: str, max_chars: int = 56) -> str:
    lines = textwrap.wrap(text, width=max_chars, break_long_words=False, break_on_hyphens=False)
    if len(lines) <= 2:
        return r"\N".join(lines)
    # Keep subtitle blocks compact; long sentences have already been chunked.
    return r"\N".join([" ".join(lines[:-1]), lines[-1]])


def ass_timestamp(seconds: float) -> str:
    seconds = max(0, seconds)
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds - int(seconds)) * 100))
    if cs == 100:
        s += 1
        cs = 0
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def ass_escape(text: str) -> str:
    return text.replace("{", "(").replace("}", ")")


def write_ass_subtitles(path: Path, narrations: list[str], durations: list[float]) -> None:
    """Create readable burned-in subtitles aligned to each visual scene."""
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default, Arial, 32, &H00FFFFFF, &H00FFFFFF, &H00202020, &HC0000000, 0, 0, 0, 0, 100, 100, 0, 0, 3, 1.5, 0, 2, 180, 180, 82, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events: list[str] = []
    slide_start = 0.0
    for narration, duration in zip(narrations, durations):
        sentences = split_sentences(narration)
        chunks = [chunk for sentence in sentences for chunk in chunk_sentence(sentence)]
        weights = [max(1, len(chunk.split())) for chunk in chunks]
        total_weight = sum(weights) or 1
        cursor = slide_start + 0.15
        usable_duration = max(0.5, duration - 0.30)
        for i, (chunk, weight) in enumerate(zip(chunks, weights)):
            chunk_duration = usable_duration * weight / total_weight
            end = slide_start + duration - 0.15 if i == len(chunks) - 1 else cursor + chunk_duration
            events.append(
                "Dialogue: 0,"
                f"{ass_timestamp(cursor)},{ass_timestamp(end)},Default,,0,0,0,,"
                f"{ass_escape(wrap_subtitle(chunk))}"
            )
            cursor = end
        slide_start += duration
    path.write_text(header + "\n".join(events) + "\n", encoding="utf-8")


def ffmpeg_filter_escape(path: Path) -> str:
    return str(path).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'").replace(",", "\\,").replace(" ", "\\ ")


def make_silent_clip(frame: Path, duration: float, index: int) -> Path:
    clip_path = CLIPS / f"clip_{index + 1:02d}.mp4"
    run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-loop",
            "1",
            "-i",
            str(frame),
            "-t",
            f"{duration:.3f}",
            "-r",
            "30",
            "-vf",
            "format=yuv420p",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-an",
            str(clip_path),
        ]
    )
    return clip_path


def concat(clips: list[Path], out: Path) -> None:
    concat_file = BUILD_DIR / "clips.txt"
    concat_file.write_text("".join(f"file '{clip.resolve()}'\n" for clip in clips), encoding="utf-8")
    run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_file),
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
            "-movflags",
            "+faststart",
            str(out),
        ]
    )


def concat_video_only(clips: list[Path], out: Path) -> None:
    concat_file = BUILD_DIR / "clips.txt"
    concat_file.write_text("".join(f"file '{clip.resolve()}'\n" for clip in clips), encoding="utf-8")
    run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_file),
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(out),
        ]
    )


def mux_voiceover(video: Path, voiceover: Path, out: Path, subtitles: Path | None = None) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(video),
        "-i",
        str(voiceover),
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
    ]
    if subtitles:
        rel_subtitles = subtitles.relative_to(ROOT)
        cmd.extend(["-vf", f"ass={ffmpeg_filter_escape(rel_subtitles)}", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20"])
    else:
        cmd.extend(["-c:v", "copy"])
    cmd.extend(
        [
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            "-movflags",
            "+faststart",
            str(out),
        ]
    )
    run(cmd)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rate", type=int, default=170, help="macOS say speech rate")
    parser.add_argument("--output", type=Path, default=OUT)
    parser.add_argument("--voiceover", type=Path, help="External narration MP3/WAV to use instead of macOS say")
    parser.add_argument("--subtitle-script", type=Path, default=DEFAULT_SUBTITLE_SCRIPT, help="Paragraph-aligned narration script for subtitles")
    parser.add_argument("--no-subtitles", action="store_true", help="Do not burn subtitles into the voiceover video")
    args = parser.parse_args()

    require_binary("ffmpeg")
    require_binary("ffprobe")
    if not args.voiceover:
        require_binary("say")
    elif not args.voiceover.exists():
        raise SystemExit(f"Voiceover file not found: {args.voiceover}")

    for directory in [FRAMES, AUDIO, CLIPS]:
        directory.mkdir(parents=True, exist_ok=True)
        for child in directory.glob("*"):
            child.unlink()

    frames = [render_slide(slide, i) for i, slide in enumerate(SLIDES)]
    if args.voiceover:
        voiceover_duration = ffprobe_duration(args.voiceover)
        narrations = load_subtitle_script(args.subtitle_script) or [slide.narration for slide in SLIDES]
        durations = slide_voiceover_durations(voiceover_duration, narrations)
        clips = [make_silent_clip(frame, duration, i) for i, (frame, duration) in enumerate(zip(frames, durations))]
        temp_video = BUILD_DIR / "voiceover_video_only.mp4"
        concat_video_only(clips, temp_video)
        subtitles = None
        if not args.no_subtitles:
            subtitles = BUILD_DIR / "subtitles.ass"
            write_ass_subtitles(subtitles, narrations, durations)
        mux_voiceover(temp_video, args.voiceover, args.output, subtitles)
    else:
        audios = [say_audio(slide, i, args.rate) for i, slide in enumerate(SLIDES)]
        clips = [make_clip(frame, audio, i) for i, (frame, audio) in enumerate(zip(frames, audios))]
        concat(clips, args.output)
    duration = ffprobe_duration(args.output)
    print(f"Created {args.output}")
    print(f"Duration: {duration:.1f} seconds")


if __name__ == "__main__":
    main()
