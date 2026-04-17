import base64
from pathlib import Path

def generate_welcome_carousel():
    logo_path = Path(r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\logo.png")
    output_path = Path(r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\boas_vindas_carousel.html")
    
    # Encode logo
    with open(logo_path, "rb") as f:
        logo_base64 = base64.b64encode(f.read()).decode()
    
    logo_img = f"data:image/png;base64,{logo_base64}"
    
    # Logo snippet for avatar and badges
    # The user has several SVG logos to replace.
    # 1. ig-avatar
    # 2. slide 1 clay-badge
    # 3. slide 2 logo
    # 4. slide 3 logo
    # 5. slide 4 logo
    # 6. slide 5 large logo
    
    # Refined logo HTML (using actual logo)
    logo_html = f'<img src="{logo_img}" style="height: 34px; width: auto;" alt="Avalia Solar Logo">'
    large_logo_html = f'<img src="{logo_img}" style="height: 68px; width: auto;" alt="Avalia Solar Logo">'
    avatar_logo_html = f'<img src="{logo_img}" style="height: 100%; width: 100%; object-fit: contain;" alt="Logo">'

    # Full HTML provided by user, modified
    html = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Avalia Solar — Boas-vindas</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#0D1B2A;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;font-family:'Poppins',sans-serif;}
.ig-frame{width:420px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 28px 90px rgba(0,0,0,0.65);user-select:none;}
.ig-header{padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #eef1f8;background:#fff;}
.ig-avatar{width:36px;height:36px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #eef1f8;}
.ig-meta{flex:1;}
.ig-handle{font-size:13px;font-weight:700;color:#1a1a1a;}
.ig-sub{font-size:11px;color:#7A8EA8;}
.ig-more{font-size:20px;color:#9e9e9e;cursor:pointer;}
.carousel-viewport{width:420px;aspect-ratio:4/5;overflow:hidden;position:relative;cursor:grab;}
.carousel-viewport:active{cursor:grabbing;}
.carousel-track{display:flex;width:calc(420px * 6);transition:transform 0.35s cubic-bezier(.4,0,.2,1);}
.slide{width:420px;height:525px;flex-shrink:0;position:relative;overflow:hidden;}
.ig-dots{display:flex;align-items:center;justify-content:center;gap:5px;padding:10px 0 6px;background:#fff;}
.dot{width:6px;height:6px;border-radius:50%;background:#dde5f5;transition:all .3s;cursor:pointer;}
.dot.active{background:#0056D2;width:14px;border-radius:3px;}
.ig-actions{padding:10px 16px 4px;display:flex;gap:14px;align-items:center;background:#fff;}
.ig-caption{padding:6px 16px 14px;background:#fff;}
.ig-cap-text{font-size:12px;color:#3a3a3a;line-height:1.45;}
.ig-time{font-size:10px;color:#b0b8c8;margin-top:4px;}
</style>
</head>
<body>

<div class="ig-frame">
  <div class="ig-header">
    <div class="ig-avatar">""" + avatar_logo_html + """</div>
    <div class="ig-meta">
      <div class="ig-handle">avaliasolar</div>
      <div class="ig-sub">Avalia Solar · Energia &amp; Mobilidade B2B</div>
    </div>
    <span class="ig-more">···</span>
  </div>

  <div class="carousel-viewport" id="vp">
    <div class="carousel-track" id="track">
      
<div class="slide" style="background:#F0F4FF;position:relative;">
  <!-- subtle grid -->
  <div style="position:absolute;inset:0;background-image:linear-gradient(#D8E2F5 1px,transparent 1px),linear-gradient(90deg,#D8E2F5 1px,transparent 1px);background-size:36px 36px;opacity:0.5;"></div>

  <!-- hero graphic -->
  <div style="position:absolute;top:30px;right:20px;opacity:0.82;"><svg width="130" height="130" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sg1" cx="40%" cy="40%">
      <stop offset="0%"   stop-color="#FFF176"/>
      <stop offset="50%"  stop-color="#00B4D8" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#0056D2" stop-opacity="0.6"/>
    </radialGradient>
  </defs>
  <!-- glow -->
  <circle cx="65" cy="55" r="46" fill="url(#sg1)" opacity="0.18"/>
  <!-- sol -->
  <circle cx="65" cy="50" r="24" fill="url(#sg1)" opacity="0.9"/>
  <!-- raios -->
  <line x1="65" y1="10" x2="65" y2="2"  stroke="#00B4D8" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="65" y1="98" x2="65" y2="90" stroke="#00B4D8" stroke-width="3.5" stroke-linecap="round" opacity="0.5"/>
  <line x1="15" y1="50" x2="7"  y2="50" stroke="#00B4D8" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="123" y1="50" x2="115" y2="50" stroke="#00B4D8" stroke-width="3.5" stroke-linecap="round" opacity="0.5"/>
  <line x1="29" y1="17" x2="23" y2="11" stroke="#00B4D8" stroke-width="3" stroke-linecap="round"/>
  <line x1="101" y1="17" x2="107" y2="11" stroke="#00B4D8" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  <!-- escudo -->
  <path d="M65 70 C45 70 38 82 38 92 C38 105 50 118 65 122 C80 118 92 105 92 92 C92 82 85 70 65 70Z"
        fill="#0056D2" opacity="0.85" rx="10"/>
  <path d="M56 94 L62 100 L76 87" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg></div>

  <!-- Logo (replaces SVG) -->
  <div style="position:absolute;top:36px;left:36px;">
    """ + logo_html + """
  </div>

  <div style="position:relative;z-index:2;padding:40px 36px 64px;display:flex;flex-direction:column;height:100%;box-sizing:border-box;justify-content:flex-end;">
    <span style="font-family:'Poppins',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.2px;color:#0056D2;text-transform:uppercase;margin-bottom:12px;display:block;">Boas-vindas</span>
    <h1 style="font-family:'Poppins',sans-serif;font-size:30px;font-weight:800;color:#1E2A3A;line-height:1.14;letter-spacing:-0.5px;margin:0 0 14px;">Bem-vindo ao novo padrão de <span style="color:#0056D2;">confiança</span> no mercado solar</h1>
    <p style="font-family:'Poppins',sans-serif;font-size:13px;color:#4A5A72;line-height:1.58;margin:0 0 18px;">Cada empresa validada, certificada e ranqueada para você crescer com segurança.</p>
    <!-- clay tag pill -->
    <div style="display:inline-flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #D8E2F5;border-radius:30px;padding:7px 16px;box-shadow:0 4px 14px rgba(0,86,210,0.10);width:fit-content;">
      <div style="width:8px;height:8px;border-radius:50%;background:#00B4D8;"></div>
      <span style="font-family:'Poppins',sans-serif;font-size:11px;font-weight:600;color:#0056D2;">@avaliasolar</span>
    </div>
  </div>

  <div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,rgba(0,0,0,0.05));">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="rgba(0,0,0,0.20)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>
  <div style="position:absolute;bottom:0;left:0;right:0;padding:14px 28px 18px;z-index:10;display:flex;align-items:center;gap:10px;">
  <div style="flex:1;height:3px;background:rgba(0,0,0,0.08);border-radius:2px;overflow:hidden;">
    <div style="height:100%;width:20.0%;background:#0056D2;border-radius:2px;"></div>
  </div>
  <span style="font-size:11px;color:rgba(0,0,0,0.28);font-weight:500;font-family:'Poppins',sans-serif;">1/6</span>
</div>
</div>
<div class="slide" style="background:#1E2A3A;position:relative;">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 20%,rgba(0,86,210,0.18) 0%,transparent 60%);"></div>

  <div style="position:relative;z-index:2;padding:40px 36px 64px;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
    <!-- Logo -->
    <div style="margin-bottom: 20px;">
      """ + logo_html.replace('color:#1E2A3A', 'color:#fff').replace('color:#0056D2', 'color:#00B4D8') + """
    </div>

    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;">
      <!-- REMOVED CONTEXTO SPAN -->
      <h2 style="font-family:'Poppins',sans-serif;font-size:27px;font-weight:800;color:#fff;line-height:1.18;letter-spacing:-0.4px;margin:0 0 16px;">Por que a <span style="color:#00B4D8;">confiança</span> é o seu maior ativo?</h2>

      <div style="background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.10);border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.30);padding:14px 16px;">

<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
  <rect width="48" height="48" rx="12" fill="rgba(0,180,216,0.14)"/>
  <path d="M8 26l6-6h8l4 4h8l6-6" stroke="#00B4D8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M8 26c0 4 3 8 7 8h18c4 0 7-4 7-8" stroke="#00B4D8" stroke-width="2.5" stroke-linecap="round" fill="none"/>
</svg>
  <div>
    <p style="font-family:'Poppins',sans-serif;font-size:13px;font-weight:700;color:#fff;margin:0 0 2px;">Transparência que conecta</p>
    <p style="font-family:'Poppins',sans-serif;font-size:11px;color:rgba(255,255,255,0.52);margin:0;">Empresas sérias + clientes exigentes</p>
  </div>
</div>
<svg width="160" height="80" viewBox="0 0 160 80" fill="none">
  <polyline points="10,65 40,50 70,38 100,22 130,12 155,5"
            stroke="#00B4D8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <polyline points="10,65 40,50 70,38 100,22 130,12 155,5"
            stroke="#00B4D8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.10"/>
  <circle cx="155" cy="5" r="5" fill="#00B4D8"/>
  <line x1="10" y1="70" x2="155" y2="70" stroke="rgba(255,255,255,0.10)" stroke-width="1.5"/>
  <line x1="10" y1="70" x2="10" y2="5"   stroke="rgba(255,255,255,0.10)" stroke-width="1.5"/>
</svg>
<p style="font-family:'Poppins',sans-serif;font-size:9px;color:rgba(255,255,255,0.28);text-align:center;margin-top:6px;letter-spacing:1px;text-transform:uppercase;">Crescimento do Setor Solar B2B</p>
</div>

      <p style="font-family:'Poppins',sans-serif;font-size:12px;color:rgba(255,255,255,0.52);line-height:1.58;margin:14px 0 0;">Em um mercado em expansão, parceiros precisam de transparência. A Avalia Solar conecta empresas sérias a quem busca qualidade.</p>
    </div>
  </div>

  <div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,rgba(255,255,255,0.07));">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.35)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>
  <div style="position:absolute;bottom:0;left:0;right:0;padding:14px 28px 18px;z-index:10;display:flex;align-items:center;gap:10px;">
  <div style="flex:1;height:3px;background:rgba(255,255,255,0.12);border-radius:2px;overflow:hidden;">
    <div style="height:100%;width:40.0%;background:#fff;border-radius:2px;"></div>
  </div>
  <span style="font-size:11px;color:rgba(255,255,255,0.38);font-weight:500;font-family:'Poppins',sans-serif;">2/6</span>
</div>
</div>
<div class="slide" style="background:#F0F4FF;position:relative;">
  <div style="position:absolute;inset:0;background-image:linear-gradient(#D8E2F5 1px,transparent 1px),linear-gradient(90deg,#D8E2F5 1px,transparent 1px);background-size:36px 36px;opacity:0.45;"></div>

  <div style="position:relative;z-index:2;padding:40px 36px 64px;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
    <!-- Logo -->
    <div style="margin-bottom: 20px;">
      """ + logo_html + """
    </div>

    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;">
      <span style="font-family:'Poppins',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.2px;color:#00B4D8;text-transform:uppercase;margin-bottom:12px;display:block;">Mobilidade</span>
      <h2 style="font-family:'Poppins',sans-serif;font-size:26px;font-weight:800;color:#1E2A3A;line-height:1.18;letter-spacing:-0.4px;margin:0 0 10px;">Além do sol: a revolução da <span style="color:#0056D2;">mobilidade elétrica</span></h2>
      <p style="font-family:'Poppins',sans-serif;font-size:13px;color:#4A5A72;line-height:1.52;margin:0 0 20px;">Infraestrutura de recarga para quem olha para o futuro. Validamos instaladores de Wallbox e Carregadores Veiculares.</p>

      <div style="background:#fff;border:1.5px solid rgba(0,86,210,0.12);border-radius:18px;padding:16px;box-shadow:0 10px 25px rgba(0,86,210,0.06);display:flex;align-items:center;gap:15px;">
        <div style="width:54px;height:54px;border-radius:14px;background:#0056D2;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 2L3 14h9l-1 8 8-12h-9l1-8z"></path>
          </svg>
        </div>
        <div>
          <p style="font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;color:#1E2A3A;margin:0;">Ecossistema Integrado</p>
          <p style="font-family:'Poppins',sans-serif;font-size:11px;color:#6A7A8E;margin:0;">Energia Solar + Recarga Veicular = Zero Emissões.</p>
        </div>
      </div>
    </div>
  </div>

  <div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,rgba(0,0,0,0.05));">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="rgba(0,0,0,0.20)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>
  <div style="position:absolute;bottom:0;left:0;right:0;padding:14px 28px 18px;z-index:10;display:flex;align-items:center;gap:10px;">
  <div style="flex:1;height:3px;background:rgba(0,0,0,0.08);border-radius:2px;overflow:hidden;">
    <div style="height:100%;width:50.0%;background:#0056D2;border-radius:2px;"></div>
  </div>
  <span style="font-size:11px;color:rgba(0,0,0,0.28);font-weight:500;font-family:'Poppins',sans-serif;">3/6</span>
</div>
</div>

<div class="slide" style="background:#F0F4FF;position:relative;">
  <div style="position:absolute;inset:0;background-image:linear-gradient(#D8E2F5 1px,transparent 1px),linear-gradient(90deg,#D8E2F5 1px,transparent 1px);background-size:36px 36px;opacity:0.45;"></div>

  <div style="position:relative;z-index:2;padding:40px 36px 64px;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
    <!-- Logo -->
    <div style="margin-bottom: 20px;">
      """ + logo_html + """
    </div>

    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;">
      <span style="font-family:'Poppins',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.2px;color:#0056D2;text-transform:uppercase;margin-bottom:12px;display:block;">Pilares</span>
      <h2 style="font-family:'Poppins',sans-serif;font-size:28px;font-weight:800;color:#1E2A3A;line-height:1.18;letter-spacing:-0.4px;margin:0 0 6px;">Nossos <span style="color:#0056D2;">3 pilares</span></h2>
      <p style="font-family:'Poppins',sans-serif;font-size:12px;color:#4A5A72;margin:0 0 18px;">A base da nossa plataforma de confiança B2B.</p>

      <!-- 3 clay cards side by side -->
      <div style="display:flex;gap:10px;">
        <div style="flex:1;background:#fff;border:1.5px solid rgba(0,86,210,0.10);border-radius:14px;box-shadow:0 6px 20px rgba(0,86,210,0.09);padding:12px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;">
  <div style="width:36px;height:36px;border-radius:10px;background:#0056D218;display:flex;align-items:center;justify-content:center;font-size:16px;color:#0056D2;font-weight:800;">✓</div>
  <p style="font-family:'Poppins',sans-serif;font-size:12px;font-weight:700;color:#1E2A3A;margin:0;">Validação</p>
  <p style="font-family:'Poppins',sans-serif;font-size:10px;color:#6A7A8E;line-height:1.45;margin:0;">Verificamos dados reais de cada empresa parceira.</p>
</div><div style="flex:1;background:#fff;border:1.5px solid rgba(0,86,210,0.10);border-radius:14px;box-shadow:0 6px 20px rgba(0,86,210,0.09);padding:12px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;">
  <div style="width:36px;height:36px;border-radius:10px;background:#00B4D818;display:flex;align-items:center;justify-content:center;font-size:16px;color:#00B4D8;font-weight:800;">★</div>
  <p style="font-family:'Poppins',sans-serif;font-size:12px;font-weight:700;color:#1E2A3A;margin:0;">Certificação</p>
  <p style="font-family:'Poppins',sans-serif;font-size:10px;color:#6A7A8E;line-height:1.45;margin:0;">Selos que atestam qualidade e conformidade no setor.</p>
</div><div style="flex:1;background:#fff;border:1.5px solid rgba(0,86,210,0.10);border-radius:14px;box-shadow:0 6px 20px rgba(0,86,210,0.09);padding:12px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;">
  <div style="width:36px;height:36px;border-radius:10px;background:#0044B318;display:flex;align-items:center;justify-content:center;font-size:16px;color:#0044B3;font-weight:800;">⬆</div>
  <p style="font-family:'Poppins',sans-serif;font-size:12px;font-weight:700;color:#1E2A3A;margin:0;">Ranking</p>
  <p style="font-family:'Poppins',sans-serif;font-size:10px;color:#6A7A8E;line-height:1.45;margin:0;">Posicione-se entre os melhores do setor solar.</p>
</div>
      </div>
    </div>
  </div>

  <div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,rgba(0,0,0,0.05));">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="rgba(0,0,0,0.20)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>
  <div style="position:absolute;bottom:0;left:0;right:0;padding:14px 28px 18px;z-index:10;display:flex;align-items:center;gap:10px;">
  <div style="flex:1;height:3px;background:rgba(0,0,0,0.08);border-radius:2px;overflow:hidden;">
    <div style="height:100%;width:60.0%;background:#0056D2;border-radius:2px;"></div>
  </div>
  <span style="font-size:11px;color:rgba(0,0,0,0.28);font-weight:500;font-family:'Poppins',sans-serif;">4/6</span>
</div>
</div>
<div class="slide" style="background:#1E2A3A;position:relative;">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 20% 80%,rgba(0,180,216,0.12) 0%,transparent 55%);"></div>

  <div style="position:relative;z-index:2;padding:40px 36px 64px;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
    <!-- Logo -->
    <div style="margin-bottom: 20px;">
      """ + logo_html.replace('color:#1E2A3A', 'color:#fff').replace('color:#0056D2', 'color:#00B4D8') + """
    </div>

    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;">
      <span style="font-family:'Poppins',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.2px;color:#00B4D8;text-transform:uppercase;margin-bottom:12px;display:block;">Diferencial</span>
      <h2 style="font-family:'Poppins',sans-serif;font-size:22px;font-weight:800;color:#fff;line-height:1.22;letter-spacing:-0.3px;margin:0 0 14px;">O <span style="color:#00B4D8;">Trust Score</span>: o KPI definitivo para o crescimento</h2>

      <div style="background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.09);border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.30);padding:14px 14px 10px;">
        <div style="display:flex;justify-content:center;margin-bottom:10px;"><svg width="180" height="100" viewBox="0 0 180 100" fill="none">
  <!-- arc track -->
  <path d="M20 90 A70 70 0 0 1 160 90" stroke="rgba(255,255,255,0.10)" stroke-width="14" stroke-linecap="round" fill="none"/>
  <!-- arc fill ~75% -->
  <path d="M20 90 A70 70 0 0 1 148 35" stroke="url(#gGrad)" stroke-width="14" stroke-linecap="round" fill="none"/>
  <!-- center score -->
  <text x="90" y="75" text-anchor="middle" font-family="Poppins,sans-serif" font-size="28" font-weight="800" fill="white">782</text>
  <text x="90" y="92" text-anchor="middle" font-family="Poppins,sans-serif" font-size="9" fill="rgba(255,255,255,0.38)" letter-spacing="1.5">TRUST SCORE</text>
  <defs>
    <linearGradient id="gGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#0056D2"/>
      <stop offset="100%" stop-color="#00B4D8"/>
    </linearGradient>
  </defs>
</svg></div>
<div style="display:flex;flex-direction:column;"><div style="display:flex;align-items:flex-start;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
  <span style="font-size:15px;width:20px;flex-shrink:0;margin-top:1px;">📈</span>
  <div>
    <p style="font-family:'Poppins',sans-serif;font-size:12px;font-weight:700;color:#fff;margin:0 0 2px;">Mais negócios fechados</p>
    <p style="font-family:'Poppins',sans-serif;font-size:10px;color:rgba(255,255,255,0.46);margin:0;line-height:1.45;">Empresas com alto Trust Score atraem +3x mais leads.</p>
  </div>
</div><div style="display:flex;align-items:flex-start;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
  <span style="font-size:15px;width:20px;flex-shrink:0;margin-top:1px;">🤝</span>
  <div>
    <p style="font-family:'Poppins',sans-serif;font-size:12px;font-weight:700;color:#fff;margin:0 0 2px;">Parcerias qualificadas</p>
    <p style="font-family:'Poppins',sans-serif;font-size:10px;color:rgba(255,255,255,0.46);margin:0;line-height:1.45;">Credibilidade que abre portas no mercado B2B.</p>
  </div>
</div><div style="display:flex;align-items:flex-start;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
  <span style="font-size:15px;width:20px;flex-shrink:0;margin-top:1px;">🏆</span>
  <div>
    <p style="font-family:'Poppins',sans-serif;font-size:12px;font-weight:700;color:#fff;margin:0 0 2px;">Destaque no Magic Quadrant</p>
    <p style="font-family:'Poppins',sans-serif;font-size:10px;color:rgba(255,255,255,0.46);margin:0;line-height:1.45;">Visibilidade para quem decide comprar.</p>
  </div>
</div></div>
      </div>
    </div>
  </div>

  <div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,rgba(255,255,255,0.07));">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.35)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>
  <div style="position:absolute;bottom:0;left:0;right:0;padding:14px 28px 18px;z-index:10;display:flex;align-items:center;gap:10px;">
  <div style="flex:1;height:3px;background:rgba(255,255,255,0.12);border-radius:2px;overflow:hidden;">
    <div style="height:100%;width:80.0%;background:#fff;border-radius:2px;"></div>
  </div>
  <span style="font-size:11px;color:rgba(255,255,255,0.38);font-weight:500;font-family:'Poppins',sans-serif;">5/6</span>
</div>
</div>
<div class="slide" style="background:linear-gradient(135deg, #0044B3 0%, #0056D2 45%, #00B4D8 100%);position:relative;">
  <!-- orbs -->
  <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.07);"></div>
  <div style="position:absolute;bottom:-60px;left:-30px;width:240px;height:240px;border-radius:50%;background:rgba(0,0,0,0.10);"></div>

  <div style="position:relative;z-index:2;padding:40px 36px 52px;display:flex;flex-direction:column;height:100%;box-sizing:border-box;align-items:center;justify-content:center;text-align:center;">

    <!-- large logo (Actual Image) -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:24px;">
      """ + large_logo_html.replace('height: 68px', 'height: 80px') + """
    </div>

    <h2 style="font-family:'Poppins',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1.15;letter-spacing:-0.5px;margin:0 0 14px;">Sua empresa merece ser vista como <span style="color:#FFF176;">referência</span></h2>
    <p style="font-family:'Poppins',sans-serif;font-size:13px;color:rgba(255,255,255,0.85);line-height:1.52;margin:0 0 28px;">Destaque-se de integradores genéricos. Reivindique seu perfil, aumente seu Trust Score e domine o Magic Quadrant.</p>

    <!-- Enhanced CTA Button -->
    <div style="background:#fff;border-radius:40px;padding:16px 32px;box-shadow:0 12px 30px rgba(0,0,0,0.25);display:inline-flex;align-items:center;gap:12px;cursor:pointer;transition:transform 0.2s;">
      <span style="font-family:'Poppins',sans-serif;font-size:14px;font-weight:800;color:#0056D2;letter-spacing:-0.2px;">CADASTRE-SE GRATUITAMENTE</span>
      <span style="font-size:16px;color:#0056D2;">→</span>
    </div>
    
    <p style="font-family:'Poppins',sans-serif;font-size:10px;color:rgba(255,255,255,0.40);margin-top:20px;text-transform:uppercase;letter-spacing:1px;">avaliasolar.com.br</p>
  </div>

  <!-- Progress bar -->
  <div style="position:absolute;bottom:0;left:0;right:0;padding:14px 28px 18px;z-index:10;display:flex;align-items:center;gap:10px;">
  <div style="flex:1;height:3px;background:rgba(255,255,255,0.12);border-radius:2px;overflow:hidden;">
    <div style="height:100%;width:100.0%;background:#fff;border-radius:2px;"></div>
  </div>
  <span style="font-size:11px;color:rgba(255,255,255,0.38);font-weight:500;font-family:'Poppins',sans-serif;">6/6</span>
</div>
</div>
    </div>
  </div>

  <div class="ig-dots" id="dots">
    <div class="dot active" onclick="goTo(0)"></div><div class="dot" onclick="goTo(1)"></div><div class="dot" onclick="goTo(2)"></div><div class="dot" onclick="goTo(3)"></div><div class="dot" onclick="goTo(4)"></div><div class="dot" onclick="goTo(5)"></div>
  </div>

  <div class="ig-actions">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><line x1="22" y1="2" x2="11" y2="13" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div style="flex:1;"></div>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>

  <div class="ig-caption">
    <p class="ig-cap-text"><strong>avaliasolar</strong> Bem-vindo ao novo padrão de confiança no mercado solar ☀️🛡️ Reivindique seu perfil e posicione sua empresa entre as melhores.</p>
    <p class="ig-time">HÁ 1 HORA</p>
  </div>
</div>

<script>
let cur=0;
const track=document.getElementById('track');
const dots=document.querySelectorAll('.dot');
const vp=document.getElementById('vp');
const W=420,TOTAL=6;
function goTo(n){cur=Math.max(0,Math.min(n,TOTAL-1));track.style.transform=`translateX(${-cur*W}px)`;dots.forEach((d,i)=>d.classList.toggle('active',i===cur));}
let sx=0,drag=false;
vp.addEventListener('pointerdown',e=>{sx=e.clientX;drag=true;vp.setPointerCapture(e.pointerId);});
vp.addEventListener('pointerup',e=>{if(!drag)return;drag=false;const dx=e.clientX-sx;if(Math.abs(dx)>40)goTo(dx<0?cur+1:cur-1);});
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')goTo(cur+1);if(e.key==='ArrowLeft')goTo(cur-1);});
</script>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    
    print(f"Generated: {output_path}")

if __name__ == "__main__":
    generate_welcome_carousel()
