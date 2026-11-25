"""Build the course site data and the downloadable PDF worksheets.

Usage: python build.py   (needs reportlab)
Reads  src/content/unit*.json
Writes site/js/data.js and site/downloads/unitN/*.pdf
"""
import json, re, random, glob, os
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, KeepTogether, PageBreak, Image)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
LOGO = str(ROOT / "site" / "img" / "logo.png")
LOGO_RATIO = 313 / 560
FONTS = "/System/Library/Fonts/Supplemental/"
pdfmetrics.registerFont(TTFont("Body", FONTS + "Arial.ttf"))
pdfmetrics.registerFont(TTFont("Body-Bold", FONTS + "Arial Bold.ttf"))
pdfmetrics.registerFont(TTFont("Body-Italic", FONTS + "Arial Italic.ttf"))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic", boldItalic="Body-Bold")

LEVELS = [("basic", "Basic"), ("intermediate", "Intermediate"), ("advanced", "Advanced")]
INK = colors.HexColor("#1d2433")
MUTED = colors.HexColor("#5b6478")
LINE = colors.HexColor("#c9cfdb")

PROPER = {"english": "English", "new york": "New York", "march": "March", "saturday": "Saturday",
          "tv": "TV", "pokémon": "Pokémon"}


def fix_sentence(s):
    s = " " + s + " "
    s = re.sub(r"(?<= )i(?=[ '])", "I", s)
    for k, v in PROPER.items():
        s = re.sub(r"(?<= )" + re.escape(k) + r"(?= )", v, s)
    s = s.strip()
    s = s[0].upper() + s[1:]
    qw = ("how", "what", "where", "why", "who", "when", "which", "do", "does", "did", "will", "would",
          "could", "can", "have", "has", "is", "are")
    if s[-1] not in ".?!":
        s += "?" if s.split()[0].lower() in qw else "."
    return s


def load_units():
    units = []
    for f in sorted(glob.glob(str(ROOT / "src/content/unit*.json"))):
        u = json.load(open(f, encoding="utf-8"))
        for g in u["grammar"]:
            for bank in ("ex", "ws"):
                for lvl in g[bank].values():
                    for it in lvl:
                        if "r" in it:
                            it["r"] = fix_sentence(it["r"])
        units.append(u)
    return units


# ---------------------------------------------------------------- PDF helpers
def styles(color):
    c = colors.HexColor(color)
    base = dict(fontName="Body", fontSize=10.5, leading=15, textColor=INK)
    return {
        "body": ParagraphStyle("body", **base),
        "small": ParagraphStyle("small", **{**base, "fontSize": 9, "leading": 12, "textColor": MUTED}),
        "h1": ParagraphStyle("h1", **{**base, "fontName": "Body-Bold", "fontSize": 20, "leading": 24}),
        "h2": ParagraphStyle("h2", **{**base, "fontName": "Body-Bold", "fontSize": 12.5, "leading": 16,
                                      "textColor": c, "spaceBefore": 10, "spaceAfter": 4}),
        "item": ParagraphStyle("item", **{**base, "leftIndent": 16, "firstLineIndent": -16, "spaceAfter": 5}),
        "cell": ParagraphStyle("cell", **{**base, "fontSize": 9, "leading": 11.5}),
        "cellb": ParagraphStyle("cellb", **{**base, "fontName": "Body-Bold", "fontSize": 9, "leading": 11.5}),
        "box": ParagraphStyle("box", **{**base, "fontSize": 9.5, "leading": 13.5}),
    }


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def make_doc(path, unit, subtitle):
    color = colors.HexColor(unit["color"])

    def on_page(canvas, doc):
        w, h = A4
        canvas.saveState()
        canvas.setFillColor(color)
        canvas.rect(0, h - 9 * mm, w, 9 * mm, stroke=0, fill=1)
        canvas.setFillColor(colors.white)
        canvas.setFont("Body-Bold", 9)
        canvas.drawString(18 * mm, h - 6 * mm, f"UNIT {unit['id']} · {unit['title'].upper()}")
        canvas.drawRightString(w - 18 * mm, h - 6 * mm, "4º ESO ENGLISH")
        canvas.setFillColor(MUTED)
        canvas.setFont("Body", 8)
        lw = 22 * mm
        canvas.drawImage(LOGO, 18 * mm, 6 * mm, width=lw, height=lw * LOGO_RATIO, mask="auto")
        canvas.drawString(18 * mm + lw + 4 * mm, 10 * mm, subtitle)
        canvas.drawRightString(w - 18 * mm, 10 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc = BaseDocTemplate(str(path), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
                          topMargin=18 * mm, bottomMargin=18 * mm, title=subtitle,
                          author="4º ESO English")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=on_page)])
    return doc


