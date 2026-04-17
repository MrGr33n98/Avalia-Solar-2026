import base64
import os
import json
from dataclasses import dataclass
from typing import List, Dict, Optional

# --- CONFIGURAÇÃO E ASSETS ---

@dataclass
class AssetPaths:
    LOGO: str = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\logo - Copy.png"
    PERSONA: str = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\persona-marketing.png"
    FAVICON: str = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\favicon.ico"
    
    # Imagens Geradas via IA / Mockups
    IMG_EV: str = r"C:\Users\Bobi\.gemini\antigravity\brain\4a11b75c-4040-4830-b5d1-b0b02ccd4427\floripa_ev_mobility_coastal_1775060558622.png"
    IMG_BADGE: str = r"C:\Users\Bobi\.gemini\antigravity\brain\4a11b75c-4040-4830-b5d1-b0b02ccd4427\floripa_exclusive_20_badge_1775060592611.png"
    IMG_TRUST: str = r"C:\Users\Bobi\.gemini\antigravity\brain\4a11b75c-4040-4830-b5d1-b0b02ccd4427\floripa_verification_badge_premium_1775060610591.png"
    IMG_WORK: str = r"C:\Users\Bobi\.gemini\antigravity\brain\4a11b75c-4040-4830-b5d1-b0b02ccd4427\floripa_workspace_cta_premium_1775060631116.png"

