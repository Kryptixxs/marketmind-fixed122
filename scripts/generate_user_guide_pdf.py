from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "MarketMind-Terminal-OS-Complete-Guide.md"
OUT = ROOT / "docs" / "MarketMind-Terminal-OS-Complete-Guide.pdf"


def parse_markdown(lines):
    blocks = []
    paragraph = []
    in_code = False
    code_lines = []
    for raw in lines:
        line = raw.rstrip("\n")
        if line.strip().startswith("```"):
            if in_code:
                blocks.append(("code", "\n".join(code_lines)))
                code_lines = []
                in_code = False
            else:
                if paragraph:
                    blocks.append(("p", " ".join(paragraph).strip()))
                    paragraph = []
                in_code = True
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not line.strip():
            if paragraph:
                blocks.append(("p", " ".join(paragraph).strip()))
                paragraph = []
            continue
        if line.startswith("# "):
            if paragraph:
                blocks.append(("p", " ".join(paragraph).strip()))
                paragraph = []
            blocks.append(("h1", line[2:].strip()))
            continue
        if line.startswith("## "):
            if paragraph:
                blocks.append(("p", " ".join(paragraph).strip()))
                paragraph = []
            blocks.append(("h2", line[3:].strip()))
            continue
        if line.startswith("### "):
            if paragraph:
                blocks.append(("p", " ".join(paragraph).strip()))
                paragraph = []
            blocks.append(("h3", line[4:].strip()))
            continue
        if line.strip() == "---":
            if paragraph:
                blocks.append(("p", " ".join(paragraph).strip()))
                paragraph = []
            blocks.append(("hr", ""))
            continue
        if line.lstrip().startswith("- "):
            if paragraph:
                blocks.append(("p", " ".join(paragraph).strip()))
                paragraph = []
            text = line.lstrip()[2:].strip()
            blocks.append(("li", text))
            continue
        if line[:2].isdigit() and line[2:4] == ") ":
            if paragraph:
                blocks.append(("p", " ".join(paragraph).strip()))
                paragraph = []
            blocks.append(("ol", line.strip()))
            continue
        paragraph.append(line.strip())
    if paragraph:
        blocks.append(("p", " ".join(paragraph).strip()))
    if code_lines:
        blocks.append(("code", "\n".join(code_lines)))
    return blocks


def build_pdf():
    lines = SRC.read_text(encoding="utf-8").splitlines(True)
    blocks = parse_markdown(lines)

    styles = getSampleStyleSheet()
    h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontName="Courier-Bold",
        fontSize=16,
        leading=18,
        spaceAfter=8,
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontName="Courier-Bold",
        fontSize=12,
        leading=14,
        spaceBefore=6,
        spaceAfter=4,
    )
    h3 = ParagraphStyle(
        "H3",
        parent=styles["Heading3"],
        fontName="Courier-Bold",
        fontSize=11,
        leading=13,
        spaceBefore=4,
        spaceAfter=2,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Courier",
        fontSize=9,
        leading=12,
        spaceAfter=4,
    )
    bullet = ParagraphStyle(
        "Bullet",
        parent=body,
        leftIndent=16,
        firstLineIndent=-8,
    )
    code = ParagraphStyle(
        "Code",
        parent=body,
        fontName="Courier",
        backColor=colors.whitesmoke,
        leading=11,
        leftIndent=8,
        rightIndent=8,
        spaceBefore=4,
        spaceAfter=4,
    )

    story = []
    for kind, text in blocks:
        if kind == "h1":
            story.append(Paragraph(text, h1))
        elif kind == "h2":
            story.append(Paragraph(text, h2))
        elif kind == "h3":
            story.append(Paragraph(text, h3))
        elif kind == "p":
            story.append(Paragraph(text.replace("&", "&amp;"), body))
        elif kind == "li":
            story.append(Paragraph(f"• {text}".replace("&", "&amp;"), bullet))
        elif kind == "ol":
            story.append(Paragraph(text.replace("&", "&amp;"), bullet))
        elif kind == "hr":
            story.append(HRFlowable(width="100%", color=colors.grey, thickness=0.5))
            story.append(Spacer(1, 4))
        elif kind == "code":
            story.append(Preformatted(text, code))
        if len(story) > 0 and len(story) % 140 == 0:
            story.append(PageBreak())

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.6 * inch,
        rightMargin=0.6 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        title="MarketMind Terminal OS Complete Guide",
        author="MarketMind",
    )
    doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(f"PDF generated: {OUT}")