def header_block(st, title, level_label, color):
    left = [Paragraph(esc(title), st["h1"]), Spacer(1, 3)]
    if level_label:
        left.append(Paragraph(f'<font color="{color}"><b>Level: {level_label}</b></font>', st["body"]))
    lw = 42 * mm
    top = Table([[left, Image(LOGO, width=lw, height=lw * LOGO_RATIO)]], colWidths=[174 * mm - lw, lw])
    top.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    out = [top, Spacer(1, 6)]
    t = Table([["Name: ______________________________", "Class: ________", "Date: ____________"]],
              colWidths=[95 * mm, 35 * mm, 44 * mm])
    t.setStyle(TableStyle([("FONT", (0, 0), (-1, -1), "Body", 9.5), ("TEXTCOLOR", (0, 0), (-1, -1), MUTED),
                           ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    out += [t, Spacer(1, 8)]
    return out


def write_lines(n, width):
    t = Table([[""] for _ in range(n)], colWidths=[width], rowHeights=[8 * mm] * n)
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE)]))
    return t


def tip_box(st, lines, color, width):
    p = [Paragraph("<b>Remember</b>", st["box"])] + [Paragraph("• " + esc(l), st["box"]) for l in lines]
    t = Table([[p]], colWidths=[width])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(color + "14") if False else colors.HexColor("#f3f5f9")),
                           ("LINEBEFORE", (0, 0), (0, -1), 3, colors.HexColor(color)),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 7),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return t


def gap(q):
    return esc(q).replace("___", "__________")


def star_gap(sentence):
    """'I *asked* Leo *over*' -> ('I ______ Leo ______', 'asked ... over')"""
    parts = re.findall(r"\*(.+?)\*", sentence)
    return re.sub(r"\*(.+?)\*", "__________", sentence), " ... ".join(parts)


def first_letter_gap(sentence):
    def rep(m):
        w = m.group(1)
        return w[0] + "_" * max(4, len(w) - 1)
    parts = re.findall(r"\*(.+?)\*", sentence)
    return re.sub(r"\*(.+?)\*", rep, sentence), " ... ".join(parts)


def jumble(sentence, rnd):
    words = re.sub(r"[?.!]$", "", sentence).split()
    words = [w if w == "I" else (w.lower() if w not in PROPER.values() else w) for w in words]
    for _ in range(10):
        rnd.shuffle(words)
        if " ".join(words).lower() != re.sub(r"[?.!]$", "", sentence).lower():
            break
    return " / ".join(words)


def answer_key(st, keys):
    out = [PageBreak(), Paragraph("Answer key", st["h1"]), Spacer(1, 6)]
    for sec, items in keys:
        out.append(Paragraph(esc(sec), st["h2"]))
        out.append(Paragraph("   ".join(f"<b>{i}</b> {esc(a)}" for i, a in items), st["body"]))
    return out


