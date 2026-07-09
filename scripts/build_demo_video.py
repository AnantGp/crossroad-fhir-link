#!/usr/bin/env python3
"""Build a local judge-facing demo video from submission screenshots.

The generated video is intentionally conservative: no stock footage, no
unsupported claims, and captions are burned into every slide.
"""

from __future__ import annotations

import argparse
import json
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
        eyebrow="HL7 AI Challenge Demo",
        title="Cross-Border IPS AI Agent",
        visual="screenshot",
        screenshot="usa-to-india-dashboard.png",
        route="USA -> India",
        bullets=[
            "FHIR IPS is the interoperable artifact.",
            "PDFs are human-readable renderings.",
            "Case study: Type 2 diabetes across USA, India, Australia, and Europe.",
        ],
        narration=(
            "Hello, this is Cross-Border IPS AI Agent, a Type 2 diabetes interoperability "
            "case study for the HL7 AI Challenge. The core principle is simple: FHIR IPS "
            "is the interoperable artifact, while PDFs are human-readable renderings."
        ),
    ),
    Slide(
        eyebrow="Problem",
        title="Local clinical language blocks cross-border reuse",
        visual="pipeline",
        bullets=[
            "Doctor notes use local phrases, abbreviations, and report habits.",
            "A receiver EHR needs standard codes and predictable resources.",
            "HL7/FHIR gives the exchange language; AI helps align local terminology.",
        ],
        narration=(
            "The problem is that a doctor report written in one country may not be immediately "
            "understandable in another EHR ecosystem. Local phrases, abbreviations, and report "
            "formats differ. HL7 and FHIR give the exchange language, and AI helps align the "
            "local terminology."
        ),
    ),
    Slide(
        eyebrow="Step 1",
        title="Report to clinical facts",
        visual="screenshot",
        screenshot="india-to-usa-dashboard.png",
        route="India -> USA",
        bullets=[
            "Structured EHR input can skip extraction.",
            "Free text or PDF-like notes use rule-backed extraction in this prototype.",
            "Production can replace this layer with pretrained clinical NER.",
        ],
        narration=(
            "The source can be an EHR-like note, a PDF-like clinical note, or free text. If the "
            "input is already structured, extraction can be skipped. In this prototype, extraction "
            "is rule-backed; in production it can be replaced with pretrained clinical NER."
        ),
    ),
    Slide(
        eyebrow="Step 2",
        title="Clinical trace proves source to code to resource",
        visual="trace",
        screenshot="usa-to-india-dashboard.png",
        bullets=[
            "T2DM -> Type 2 diabetes mellitus -> SNOMED CT 44054006 / ICD-10 E11.",
            "A1c -> HbA1c -> LOINC 4548-4 -> Observation.",
            "metformin -> RxNorm 6809 -> MedicationStatement.",
        ],
        narration=(
            "The Clinical Trace tab is the audit path. It shows source phrase, normalized clinical "
            "meaning, standard code, and the FHIR resource. For example, T2DM maps to Type 2 "
            "diabetes mellitus, SNOMED CT 44054006, ICD-10 E11, and then a FHIR Condition."
        ),
    ),
    Slide(
        eyebrow="Step 3",
        title="FHIR-native terminology layer",
        visual="terminology",
        bullets=[
            "Local registry handles trusted known phrases first.",
            "Registry misses go to the federated terminology linker.",
            "Accepted mappings are expressed as CodeSystem, ValueSet, and ConceptMap.",
            "Simulated $translate, $lookup, and $validate-code keep the flow HL7-aligned.",
        ],
        narration=(
            "Terminology lookup checks the local registry first. If the registry misses a phrase, "
            "the federated terminology linker predicts the canonical concept. Accepted mappings "
            "are then represented through FHIR CodeSystem, ValueSet, and ConceptMap artifacts, "
            "with simulated translate, lookup, and validate-code operations."
        ),
    ),
    Slide(
        eyebrow="Step 4",
        title="Federated terminology learning",
        visual="federated",
        bullets=[
            "Four local sites train on country-specific terminology examples.",
            "Coordinator receives model tensors and sample counts only.",
            "Raw reports, labels, aliases, identifiers, and patient Bundles stay local.",
            "FedAvg is data locality, not cryptography or formal privacy.",
        ],
        narration=(
            "Federated learning helps each site benefit from terminology variation without "
            "centralizing raw clinical text. USA, India, Australia, and Europe train locally. "
            "The coordinator receives model tensors and sample counts only. FedAvg gives data "
            "locality, but it is not cryptography and not a formal privacy guarantee."
        ),
    ),
    Slide(
        eyebrow="Step 5",
        title="FHIR IPS document Bundle",
        visual="screenshot",
        screenshot="usa-to-india-fhir-bundle.png",
        route="USA -> India",
        bullets=[
            "Bundle.type = document.",
            "Composition is the first entry.",
            "Facts become Patient, Condition, Observation, MedicationStatement, and Organization resources.",
        ],
        narration=(
            "The FHIR IPS Bundle is the actual interoperable artifact. The Bundle type is document, "
            "the first entry is Composition, and the clinical facts are packaged into patient, "
            "condition, observation, medication statement, organization, and related resources."
        ),
    ),
    Slide(
        eyebrow="Step 6",
        title="Target-country readiness, not certification",
        visual="screenshot",
        screenshot="australia-to-europe-fhir-bundle.png",
        route="Australia -> Europe",
        bullets=[
            "Receiver-specific gaps are shown for US Core, ABDM, AU Core, and European Patient Summary.",
            "The app says readiness checks, not national profile certification.",
            "Same IPS artifact can be rendered into a target-country PDF for human review.",
        ],
        narration=(
            "When the target country changes, the receiver view and readiness checks change. "
            "The demo labels these as readiness checks, not national certification. The same FHIR "
            "IPS artifact can also be rendered into a target-country PDF for human review."
        ),
    ),
    Slide(
        eyebrow="Evidence",
        title="Validated prototype evidence",
        visual="screenshot",
        screenshot="europe-to-usa-evidence.png",
        route="Europe -> USA",
        bullets=[
            "20 synthetic reports and 4 country sites.",
            "768 terminology training examples and 192 globally unseen examples.",
            "48/48 cross-site transfer mappings correct.",
            "Representative Bundles show official validator evidence: 0 errors.",
        ],
        narration=(
            "The evidence tab shows the validation story: 20 synthetic reports, four country sites, "
            "768 terminology training examples, 192 globally unseen examples, 48 out of 48 cross-site "
            "transfer mappings correct, and official validator evidence with zero errors for "
            "representative Bundles."
        ),
    ),
    Slide(
        eyebrow="Limitations",
        title="Honest scope for a competition prototype",
        visual="limits",
        bullets=[
            "Synthetic data only; no real patient data.",
            "Rule-backed extraction; pretrained clinical NER is future work.",
            "Simulated terminology operations; live servers are future work.",
            "No formal privacy guarantee without DP-SGD and secure aggregation.",
        ],
        narration=(
            "The scope is honest. This is synthetic data only. Extraction is rule-backed. "
            "Terminology operations are simulated for the prototype. And federated learning alone "
            "does not provide a formal privacy guarantee; production deployment needs secure "
            "aggregation, differential privacy, sample thresholds, and privacy auditing."
        ),
    ),
    Slide(
        eyebrow="Closing",
        title="Semantic interoperability plus data interoperability",
        visual="closing",
        bullets=[
            "Federated learning aligns local terminology without centralizing raw reports.",
            "FHIR terminology artifacts make mappings auditable and exchangeable.",
            "FHIR IPS packages the patient summary for cross-border exchange.",
        ],
        narration=(
            "In summary, this project combines semantic interoperability and data interoperability. "
            "Federated learning aligns local terminology without centralizing raw reports. FHIR "
            "terminology resources make those mappings auditable. FHIR IPS packages the result into "
            "a standards-based patient summary for cross-border exchange."
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
    draw.text((82, 98), slide.title, font=FONT_TITLE, fill=INK)
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
        draw.text((835, y), "✓", font=FONT_H2, fill="#86efac")
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
    subprocess.run(cmd, check=True)


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


def slide_voiceover_durations(total_duration: float) -> list[float]:
    """Allocate one continuous voiceover across slides using narration length."""
    weights = [max(1, len(slide.narration.split())) for slide in SLIDES]
    target_duration = total_duration + 0.6
    total_weight = sum(weights)
    return [target_duration * weight / total_weight for weight in weights]


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


def mux_voiceover(video: Path, voiceover: Path, out: Path) -> None:
    run(
        [
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
            "-c:v",
            "copy",
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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rate", type=int, default=170, help="macOS say speech rate")
    parser.add_argument("--output", type=Path, default=OUT)
    parser.add_argument("--voiceover", type=Path, help="External narration MP3/WAV to use instead of macOS say")
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
        durations = slide_voiceover_durations(voiceover_duration)
        clips = [make_silent_clip(frame, duration, i) for i, (frame, duration) in enumerate(zip(frames, durations))]
        temp_video = BUILD_DIR / "voiceover_video_only.mp4"
        concat_video_only(clips, temp_video)
        mux_voiceover(temp_video, args.voiceover, args.output)
    else:
        audios = [say_audio(slide, i, args.rate) for i, slide in enumerate(SLIDES)]
        clips = [make_clip(frame, audio, i) for i, (frame, audio) in enumerate(zip(frames, audios))]
        concat(clips, args.output)
    duration = ffprobe_duration(args.output)
    print(f"Created {args.output}")
    print(f"Duration: {duration:.1f} seconds")


if __name__ == "__main__":
    main()
