"""Gera PDFs A4 a partir do MusicXML de referência (Verovio -> SVG -> PDF vetorial) e versões "escaneadas".

Uso: python render.py <dir_referencias> <dir_saida> <nome> [<nome> ...]
"""
import random
import sys
from pathlib import Path

import io

import pymupdf
import verovio
from PIL import Image, ImageFilter
from reportlab.graphics import renderPDF
from svglib.svglib import svg2rlg

ref_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
out_dir.mkdir(parents=True, exist_ok=True)

tk = verovio.toolkit()
tk.setOptions({
    "pageWidth": 2100, "pageHeight": 2970, "pageMarginLeft": 100, "pageMarginRight": 100,
    "pageMarginTop": 100, "pageMarginBottom": 100, "scale": 45, "svgViewBox": False,
    "adjustPageHeight": False, "breaks": "auto", "footer": "none",
})


def read_xml(path: Path) -> str:
    raw = path.read_bytes()
    if raw[:2] in (b"\xff\xfe", b"\xfe\xff") or raw[1:2] == b"\x00":
        return raw.decode("utf-16")
    return raw.decode("utf-8-sig")


A4 = (595, 842)  # pontos

for name in sys.argv[3:]:
    assert tk.loadData(read_xml(ref_dir / f"{name}.xml")), name
    pdf = pymupdf.open()
    for i in range(1, tk.getPageCount() + 1):
        drawing = svg2rlg(io.StringIO(tk.renderToSVG(i)))
        page_pdf = pymupdf.open("pdf", renderPDF.drawToString(drawing))
        page = pdf.new_page(width=A4[0], height=A4[1])
        page.show_pdf_page(page.rect, page_pdf, 0)  # encaixa a página do Verovio no A4
    pdf.save(out_dir / f"{name}.pdf")

    # "Escaneado": 200 dpi, leve rotação, desfoque e ruído; PDF só de imagem.
    rng = random.Random(name)
    scan = pymupdf.open()
    for page in pdf:
        pix = page.get_pixmap(dpi=200, colorspace=pymupdf.csGRAY)
        img = Image.frombytes("L", (pix.width, pix.height), pix.samples)
        img = img.rotate(rng.uniform(-1.5, 1.5), fillcolor=255, resample=Image.Resampling.BICUBIC)
        img = img.filter(ImageFilter.GaussianBlur(0.8))
        img = Image.blend(img, Image.effect_noise(img.size, 18), 0.12)
        png = out_dir / f"{name}-scan-{page.number + 1}.png"
        img.save(png, dpi=(200, 200))
        out = scan.new_page(width=A4[0], height=A4[1])
        out.insert_image(out.rect, filename=str(png))
    scan.save(out_dir / f"{name}-scan.pdf")
    print(name, pdf.page_count, "página(s)")
