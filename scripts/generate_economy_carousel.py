import base64
from pathlib import Path

def generate_economy_carousel():
    # Logo path
    logo_path = Path(r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\logo.png")
    
    # Generated images paths
    img1_path = Path(r"C:\Users\Bobi\.gemini\antigravity\brain\4a11b75c-4040-4830-b5d1-b0b02ccd4427\familia_solar_economizando_capa_1775058682826.png")
    img5_path = Path(r"C:\Users\Bobi\.gemini\antigravity\brain\4a11b75c-4040-4830-b5d1-b0b02ccd4427\telhado_solar_minimalista_sol_1775058706715.png")
    img6_path = Path(r"C:\Users\Bobi\.gemini\antigravity\brain\4a11b75c-4040-4830-b5d1-b0b02ccd4427\notebook_monitor_avaliasolar_mockup_1775058729132.png")
    
    # Encode images to base64
    def get_b64(p):
        if not p.exists(): return ""
        with open(p, "rb") as f:
            return f"data:image/png;base64,{base64.b64encode(f.read()).decode()}"

    logo_b64 = get_b64(logo_path)
    img1 = get_b64(img1_path)
    img5 = get_b64(img5_path)
    img6 = get_b64(img6_path)

    # HTML content
    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Avalia Solar — Economia 95%</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#0D1B2A;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;font-family:'Poppins',sans-serif;}}
.ig-frame{{width:420px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 28px 90px rgba(0,0,0,0.65);user-select:none;}}
.ig-header{{padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #eef1f8;background:#fff;}}
.ig-avatar{{width:36px;height:36px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #eef1f8;}}
.ig-meta{{flex:1;}}
.ig-handle{{font-size:13px;font-weight:700;color:#1a1a1a;}}
.ig-sub{{font-size:11px;color:#7A8EA8;}}
.carousel-viewport{{width:420px;aspect-ratio:4/5;overflow:hidden;position:relative;cursor:grab;}}
.carousel-track{{display:flex;width:calc(420px * 6);transition:transform 0.35s cubic-bezier(.4,0,.2,1);}}
.slide{{width:420px;height:525px;flex-shrink:0;position:relative;overflow:hidden;}}
.ig-dots{{display:flex;align-items:center;justify-content:center;gap:5px;padding:10px 0 6px;background:#fff;}}
.dot{{width:6px;height:6px;border-radius:50%;background:#dde5f5;transition:all .3s;}}
.dot.active{{background:#0056D2;width:14px;border-radius:3px;}}
.ig-actions{{padding:10px 16px 4px;display:flex;gap:14px;align-items:center;background:#fff;}}
.ig-caption{{padding:6px 16px 14px;background:#fff;}}
.ig-cap-text{{font-size:12px;color:#3a3a3a;line-height:1.45;}}
.ig-time{{font-size:10px;color:#b0b8c8;margin-top:4px;}}
.overlay-content{{position:relative;z-index:10;padding:40px 36px 60px;display:flex;flex-direction:column;height:100%;justify-content:flex-end;}}
.brand-pill{{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #D8E2F5;border-radius:30px;padding:6px 14px;box-shadow:0 4px 14px rgba(0,86,210,0.10);width:fit-content;margin-bottom:12px;}}
.progress-bar-container{{position:absolute;bottom:0;left:0;right:0;padding:14px 28px 18px;z-index:20;display:flex;align-items:center;gap:10px;}}
.progress-bar{{flex:1;height:3px;background:rgba(0,0,0,0.1);border-radius:2px;overflow:hidden;}}
.progress-fill{{height:100%;background:#0056D2;border-radius:2px;}}
.dark-mode .progress-bar{{background:rgba(255,255,255,0.12);}}
.dark-mode .progress-fill{{background:#fff;}}
</style>
</head>
<body>

<div class="ig-frame">
  <div class="ig-header">
    <div class="ig-avatar"><img src="{logo_b64}" style="height:100%;width:100%;object-fit:contain;"></div>
    <div class="ig-meta">
      <div class="ig-handle">avaliasolar</div>
      <div class="ig-sub">Avalia Solar · Economia Sustentável</div>
    </div>
    <span style="font-size:20px;color:#9e9e9e;">···</span>
  </div>

  <div class="carousel-viewport" id="vp">
    <div class="carousel-track" id="track">
      
      <!-- Slide 1: Capa -->
      <div class="slide" style="background:#000;">
        <img src="{img1}" style="width:100%;height:100%;object-fit:cover;opacity:0.85;">
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%, rgba(13,27,42,0.9) 100%);"></div>
        <div class="overlay-content">
          <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:#00B4D8;text-transform:uppercase;margin-bottom:14px;display:block;">Economia Real</span>
          <h1 style="font-size:30px;font-weight:800;color:#fff;line-height:1.15;letter-spacing:-0.4px;margin:0 0 16px;">Como economizar até <span style="color:#FFF176;">95%</span> na conta de luz</h1>
          <p style="font-size:14px;color:rgba(255,255,255,0.8);line-height:1.52;">Guia definitivo para fugir das armadilhas comerciais e transformar seu orçamento.</p>
        </div>
        <div class="progress-bar-container"><div class="progress-bar"><div class="progress-fill" style="width:16.6%; background:#fff;"></div></div><span style="font-size:11px;color:rgba(255,255,255,0.5);">1/6</span></div>
      </div>

      <!-- Slide 2: Impacto das Tarifas -->
      <div class="slide" style="background:#F4F7FD;">
        <div style="position:absolute;inset:0;background-image:radial-gradient(#D8E2F5 1px,transparent 1px);background-size:20px 20px;opacity:0.6;"></div>
        <div style="padding:40px 36px;">
          <img src="{logo_b64}" style="height:28px;margin-bottom:30px;">
          <h2 style="font-size:24px;font-weight:800;color:#1E2A3A;line-height:1.2;margin:0 0 20px;">O peso das <span style="color:#0056D2;">tarifas</span> no seu bolso</h2>
          
          <div style="background:#fff;border:1.5px solid rgba(0,86,210,0.12);border-radius:20px;padding:24px;box-shadow:0 10px 30px rgba(0,86,210,0.06);margin-top:20px;display:flex;flex-direction:column;align-items:center;text-align:center;">
             <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#0056D2" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
               <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
             </svg>
             <div style="margin-top:15px;">
               <p style="font-weight:700;color:#1E2A3A;font-size:16px;">Orçamento em Risco</p>
               <p style="font-size:13px;color:#4A5A72;line-height:1.5;margin-top:6px;">O aumento constante impacta diretamente famílias e empresas brasileiras.</p>
             </div>
          </div>
        </div>
        <div class="progress-bar-container"><div class="progress-bar"><div class="progress-fill" style="width:33.3%;"></div></div><span style="font-size:11px;color:rgba(0,0,0,0.3);">2/6</span></div>
      </div>

      <!-- Slide 3: Mudanças de Hábito -->
      <div class="slide" style="background:#1E2A3A;" class="dark-mode">
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 20%,rgba(0,86,210,0.15) 0%,transparent 65%);"></div>
        <div style="padding:40px 36px;">
          <img src="{logo_b64}" style="height:28px;margin-bottom:30px;filter:brightness(200%);">
          <h2 style="font-size:24px;font-weight:800;color:#fff;line-height:1.2;margin:0 0 18px;">Lâmpadas LED não são <span style="color:#00B4D8;">suficientes</span></h2>
          <p style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.58;margin-bottom:24px;">Reduzir o tempo de banho gera impactos iniciais, mas os limites são rápidos.</p>
          
          <div style="display:flex;gap:12px;">
             <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:16px;padding:16px;border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:24px;margin-bottom:8px;">💡</div>
                <p style="font-size:11px;font-weight:600;color:#fff;">Lâmpadas</p>
                <div style="height:4px;width:30%;background:#00B4D8;border-radius:2px;margin-top:6px;"></div>
             </div>
             <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:16px;padding:16px;border:1px solid rgba(255,255,255,0.1);">
                <div style="font-size:24px;margin-bottom:8px;">🚿</div>
                <p style="font-size:11px;font-weight:600;color:#fff;">Hábitos</p>
                <div style="height:4px;width:45%;background:#00B4D8;border-radius:2px;margin-top:6px;"></div>
             </div>
             <div style="flex:1;background:rgba(255,255,255,0.12);border-radius:16px;padding:16px;border:1.5px solid #00B4D8;">
                <div style="font-size:24px;margin-bottom:8px;">☀️</div>
                <p style="font-size:11px;font-weight:800;color:#fff;">Solar</p>
                <div style="height:4px;width:95%;background:#FFF176;border-radius:2px;margin-top:6px;"></div>
             </div>
          </div>
        </div>
        <div class="progress-bar-container"><div class="progress-bar" style="background:rgba(255,255,255,0.1);"><div class="progress-fill" style="width:50%; background:#fff;"></div></div><span style="font-size:11px;color:rgba(255,255,255,0.4);">3/6</span></div>
      </div>

      <!-- Slide 4: Gráfico de Redução -->
      <div class="slide" style="background:#F4F7FD;">
        <div style="padding:40px 36px;">
          <h2 style="font-size:24px;font-weight:800;color:#1E2A3A;line-height:1.2;margin:0 0 10px;">Transição <span style="color:#0056D2;">Estrutural</span></h2>
          <p style="font-size:13px;color:#4A5A72;margin-bottom:24px;">Para economias de até 95%, o painel solar é indispensável.</p>
          
          <div style="background:#fff;border:1.5px solid rgba(0,86,210,0.1);border-radius:20px;padding:20px;box-shadow:0 12px 30px rgba(0,86,210,0.08);">
            <svg width="300" height="150" viewBox="0 0 300 150">
              <rect x="20" y="20" width="40" height="110" rx="4" fill="#0056D2" opacity="0.1"/>
              <rect x="20" y="30" width="40" height="100" rx="4" fill="#0056D2"/>
              <text x="40" y="145" text-anchor="middle" font-size="10" fill="#4A5A72" font-weight="600">Sem Solar</text>
              
              <rect x="240" y="20" width="40" height="110" rx="4" fill="#00B4D8" opacity="0.1"/>
              <rect x="240" y="123" width="40" height="7" rx="2" fill="#00B4D8"/>
              <text x="260" y="145" text-anchor="middle" font-size="10" fill="#4A5A72" font-weight="600">Com Solar</text>
              
              <path d="M60 50 Q 150 50, 240 125" stroke="#F5D020" stroke-width="3" fill="none" stroke-dasharray="6,4"/>
              <text x="150" y="45" text-anchor="middle" font-size="16" fill="#0056D2" font-weight="900">-95%</text>
            </svg>
          </div>
          <p style="font-size:12px;color:#6A7A8E;margin-top:15px;text-align:center;font-style:italic;">*Redução média estimada considerando custo de disponibilidade.</p>
        </div>
        <div class="progress-bar-container"><div class="progress-bar"><div class="progress-fill" style="width:66.6%;"></div></div><span style="font-size:11px;color:rgba(0,0,0,0.3);">4/6</span></div>
      </div>

      <!-- Slide 5: Sol e Telhado -->
      <div class="slide" style="background:#000;">
        <img src="{img5}" style="width:100%;height:100%;object-fit:cover;opacity:0.85;">
        <div style="position:absolute;inset:0;background:linear-gradient(to top,transparent 30%, rgba(13,27,42,0.95) 100%);"></div>
        <div style="position:relative;z-index:10;padding:40px 36px;">
          <h2 style="font-size:26px;font-weight:800;color:white;line-height:1.2;margin:0 0 14px;">A <span style="color:#FFF176;">solução definitiva</span> contra bandeiras tarifárias</h2>
          <p style="font-size:14px;color:rgba(255,255,255,0.8);line-height:1.55;">Energia limpa, renovável e imune às oscilações do mercado elétrico.</p>
        </div>
        <div class="progress-bar-container"><div class="progress-bar" style="background:rgba(255,255,255,0.15);"><div class="progress-fill" style="width:83.3%; background:#fff;"></div></div><span style="font-size:11px;color:rgba(255,255,255,0.4);">5/6</span></div>
      </div>

      <!-- Slide 6: Notebook e CTA -->
      <div class="slide" style="background:#F0F4FF;">
        <img src="{img6}" style="width:100%;height:180px;object-fit:cover;border-bottom:1px solid rgba(0,86,210,0.1);">
        <div style="padding:30px 36px;">
          <h2 style="font-size:24px;font-weight:800;color:#1E2A3A;line-height:1.15;letter-spacing:-0.4px;margin:0 0 12px;">Seu primeiro passo para a <span style="color:#0056D2;">liberdade</span> financeira</h2>
          <p style="font-size:13px;color:#4A5A72;line-height:1.52;margin:0 0 24px;">Avalie o potencial solar do seu telhado com dados precisos e integradores verificados pela **Avalia Solar**.</p>
          
          <div style="background:#0056D2;border-radius:32px;padding:14px 28px;box-shadow:0 8px 24px rgba(0,86,210,0.25);display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;">
            <span style="font-size:13px;font-weight:800;color:#fff;">AVALIAR MEU TELHADO AGORA</span>
            <span style="color:#fff;">→</span>
          </div>
        </div>
        <div class="progress-bar-container"><div class="progress-bar"><div class="progress-fill" style="width:100%;"></div></div><span style="font-size:11px;color:rgba(0,0,0,0.3);">6/6</span></div>
      </div>

    </div>
  </div>

  <div class="ig-dots" id="dots">
    <div class="dot active"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>
  </div>

  <div class="ig-actions">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><line x1="22" y1="2" x2="11" y2="13" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div style="flex:1;"></div>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>

  <div class="ig-caption">
    <p class="ig-cap-text"><strong>avaliasolar</strong> Economize até 95% na conta de luz hoje mesmo! ☀️💰 Descubra como a energia solar pode transformar sua vida financeira.</p>
    <p class="ig-time">HÁ 1 HORA</p>
  </div>
</div>

<script>
let cur=0;
const track=document.getElementById('track');
const dots=document.querySelectorAll('.dot');
const vp=document.getElementById('vp');
const W=420,TOTAL=6;
function goTo(n){{cur=Math.max(0,Math.min(n,TOTAL-1));track.style.transform=`translateX(${{-cur*W}}px)`;dots.forEach((d,i)=>d.classList.toggle('active',i===cur));}}
let sx=0,drag=false;
vp.addEventListener('pointerdown',e=>{{sx=e.clientX;drag=true;vp.setPointerCapture(e.pointerId);}});
vp.addEventListener('pointerup',e=>{{if(!drag)return;drag=false;const dx=e.clientX-sx;if(Math.abs(dx)>40)goTo(dx<0?cur+1:cur-1);}});
document.addEventListener('keydown',e=>{{if(e.key==='ArrowRight')goTo(cur+1);if(e.key==='ArrowLeft')goTo(cur-1);}});
</script>
</body>
</html>"""

    output_path = Path(r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\economia_95_carousel.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated: {output_path}")

if __name__ == "__main__":
    generate_economy_carousel()
