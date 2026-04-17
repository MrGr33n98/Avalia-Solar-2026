import base64
import os

def get_base64_img(path):
    if not os.path.exists(path):
        # Fallback to local placeholders or empty string
        return ""
    with open(path, "rb") as image_file:
        return "data:image/png;base64," + base64.b64encode(image_file.read()).decode('utf-8')

def generate_ally_carousel():
    # Asset paths
    SAAS_DIR = r"c:\Users\Bobi\Desktop\AB0-1-main\videos\public\saas"
    PUBLIC_DIR = r"c:\Users\Bobi\Desktop\AB0-1-main\videos\public"
    PERSONA_IMG = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\persona-marketing.png"
    FAVICON = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\favicon.ico"
    OUTPUT_PATH = r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\company_ally_carousel.html"
    
    # Load images
    img_capa = get_base64_img(PERSONA_IMG)
    img_favicon = get_base64_img(FAVICON)
    
    # New Assets
    img_free = get_base64_img(os.path.join(PUBLIC_DIR, "br-free-3.png"))
    img_rev = get_base64_img(os.path.join(PUBLIC_DIR, "br-rev-3.png"))
    img_cena = get_base64_img(os.path.join(PUBLIC_DIR, "cena-05.png"))
    
    # SaaS Images
    s_01 = get_base64_img(os.path.join(SAAS_DIR, "01.png"))
    s_02 = get_base64_img(os.path.join(SAAS_DIR, "02.png"))
    s_04 = get_base64_img(os.path.join(SAAS_DIR, "04.png"))
    s_07 = get_base64_img(os.path.join(SAAS_DIR, "07.png"))
    s_09 = get_base64_img(os.path.join(SAAS_DIR, "09.png"))

    slides = [
        {
            "title": "Muito mais que um marketplace",
            "subtitle": "Avalia Solar: O aliado estratégico que escala sua autoridade.",
            "bg": "linear-gradient(135deg, #0056D2, #001A3D)",
            "color": "white",
            "img": img_capa,
            "type": "cover"
        },
        {
            "title": "Insights que Transformam",
            "subtitle": "Dados reais sobre sua performance para decisões inteligentes e lucrativas.",
            "bg": "#F8FAFC",
            "color": "#0F172A",
            "img": s_01,
            "type": "asset"
        },
        {
            "title": "Posicionamento de Peso",
            "subtitle": "Diferencie-se no mercado com métricas de confiança verificáveis.",
            "bg": "#0D1B2A",
            "color": "white",
            "img": img_free,
            "type": "asset"
        },
        {
            "title": "Liderança de Mercado",
            "subtitle": "Ocupe o quadrante dos líderes e seja a primeira escolha dos clientes.",
            "bg": "#F8FAFC",
            "color": "#0F172A",
            "img": s_07,
            "type": "asset"
        },
        {
            "title": "Presença Online Atômica",
            "subtitle": "Sua reputação em destaque em toda a web, 24 horas por dia.",
            "bg": "#0D1B2A",
            "color": "white",
            "img": img_rev,
            "type": "asset"
        },
        {
            "title": "Autoridade em Pauta",
            "subtitle": "Liderança técnica reconhecida pelo mercado e pela prensa especializada.",
            "bg": "#F8FAFC",
            "color": "#0F172A",
            "img": img_cena,
            "type": "asset"
        },
        {
            "title": "Vamos liderar o setor juntos?",
            "subtitle": "Escalamos seu Trust Score para que seu negócio nunca pare de crescer.",
            "bg": "white",
            "color": "#0056D2",
            "img": img_favicon,
            "type": "cta"
        }
    ]

    slides_html = []
    for i, slide in enumerate(slides):
        content = ""
        if slide["type"] == "cover":
            content = f"""
                <div class="slide-content" style="background:{slide['bg']}; color:{slide['color']}">
                    <div style="padding: 40px; position: relative; z-index: 50;">
                        <h1 style="font-size: 38px; font-weight: 800; line-height: 1.1; margin-bottom: 20px;">{slide['title']}</h1>
                        <p style="font-size: 18px; opacity: 0.9;">{slide['subtitle']}</p>
                    </div>
                    <div class="media-container" style="position: absolute; bottom: 0; right: 0; width: 100%; height: 75%; opacity: 0.9; z-index: 10; display: flex; align-items: flex-end; justify-content: flex-end;">
                        <img src="{slide['img']}" style="max-width: 100%; max-height: 100%; object-fit: contain; object-position: bottom right;">
                    </div>
                    <div class="logo-abs"><img src="{img_favicon}" width="40"></div>
                </div>
            """
        elif slide["type"] == "cta":
             content = f"""
                <div class="slide-content" style="background:{slide['bg']}; color:{slide['color']}; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px;">
                    <img src="{slide['img']}" width="100" style="margin-bottom: 30px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));">
                    <h1 style="font-size: 32px; font-weight: 800; margin-bottom: 20px;">{slide['title']}</h1>
                    <p style="font-size: 18px; margin-bottom: 40px; color: #64748B;">{slide['subtitle']}</p>
                    <div class="cta-button" style="background: #0056D2; color: white; padding: 16px 40px; border-radius: 50px; font-weight: 800; font-size: 18px; box-shadow: 0 10px 25px rgba(0,86,210,0.3);">AGENDAR DEMO</div>
                    <p style="margin-top: 30px; font-weight: 600; font-size: 14px; color: #94A3B8;">@avaliasolar.pro</p>
                </div>
            """
        else:
            content = f"""
                <div class="slide-content" style="background:{slide['bg']}; color:{slide['color']}">
                    <div style="padding: 40px; position: relative; z-index: 10;">
                        <span style="font-weight: 800; color: #0056D2; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">0{i+1} — ALIADO ESTRATÉGICO</span>
                        <h2 style="font-size: 34px; font-weight: 800; margin-top: 10px; margin-bottom: 10px;">{slide['title']}</h2>
                        <p style="font-size: 16px; opacity: 0.8; max-width: 80%;">{slide['subtitle']}</p>
                    </div>
                    <div class="clay-device-mockup" style="margin: 0 20px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.15); border: 4px solid #fff; background: white;">
                        <img src="{slide['img']}" style="width: 100%; display: block;">
                    </div>
                </div>
            """
        slides_html.append(f'<div class="slide">{content}</div>')

    html = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avalia Solar — Aliado Estratégico</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ background: #0F172A; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Poppins', sans-serif; overflow: hidden; }}
            .ig-frame {{ width: 420px; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.5); position: relative; }}
            .ig-header {{ padding: 12px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #f1f5f9; }}
            .ig-avatar {{ width: 32px; height: 32px; border-radius: 50%; background: #0056D2; display: flex; align-items: center; justify-content: center; }}
            .ig-user {{ font-size: 14px; font-weight: 700; color: #1e293b; }}
            .viewport {{ width: 420px; aspect-ratio: 4/5; overflow: hidden; position: relative; }}
            .track {{ display: flex; width: calc(420px * {len(slides)}); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }}
            .slide {{ width: 420px; height: 525px; flex-shrink: 0; }}
            .slide-content {{ width: 100%; height: 100%; position: relative; display: flex; flex-direction: column; overflow: hidden; }}
            .logo-abs {{ position: absolute; top: 15px; right: 20px; background: rgba(255,255,255,0.1); backdrop-filter: blur(5px); padding: 8px; border-radius: 10px; }}
            
            .controls {{ position: absolute; bottom: 85px; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; z-index: 100; }}
            .dot {{ width: 6px; height: 6px; border-radius: 50%; background: rgba(0,0,0,0.15); transition: 0.3s; cursor: pointer; }}
            .dot.active {{ background: #0056D2; width: 16px; border-radius: 3px; }}

            .nav-btn {{ position: absolute; top: 45%; transform: translateY(-50%); width: 40px; height: 40px; background: #fff; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 200; font-weight: 800; color: #0056D2; opacity: 0.6; transition: 0.2s; }}
            .nav-btn:hover {{ opacity: 1; scale: 1.1; }}
            .prev {{ left: 10px; }}
            .next {{ right: 10px; }}

            .ig-actions {{ padding: 12px 16px; display: flex; justify-content: space-between; }}
            .ig-left {{ display: flex; gap: 16px; }}
        </style>
    </head>
    <body onkeydown="handleKey(event)">
        <div class="ig-frame">
            <div class="ig-header">
                <div class="ig-avatar"><img src="{img_favicon}" width="20"></div>
                <div class="ig-user">avaliasolar.pro</div>
            </div>
            <div class="viewport">
                <div class="nav-btn prev" onclick="move(-1)">‹</div>
                <div class="nav-btn next" onclick="move(1)">›</div>
                <div class="track" id="track">{"".join(slides_html)}</div>
                <div class="controls" id="dots">
                    {"".join([f'<div class="dot {"active" if i==0 else ""}" onclick="goTo({i})"></div>' for i in range(len(slides))])}
                </div>
            </div>
            <div class="ig-actions">
                <div class="ig-left">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </div>
        </div>

        <script>
            let current = 0;
            const total = {len(slides)};
            const track = document.getElementById('track');
            const dots = document.querySelectorAll('.dot');
            
            function update() {{
                track.style.transform = `translateX(-${{current * 420}}px)`;
                dots.forEach((d, i) => d.classList.toggle('active', i === current));
            }}
            
            function move(dir) {{
                current = (current + dir + total) % total;
                update();
            }}
            
            function goTo(idx) {{
                current = idx;
                update();
            }}

            function handleKey(e) {{
                if (e.key === 'ArrowRight') move(1);
                if (e.key === 'ArrowLeft') move(-1);
            }}
        </script>
    </body>
    </html>
    """
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated: {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_ally_carousel()