class CarouselEngine:
    def __init__(self, output_path: str):
        self.output_path = output_path
        self.assets = AssetPaths()
        self.base64_cache = {}

    def get_base64(self, path: str) -> str:
        if path in self.base64_cache:
            return self.base64_cache[path]
        
        if not os.path.exists(path):
            print(f"Alerta: Arquivo não encontrado: {path}")
            return ""
            
        ext = os.path.splitext(path)[1].replace(".", "")
        mime = f"image/{ext}" if ext != "ico" else "image/x-icon"
        
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
            data_uri = f"data:{mime};base64,{b64}"
            self.base64_cache[path] = data_uri
            return data_uri

    def _generate_css(self, slide_count: int) -> str:
        return f"""
        <style>
            :root {{
                --brand-blue: #0056D2;
                --brand-dark: #0F172A;
                --brand-gray: #64748B;
                --clay-radius: 24px;
                --transition: 0.6s cubic-bezier(0.23, 1, 0.32, 1);
            }}

            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ 
                background: #070B14; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                font-family: 'Poppins', sans-serif;
                overflow: hidden;
            }}

            /* IG Container */
            .ig-container {{ 
                width: 420px; 
                height: 525px; /* 4:5 Aspect Ratio */
                background: #fff; 
                border-radius: 32px; 
                overflow: hidden; 
                box-shadow: 0 40px 100px rgba(0,0,0,0.6); 
                position: relative; 
            }}

            .track {{ 
                display: flex; 
                width: calc(420px * {slide_count}); 
                height: 100%;
                transition: transform var(--transition); 
            }}

            .slide {{ 
                width: 420px; 
                height: 100%; 
                flex-shrink: 0; 
                position: relative;
                overflow: hidden;
            }}

            /* Typography */
            h1, h2 {{ line-height: 1.1; font-weight: 800; }}
            p {{ line-height: 1.5; }}

            /* Components */
            .header {{ 
                padding: 30px 40px; 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                z-index: 100;
                position: relative;
            }}

            .tag {{ 
                background: var(--brand-blue); 
                color: white; 
                padding: 6px 14px; 
                font-weight: 900; 
                border-radius: 10px; 
                font-size: 10px; 
                letter-spacing: 1.5px;
                text-transform: uppercase;
            }}

            .content {{ padding: 0 40px; position: relative; z-index: 50; }}
            
            .persona-img {{ 
                position: absolute; 
                bottom: 0; 
                right: 5%; 
                width: 45%;  /* Reduzido conforme solicitado */
                height: auto; 
                z-index: 10;
                filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15));
                mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
            }}

            .mockup-container {{
                margin-top: 20px;
                width: 100%;
                height: 240px;
                display: flex;
                align-items: center;
                justify-content: center;
                perspective: 1000px;
            }}

            .mockup-img {{
                width: 85%;
                border-radius: 18px;
                box-shadow: 0 25px 50px rgba(0,0,0,0.15);
                border: 3px solid #fff;
                transform: rotateX(5deg) rotateY(-5deg);
            }}

            .footer {{
                position: absolute;
                bottom: 30px;
                left: 40px;
                right: 40px;
                z-index: 100;
            }}

            .cta-button {{
                display: inline-block;
                background: var(--brand-blue);
                color: white;
                padding: 16px 32px;
                border-radius: 50px;
                font-weight: 800;
                font-size: 16px;
                box-shadow: 0 15px 30px rgba(0,86,210,0.3);
                cursor: pointer;
                transition: transform 0.3s;
            }}

            /* Navigation */
            .nav-overlay {{
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                pointer-events: none;
                z-index: 999;
            }}
            .nav-area {{
                position: absolute;
                top: 0; height: 100%; width: 20%;
                cursor: pointer;
                pointer-events: auto;
            }}
            .nav-left {{ left: 0; }}
            .nav-right {{ right: 0; }}

            .pagination {{
                position: absolute;
                bottom: 15px;
                left: 0; right: 0;
                display: flex;
                justify-content: center;
                gap: 8px;
                z-index: 1000;
            }}
            .dot {{ 
                width: 6px; height: 6px; border-radius: 3px; 
                background: rgba(0,0,0,0.1); transition: 0.3s; 
            }}
            .dot.active {{ background: var(--brand-blue); width: 24px; }}
            
            /* Themes */
            .theme-dark {{ background: var(--brand-dark); color: white; }}
            .theme-light {{ background: #fff; color: var(--brand-dark); }}
            .theme-blue {{ background: var(--brand-blue); color: white; }}
            .theme-accent {{ background: #C4704A; color: white; }}
        </style>
        """

    def render_slide(self, slide: Dict, index: int, total: int) -> str:
        theme_class = f"theme-{slide.get('theme', 'light')}"
        
        # Header
        header_html = f"""
        <div class="header">
            <img src="{self.get_base64(self.assets.LOGO)}" height="35" style="filter: {'brightness(0) invert(1)' if 'light' not in theme_class else 'none'}">
            <div class="tag">{slide.get('tag', 'AVALIA SOLAR')}</div>
        </div>
        """ if slide.get('show_header', True) else ""

        # Content
        persona_html = f'<img src="{self.get_base64(self.assets.PERSONA)}" class="persona-img">' if slide.get('show_persona') else ""
        
        mockup_html = ""
        if slide.get('img_path'):
            mockup_html = f"""
            <div class="mockup-container">
                <img src="{self.get_base64(slide['img_path'])}" class="mockup-img">
            </div>
            """

        footer_html = f"""
        <div class="footer">
            <p style="font-weight: 700; font-size: 14px; opacity: 0.9; margin-bottom: 5px;">{slide.get('footer_text', '')}</p>
            <div style="height: 4px; width: 40px; background: { 'white' if 'light' not in theme_class else '#0056D2' }; border-radius: 2px;"></div>
        </div>
        """

        return f"""
        <div class="slide {theme_class}">
            {header_html}
            <div class="content">
                <h2 style="font-size: 38px; margin-top: 20px;">{slide['title']}</h2>
                <p style="font-size: 18px; margin-top: 15px; opacity: 0.8; font-weight: 500;">{slide['subtitle']}</p>
                {mockup_html}
            </div>
            {persona_html}
            {footer_html}
            {f'<div style="position: absolute; bottom: 80px; left: 40px;"><div class="cta-button">{slide["cta"]}</div></div>' if slide.get('cta') else ''}
        </div>
        """

    def build(self):
        slides = [
            {
                "title": "A Liderança Solar Chegou.",
                "subtitle": "Valide sua reputação e domine o mercado regional de Florianópolis.",
                "tag": "Lançamento",
                "theme": "light",
                "show_persona": True,
                "footer_text": "Arraste para começar a jornada"
            },
            {
                "title": "Muito mais que um cadastro.",
                "subtitle": "Conectamos os melhores integradores a clientes de alto valor.",
                "tag": "Comunidade",
                "theme": "dark",
                "img_path": self.assets.IMG_TRUST,
                "footer_text": "Segurança e Confiança Real"
            },
            {
                "title": "Mobilidade Elétrica.",
                "subtitle": "O futuro da ilha passa pela energia limpa em movimento.",
                "tag": "Expansão",
                "theme": "blue",
                "img_path": self.assets.IMG_EV,
                "footer_text": "Liderança de Categoria"
            },
            {
                "title": "Ocupe o Topo do Ranking.",
                "subtitle": "Mostre sua autoridade com pontuações reais e verificadas.",
                "tag": "Reputação",
                "theme": "light",
                "img_path": self.assets.IMG_WORK,
                "footer_text": "Sua marca merecida no topo"
            },
            {
                "title": "Um presente para os 20 primeiros.",
                "subtitle": "Garanta 30 dias de Plano Premium grátis e destaque sua empresa.",
                "tag": "Exclusivo",
                "theme": "accent",
                "img_path": self.assets.IMG_BADGE,
                "footer_text": "Promoção de Lançamento"
            },
            {
                "title": "Sua jornada rumo ao topo começa agora.",
                "subtitle": "Transforme seu negócio na maior autoridade solar da região.",
                "tag": "Convite",
                "theme": "light",
                "show_persona": True,
                "cta": "QUERO SER LÍDER",
                "footer_text": "Acesse o link na BIO"
            }
        ]

        slides_html = [self.render_slide(s, i, len(slides)) for i, s in enumerate(slides)]
        dots_html = "".join([f'<div class="dot {"active" if i==0 else ""}"></div>' for i in range(len(slides))])

        html_content = f"""
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Avalia Solar - Carrossel de Lançamento</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            {self._generate_css(len(slides))}
        </head>
        <body>
            <div class="ig-container">
                <div class="nav-overlay">
                    <div class="nav-area nav-left" onclick="move(-1)"></div>
                    <div class="nav-area nav-right" onclick="move(1)"></div>
                </div>
                <div class="track" id="track">
                    {"".join(slides_html)}
                </div>
                <div class="pagination">
                    {dots_html}
                </div>
            </div>

            <script>
                let current = 0;
                const total = {len(slides)};
                const track = document.getElementById('track');
                const dots = document.querySelectorAll('.dot');

                function move(dir) {{
                    current = (current + dir + total) % total;
                    update();
                }}

                function update() {{
                    track.style.transform = `translateX(-${{current * 420}}px)`;
                    dots.forEach((dot, idx) => {{
                        dot.classList.toggle('active', idx === current);
                    }});
                }}

                document.addEventListener('keydown', (e) => {{
                    if(e.key === 'ArrowRight') move(1);
                    if(e.key === 'ArrowLeft') move(-1);
                }});
            </script>
        </body>
        </html>
        """

        with open(self.output_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        
        print(f"Sucesso! Carrossel refatorado gerado em: {self.output_path}")

if __name__ == "__main__":
    engine = CarouselEngine(r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\launch_carousel_v2.html")
    engine.build()
