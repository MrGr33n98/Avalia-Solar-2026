import base64
from pathlib import Path

# Brand Assets
BRAND_PRIMARY = '#0056D2'
BRAND_LIGHT = '#3374DB'
BRAND_DARK = '#003FA3'
LIGHT_BG = '#F8FAFC'
DARK_BG = '#0F172A'
LIGHT_BORDER = '#E2E8F0'

# Mock SVG for Logo (Initials AS)
# Using a slightly improved SVG
LOGO_SVG = f'''<svg width="40" height="40" viewBox="0 0 40 40" fill="none" style="position:absolute; top:28px; left:36px; z-index:5;">
  <circle cx="20" cy="20" r="20" fill="{BRAND_PRIMARY}"/>
  <text x="50%" y="54%" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="800" font-size="14">AS</text>
</svg>'''

def get_slide_html(index, total, title, body=None, list_items=None, steps=None, is_dark=False, is_gradient=False, label=None, cta=None):
    pct = ((index + 1) / total) * 100
    track_color = 'rgba(255,255,255,0.12)' if is_dark or is_gradient else 'rgba(0,0,0,0.08)'
    fill_color = '#fff' if is_dark or is_gradient else BRAND_PRIMARY
    label_color = 'rgba(255,255,255,0.4)' if is_dark or is_gradient else 'rgba(0,0,0,0.3)'
    
    bg_style = ''
    if is_gradient:
        bg_style = f'background: linear-gradient(165deg, {BRAND_DARK} 0%, {BRAND_PRIMARY} 50%, {BRAND_LIGHT} 100%);'
    elif is_dark:
        bg_style = f'background: {DARK_BG};'
    else:
        bg_style = f'background: {LIGHT_BG};'
    
    text_color = '#fff' if is_dark or is_gradient else DARK_BG
    tag_color = BRAND_LIGHT if is_dark else (BRAND_PRIMARY if not is_gradient else 'rgba(255,255,255,0.6)')
    
    content = f'<h2 class="serif" style="font-size:30px; color:{text_color}; margin-bottom:16px; line-height:1.1;">{title}</h2>'
    if label:
        content = f'<span class="sans" style="display:inline-block; font-size:10px; font-weight:700; letter-spacing:2px; color:{tag_color}; margin-bottom:12px; text-transform:uppercase;">{label}</span>' + content
    
    if body:
        content += f'<p class="sans" style="font-size:14px; color:{text_color}; opacity:0.85; line-height:1.5;">{body}</p>'
    
    if list_items:
        items_html = ''
        for item in list_items:
            items_html += f'''
            <div style="display:flex; align-items:flex-start; gap:14px; padding:12px 0; border-bottom:1px solid {'rgba(255,255,255,0.08)' if is_dark else LIGHT_BORDER};">
              <span style="color:{BRAND_PRIMARY if not is_dark else BRAND_LIGHT}; font-size:18px; line-height:1; font-weight:bold;">→</span>
              <div>
                <span class="sans" style="font-size:14px; font-weight:700; color:{text_color};">{item['label']}</span><br/>
                <span class="sans" style="font-size:12px; color:{'rgba(255,255,255,0.6)' if is_dark else '#64748B'};">{item['desc']}</span>
              </div>
            </div>'''
        content += f'<div style="margin-top:20px;">{items_html}</div>'

    if steps:
        steps_html = ''
        for i, step in enumerate(steps):
            steps_html += f'''
            <div style="display:flex; align-items:flex-start; gap:16px; padding:14px 0; border-bottom:1px solid {LIGHT_BORDER if not is_dark else 'rgba(255,255,255,0.08)'};">
              <span class="serif" style="font-size:26px; font-weight:300; color:{BRAND_PRIMARY if not is_dark else BRAND_LIGHT}; min-width:34px; line-height:1;">0{i+1}</span>
              <div>
                <span class="sans" style="font-size:14px; font-weight:700; color:{text_color};">{step['title']}</span><br/>
                <span class="sans" style="font-size:12px; color:{'rgba(255,255,255,0.6)' if is_dark else '#64748B'};">{step['desc']}</span>
              </div>
            </div>'''
        content += f'<div style="margin-top:20px;">{steps_html}</div>'

    if cta:
        content += f'''
        <div style="margin-top:32px;">
          <div style="display:inline-flex; align-items:center; gap:8px; padding:14px 32px; background:{'#fff' if is_gradient else BRAND_PRIMARY}; color:{BRAND_DARK if is_gradient else '#fff'}; font-family:sans-serif; font-weight:700; font-size:14px; border-radius:32px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            {cta}
          </div>
        </div>'''

    swipe_arrow = ''
    if index < total - 1:
        s_bg = 'rgba(0,0,0,0.04)' if not is_dark and not is_gradient else 'rgba(255,255,255,0.06)'
        s_stroke = 'rgba(0,0,0,0.2)' if not is_dark and not is_gradient else 'rgba(255,255,255,0.3)'
        swipe_arrow = f'''
        <div style="position:absolute; right:0; top:0; bottom:0; width:48px; z-index:9; display:flex; align-items:center; justify-content:center; background:linear-gradient(to right, transparent, {s_bg});">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="{s_stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>'''

    justify = 'center' if index == 0 or index == total - 1 else 'flex-end'
    
    return f'''
    <div class="slide" style="flex-shrink:0; width:420px; height:525px; {bg_style} position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:{justify}; padding:0 36px 64px; box-sizing:border-box;">
        <div style="z-index:2;">
            {content}
        </div>
        
        {swipe_arrow}

        <div style="position:absolute; bottom:0; left:0; right:0; padding:16px 36px 24px; z-index:10; display:flex; align-items:center; gap:12px;">
            <div style="flex:1; height:3px; background:{track_color}; border-radius:2px; overflow:hidden;">
                <div style="height:100%; width:{pct}%; background:{fill_color}; border-radius:2px;"></div>
            </div>
            <span style="font-size:11px; color:{label_color}; font-weight:600; font-variant-numeric: tabular-nums;">{index+1}/{total}</span>
        </div>
        
        {LOGO_SVG if index==0 or index==total-1 else ''}
    </div>
    '''

