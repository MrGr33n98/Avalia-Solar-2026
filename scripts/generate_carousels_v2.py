import base64
from pathlib import Path

# --- BRAND ASSETS ---
BRAND_PRIMARY = '#0056D2'
BRAND_CYAN = '#00AFEF'
BRAND_GREEN = '#34C759'
BRAND_DARK = '#003FA3'
SLATE_900 = '#0F172A'
SLATE_950 = '#020617'
OFF_WHITE = '#F8FAFC'

# Read logo
logo_path = Path('c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/public/images/logo.png')
try:
    logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
    logo_data = f'data:image/png;base64,{logo_b64}'
except Exception:
    logo_data = ''

def get_slide_html(index, total, title, sub=None, items=None, steps=None, is_dark=False, is_gradient=False, tag=None, cta=None, svg_dec=None):
    pct = ((index + 1) / total) * 100
    track_color = 'rgba(255,255,255,0.12)' if is_dark or is_gradient else 'rgba(0,0,0,0.08)'
    fill_color = '#fff' if is_dark or is_gradient else BRAND_PRIMARY
    label_color = 'rgba(255,255,255,0.4)' if is_dark or is_gradient else 'rgba(0,0,0,0.3)'
    
    bg = SLATE_900 if is_dark else OFF_WHITE
    if is_gradient:
       bg = f'linear-gradient(165deg, {BRAND_DARK} 0%, {BRAND_PRIMARY} 50%, {BRAND_CYAN} 100%)'
    
    text_color = '#fff' if is_dark or is_gradient else '#1e293b'
    emp_color = BRAND_CYAN if is_dark or is_gradient else BRAND_PRIMARY
    
    html = f'<div class="slide" style="background:{bg}; position:relative; overflow:hidden; display:flex; flex-direction:column; padding:40px 36px 64px;">'
    html += '<div style="position:absolute; inset:0; background-image:radial-gradient(circle,rgba(0,0,0,0.05) 1px,transparent 1px); background-size:22px 22px; opacity:0.3;"></div>'
    
    if svg_dec:
        html += f'<div style="position:absolute; top:40px; right:32px; opacity:0.12; transform:scale(1.2);">{svg_dec}</div>'
    
    html += f'''
    <div style="position:relative; z-index:2; display:flex; align-items:center; gap:10px; margin-bottom:auto;">
        <img src="{logo_data}" style="width:32px; height:32px; filter:{'brightness(0) invert(1)' if is_dark or is_gradient else 'none'}">
        <div style="display:flex; flex-direction:column; line-height:1.1;">
            <span style="font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:700; color:{text_color};">Avalia</span>
            <span style="font-family:'Plus Jakarta Sans',sans-serif; font-size:10px; font-weight:800; letter-spacing:2.5px; color:{emp_color if not is_gradient else '#fff'};">SOLAR</span>
        </div>
    </div>'''
    
    html += f'<div style="position:relative; z-index:2; margin-top:auto;">'
    if tag:
        html += f'<span style="font-family:\'Plus Jakarta Sans\',sans-serif; font-size:10px; font-weight:800; letter-spacing:2px; color:{emp_color if not is_gradient else "rgba(255,255,255,0.7)"}; text-transform:uppercase; margin-bottom:14px; display:block;">{tag}</span>'
    
    html += f'<h2 style="font-family:\'Plus Jakarta Sans\',sans-serif; font-size:30px; font-weight:800; color:{text_color}; line-height:1.1; letter-spacing:-0.5px; margin-bottom:18px;">{title}</h2>'
    
    if sub:
        html += f'<p style="font-family:\'Plus Jakarta Sans\',sans-serif; font-size:14px; color:{text_color}; opacity:0.85; line-height:1.55;">{sub}</p>'
    
    if items:
        for item in items:
            html += f'''
            <div style="display:flex; align-items:flex-start; gap:12px; padding:11px 0; border-bottom:1px solid {'rgba(255,255,255,0.08)' if is_dark else 'rgba(0,0,0,0.05)'};">
              <span style="color:{emp_color if not is_dark else '#fff'}; font-size:16px; width:18px; flex-shrink:0;">✔</span>
              <p style="font-family:\'Plus Jakarta Sans\',sans-serif; font-size:13px; color:{text_color}; margin:0;"><b>{item['label']}</b>: {item['desc']}</p>
            </div>'''

    if cta:
        html += f'''
        <div style="margin-top:32px; display:inline-flex; align-items:center; gap:8px; padding:13px 30px; background:{'#fff' if is_gradient else BRAND_PRIMARY}; color:{BRAND_DARK if is_gradient else '#fff'}; font-weight:800; font-size:13px; border-radius:30px; letter-spacing:0.3px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          {cta} →
        </div>'''
        
    html += '</div>'
    html += f'''
    <div style="position:absolute; bottom:0; left:0; right:0; padding:16px 36px 24px; z-index:10; display:flex; align-items:center; gap:12px;">
        <div style="flex:1; height:3px; background:{track_color}; border-radius:2px; overflow:hidden;">
            <div style="height:100%; width:{pct}%; background:{fill_color}; border-radius:2px;"></div>
        </div>
        <span style="font-size:11px; color:{label_color}; font-weight:600; font-variant-numeric: tabular-nums;">{index+1}/{total}</span>
    </div>'''
    
    if index < total - 1:
        s_bg = 'rgba(0,0,0,0.04)' if not is_dark and not is_gradient else 'rgba(255,255,255,0.06)'
        s_stroke = 'rgba(0,0,0,0.2)' if not is_dark and not is_gradient else 'rgba(255,255,255,0.3)'
        html += f'''
        <div style="position:absolute; right:0; top:0; bottom:0; width:48px; z-index:9; display:flex; align-items:center; justify-content:center; background:linear-gradient(to right,transparent,{s_bg});">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="{s_stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>'''
    html += '</div>'
    return html