# ---------------------------------------------------------------- grammar worksheets
def grammar_ws(unit, g, lvl_key, lvl_label, path):
    st = styles(unit["color"])
    rnd = random.Random(f"{unit['id']}-{g['id']}-{lvl_key}")
    doc = make_doc(path, unit, f"Grammar worksheet · {g['title']} · {lvl_label}")
    W = doc.width
    items = g["ws"][lvl_key] + g["ex"][lvl_key]
    summary = next((s["p"] for s in g["slides"] if s["k"] == "sum"), [])
    flow = header_block(st, g["title"], lvl_label, unit["color"])
    flow += [tip_box(st, summary, unit["color"], W), Spacer(1, 6)]
    keys = []
    n_sec = 0

    mc = [i for i in items if "o" in i]
    if True:
        pass
    gp = [i for i in items if "a" in i and "o" not in i]
    ro = [i for i in items if "r" in i]
    wr = [i for i in items if "w" in i]

    if mc:
        n_sec += 1
        flow.append(Paragraph(f"{n_sec}  Choose the correct option.", st["h2"]))
        k = []
        for n, it in enumerate(mc, 1):
            sep = "<br/>" if max(len(o) for o in it["o"]) > 22 else "    "
            opts = sep.join(f"<b>{'abc'[j]}</b> {esc(o)}" for j, o in enumerate(it["o"]))
            flow.append(KeepTogether([Paragraph(f"<b>{n}</b>  {gap(it['q'])}", st["item"]),
                                      Paragraph(opts, ParagraphStyle("o", parent=st["item"], leftIndent=16, firstLineIndent=0))]))
            k.append((n, f"{'abc'[it['a']]} ({it['o'][it['a']]})"))
        keys.append((f"Exercise {n_sec}", k))
    if gp:
        n_sec += 1
        flow.append(Paragraph(f"{n_sec}  Complete the sentences.", st["h2"]))
        k = []
        for n, it in enumerate(gp, 1):
            flow.append(Paragraph(f"<b>{n}</b>  {gap(it['q'])}", st["item"]))
            if "Rewrite" in it["q"] or "Correct" in it["q"] or "Report" in it["q"] or "Explain" in it["q"] or "Join" in it["q"] or "Make" in it["q"] or "Question" in it["q"]:
                flow.append(write_lines(1, W - 16))
            k.append((n, it["a"][0]))
        keys.append((f"Exercise {n_sec}", k))
    if ro:
        n_sec += 1
        flow.append(Paragraph(f"{n_sec}  Put the words in the correct order.", st["h2"]))
        k = []
        for n, it in enumerate(ro, 1):
            flow.append(Paragraph(f"<b>{n}</b>  <i>{esc(jumble(it['r'], rnd))}</i>", st["item"]))
            flow.append(write_lines(1, W - 16))
            k.append((n, it["r"]))
        keys.append((f"Exercise {n_sec}", k))
    for it in wr:
        n_sec += 1
        flow.append(KeepTogether([Paragraph(f"{n_sec}  Writing", st["h2"]),
                                  Paragraph(esc(it["w"]), st["body"]), Spacer(1, 4),
                                  write_lines(7 if lvl_key == "advanced" else 5, W)]))
        keys.append((f"Exercise {n_sec}", [("", "Open answer.")]))
    flow += answer_key(st, keys)
    doc.build(flow)


# ---------------------------------------------------------------- vocabulary
def all_words(unit, include_extra):
    return [(s["name"], w) for s in unit["vocab"] for w in s["words"] if include_extra or not s.get("extra")]


def vocab_list_pdf(unit, path):
    st = styles(unit["color"])
    doc = make_doc(path, unit, f"Vocabulary list · Unit {unit['id']} {unit['title']}")
    W = doc.width
    flow = header_block(st, f"Unit {unit['id']} · {unit['title']}", None, unit["color"])
    flow.insert(1, Paragraph("Vocabulary list with English definitions and Spanish translations", st["small"]))
    cw = [32 * mm, 18 * mm, 52 * mm, 30 * mm, W - 132 * mm]
    for s in unit["vocab"]:
        flow.append(Paragraph(esc(s["name"].replace("Extra: ", "Extra vocabulary: ")), st["h2"]))
        rows = [[Paragraph(h, st["cellb"]) for h in ("Word", "Type", "Definition", "Spanish", "Example")]]
        for w in s["words"]:
            ex = esc(w[4])
            ex = re.sub(r"\*(.+?)\*", r"<b>\1</b>", ex)
            rows.append([Paragraph(f"<b>{esc(w[0])}</b>", st["cell"]), Paragraph(esc(w[1]), st["cell"]),
                         Paragraph(esc(w[2]), st["cell"]), Paragraph(esc(w[3]), st["cell"]), Paragraph(ex, st["cell"])])
        t = Table(rows, colWidths=cw, repeatRows=1)
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eef1f6")),
                               ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
                               ("VALIGN", (0, 0), (-1, -1), "TOP"),
                               ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
        flow.append(t)
    doc.build(flow)


