from html import escape
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.table import Table as DocxTable
from docx.text.paragraph import Paragraph as DocxParagraph
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parent
INPUT = ROOT / "Whitepaper FastLedger V5 - Trade Operating System.docx"
OUTPUT = ROOT / "Whitepaper FastLedger V5 - Trade Operating System.pdf"

NAVY = colors.HexColor("#06101C")
BLUE = colors.HexColor("#0272C0")
SKY = colors.HexColor("#38AEF8")
INK = colors.HexColor("#1F2D3D")
MUTED = colors.HexColor("#5C6F80")
LIGHT = colors.HexColor("#F4F6F9")
PALE_BLUE = colors.HexColor("#EAF5FC")
GRID = colors.HexColor("#CFD9E2")


class WhitepaperDocTemplate(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            filename,
            pagesize=letter,
            leftMargin=0.9 * inch,
            rightMargin=0.9 * inch,
            topMargin=0.8 * inch,
            bottomMargin=0.72 * inch,
            title="FastLedger V5 - Trade Operating System",
            author="Equipo FastLedger",
        )
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(
            [
                PageTemplate(id="cover", frames=[frame], onPage=self.draw_cover_page),
                PageTemplate(id="body", frames=[frame], onPage=self.draw_body_page),
            ]
        )

    def draw_cover_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, letter[0], 0.23 * inch, fill=1, stroke=0)
        canvas.restoreState()

    def draw_body_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(BLUE)
        canvas.drawString(self.leftMargin, letter[1] - 0.38 * inch, "FASTLEDGER")
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(self.leftMargin + 0.78 * inch, letter[1] - 0.38 * inch, "| Trade Operating System")
        canvas.setStrokeColor(GRID)
        canvas.line(self.leftMargin, letter[1] - 0.45 * inch, letter[0] - self.rightMargin, letter[1] - 0.45 * inch)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawRightString(
            letter[0] - self.rightMargin,
            0.36 * inch,
            f"Whitepaper V5 | Junio 2026 | {doc.page}",
        )
        canvas.restoreState()


styles = getSampleStyleSheet()
body = ParagraphStyle(
    "Body",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=9.5,
    leading=12.1,
    textColor=INK,
    alignment=TA_JUSTIFY,
    spaceAfter=7,
)
h1 = ParagraphStyle(
    "H1",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=16,
    leading=19,
    textColor=BLUE,
    spaceBefore=12,
    spaceAfter=7,
    keepWithNext=True,
)
h2 = ParagraphStyle(
    "H2",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=12.5,
    leading=15,
    textColor=BLUE,
    spaceBefore=9,
    spaceAfter=5,
    keepWithNext=True,
)
h3 = ParagraphStyle(
    "H3",
    parent=styles["Heading3"],
    fontName="Helvetica-Bold",
    fontSize=10.5,
    leading=13,
    textColor=colors.HexColor("#1F4D78"),
    spaceBefore=7,
    spaceAfter=4,
    keepWithNext=True,
)
bullet = ParagraphStyle(
    "Bullet",
    parent=body,
    leftIndent=16,
    firstLineIndent=-9,
    bulletIndent=4,
    spaceAfter=4,
    alignment=TA_LEFT,
)
cover_kicker = ParagraphStyle(
    "CoverKicker",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=10,
    leading=12,
    textColor=SKY,
    alignment=TA_CENTER,
    spaceBefore=64,
    spaceAfter=18,
)
cover_title = ParagraphStyle(
    "CoverTitle",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=31,
    leading=34,
    textColor=NAVY,
    alignment=TA_CENTER,
    spaceAfter=8,
)
cover_subtitle = ParagraphStyle(
    "CoverSubtitle",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=17,
    leading=21,
    textColor=BLUE,
    alignment=TA_CENTER,
    spaceAfter=17,
)
cover_body = ParagraphStyle(
    "CoverBody",
    parent=body,
    fontSize=11,
    leading=15,
    textColor=MUTED,
    alignment=TA_CENTER,
    leftIndent=35,
    rightIndent=35,
    spaceAfter=24,
)
cover_meta = ParagraphStyle(
    "CoverMeta",
    parent=body,
    fontSize=8.8,
    leading=11,
    textColor=INK,
    alignment=TA_CENTER,
    spaceAfter=2,
)
table_text = ParagraphStyle(
    "TableText",
    parent=body,
    fontSize=7.7,
    leading=9.5,
    alignment=TA_LEFT,
    spaceAfter=0,
)
reference_text = ParagraphStyle(
    "ReferenceText",
    parent=body,
    fontSize=7.6,
    leading=9.2,
    alignment=TA_LEFT,
    spaceAfter=3,
)
table_head = ParagraphStyle(
    "TableHead",
    parent=table_text,
    fontName="Helvetica-Bold",
    textColor=NAVY,
)
callout_title = ParagraphStyle(
    "CalloutTitle",
    parent=body,
    fontName="Helvetica-Bold",
    fontSize=9.5,
    leading=12,
    textColor=BLUE,
    spaceAfter=3,
)
callout_text = ParagraphStyle(
    "CalloutText",
    parent=body,
    fontSize=9,
    leading=11.5,
    alignment=TA_LEFT,
    spaceAfter=0,
)