def wrap_ig_frame(slides_html, total, caption, filename):
    full_html = f'''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Lora:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ background: #020617; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; }}
        .ig-frame {{ width: 420px; background: #fff; border-radius: 16px; box-shadow: 0 40px 80px rgba(0,0,0,0.8); overflow: hidden; position: relative; }}
        .ig-header {{ padding: 14px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f2f2f2; }}
        .header-avatar {{ width: 34px; height: 34px; border-radius: 50%; background: {BRAND_PRIMARY}; display: flex; align-items: center; justify-content: center; overflow:hidden; }}
        .header-meta {{ display: flex; flex-direction: column; }}
        .handle {{ font-size: 13.5px; font-weight: 700; color: #262626; }}
        .sub {{ font-size: 11px; color: #8e8e8e; }}
        .carousel-viewport {{ width: 420px; height: 525px; overflow: hidden; position: relative; cursor: grab; }}
        .carousel-track {{ display: flex; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }}
        .slide {{ width: 420px; height: 525px; flex-shrink: 0; }}
        .ig-dots {{ display: flex; align-items: center; justify-content: center; gap: 5px; padding: 12px 0 6px; background: #fff; }}
        .dot {{ width: 6px; height: 6px; border-radius: 50%; background: #ddd; transition: all 0.3s; cursor: pointer; }}
        .dot.active {{ background: {BRAND_PRIMARY}; width: 14px; border-radius: 3px; }}
        .ig-actions {{ padding: 12px 16px 4px; display: flex; gap: 16px; align-items: center; background: #fff; }}
        .ig-caption {{ padding: 6px 16px 18px; background: #fff; font-size: 13px; color: #262626; line-height: 1.5; }}
        .ig-caption b {{ font-weight: 700; margin-right: 4px; }}
        .ig-time {{ font-size: 10px; color: #8e8e8e; margin-top: 8px; text-transform: uppercase; font-weight: 600; }}
    </style>
</head>
<body>
    <div class="ig-frame">
        <div class="ig-header">
            <div class="header-avatar"><img src="{logo_data}" style="width:100%; height:100%; object-fit:cover;"></div>
            <div class="header-meta">
                <span class="handle">avaliasolar</span>
                <span class="sub">Avalia Solar · Energia &amp; Mobilidade</span>
            </div>
        </div>
        <div class="carousel-viewport" id="vp">
            <div class="carousel-track" id="track">{slides_html}</div>
        </div>
        <div class="ig-dots">{''.join([f'<div class="dot {"active" if i==0 else ""}"></div>' for i in range(total)])}</div>
        <div class="ig-actions">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            <div style="flex:1;"></div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#262626" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div class="ig-caption"><b>avaliasolar</b> {caption}</div>
        <div class="ig-time" style="padding-left:16px; padding-bottom:12px;">HÁ 2 HORAS</div>
    </div>
    <script>
        let cur = 0;
        const track = document.getElementById('track');
        const dots  = document.querySelectorAll('.dot');
        const vp    = document.getElementById('vp');
        const W     = 420;
        const TOTAL = {total};
        function goTo(n) {{
            cur = Math.max(0, Math.min(n, TOTAL-1));
            track.style.transform = `translateX(${{-cur * W}}px)`;
            dots.forEach((d,i) => d.classList.toggle('active', i===cur));
        }}
        let startX=0, dragging=false;
        vp.addEventListener('pointerdown', e => {{ startX=e.clientX; dragging=true; vp.setPointerCapture(e.pointerId); }});
        vp.addEventListener('pointerup',   e => {{ if(!dragging) return; dragging=false; const dx=e.clientX-startX; if(Math.abs(dx)>40) goTo(dx<0?cur+1:cur-1); }});
        dots.forEach((dot, i) => dot.onclick = () => goTo(i));
    </script>
</body>
</html>
'''
    out_path = Path(f'c:/Users/Bobi/Desktop/AB0-1-main/outputs/{filename}')
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(full_html, encoding='utf-8')
    print(f'Generated: {out_path}')

