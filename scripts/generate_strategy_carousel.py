import base64
import os
from pathlib import Path

def get_base64_img(path):
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as image_file:
        ext = os.path.splitext(path)[1].replace(".", "")
        return f"data:image/{ext};base64," + base64.b64encode(image_file.read()).decode('utf-8')

def generate_strategy_carousel():
    # Brand Config
    BRAND_PRIMARY = "#0056D2"
    BRAND_LIGHT = "#3374DB"
    BRAND_DARK = "#003FA3"
    BRAND_GREEN = "#34C759"
    BRAND_SLATE = "#0F172A"
    
    # Fonts
    HEADING_FONT = "Poppins"
    BODY_FONT = "Poppins"
    
    LOGO_IMG = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\logo - Copy.png"
    img_logo = get_base64_img(LOGO_IMG)
    
    output_path = r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\strategy_carousel.html"
    
    slides = [
        {
            "type": "hero",
            "bg": "#FFFFFF",
            "tag": "ESTRATÉGIA ENTERPRISE",
            "title": "7 Passos para<br><span>Dominar o Mercado</span>",
            "subtitle": "Como escalar sua autoridade e fechar mais projetos solares no Avalia Solar.",
            "is_light": True
        },
        {
            "type": "content",
            "bg": BRAND_SLATE,
            "step": "01",
            "title": "Estratégia de Categoria",
            "text": "Defina o posicionamento ideal: Energia Solar, Armazenamento ou Mobilidade Elétrica? Onde sua empresa quer ser líder?",
            "is_light": False
        },
        {
            "type": "content",
            "bg": "#FFFFFF",
            "step": "02",
            "title": "SEO & Conteúdo Premium",
            "text": "Palavras-chave estratégicas e backlinks de autoridade. Apareça no topo quando o cliente buscar por qualidade.",
            "is_light": True
        },
        {
            "type": "content",
            "bg": BRAND_SLATE,
            "step": "03",
            "title": "Cultura de Reviews",
            "text": "Estratégia contínua de coleta de depoimentos. Reviews novos a cada 90 dias garantem o seu lugar nos Awards.",
            "is_light": False
        },
        {
            "type": "content",
            "bg": "#FFFFFF",
            "step": "04",
            "title": "Funil de Oportunidades",
            "text": "Entenda que leads de alta qualidade são a consequência direta de um perfil verificado e bem pontuado.",
            "is_light": True
        },
        {
            "type": "content",
            "bg": "linear-gradient(165deg, #003FA3 0%, #0056D2 50%, #3374DB 100%)",
            "step": "05",
            "title": "Apoio em Performance",
            "text": "Trabalhe em conjunto com os especialistas do Avalia Solar para otimizar suas campanhas e visibilidade.",
            "is_light": False
        },
        {
            "type": "content",
            "bg": "#FFFFFF",
            "step": "06",
            "title": "Prova Social de Elite",
            "text": "Use o Quadrante de Líderes e selos de verificação em seu marketing. Mostre que sua empresa é validada.",
            "is_light": True
        },
        {
            "type": "content",
            "bg": BRAND_SLATE,
            "step": "07",
            "title": "Sales Enablement",
            "text": "Treine seu time comercial para usar os dados do portal no fechamento. A confiança vende mais que o preço.",
            "is_light": False
        },
        {
            "type": "cta",
            "bg": "linear-gradient(165deg, #003FA3 0%, #0056D2 50%, #3374DB 100%)",
            "title": "Sua jornada de liderança<br>começa aqui.",
            "btn": "GARANTIR MEU LUGAR NO TOPO",
            "is_light": False
        }
    ]
    
    total_slides = len(slides)
    
    # CSS Parts
    css = f"""
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ background:#f0f0f0; font-family:'{BODY_FONT}', sans-serif; display:flex; justify-content:center; padding:40px 0; }}
    
    .ig-frame {{ 
        width:420px; 
        background:#fff; 
        border-radius:12px; 
        box-shadow: 0 30px 60px rgba(0,0,0,0.1); 
        overflow:hidden;
        display: flex;
        flex-direction: column;
    }}
    
    /* IG UI */
    .ig-header {{ padding:12px; display:flex; align-items:center; gap:10px; border-bottom:1px solid #efefef; }}
    .ig-avatar {{ width:32px; height:32px; border-radius:50%; background:linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); padding:2px; }}
    .ig-avatar-inner {{ width:100%; height:100%; background:#fff; border-radius:50%; }}
    .ig-handle {{ font-size:13px; font-weight:600; color:#262626; }}
    
    .carousel-viewport {{ 
        width:420px; 
        height:525px; 
        overflow-x: auto; 
        scroll-snap-type: x mandatory; 
        display: flex; 
        -ms-overflow-style: none; scrollbar-width: none;
    }}
    .carousel-viewport::-webkit-scrollbar {{ display: none; }}
    
    .slide {{ 
        min-width:420px; 
        height:525px; 
        scroll-snap-align: start; 
        position:relative; 
        padding:40px 36px;
        display:flex;
        flex-direction:column;
    }}
    
    /* Typography */
    .tag {{ font-size:10px; font-weight:700; letter-spacing:2px; margin-bottom:16px; color:{BRAND_PRIMARY}; }}
    .title {{ font-size:34px; font-weight:900; line-height:1.1; margin-bottom:20px; }}
    .title span {{ color:{BRAND_PRIMARY}; }}
    .text {{ font-size:16px; font-weight:500; line-height:1.5; color:#64748B; }}
    
    /* Content Types */
    .slide-dark {{ color:#fff; }}
    .slide-dark .tag {{ color:{BRAND_LIGHT}; }}
    .slide-dark .text {{ color:rgba(255,255,255,0.7); }}
    
    .step-number {{ font-size:80px; font-weight:900; opacity:0.1; position:absolute; top:40px; right:36px; }}
    
    /* Progress Bar */
    .progress-bar-container {{
        position:absolute; bottom:20px; left:28px; right:28px;
        display:flex; align-items:center; gap:10px;
    }}
    .progress-track {{ flex:1; height:3px; background:rgba(0,0,0,0.08); border-radius:2px; overflow:hidden; }}
    .progress-fill {{ height:100%; background:{BRAND_PRIMARY}; border-radius:2px; }}
    .progress-counter {{ font-size:11px; font-weight:600; color:rgba(0,0,0,0.3); }}
    
    .slide-dark .progress-track {{ background:rgba(255,255,255,0.15); }}
    .slide-dark .progress-fill {{ background:#fff; }}
    .slide-dark .progress-counter {{ color:rgba(255,255,255,0.4); }}
    
    /* Swipe Arrow */
    .swipe-arrow {{
        position:absolute; right:0; top:0; bottom:0; width:40px; display:flex; align-items:center; justify-content:center;
        background:linear-gradient(to right, transparent, rgba(0,0,0,0.02));
    }}
    .slide-dark .swipe-arrow {{ background:linear-gradient(to right, transparent, rgba(255,255,255,0.05)); }}
    
    /* CTA Button */
    .cta-btn {{
        margin-top:auto;
        background:#fff;
        color:{BRAND_DARK};
        padding:16px 24px;
        border-radius:100px;
        font-size:13px;
        font-weight:800;
        text-align:center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }}
    
    .ig-actions {{ padding:12px; display:flex; align-items:center; gap:16px; border-top:1px solid #efefef; }}
    .ig-dots {{ display:flex; justify-content:center; gap:4px; padding-bottom:12px; }}
    .dot {{ width:6px; height:6px; border-radius:50%; background:#dbdbdb; }}
    .dot.active {{ background:{BRAND_PRIMARY}; }}
    """
    
    html_slides = ""
    for i, s in enumerate(slides):
        is_light = s["is_light"]
        bg = s["bg"]
        cls = "" if is_light else "slide-dark"
        
        pct = ((i + 1) / total_slides) * 100
        
        arrow = ""
        if i < total_slides - 1:
            stroke = "rgba(0,0,0,0.2)" if is_light else "rgba(255,255,255,0.3)"
            arrow = f"""
            <div class="swipe-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="{stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            """
        
        content = ""
        if s["type"] == "hero":
            content = f"""
                <div class="tag">{s['tag']}</div>
                <h1 class="title">{s['title']}</h1>
                <p class="text">{s['subtitle']}</p>
            """
        elif s["type"] == "content":
            content = f"""
                <div class="step-number">{s['step']}</div>
                <div class="tag">PASSO {s['step']}</div>
                <h2 class="title">{s['title']}</h2>
                <p class="text">{s['text']}</p>
            """
        elif s["type"] == "cta":
            content = f"""
                <h1 class="title" style="margin-top:auto;">{s['title']}</h1>
                <div class="cta-btn">{s['btn']}</div>
            """
            
        html_slides += f"""
        <div class="slide {cls}" style="background:{bg};">
            {content}
            {arrow}
            <div class="progress-bar-container">
                <div class="progress-track"><div class="progress-fill" style="width:{pct}%;"></div></div>
                <div class="progress-counter">{i+1}/{total_slides}</div>
            </div>
        </div>
        """

    full_html = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>{css}</style>
    </head>
    <body>
        <div class="ig-frame">
            <div class="ig-header">
                <div class="ig-avatar"><div class="ig-avatar-inner"></div></div>
                <div class="ig-handle">avaliasolar</div>
            </div>
            <div class="carousel-viewport">
                {html_slides}
            </div>
            <div class="ig-actions">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M12.12 3.45c3.07-2.62 7.28-2 9.31.73 1.3 1.74 1.45 4.39.51 6.93-1.19 3.17-3.62 6.16-5.83 8.1l-4 3.5-4-3.5c-2.21-1.94-4.64-4.93-5.83-8.1-.94-2.54-.79-5.19.51-6.93 2.03-2.73 6.24-3.35 9.31-.73z" fill="none" stroke="#262626" stroke-width="2"/>
                </svg>
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M20.65 19.19a1.1 1.1 0 01-.09.44c-.1.25-.33.44-.61.48a1.29 1.29 0 01-.14 0h-1.48a1.2 1.2 0 01-.81-.36l-2.38-2.38H7.44a4.84 4.84 0 01-4.84-4.84V5.44A4.84 4.84 0 017.44.6h9.12a4.84 4.84 0 014.84 4.84v8.11a4.84 4.84 0 01-4.84 4.84h-.35l2.44 2.44a1.28 1.28 0 01.36.81l.01 1.55z" fill="none" stroke="#262626" stroke-width="2"/>
                </svg>
            </div>
            <div class="ig-dots">
                {' '.join([f'<div class="dot {"active" if i==0 else ""}"></div>' for i in range(total_slides)])}
            </div>
        </div>
    </body>
    </html>
    """
    
    Path(output_path).write_text(full_html, encoding="utf-8")
    print(f"Carrossel Estratégico gerado: {output_path}")

if __name__ == "__main__":
    generate_strategy_carousel()