def iter_blocks(document):
    parent = document.element.body
    for child in parent.iterchildren():
        if child.tag == qn("w:p"):
            yield DocxParagraph(child, document)
        elif child.tag == qn("w:tbl"):
            yield DocxTable(child, document)


def contains_page_break(paragraph):
    return bool(paragraph._p.xpath(".//w:br[@w:type='page']"))


def table_column_widths(table, available):
    count = len(table.columns)
    if count == 1:
        return [available]
    if count == 3:
        first_row = [cell.text.strip().upper() for cell in table.rows[0].cells]
        if first_row == ["PRODUCTO", "MERCADO INICIAL", "ESTADO"]:
            return [available / 3] * 3
        if "LÍNEA" in first_row or "LINEA" in first_row:
            return [1.7 * inch, 3.0 * inch, available - 4.7 * inch]
        return [1.55 * inch, 2.55 * inch, available - 4.1 * inch]
    if count == 4:
        return [1.25 * inch, 1.7 * inch, 2.05 * inch, available - 5.0 * inch]
    return [available / count] * count


def build_table(block, available, cover=False):
    rows = []
    for r_index, row in enumerate(block.rows):
        rendered = []
        for cell in row.cells:
            text = "<br/>".join(
                escape(p.text.strip()).replace("\n", "<br/>")
                for p in cell.paragraphs
                if p.text.strip()
            )
            rendered.append(Paragraph(text or " ", table_head if r_index == 0 and not cover else table_text))
        rows.append(rendered)
    widths = table_column_widths(block, available)
    table = Table(rows, colWidths=widths, repeatRows=1 if len(rows) > 1 else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.35, GRID),
    ]
    if cover:
        commands.extend(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE_BLUE),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    elif len(rows) == 1 and len(rows[0]) == 1:
        commands.extend(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE_BLUE),
                ("BOX", (0, 0), (-1, -1), 0.8, SKY),
            ]
        )
    else:
        commands.extend(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DCEAF5")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
            ]
        )
    table.setStyle(TableStyle(commands))
    return table


docx = Document(INPUT)
story = []
cover_mode = True
cover_paragraph_index = 0
in_references = False

for block in iter_blocks(docx):
    if isinstance(block, DocxParagraph):
        if contains_page_break(block):
            story.append(PageBreak())
            cover_mode = False
            continue
        text = block.text.strip()
        if not text:
            continue
        style_name = block.style.name if block.style else ""

        if cover_mode:
            cover_paragraph_index += 1
            if text == "WHITEPAPER V4":
                story.append(Paragraph(escape(text), cover_kicker))
            elif text == "FASTLEDGER":
                story.append(Paragraph(escape(text), cover_title))
            elif text == "El Sistema Operativo del Comercio Exterior":
                story.append(Paragraph(escape(text), cover_subtitle))
            elif text.startswith("Plataforma latinoamericana"):
                story.append(Paragraph(escape(text), cover_body))
            else:
                story.append(Paragraph(escape(text), cover_meta))
            continue

        if style_name == "Heading 1":
            if text == "Referencias":
                in_references = True
            story.append(Paragraph(escape(text), h1))
        elif style_name == "Heading 2":
            story.append(Paragraph(escape(text), h2))
        elif style_name == "Heading 3":
            story.append(Paragraph(escape(text), h3))
        elif style_name == "List Bullet":
            story.append(Paragraph(escape(text), bullet, bulletText="•"))
        elif style_name == "List Number":
            story.append(Paragraph(escape(text), bullet))
        else:
            story.append(Paragraph(escape(text), reference_text if in_references else body))
    else:
        table = build_table(block, 6.7 * inch, cover=cover_mode)
        story.append(KeepTogether([table, Spacer(1, 8)]))

pdf = WhitepaperDocTemplate(str(OUTPUT))
pdf.build(story)
print(OUTPUT)