slides_data = [
    {
        'title': 'Por que o mercado solar precisa de um novo padrão de confiança?', 
        'body': 'O setor de energia solar e mobilidade elétrica cresce rápido, mas a assimetria de informação ainda é o maior freio para negócios de alto valor B2B.', 
        'label': 'Manifesto Avalia Solar'
    },
    {
        'title': 'O Caos da Transparência', 
        'body': 'Orçamentos opacos, empresas sem histórico validado e a guerra de preços destroem o valor e a segurança do ecossistema solar hoje.', 
        'is_dark': True, 
        'label': 'O Problema'
    },
    {
        'title': 'Trust as a Service (TaaS)', 
        'body': 'Não somos apenas um marketplace. Somos a fundação da confiança que valida, certifica e rankea o mercado solar com base em dados reais.', 
        'is_gradient': True, 
        'label': 'A Nova Categoria'
    },
    {
        'title': 'Pilares da Credibilidade', 
        'list_items': [
            {'label':'Validação Rigorosa', 'desc':'Sistemas de auditoria técnica e documental.'}, 
            {'label':'Selos Verificáveis', 'desc':'Credenciais que provam competência técnica.'}, 
            {'label':'Trust Score', 'desc':'O KPI central da sua reputação (0 a 100).'}
        ],
        'label': 'Como Criamos Confiança'
    },
    {
        'title': 'B2B & Mobilidade Elétrica', 
        'body': 'Conectamos os melhores players de energia solar, baterias e carregadores veiculares a compradores que exigem ROI e qualidade premium.', 
        'is_dark': True,
        'label': 'Foco de Mercado'
    },
    {
        'title': 'O Caminho da Autoridade', 
        'steps': [
            {'title':'Reivindique seu Perfil', 'desc':'Inicie sua presença no ecossistema.'}, 
            {'title':'Valide sua Expertise', 'desc':'Submeta sua competência ao crivo TaaS.'}, 
            {'title':'Domine o Ranking', 'desc':'Seja visto no Magic Quadrant do setor.'}
        ],
        'label': 'Trilha de Sucesso'
    },
    {
        'title': 'Onde a confiança gera energia.', 
        'is_gradient': True, 
        'cta': 'Calcule seu Trust Score', 
        'label': '@avaliasolar'
    }
]

