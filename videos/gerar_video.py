#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Avalia Solar - Primeiro Post Video Generator
Formato: 1080x1920 (9:16 vertical) | 30fps | ~41 segundos
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio
from pathlib import Path
import math

# ─── CONFIG ──────────────────────────────────────────────────────────────────
W, H = 1080, 1920
FPS  = 30
FONT_DIR  = Path("C:/Windows/Fonts")
LOGO_PATH = Path("C:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/public/images/logo.png")
OUTPUT    = Path("C:/Users/Bobi/Desktop/AB0-1-main/videos/avalia_solar_primeiro_post.mp4")

# ─── CORES ───────────────────────────────────────────────────────────────────
BG_TOP   = (6,  18,  38)
BG_BOT   = (14, 42,  78)
WHITE    = (255, 255, 255)
YELLOW   = (255, 196,   0)
CYAN     = ( 56, 189, 248)
GREEN    = ( 52, 211, 153)
RED_ACC  = (251,  99,  64)
GRAY     = (186, 207, 235)
DARK_TXT = ( 30,  58,  95)

# ─── FONTES ──────────────────────────────────────────────────────────────────
def F(size, weight="regular"):
    files = {
        "black":   "seguibl.ttf",
        "bold":    "calibrib.ttf",
        "regular": "segoeui.ttf",
        "light":   "calibril.ttf",
    }
    return ImageFont.truetype(str(FONT_DIR / files[weight]), size)

F_HUGE  = F(96,  "black")
F_BIG   = F(68,  "black")
F_MED   = F(52,  "bold")
F_BODY  = F(42,  "regular")
F_SMALL = F(34,  "regular")
F_TAG   = F(28,  "regular")

# ─── UTILITÁRIOS ─────────────────────────────────────────────────────────────
def gradient_bg():
    img = Image.new("RGBA", (W, H))
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] + (BG_BOT[0]-BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOT[1]-BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOT[2]-BG_TOP[2]) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))
    return img

def add_grid(img, alpha=10):
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for x in range(0, W, 80):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, alpha))
    for y in range(0, H, 80):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, alpha))
    return Image.alpha_composite(img, overlay)

def add_glow(img, cx, cy, radius, color, intensity=35):
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    steps = 8
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        a = int(intensity * (1 - i/steps))
        d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*color, a))
    return Image.alpha_composite(img, overlay)

def remove_white_bg(logo_img, threshold=220):
    rgba = logo_img.convert("RGBA")
    data = np.array(rgba, dtype=np.int32)
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
    white_mask = (r > threshold) & (g > threshold) & (b > threshold)
    data[white_mask, 3] = 0
    return Image.fromarray(data.astype(np.uint8))

