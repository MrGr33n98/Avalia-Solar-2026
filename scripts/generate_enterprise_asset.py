import base64
import os

def get_base64_img(path):
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as image_file:
        ext = os.path.splitext(path)[1].replace(".", "")
        return f"data:image/{ext};base64," + base64.b64encode(image_file.read()).decode('utf-8')

def generate_enterprise_reputation_asset():
    # Assets
    LOGO_IMG = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\logo - Copy.png"
    
    img_logo = get_base64_img(LOGO_IMG)
    
    output_path = r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\enterprise_reputation_asset.html"
    
    html = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avalia Solar — Enterprise Reputation</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            :root {{
                --brand-blue: #0056D2;
                --brand-green: #34C759;
                --brand-slate: #0F172A;
                --clay-radius: 32px;
            }}

            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ 
                background: #F8FAFC; 
                font-family: 'Poppins', sans-serif; 
                display: flex; 
                justify-content: center; 
                padding: 100px 0;
            }}

            .asset-canvas {{
                width: 1080px;
                height: 1350px; /* 4:5 Instagram Portrait */
                background: #FFFFFF;
                position: relative;
                overflow: hidden;
                border-radius: 0px; /* Clean for export */
                display: flex;
                flex-direction: column;
                padding: 100px;
            }}

            /* Background Grid */
            .bg-grid {{
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background-image: 
                    linear-gradient(rgba(0, 86, 210, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 86, 210, 0.03) 1px, transparent 1px);
                background-size: 60px 60px;
                z-index: 1;
            }}

            .content-layer {{
                position: relative;
                z-index: 10;
                display: flex;
                flex-direction: column;
                height: 100%;
            }}

            .logo {{ height: 80px; margin-bottom: 80px; }}

            .headline {{
                font-size: 86px;
                font-weight: 900;
                color: var(--brand-slate);
                line-height: 1.1;
                margin-bottom: 20px;
            }}
            .headline span {{ color: var(--brand-blue); }}

            .subheadline {{
                font-size: 34px;
                color: #64748B;
                margin-bottom: 80px;
                line-height: 1.4;
                font-weight: 500;
            }}

            /* Enterprise Cards Layout */
            .cards-container {{
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 80px;
            }}

            .enterprise-card {{
                background: #FFFFFF;
                border-radius: var(--clay-radius);
                padding: 50px;
                box-shadow: 0 40px 80px rgba(0,0,0,0.06);
                border: 1px solid #E2E8F0;
                display: flex;
                flex-direction: column;
                gap: 30px;
            }}

            .card-icon {{
                width: 80px;
                height: 80px;
                background: #F1F5F9;
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
            }}

            .card-title {{ font-size: 32px; font-weight: 800; color: var(--brand-slate); }}
            
            .benefit-item {{ display: flex; align-items: flex-start; gap: 15px; font-size: 20px; color: #475569; line-height: 1.4; }}
            .check {{ color: var(--brand-green); font-weight: 900; }}

            /* Analytics Banner at the bottom */
            .stats-banner {{
                margin-top: auto;
                background: var(--brand-slate);
                border-radius: 30px;
                padding: 50px;
                display: flex;
                justify-content: space-around;
                color: white;
                box-shadow: 0 30px 60px rgba(15,23,42,0.3);
            }}

            .stat-box {{ text-align: center; }}
            .stat-num {{ font-size: 52px; font-weight: 900; color: #fff; margin-bottom: 5px; }}
            .stat-txt {{ font-size: 18px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 2px; }}

            /* Final Tag */
            .tagline {{
                position: absolute;
                bottom: 40px;
                left: 0; right: 0;
                text-align: center;
                font-size: 18px;
                font-weight: 700;
                color: var(--brand-blue);
                letter-spacing: 5px;
            }}
        </style>
    </head>
    <body>
        <div class="asset-canvas">
            <div class="bg-grid"></div>
            
            <div class="content-layer">
                <h1 class="headline">Reputação de<br><span>Classe Enterprise</span></h1>
                
                <p class="subheadline">
                    Validação de confiança em larga escala para os maiores integradores do Brasil.
                </p>

                <div class="cards-container">
                    <div class="enterprise-card">
                        <div class="card-icon">🏗️</div>
                        <h2 class="card-title">Infraestrutura Trust as a Service</h2>
                        <div class="benefit-item">
                            <span class="check">✔</span> Monitoramento de reputação em tempo real.
                        </div>
                        <div class="benefit-item">
                            <span class="check">✔</span> Dashboards analíticos de intenção de compra.
                        </div>
                    </div>

                    <div class="enterprise-card">
                        <div class="card-icon">⚡</div>
                        <h2 class="card-title">Aceleração de Liderança</h2>
                        <div class="benefit-item">
                            <span class="check">✔</span> Posicionamento no topo dos resultados regionais.
                        </div>
                        <div class="benefit-item">
                            <span class="check">✔</span> Selos de verificação para B2B e grandes obras.
                        </div>
                    </div>
                </div>

                <div class="stats-banner">
                    <div class="stat-box">
                        <div class="stat-num">4.9/5.0</div>
                        <div class="stat-txt">Média de Confiança</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-num">1.2M+</div>
                        <div class="stat-txt">Sinais de Intenção</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-num">98%</div>
                        <div class="stat-txt">Validação Real</div>
                    </div>
                </div>

                <div class="tagline">AVALIA SOLAR • ENTERPRISE</div>
            </div>
        </div>
    </body>
    </html>
    """
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Asset Enterprise gerado sem a persona: {output_path}")

if __name__ == "__main__":
    generate_enterprise_reputation_asset()