html_slides = ''.join([get_slide_html(i, len(slides_data), **s) for i, s in enumerate(slides_data)])

full_html = f'''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; }}
        .serif {{ font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; letter-spacing: -0.8px; }}
        .sans {{ font-family: 'Plus Jakarta Sans', sans-serif; }}
        
        .ig-frame {{ width: 420px; background: #fff; border-radius: 16px; box-shadow: 0 30px 60px rgba(0,0,0,0.12); overflow: hidden; position: relative; }}
        .ig-header {{ padding: 14px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f2f2f2; }}
        .avatar {{ width: 34px; height: 34px; border-radius: 50%; background: {BRAND_PRIMARY}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; }}
        .header-text {{ display: flex; flex-direction: column; }}
        .handle {{ font-size: 13.5px; font-weight: 700; color: #262626; }}
        .location {{ font-size: 11px; color: #8e8e8e; }}
        
        .carousel-viewport {{ width: 420px; height: 525px; overflow-x: auto; scroll-snap-type: x mandatory; display: flex; scrollbar-width: none; cursor: grab; }}
        .carousel-viewport::-webkit-scrollbar {{ display: none; }}
        .carousel-track {{ display: flex; }}
        .slide {{ scroll-snap-align: start; flex-shrink: 0; }}
        
        .ig-actions {{ padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }}
        .left-actions {{ display: flex; gap: 16px; }}
        .ig-dots {{ display: flex; justify-content: center; gap: 4px; padding-bottom: 14px; }}
        .dot {{ width: 6px; height: 6px; border-radius: 50%; background: #dbdbdb; transition: background 0.3s; }}
        .dot.active {{ background: {BRAND_PRIMARY}; }}
        
        .ig-caption {{ padding: 0 16px 18px; font-size: 13px; color: #262626; line-height: 1.5; }}
        .ig-caption b {{ font-weight: 700; margin-right: 4px; }}
        .hashtags {{ color: #00376b; }}
        .timestamp {{ font-size: 10px; color: #8e8e8e; margin-top: 8px; text-transform: uppercase; font-weight: 600; }}
    </style>
</head>
<body>
    <div class="ig-frame">
        <div class="ig-header">
            <div class="avatar">AS</div>
            <div class="header-text">
                <span class="handle">avaliasolar</span>
                <span class="location">Florianópolis, Brazil</span>
            </div>
        </div>
        
        <div class="carousel-viewport" id="viewport">
            <div class="carousel-track">
                {html_slides}
            </div>
        </div>
        
        <div class="ig-actions">
            <div class="left-actions">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>
        
        <div class="ig-dots">
            {''.join([f'<div class="dot {"active" if i==0 else ""}"></div>' for i in range(len(slides_data))])}
        </div>
        
        <div class="ig-caption">
            <b>avaliasolar</b> Trust as a Service: Onde a confiança gera energia. <br>
            Construindo o novo padrão de transparência e validação para o mercado solar B2B.
            <div class="hashtags">#SolarTrust #TaaS #EnergiaSolar #MobilidadeEletrica</div>
            <div class="timestamp">AGOSTO 2026</div>
        </div>
    </div>
    
    <script>
        const viewport = document.getElementById('viewport');
        const dots = document.querySelectorAll('.dot');
        viewport.addEventListener('scroll', () => {{
            const index = Math.round(viewport.scrollLeft / 420);
            dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        }});
    </script>
</body>
</html>
'''

# Ensure output directory exists
out_path = Path("c:/Users/Bobi/Desktop/AB0-1-main/outputs/manifesto_carousel.html")
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(full_html, encoding="utf-8")
print(f"Carousel generated at: {out_path}")
