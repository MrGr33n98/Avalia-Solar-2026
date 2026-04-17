import base64
import os

def get_base64_img(path):
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as image_file:
        ext = os.path.splitext(path)[1].replace(".", "")
        return f"data:image/{ext};base64," + base64.b64encode(image_file.read()).decode('utf-8')

def generate_high_def_asset_v2():
    # Assets
    LOGO_IMG = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\logo - Copy.png"
    PERSONA_IMG = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\persona-marketing.png"
    
    img_logo = get_base64_img(LOGO_IMG)
    img_persona = get_base64_img(PERSONA_IMG)
    
    output_path = r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\marketing_asset_reputacao.html"
    
    html = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avalia Solar — Marketing Asset Elite</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            :root {{
                --brand-blue: #0056D2;
                --brand-green: #34C759;
                --brand-slate: #0F172A;
                --clay-radius: 28px;
            }}

            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ 
                background: #f0f4f8; 
                font-family: 'Poppins', sans-serif; 
                display: flex; 
                justify-content: center; 
                padding: 50px 0;
            }}

            .asset-canvas {{
                width: 1080px;
                height: 1600px;
                background: linear-gradient(145deg, #ffffff 0%, #dbeafe 100%);
                position: relative;
                overflow: hidden;
                border-radius: 40px;
                box-shadow: 0 80px 160px rgba(0,0,0,0.1);
            }}

            /* Persona: POSICIONADA ATRÁS DAS CARTAS */
            .persona-layer {{
                position: absolute;
                top: 350px;
                right: -100px;
                width: 1100px; /* Bem grande para preencher o fundo */
                z-index: 10;
                opacity: 0.9;
                pointer-events: none;
            }}
            .persona-img {{
                width: 100%;
                filter: saturate(1.1) brightness(1.05);
                mask-image: linear-gradient(to bottom, black 50%, transparent 95%);
            }}

            /* UI Layer: NA FRENTE (Z-INDEX 100) */
            .glass-ui-layer {{
                position: relative;
                z-index: 100;
                padding: 80px 100px;
                height: 100%;
                display: flex;
                flex-direction: column;
            }}

            .logo {{ height: 75px; margin-bottom: 70px; }}

            .headline {{
                font-size: 80px;
                font-weight: 900;
                color: var(--brand-slate);
                line-height: 1.05;
                margin-bottom: 30px;
            }}
            .headline span {{ color: var(--brand-green); }}

            .subheadline {{
                font-size: 30px;
                color: #475569;
                max-width: 800px;
                margin-bottom: 60px;
                line-height: 1.4;
            }}

            /* Glass Cards */
            .glass-card {{
                background: rgba(255, 255, 255, 0.35); /* Transparência alta */
                backdrop-filter: blur(40px) saturate(200%); /* Blur forte para o efeito de vidro */
                -webkit-backdrop-filter: blur(40px) saturate(200%);
                border: 1px solid rgba(255, 255, 255, 0.5);
                border-radius: var(--clay-radius);
                padding: 40px;
                margin-bottom: 30px;
                width: 600px; /* Largura controlada para deixar a persona aparecer dos lados */
                box-shadow: 0 20px 50px rgba(0,0,0,0.04);
            }}

            .card-header {{ display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; }}
            .card-title {{ display: flex; align-items: center; gap: 15px; font-size: 26px; font-weight: 800; color: var(--brand-slate); }}
            .icon-box {{ width: 60px; height: 60px; background: rgba(0,86,210,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; }}

            .rating-badge {{ background: #fff; padding: 10px 18px; border-radius: 50px; font-weight: 800; font-size: 20px; }}
            .stars {{ color: #FBBF24; }}

            .benefit {{ display: flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 600; color: #334155; margin-bottom: 15px; }}
            .check {{ color: var(--brand-green); font-weight: 900; }}

            /* Reviews Column */
            .review-glass {{
                width: 450px;
                margin-left: 50px;
                background: rgba(255, 255, 255, 0.45);
                backdrop-filter: blur(25px);
                padding: 25px;
                border-radius: 20px;
                margin-bottom: 20px;
                border: 1px solid rgba(255, 255, 255, 0.4);
                box-shadow: 0 10px 30px rgba(0,0,0,0.06);
            }}

            /* Button */
            .cta-btn {{
                background: var(--brand-blue);
                color: white;
                padding: 24px 50px;
                border-radius: 100px;
                font-size: 28px;
                font-weight: 800;
                display: inline-block;
                margin-top: 40px;
                box-shadow: 0 20px 40px rgba(0,86,210,0.3);
            }}

            /* Stats at the bottom */
            .stats-glass-bar {{
                position: absolute;
                bottom: 80px;
                left: 100px;
                right: 100px;
                background: rgba(255,255,255,0.5);
                backdrop-filter: blur(40px);
                border-radius: 30px;
                padding: 40px;
                display: flex;
                justify-content: space-around;
                border: 1px solid rgba(255,255,255,0.6);
            }}
            .stat {{ text-align: center; }}
            .stat-val {{ font-size: 42px; font-weight: 900; color: var(--brand-blue); }}
            .stat-lbl {{ font-size: 16px; font-weight: 700; color: #64748B; text-transform: uppercase; }}

        </style>
    </head>
    <body>
        <div class="asset-canvas">
            
            <div class="persona-layer">
                <img src="{img_persona}" class="persona-img">
            </div>

            <div class="glass-ui-layer">
                <img src="{img_logo}" class="logo">
                
                <h1 class="headline">Amplifique a voz dos<br>seus <span>melhores clientes</span></h1>
                
                <p class="subheadline">
                    Transforme avaliações reais na sua maior ferramenta de vendas.
                    Lidere o mercado solar com transparência.
                </p>

                <div class="glass-card">
                    <div class="card-header">
                        <div class="card-title">
                            <div class="icon-box">🛡️</div>
                            Geração de Avaliações
                        </div>
                        <div class="rating-badge">
                            <span class="stars">★★★★★</span> 4.9
                        </div>
                    </div>
                    <div class="benefit"><span class="check">✔</span> Conquiste a confiança do mercado</div>
                    <div class="benefit"><span class="check">✔</span> Seja reconhecido como solução líder</div>
                </div>

                <div class="glass-card" style="width: 550px;">
                    <div class="card-header">
                        <div class="card-title">
                            <div class="icon-box">🏆</div>
                            Premiações e Selos
                        </div>
                    </div>
                    <div class="benefit"><span class="check">✔</span> Desponte de sua concorrência</div>
                    <div class="benefit" style="margin-bottom: 0;"><span class="check">✔</span> Entenda a mente dos seus clientes</div>
                </div>

                <div class="review-glass">
                    <div style="font-weight: 800; margin-bottom: 10px;">Felipe M. <span class="stars">★★★★★</span></div>
                    <p style="font-size: 17px; font-style: italic; color: #475569;">"Serviço excelente, instalação rápida e eficiente."</p>
                </div>

                <div class="cta-btn">Amplificar reputação agora</div>
            </div>

            <div class="stats-glass-bar">
                <div class="stat">
                    <div class="stat-val">863</div>
                    <div class="stat-lbl">Avaliações</div>
                </div>
                <div class="stat">
                    <div class="stat-val">4.9</div>
                    <div class="stat-lbl">Média</div>
                </div>
                <div class="stat">
                    <div class="stat-val">98%</div>
                    <div class="stat-lbl">Confiança</div>
                </div>
            </div>

        </div>
    </body>
    </html>
    """
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Asset gerado com Sucesso: {output_path}")

if __name__ == "__main__":
    generate_high_def_asset_v2()