def match_table(st, left, right, W):
    rows = []
    for i in range(max(len(left), len(right))):
        l = Paragraph(f"<b>{i + 1}</b>  {esc(left[i])}", st["cell"]) if i < len(left) else ""
        r = Paragraph(f"<b>{'abcdefghijklmnop'[i]}</b>  {esc(right[i])}", st["cell"]) if i < len(right) else ""
        rows.append(["____", l, r])
    t = Table(rows, colWidths=[12 * mm, 50 * mm, W - 62 * mm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3),
                           ("TEXTCOLOR", (0, 0), (0, -1), MUTED)]))
    return t


def vocab_ws(unit, lvl_key, lvl_label, path):
    st = styles(unit["color"])
    rnd = random.Random(f"v{unit['id']}-{lvl_key}")
    doc = make_doc(path, unit, f"Vocabulary worksheet · Unit {unit['id']} · {lvl_label}")
    W = doc.width
    core = [w for _, w in all_words(unit, False)]
    every = [w for _, w in all_words(unit, True)]
    flow = header_block(st, f"Vocabulary: {unit['title']}", lvl_label, unit["color"])
    keys = []

    def match(words, field, title, n):
        words = rnd.sample(words, min(n, len(words)))
        right = [w[field] for w in words]
        order = list(range(len(words)))
        rnd.shuffle(order)
        shuffled = [right[i] for i in order]
        flow.append(Paragraph(title, st["h2"]))
        flow.append(match_table(st, [w[0] for w in words], shuffled, W))
        return [(i + 1, "abcdefghijklmnop"[order.index(i)]) for i in range(len(words))]

    if lvl_key == "basic":
        keys.append(("Exercise 1", match(core, 3, "1  Match the English words (1–10) with the Spanish translations (a–j).", 10)))
        flow.append(Paragraph("2  Read the definitions and choose the correct word.", st["h2"]))
        pick = rnd.sample(core, 8)
        k = []
        for n, w in enumerate(pick, 1):
            others = rnd.sample([x for x in core if x is not w], 2)
            opts = [w] + others
            rnd.shuffle(opts)
            flow.append(KeepTogether([Paragraph(f"<b>{n}</b>  {esc(w[2][0].upper() + w[2][1:])}", st["item"]),
                         Paragraph("    ".join(f"<b>{'abc'[j]}</b> {esc(o[0])}" for j, o in enumerate(opts)),
                                   ParagraphStyle("o", parent=st["item"], leftIndent=16, firstLineIndent=0))]))
            k.append((n, f"{'abc'[opts.index(w)]} ({w[0]})"))
        keys.append(("Exercise 2", k))
        flow.append(Paragraph("3  Write the English word next to the Spanish translation.", st["h2"]))
        pick = rnd.sample(core, 6)
        rows = [[Paragraph(f"<b>{n}</b>  {esc(w[3])}", st["cell"]), "→  ______________________"] for n, w in enumerate(pick, 1)]
        t = Table(rows, colWidths=[70 * mm, W - 70 * mm])
        t.setStyle(TableStyle([("FONT", (0, 0), (-1, -1), "Body", 9.5), ("TOPPADDING", (0, 0), (-1, -1), 5)]))
        flow.append(t)
        keys.append(("Exercise 3", [(n, w[0]) for n, w in enumerate(pick, 1)]))

    elif lvl_key == "intermediate":
        keys.append(("Exercise 1", match(core, 2, "1  Match the words (1–10) with the definitions (a–j).", 10)))
        pick = rnd.sample(core, 10)
        box = [w[0] for w in pick]
        rnd.shuffle(box)
        flow.append(Paragraph("2  Complete the sentences with words from the box. Change the form if necessary.", st["h2"]))
        bt = Table([[Paragraph("   ·   ".join(esc(b) for b in box), st["box"])]], colWidths=[W])
        bt.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor(unit["color"])),
                                ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
        flow += [bt, Spacer(1, 6)]
        k = []
        for n, w in enumerate(pick, 1):
            s, ans = star_gap(w[4])
            flow.append(Paragraph(f"<b>{n}</b>  {esc(s)}", st["item"]))
            k.append((n, ans))
        keys.append(("Exercise 2", k))
        flow.append(Paragraph("3  Answer the questions in full sentences.", st["h2"]))
        qs = rnd.sample(core, 4)
        for n, w in enumerate(qs, 1):
            flow.append(Paragraph(f"<b>{n}</b>  Write a sentence about your life or your town using <b>{esc(w[0])}</b>.", st["item"]))
            flow.append(write_lines(1, W - 16))
        keys.append(("Exercise 3", [("", "Open answers.")]))

    else:
        pick = rnd.sample(every, 10)
        flow.append(Paragraph("1  Complete the sentences. The first letter of each missing word is given.", st["h2"]))
        k = []
        for n, w in enumerate(pick, 1):
            s, ans = first_letter_gap(w[4])
            flow.append(Paragraph(f"<b>{n}</b>  {esc(s)}", st["item"]))
            k.append((n, ans))
        keys.append(("Exercise 1", k))
        flow.append(Paragraph("2  Write the word for each definition.", st["h2"]))
        pick2 = rnd.sample([w for w in every if w not in pick], 6)
        for n, w in enumerate(pick2, 1):
            flow.append(Paragraph(f"<b>{n}</b>  {esc(w[2][0].upper() + w[2][1:])}  →  ______________________", st["item"]))
        keys.append(("Exercise 2", [(n, w[0]) for n, w in enumerate(pick2, 1)]))
        flow.append(Paragraph("3  Translate the sentences into English.", st["h2"]))
        tr = rnd.sample(every, 3)
        for n, w in enumerate(tr, 1):
            flow.append(Paragraph(f"<b>{n}</b>  Use <b>{esc(w[0])}</b> ({esc(w[3])}) in a sentence about the topic of the unit.", st["item"]))
            flow.append(write_lines(1, W - 16))
        keys.append(("Exercise 3", [("", "Open answers.")]))
        flow.append(KeepTogether([Paragraph("4  Writing", st["h2"]),
                                  Paragraph(f"Write a paragraph (80–100 words) about <b>{esc(unit['topic'].lower())}</b>. "
                                            "Use at least eight words from this unit and underline them.", st["body"]),
                                  Spacer(1, 4), write_lines(8, W)]))
        keys.append(("Exercise 4", [("", "Open answer.")]))
    flow += answer_key(st, keys)
    doc.build(flow)


