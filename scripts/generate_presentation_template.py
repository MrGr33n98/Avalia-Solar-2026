import base64
import os
from pathlib import Path

def get_base64_img(path):
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as image_file:
        ext = os.path.splitext(path)[1].replace(".", "")
        return f"data:image/{ext};base64," + base64.b64encode(image_file.read()).decode('utf-8')

def generate_presentation_template():
    # Assets
    LOGO_IMG = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\logo - Copy.png"
    BG_ASSET = r"C:\Users\Bobi\.gemini\antigravity\brain\4a11b75c-4040-4830-b5d1-b0b02ccd4427\media__1775065853995.png"
    
    img_logo = get_base64_img(LOGO_IMG)
    img_bg_tech = get_base64_img(BG_ASSET)
    
    output_path = r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\presentation_template.html"
    
    html = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avalia Solar — Template de Apresentação</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            :root {{
                --brand-blue: #0056D2;
                --brand-green: #34C759;
                --brand-dark: #0F172A;
                --bg-light: #F8FAFC;
            }}

            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            
            body {{
                background: #E2E8F0;
                font-family: 'Poppins', sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 40px;
            }}

            /* Slide Canvas (Standard 16:9 for presentations) */
            .slide-canvas {{
                width: 1920px;
                height: 1080px;
                background: white;
                position: relative;
                overflow: hidden;
                box-shadow: 0 40px 100px rgba(0,0,0,0.2);
                border-radius: 0;
                /* Scale for preview in browser (responsive-ish) */
                transform: scale(0.6);
                transform-origin: top center;
                margin-bottom: -432px; /* Offset for the scale */
            }}

            /* Background Elements */
            .bg-tech-layer {{
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background-image: url('{img_bg_tech}');
                background-size: cover;
                opacity: 0.15;
                z-index: 1;
                filter: grayscale(1) brightness(1.2);
            }}

            .bg-gradient {{
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at 10% 10%, rgba(0, 86, 210, 0.05) 0%, transparent 50%),
                            radial-gradient(circle at 90% 90%, rgba(52, 199, 89, 0.05) 0%, transparent 50%);
                z-index: 2;
            }}

            /* Content Grid */
            .main-frame {{
                position: relative;
                z-index: 10;
                height: 100%;
                width: 100%;
                padding: 80px 120px;
                display: flex;
                flex-direction: column;
            }}

            /* Logo Positioning */
            .header-logo {{
                height: 100px;
                width: auto;
                margin-bottom: 60px;
            }}

            /* Placeholder Content */
            .slide-title-area {{
                margin-top: 100px;
                max-width: 1200px;
            }}

            .slide-title {{
                font-size: 110px;
                font-weight: 900;
                color: var(--brand-dark);
                line-height: 1.1;
                margin-bottom: 40px;
            }}
            .slide-title span {{ color: var(--brand-blue); }}

            .divider {{
                width: 150px;
                height: 12px;
                background: var(--brand-blue);
                border-radius: 6px;
                margin-bottom: 60px;
            }}

            .footer {{
                margin-top: auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid rgba(0,0,0,0.05);
                padding-top: 40px;
            }}

            .footer-info {{
                font-size: 18px;
                font-weight: 700;
                color: #94A3B8;
                letter-spacing: 5px;
                text-transform: uppercase;
            }}

            .page-number {{
                font-size: 24px;
                font-weight: 900;
                color: var(--brand-blue);
            }}

            /* UI Hint */
            .hint {{
                margin-top: 20px;
                color: #64748B;
                font-weight: 600;
            }}

        </style>
    </head>
    <body>
        
        <div class="slide-canvas">
            <div class="bg-tech-layer"></div>
            <div class="bg-gradient"></div>

            <div class="main-frame">
                <img src="{img_logo}" class="header-logo">
                
                <div class="slide-title-area">
                    <div class="divider"></div>
                    <h1 class="slide-title">Título do Seu Slide<br><span>Apresentation Enterprise</span></h1>
                </div>

                <div class="footer">
                    <div class="footer-info">AVALIA SOLAR • {os.popen('date /t').read().strip()}</div>
                    <div class="page-number">01</div>
                </div>
            </div>
        </div>

        <p class="hint">Preview em escala 16:9 (1920x1080). Use este HTML como base para seus slides.</p>

    </body>
    </html>
    """
    
    Path(output_path).write_text(html, encoding="utf-8")
    print(f"Template de Apresentação gerado: {output_path}")

if __name__ == "__main__":
    generate_presentation_template()
