from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib import colors


def convert_markdown_to_pdf(md_path: Path, pdf_path: Path) -> None:
    text = md_path.read_text(encoding="utf-8")
    lines = text.splitlines()

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="CottonCare AI Technical Architecture Report",
        author="CottonCare AI",
    )

    styles = getSampleStyleSheet()
    style_title = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1a3a5f"),
        spaceAfter=12,
    )
    style_h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#123456"),
        spaceBefore=10,
        spaceAfter=6,
    )
    style_h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1f4e79"),
        spaceBefore=8,
        spaceAfter=4,
    )
    style_body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontSize=10.5,
        leading=14,
        spaceAfter=4,
    )
    style_code = ParagraphStyle(
        "Code",
        parent=styles["Code"],
        fontName="Courier",
        fontSize=9,
        leading=12,
        backColor=colors.HexColor("#f5f5f5"),
        borderPadding=4,
        spaceAfter=4,
    )

    story = []
    in_code_block = False
    code_acc = []
    bullet_acc = []

    def flush_bullets():
        nonlocal bullet_acc
        if bullet_acc:
            bullet_items = [
                ListItem(Paragraph(item, style_body), leftIndent=8) for item in bullet_acc
            ]
            story.append(ListFlowable(bullet_items, bulletType="bullet", leftIndent=12))
            story.append(Spacer(1, 4))
            bullet_acc = []

    def flush_code():
        nonlocal code_acc
        if code_acc:
            code_text = "<br/>".join(
                line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                for line in code_acc
            )
            story.append(Paragraph(code_text, style_code))
            code_acc = []

    for raw_line in lines:
        line = raw_line.rstrip()

        if line.strip().startswith("```"):
            flush_bullets()
            if in_code_block:
                flush_code()
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_acc.append(line)
            continue

        if not line.strip():
            flush_bullets()
            story.append(Spacer(1, 4))
            continue

        if line.startswith("# "):
            flush_bullets()
            story.append(Paragraph(line[2:].strip(), style_title))
            continue

        if line.startswith("## "):
            flush_bullets()
            story.append(Paragraph(line[3:].strip(), style_h1))
            continue

        if line.startswith("### "):
            flush_bullets()
            story.append(Paragraph(line[4:].strip(), style_h2))
            continue

        stripped = line.lstrip()
        if stripped.startswith("- "):
            bullet_acc.append(stripped[2:].strip())
            continue

        if stripped[:2].isdigit() and ". " in stripped:
            flush_bullets()
            story.append(Paragraph(stripped, style_body))
            continue

        flush_bullets()
        paragraph_text = (
            line.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("`", "")
        )
        story.append(Paragraph(paragraph_text, style_body))

    flush_bullets()
    flush_code()

    doc.build(story)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    md = root / "PROJECT_ARCHITECTURE_AND_FLOW.md"
    pdf = root / "PROJECT_ARCHITECTURE_AND_FLOW.pdf"
    convert_markdown_to_pdf(md, pdf)
    print(f"PDF generated: {pdf}")