# ---------------------------------------------------------------- main
def main():
    units = load_units()
    (SITE / "js").mkdir(parents=True, exist_ok=True)
    count = 0
    for u in units:
        d = SITE / "downloads" / f"unit{u['id']}"
        d.mkdir(parents=True, exist_ok=True)
        vocab_list_pdf(u, d / "vocabulary-list.pdf"); count += 1
        u["files"] = {"list": f"downloads/unit{u['id']}/vocabulary-list.pdf", "vocab": {}, "grammar": {}}
        for k, label in LEVELS:
            vocab_ws(u, k, label, d / f"vocabulary-{k}.pdf"); count += 1
            u["files"]["vocab"][k] = f"downloads/unit{u['id']}/vocabulary-{k}.pdf"
        for g in u["grammar"]:
            u["files"]["grammar"][g["id"]] = {}
            for k, label in LEVELS:
                grammar_ws(u, g, k, label, d / f"grammar-{g['id']}-{k}.pdf"); count += 1
                u["files"]["grammar"][g["id"]][k] = f"downloads/unit{u['id']}/grammar-{g['id']}-{k}.pdf"
        for g in u["grammar"]:
            del g["ws"]  # worksheets live in the PDFs only
    js = "window.COURSE = " + json.dumps(units, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (SITE / "js" / "data.js").write_text(js, encoding="utf-8")
    print(f"{len(units)} units, {count} PDFs, data.js {len(js)//1024} KB")


if __name__ == "__main__":
    main()