def ease_in_out(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

def fade_alpha(t, fade_in=0.25, fade_out=0.15):
    if t < fade_in:
        return ease_in_out(t / fade_in)
    elif t > 1 - fade_out:
        return ease_in_out((1 - t) / fade_out)
    return 1.0

def slide_y(t, total=45, fade_in=0.35):
    if t < fade_in:
        return int(total * (1 - ease_in_out(t / fade_in)))
    return 0

def draw_text_centered(draw, text, y, font, color, max_w=940):
    words = text.split()
    lines, line = [], []
    for w in words:
        test = " ".join(line + [w])
        bb = draw.textbbox((0, 0), test, font=font)
        if (bb[2]-bb[0]) > max_w and line:
            lines.append(" ".join(line))
            line = [w]
        else:
            line.append(w)
    if line:
        lines.append(" ".join(line))

    total_h = 0
    lh = 0
    for ln in lines:
        bb = draw.textbbox((0, 0), ln, font=font)
        lh = bb[3] - bb[1]
        total_h += lh + 14

    for i, ln in enumerate(lines):
        bb = draw.textbbox((0, 0), ln, font=font)
        tw = bb[2]-bb[0]
        lh = bb[3]-bb[1]
        x  = (W - tw) // 2
        draw.text((x+2, y+2), ln, font=font, fill=(0, 0, 0, 70))
        draw.text((x, y),      ln, font=font, fill=color)
        y += lh + 14
    return total_h

def draw_bullet(draw, icon, text, y, font, icon_color, text_color, max_w=820):
    ix = 90
    tx = 170
    draw.text((ix+1, y+1), icon, font=font, fill=(0, 0, 0, 50))
    draw.text((ix, y),      icon, font=font, fill=icon_color)
    words = text.split()
    lines, line = [], []
    for w in words:
        test = " ".join(line + [w])
        bb = draw.textbbox((0, 0), test, font=font)
        if (bb[2]-bb[0]) > max_w and line:
            lines.append(" ".join(line))
            line = [w]
        else:
            line.append(w)
    if line:
        lines.append(" ".join(line))
    lh_ref = draw.textbbox((0, 0), "A", font=font)[3] - draw.textbbox((0, 0), "A", font=font)[1]
    for i, ln in enumerate(lines):
        draw.text((tx+1, y+1+i*(lh_ref+8)), ln, font=font, fill=(0, 0, 0, 50))
        draw.text((tx,   y+i*(lh_ref+8)),   ln, font=font, fill=text_color)
    return len(lines) * (lh_ref + 8) + 20

def paste_logo(base_img, logo_rgba, cx, cy, scale=1.0, alpha_mult=1.0):
    lw = int(logo_rgba.width  * scale)
    lh = int(logo_rgba.height * scale)
    logo_r = logo_rgba.resize((lw, lh), Image.LANCZOS)
    if alpha_mult < 1.0:
        data = np.array(logo_r)
        data[:,:,3] = (data[:,:,3] * alpha_mult).clip(0, 255).astype(np.uint8)
        logo_r = Image.fromarray(data)
    x = cx - lw // 2
    y = cy - lh // 2
    base_img.paste(logo_r, (x, y), logo_r)

def add_divider_line(img, y, color, alpha=70, width=650):
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    x0 = (W - width) // 2
    d.rectangle([x0, y, x0+width, y+2], fill=(*color, alpha))
    return Image.alpha_composite(img, overlay)

# ─── LOGO ────────────────────────────────────────────────────────────────────
print("Carregando logo...")
logo_raw   = Image.open(LOGO_PATH)
logo_clean = remove_white_bg(logo_raw, threshold=222)

# tamanho natural do logo para escalar corretamente
LOGO_W_ORIG = logo_clean.width
LOGO_H_ORIG = logo_clean.height

def logo_scale_for_w(target_w):
    return target_w / LOGO_W_ORIG

# ─── WATERMARK ───────────────────────────────────────────────────────────────
WM_W = 200
WM_SCALE = WM_W / LOGO_W_ORIG
wm_logo = logo_clean.resize(
    (int(LOGO_W_ORIG * WM_SCALE), int(LOGO_H_ORIG * WM_SCALE)),
    Image.LANCZOS
)
wm_data = np.array(wm_logo)
wm_data[:,:,3] = (wm_data[:,:,3] * 0.16).astype(np.uint8)
wm_logo_final = Image.fromarray(wm_data)

def apply_watermark(img):
    x = W - wm_logo_final.width - 28
    y = H - wm_logo_final.height - 28
    img.paste(wm_logo_final, (x, y), wm_logo_final)

# ─── CENAS ───────────────────────────────────────────────────────────────────
def make_frame(scene, t):
    base = gradient_bg()
    base = add_grid(base)
    a    = fade_alpha(t)
    sy   = slide_y(t)

    ia = int(255 * a)  # int alpha for color tuples

    if scene == "intro":
        base = add_glow(base, W//2, H//2 - 60, 600, YELLOW, 16)
        base = add_glow(base, W//2, H//2 - 60, 280, CYAN,   28)
        # logo scale animado
        s = logo_scale_for_w(480) * (0.4 + 0.6 * ease_in_out(min(t * 2.5, 1.0)))
        paste_logo(base, logo_clean, W//2, H//2 - 80, scale=s, alpha_mult=a)
        draw = ImageDraw.Draw(base)
        tag = "Apresentando a plataforma"
        bb  = draw.textbbox((0,0), tag, font=F_SMALL)
        tx  = (W - (bb[2]-bb[0])) // 2
        draw.text((tx, H//2 + 300 + sy), tag, font=F_SMALL, fill=(*GRAY, ia))

    elif scene == "hook":
        base = add_glow(base, W//2, 380, 420, YELLOW, 12)
        draw = ImageDraw.Draw(base)
        y = 300 + sy
        y += draw_text_centered(draw, "O mercado de energia solar cresceu.", y, F_BIG,
                                 (*WHITE, ia))
        y += 30
        y += draw_text_centered(draw, "Mas a confianca", y, F_BIG, (*YELLOW, ia))
        y += draw_text_centered(draw, "nao acompanhou.", y, F_BIG, (*YELLOW, ia))

    elif scene == "problems":
        draw = ImageDraw.Draw(base)
        y = 230 + sy
        y += draw_text_centered(draw, "Milhares de brasileiros querem economizar...",
                                  y, F_BODY, (*GRAY, ia))
        y += 20
        y += draw_text_centered(draw, "mas nao sabem em quem confiar.",
                                  y, F_MED, (*WHITE, ia))
        y += 50
        base = add_divider_line(base, y, CYAN, alpha=int(70*a))
        draw = ImageDraw.Draw(base)
        y += 55

        bullets = [
            ("\u25CF", "Empresas sem avaliacao real"),
            ("\u25CF", "Promessas que nao se cumprem"),
            ("\u25CF", "Falta de transparencia no pos-venda"),
        ]
        for i, (icon, txt) in enumerate(bullets):
            t_stagger = max(0.0, (t - i * 0.22) / (1.0 - i * 0.22 + 0.01))
            ba = int(255 * ease_in_out(min(t_stagger * 2, 1.0)))
            bsy = int(35 * (1 - ease_in_out(min(t_stagger * 3, 1.0))))
            h = draw_bullet(draw, icon, txt, y + bsy, F_BODY,
                            (*RED_ACC, ba), (*WHITE, ba))
            y += h + 28

    elif scene == "result":
        base = add_glow(base, W//2, H//2, 550, RED_ACC, 12)
        draw = ImageDraw.Draw(base)
        y = 460 + sy
        y += draw_text_centered(draw, "E o resultado?", y, F_BIG, (*WHITE, ia))
        y += 40
        y += draw_text_centered(draw, "Decisoes caras...", y, F_HUGE, (*RED_ACC, ia))
        y += 30
        draw_text_centered(draw, "e muitas vezes erradas.", y, F_MED, (*GRAY, ia))

    elif scene == "pivot":
        base = add_glow(base, W//2, H//2 - 60, 520, CYAN, 20)
        draw = ImageDraw.Draw(base)
        y = 380 + sy
        y += draw_text_centered(draw, "Foi por isso que nasceu", y, F_MED, (*GRAY, ia))
        y += 50
        s = logo_scale_for_w(460)
        paste_logo(base, logo_clean, W//2, y + 130, scale=s, alpha_mult=a)
        draw = ImageDraw.Draw(base)
        y += 350
        draw_text_centered(draw,
            "Uma plataforma feita para trazer o que o mercado nunca teve.",
            y, F_BODY, (*CYAN, int(200*a)))

    elif scene == "solution":
        base = add_glow(base, W//2, 300, 380, GREEN, 14)
        draw = ImageDraw.Draw(base)
        y = 220 + sy
        y += draw_text_centered(draw, "Confianca que o mercado nunca teve:",
                                  y, F_MED, (*GRAY, ia))
        y += 45
        base = add_divider_line(base, y, GREEN, alpha=int(70*a), width=720)
        draw = ImageDraw.Draw(base)
        y += 55

        features = [
            ("\u2713", "Empresas avaliadas de verdade"),
            ("\u2713", "Criterios transparentes"),
            ("\u2713", "Reputacao baseada em dados reais"),
        ]
        for i, (icon, txt) in enumerate(features):
            t_stagger = max(0.0, (t - i * 0.22) / (1.0 - i * 0.22 + 0.01))
            ba = int(255 * ease_in_out(min(t_stagger * 2, 1.0)))
            bsy = int(35 * (1 - ease_in_out(min(t_stagger * 3, 1.0))))
            h = draw_bullet(draw, icon, txt, y + bsy, F_BODY,
                            (*GREEN, ba), (*WHITE, ba))
            y += h + 35

    elif scene == "value":
        base = add_glow(base, W//2, H//2 - 50, 520, CYAN, 15)
        draw = ImageDraw.Draw(base)
        y = 460 + sy
        y += draw_text_centered(draw, "Aqui, voce nao escolhe no escuro.", y, F_BIG, (*WHITE, ia))
        y += 50
        draw_text_centered(draw, "Voce escolhe com confianca.", y, F_BIG, (*YELLOW, ia))

    elif scene == "cta":
        base = add_glow(base, W//2, H//2 - 100, 520, YELLOW, 12)
        draw = ImageDraw.Draw(base)
        y = 320 + sy
        y += draw_text_centered(draw,
            "Se voce esta pensando em investir em energia solar...",
            y, F_BODY, (*GRAY, ia))
        y += 25
        y += draw_text_centered(draw, "comece do jeito certo.", y, F_MED, (*WHITE, ia))
        y += 80

        # botão CTA
        btn_w, btn_h = 820, 110
        bx = (W - btn_w) // 2
        by = y + 30
        btn_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bd = ImageDraw.Draw(btn_layer)
        bd.rounded_rectangle([bx, by, bx+btn_w, by+btn_h], radius=55,
                               fill=(*YELLOW, int(235*a)))
        base = Image.alpha_composite(base, btn_layer)
        draw = ImageDraw.Draw(base)
        cta = "\u2192 Compare empresas agora"
        bb  = draw.textbbox((0,0), cta, font=F_MED)
        tx  = (W - (bb[2]-bb[0])) // 2
        ty  = by + (btn_h - (bb[3]-bb[1])) // 2
        draw.text((tx, ty), cta, font=F_MED, fill=(*DARK_TXT, int(255*a)))

    elif scene == "endcard":
        base = add_glow(base, W//2, H//2 - 120, 620, CYAN,   20)
        base = add_glow(base, W//2, H//2 - 120, 260, YELLOW, 18)
        s = logo_scale_for_w(560)
        paste_logo(base, logo_clean, W//2, H//2 - 120, scale=s, alpha_mult=a)
        draw = ImageDraw.Draw(base)

        line1 = "avaliasolar.com.br"
        bb  = draw.textbbox((0,0), line1, font=F_SMALL)
        tx  = (W - (bb[2]-bb[0])) // 2
        draw.text((tx, H//2 + 260 + sy), line1, font=F_SMALL, fill=(*CYAN, ia))

        tags = "#EnergiaSolar  #AvaliaSolar  #Confianca"
        bb   = draw.textbbox((0,0), tags, font=F_TAG)
        tx   = (W - (bb[2]-bb[0])) // 2
        draw.text((tx, H//2 + 340 + sy), tags, font=F_TAG, fill=(*GRAY, int(170*a)))

    # watermark em todas as cenas exceto intro e endcard
    if scene not in ("intro", "endcard"):
        apply_watermark(base)

    return np.array(base.convert("RGB"), dtype=np.uint8)

# ─── SEQUÊNCIA ───────────────────────────────────────────────────────────────
SCENES = [
    ("intro",    3.5),
    ("hook",     4.0),
    ("problems", 6.0),
    ("result",   3.5),
    ("pivot",    4.5),
    ("solution", 6.0),
    ("value",    3.5),
    ("cta",      5.0),
    ("endcard",  5.0),
]
TOTAL         = sum(d for _, d in SCENES)
TOTAL_FRAMES  = int(TOTAL * FPS)
CF            = 10   # crossfade frames (~0.33s)

# ─── RENDER ──────────────────────────────────────────────────────────────────
print(f"Gerando vídeo: {TOTAL:.1f}s | {TOTAL_FRAMES} frames | {W}x{H}")
print(f"Output: {OUTPUT}")

writer = imageio.get_writer(
    str(OUTPUT), fps=FPS, quality=9,
    macro_block_size=1,
    ffmpeg_params=["-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p"]
)

scene_list = [(n, int(d*FPS)) for n, d in SCENES]
total_written = 0

for si, (scene_name, nf) in enumerate(scene_list):
    print(f"  [{si+1}/{len(scene_list)}] {scene_name} ({nf}f)...", end="", flush=True)
    prev_name = scene_list[si-1][0] if si > 0 else None

    for fi in range(nf):
        t     = fi / max(nf - 1, 1)
        frame = make_frame(scene_name, t)

        if prev_name and fi < CF:
            prev_frame = make_frame(prev_name, 1.0)
            blend = ease_in_out(fi / CF)
            frame = (prev_frame * (1 - blend) + frame * blend).astype(np.uint8)

        writer.append_data(frame)
        total_written += 1

    pct = int(total_written / TOTAL_FRAMES * 100)
    print(f" ✓ {pct}%")

writer.close()

size_mb = OUTPUT.stat().st_size / 1024 / 1024
print(f"\n✅ Vídeo salvo: {OUTPUT}")
print(f"   Duração: {TOTAL:.1f}s | Tamanho: {size_mb:.1f}MB")