# --- CAROUSEL 1: MANIFESTO SIMPLES ---
sun_svg = '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="28" fill="#FBD38D" opacity="0.4"/><g stroke="#FBD38D" stroke-width="4"><circle cx="50" cy="50" r="20" fill="none"/><line x1="50" y1="5" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="95"/><line x1="5" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="95" y2="50"/></g></svg>'
m_slides = [
    {'title': 'Sua empresa merece o melhor da energia solar, sem complicações.', 'sub': 'Descubra como a Avalia Solar está simplificando a transição energética para negócios inteligentes.', 'tag': 'Simplifique', 'svg_dec': sun_svg},
    {'title': 'Escolher o parceiro solar certo não deveria ser um risco.', 'sub': 'Propostas confusas, empresas sem histórico e orçamentos opacos geram incerteza. Nós mudamos esse jogo.', 'is_dark': True, 'tag': 'O Desafio'},
    {'title': 'Encontramos e validamos os melhores integradores para você.', 'sub': 'Não somos apenas um marketplace. Somos o seu consultor técnico que garante parceiros de elite.', 'is_gradient': True, 'tag': 'A Solução'},
    {'title': 'O que sua empresa ganha com a Avalia Solar?', 'items': [{'label':'Dados Comparados', 'desc':'Analise propostas lado a lado com clareza.'}, {'label':'Empresas Verificadas', 'desc':'Apenas integradores com histórico comprovado.'}, {'label':'Independência', 'desc':'Foco no seu ROI, não na venda de equipamentos.'}], 'tag': 'Benefícios B2B'},
    {'title': 'Prepare seu negócio para o futuro hoje mesmo.', 'cta': 'Faça seu cadastro gratuito', 'is_gradient': True, 'tag': '@avaliasolar'}
]
wrap_ig_frame(''.join([get_slide_html(i, len(m_slides), **s) for i, s in enumerate(m_slides)]), len(m_slides), "Energia solar sem riscos para sua empresa. Descubra como validamos o mercado.", "manifesto_simples.html")

# --- CAROUSEL 2: CONTA ZERADA ---
bulb_svg = '<svg width="100" height="120" viewBox="0 0 120 160" fill="none"><ellipse cx="60" cy="80" rx="45" ry="55" stroke="currentColor" stroke-width="4"/><line x1="45" y1="135" x2="75" y2="135" stroke="currentColor" stroke-width="4"/><line x1="48" y1="148" x2="72" y2="148" stroke="currentColor" stroke-width="4"/></svg>'
chart_svg = '<svg width="100" height="100" viewBox="0 0 100 100"><rect x="10" y="50" width="15" height="40" fill="currentColor" opacity="0.3"/><rect x="35" y="70" width="15" height="20" fill="currentColor" opacity="0.5"/><rect x="60" y="80" width="15" height="10" fill="currentColor"/></svg>'
c_slides = [
    {'title': 'A verdade sobre a conta de energia zerada com solar', 'sub': 'O que ninguém te contou sobre a fatura mínima obrigatória e o custo de disponibilidade.', 'tag': 'Educação Solar', 'svg_dec': bulb_svg},
    {'title': 'Economia real de até 95% do valor mensal', 'sub': 'Você ainda terá uma fatura, mas ela será drasticamente reduzida. O segredo está no custo de manutenção da rede.', 'is_dark': True, 'tag': 'Economia', 'svg_dec': chart_svg},
    {'title': 'A Legislação impede a fatura de chegar a zero', 'sub': 'Resolução ANEEL nº 1.000/2021: A infraestrutura de postes e fios precisa ser remunerada.', 'is_gradient': True, 'tag': 'Lei'},
    {'title': 'O Custo de Disponibilidade', 'items': [{'label':'Monofásico', 'desc':'Taxa equivalente a 30 kWh/mês.'}, {'label':'Bifásico', 'desc':'Taxa equivalente a 50 kWh/mês.'}, {'label':'Trifásico', 'desc':'Taxa equivalente a 100 kWh/mês.'}], 'tag': 'Taxa Mínima'},
    {'title': 'Simulações realistas evitam quebras de expectativa.', 'cta': 'Faça uma simulação gratuita', 'is_gradient': True, 'tag': '@avaliasolar'}
]
wrap_ig_frame(''.join([get_slide_html(i, len(c_slides), **s) for i, s in enumerate(c_slides)]), len(c_slides), "A verdade sobre a conta zerada. Planeje seu projeto solar com dados reais.", "conta_zerada_melhorado.html")
