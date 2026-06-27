from __future__ import annotations

import datetime as _dt
import os
import re
import subprocess
import textwrap
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "api" / "HALAJOB_API_REFERENCE.md"
ROUTE_REPORT = ROOT / "docs" / "api" / "ROUTE_VERIFICATION_REPORT.md"
OUTPUT = ROOT / "docs" / "api" / "HALAJOB_API_REFERENCE.pdf"


def git_commit() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short=12", "HEAD"],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return "unknown"


def route_summary() -> list[str]:
    if not ROUTE_REPORT.exists():
        return []

    text = ROUTE_REPORT.read_text(encoding="utf-8", errors="replace")
    lines: list[str] = []
    capture = False
    for line in text.splitlines():
        if line.strip() == "## Summary":
            capture = True
            continue
        if capture and line.startswith("## "):
            break
        if capture and line.strip().startswith("|") and "---" not in line:
            cells = [cell.strip(" `") for cell in line.strip().strip("|").split("|")]
            if len(cells) >= 2 and cells[0] != "Metric":
                lines.append(f"{cells[0]}: {cells[1]}")
    return lines


def normalize_line(line: str) -> str:
    return line.replace("\t", "    ").rstrip()


def wrap_code(line: str, width: int = 118) -> str:
    if not line:
        return ""
    parts = textwrap.wrap(
        line,
        width=width,
        replace_whitespace=False,
        drop_whitespace=False,
        break_long_words=True,
        break_on_hyphens=False,
    )
    return "<br/>".join(escape(part) for part in parts) if parts else ""


def paragraph(text: str, style: ParagraphStyle) -> Paragraph:
    text = escape(text)
    text = re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    return Paragraph(text, style)


def build_story() -> list:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source markdown: {SOURCE}")

    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "HalaTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#14213D"),
        spaceAfter=10,
    )
    subtitle = ParagraphStyle(
        "HalaSubtitle",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#4A5568"),
        spaceAfter=8,
    )
    h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=22,
        textColor=colors.HexColor("#14213D"),
        spaceBefore=14,
        spaceAfter=8,
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#C75D12"),
        spaceBefore=10,
        spaceAfter=5,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.6,
        leading=11.2,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=4,
    )
    code = ParagraphStyle(
        "Code",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=6.5,
        leading=8.2,
        leftIndent=4,
        rightIndent=4,
        backColor=colors.HexColor("#F7F2EA"),
        borderColor=colors.HexColor("#E7DCCB"),
        borderWidth=0.25,
        borderPadding=3,
        spaceAfter=3,
    )
    small = ParagraphStyle(
        "Small",
        parent=body,
        fontSize=7.4,
        leading=9.4,
        textColor=colors.HexColor("#4A5568"),
    )

    generated_at = _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    story: list = [
        Paragraph("HalaJob API Reference", title),
        Paragraph("Generated from the live route inventory and backend API markdown reference.", subtitle),
        Paragraph(f"Generated: {generated_at}", subtitle),
        Paragraph(f"Source commit: {git_commit()}", subtitle),
        Spacer(1, 8),
    ]

    summary = route_summary()
    if summary:
        story.append(Paragraph("Route Verification Summary", h2))
        for item in summary:
            story.append(Paragraph(item, small))
        story.append(Spacer(1, 8))

    story.extend(
        [
            Paragraph("Reading Notes", h2),
            Paragraph(
                "This PDF is a generated handover copy of docs/api/HALAJOB_API_REFERENCE.md. "
                "For machine-readable integration, use HALAJOB_OPENAPI.yaml and the Postman collection.",
                body,
            ),
            PageBreak(),
        ]
    )

    in_code = False
    for raw_line in SOURCE.read_text(encoding="utf-8", errors="replace").splitlines():
        line = normalize_line(raw_line)
        stripped = line.strip()

        if stripped.startswith("```"):
            in_code = not in_code
            continue

        if not stripped:
            story.append(Spacer(1, 3))
            continue

        if in_code or stripped.startswith("|") or stripped.startswith("- `") or stripped.startswith("* `"):
            story.append(Paragraph(wrap_code(line), code))
            continue

        if stripped.startswith("# "):
            story.append(Paragraph(stripped[2:].strip(), h1))
            continue
        if stripped.startswith("## "):
            story.append(Paragraph(stripped[3:].strip(), h2))
            continue
        if stripped.startswith("### "):
            story.append(Paragraph(stripped[4:].strip(), h2))
            continue

        story.append(paragraph(stripped, body))

    return story


def draw_footer(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawString(18 * mm, 10 * mm, "HalaJob API Reference")
    canvas.drawRightString(192 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="HalaJob API Reference",
        author="HalaJob",
        subject="Backend API handover reference",
    )
    doc.build(build_story(), onFirstPage=draw_footer, onLaterPages=draw_footer)
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"Wrote {OUTPUT} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
