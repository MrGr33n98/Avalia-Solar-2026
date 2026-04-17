import base64
from pathlib import Path

def generate_saas_usage_carousel():
    # Logo path
    logo_path = Path(r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\images\logo.png")
    saas_dir = Path(r"c:\Users\Bobi\Desktop\AB0-1-main\videos\public\saas")
    
    # Images
    img_capa = saas_dir / "banner.PNG"
    img_cat = saas_dir / "categorias.PNG"
    img_emp = saas_dir / "empresas.PNG"
    img_comp = saas_dir / "comparador.PNG"
    img_dash = saas_dir / "dashboard.PNG"
    img_final = saas_dir / "page.PNG"
    
    # Encode images to base64
    def get_b64(p):
        if not p.exists(): return ""
        with open(p, "rb") as f:
            return f"data:image/png;base64,{base64.b64encode(f.read()).decode()}"

    logo_b64 = get_b64(logo_path)
    b64_capa = get_b64(img_capa)
    b64_cat = get_b64(img_cat)
    b64_emp = get_b64(img_emp)
    b64_comp = get_b64(img_comp)
    b64_dash = get_b64(img_dash)
    b64_final = get_b64(img_final)

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Avalia Solar — Como Funciona</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#F4F1ED;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;font-family:'Poppins',sans-serif;}}
.ig-frame{{width:420px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 28px 90px rgba(0,0,0,0.4);user-select:none;}}
.ig-header{{padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #eef1f8;background:#fff;}}
.ig-avatar{{width:36px;height:36px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #eef1f8;}}
.ig-meta{{flex:1;}}
.ig-handle{{font-size:13px;font-weight:700;color:#1a1a1a;}}
.ig-sub{{font-size:11px;color:#7A8EA8;}}
.carousel-viewport{{width:420px;aspect-ratio:4/5;overflow:hidden;position:relative;cursor:grab;}}
.carousel-track{{display:flex;width:calc(420px * 6);transition:transform 0.35s cubic-bezier(.4,0,.2,1);}}
.slide{{width:420px;height:525px;flex-shrink:0;position:relative;overflow:hidden;}}
.controls {{ position: absolute; bottom: 80px; left: 0; right: 0; display: flex; justify-content: center; gap: 8px; z-index: 100; }}
.dot {{ width: 6px; height: 6px; border-radius: 50%; background: rgba(0,0,0,0.2); transition: 0.3s; cursor: pointer; }}
.dot.active {{ background: #0056D2; width: 14px; border-radius: 4px; }}
/* Nav Arrows */
.nav-btn {{ position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.7; transition: 0.3s; z-index: 200; font-weight: bold; font-size: 20px; color: #0056D2; }}
.nav-btn:hover {{ opacity: 1; transform: translateY(-50%) scale(1.1); }}
.btn-prev {{ left: 10px; }}
.btn-next {{ right: 10px; }}
.slide-title-overlay{{position:absolute;top:0;left:0;right:0;padding:40px 30px;background:linear-gradient(to bottom, rgba(13,27,42,0.95) 0%, rgba(13,27,42,0.7) 40%, transparent 100%);z-index:20;}}
.slide-footer-overlay{{position:absolute;bottom:0;left:0;right:0;padding:30px;background:linear-gradient(to top, rgba(13,27,42,0.95) 0%, rgba(13,27,42,0.7) 60%, transparent 100%);z-index:20;}}
.prog-container{{position:absolute;bottom:14px;left:28px;right:28px;z-index:30;display:flex;align-items:center;gap:10px;}}
.prog-bar{{flex:1;height:3px;background:rgba(255,255,255,0.15);border-radius:2px;overflow:hidden;}}
.prog-fill{{height:100%;background:#fff;border-radius:2px;}}
.mockup-img{{width:100%;height:100%;object-fit:cover;}}
.badge-pill{{display:inline-flex;align-items:center;gap:8px;background:#0056D2;color:white;border-radius:30px;padding:5px 12px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;}}
</style>
</head>
<body>

<div class="ig-frame">
  <div class="ig-header">
    <div class="ig-avatar"><img src="{logo_b64}" style="height:100%;width:100%;object-fit:contain;"></div>
    <div class="ig-meta">
      <div class="ig-handle">avaliasolar</div>
      <div class="ig-sub">Avalia Solar · O Marketplace Solar Inteligente</div>
    </div>
    <span style="font-size:20px;color:#9e9e9e;">···</span>
  </div>

  <div class="carousel-viewport" id="vp">
    <div class="nav-btn btn-prev" onclick="prevSlide()">‹</div>
    <div class="nav-btn btn-next" onclick="nextSlide()">›</div>
    <div class="carousel-track" id="track">
      
      <!-- Slide 1: Banners -->
      <div class="slide">
        <img src="{b64_capa}" class="mockup-img">
        <div class="slide-title-overlay">
          <div class="badge-pill">Confiança as a Service</div>
          <h2 style="color:#fff;font-size:28px;font-weight:800;line-height:1.15;letter-spacing:-0.5px;">O maior ecossistema de confiança do <span style="color:#FFF176;">Brasil</span></h2>
        </div>
        <div class="slide-footer-overlay">
          <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.5;">Comece sua transição energética com ferramentas projetadas para o comprador exigente.</p>
        </div>
        <div class="prog-container"><div class="prog-bar"><div class="prog-fill" style="width:16.6%;"></div></div><span style="color:white;font-size:10px;">1/6</span></div>
      </div>

      <!-- Slide 2: Categorias -->
      <div class="slide">
        <img src="{b64_cat}" class="mockup-img" style="object-fit: contain; background: #f8fafc;">
        <div class="slide-title-overlay" style="background: linear-gradient(to bottom, #fff 0%, rgba(255,255,255,0.9) 60%, transparent 100%);">
          <div class="badge-pill" style="background:#00B4D8;">Categorias</div>
          <h3 style="color:#1E2A3A;font-size:24px;font-weight:800;line-height:1.2;">Soluções amplas para <span style="color:#00B4D8;">cada necessidade</span></h3>
        </div>
        <div class="slide-footer-overlay" style="background: linear-gradient(to top, #fff 0%, rgba(255,255,255,0.9) 60%, transparent 100%);">
          <p style="color:#4A5A72;font-size:13px;">Painéis solares, baterias inteligentes e infraestrutura de recarga veicular — tudo em um só lugar.</p>
        </div>
        <div class="prog-container"><div class="prog-bar" style="background:rgba(0,0,0,0.1);"><div class="prog-fill" style="width:33.3%; background:#0056D2;"></div></div><span style="color:#4A5A72;font-size:10px;">2/6</span></div>
      </div>

      <!-- Slide 3: Empresas -->
      <div class="slide">
        <img src="{b64_emp}" class="mockup-img">
        <div class="slide-title-overlay">
          <div class="badge-pill">Verificação</div>
          <h3 style="color:#fff;font-size:24px;font-weight:800;line-height:1.2;">Integradores <span style="color:#FFF176;">Validados</span> 24/7</h3>
        </div>
        <div class="slide-footer-overlay">
          <p style="color:rgba(255,255,255,0.85);font-size:13px;">Esqueça o medo do desconhecido. Cada parceiro em nossa rede passa por auditoria rigorosa de dados.</p>
        </div>
        <div class="prog-container"><div class="prog-bar"><div class="prog-fill" style="width:50%;"></div></div><span style="color:white;font-size:10px;">3/6</span></div>
      </div>

      <!-- Slide 4: Comparador -->
      <div class="slide">
        <img src="{b64_comp}" class="mockup-img" style="object-fit: scale-down; background:#1e293b;">
        <div class="slide-title-overlay">
          <div class="badge-pill" style="background:#00B4D8;">Transparência</div>
          <h3 style="color:#fff;font-size:24px;font-weight:800;line-height:1.2;">Decisões baseadas em <span style="color:#00B4D8;">Dados</span></h3>
        </div>
        <div class="slide-footer-overlay">
          <p style="color:rgba(255,255,255,0.85);font-size:13px;">Compare propostas técnicas, avaliações reais e garantias lado a lado. Transparência algorítmica a seu favor.</p>
        </div>
        <div class="prog-container"><div class="prog-bar"><div class="prog-fill" style="width:66.6%;"></div></div><span style="color:white;font-size:10px;">4/6</span></div>
      </div>

      <!-- Slide 5: Dashboard -->
      <div class="slide">
        <img src="{b64_dash}" class="mockup-img">
        <div class="slide-title-overlay" style="background: linear-gradient(to bottom, #fff 0%, rgba(255,255,255,0.9) 60%, transparent 100%);">
          <div class="badge-pill">Analytics</div>
          <h3 style="color:#1E2A3A;font-size:24px;font-weight:800;line-height:1.2;">Dashboards de <span style="color:#0056D2;">Alta Performance</span></h3>
        </div>
        <div class="slide-footer-overlay" style="background: linear-gradient(to top, #fff 0%, rgba(255,255,255,0.9) 60%, transparent 100%);">
          <p style="color:#4A5A72;font-size:13px;">Monitore o ROI, as métricas de sustentabilidade e os leads qualificados em tempo real pela nossa plataforma corporativa.</p>
        </div>
        <div class="prog-container"><div class="prog-bar" style="background:rgba(0,0,0,0.1);"><div class="prog-fill" style="width:83.3%; background:#0056D2;"></div></div><span style="color:#4A5A72;font-size:10px;">5/6</span></div>
      </div>

      <!-- Slide 6: Final -->
      <div class="slide" style="background: linear-gradient(135deg, #0044B3, #00B4D8);">
        <div style="position:relative;z-index:20;padding:40px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;">
           <img src="{logo_b64}" style="height:60px;margin-bottom:30px;filter:brightness(200%);">
           <h2 style="color:#fff;font-size:28px;font-weight:800;line-height:1.2;margin:0 0 16px;">O Futuro da Energia é <span style="color:#FFF176;">Transparente</span></h2>
           <p style="color:rgba(255,255,255,0.9);font-size:14px;margin-bottom:32px;">Domine seu mercado com dados reais e segurança jurídica.</p>
           
           <div style="background:#fff;border-radius:40px;padding:16px 36px;box-shadow:0 12px 30px rgba(0,0,0,0.25);font-size:14px;font-weight:800;color:#0056D2;">
             AVALIASOLAR.COM.BR
           </div>
        </div>
        <div class="prog-container"><div class="prog-bar"><div class="prog-fill" style="width:100%;"></div></div><span style="color:white;font-size:10px;">6/6</span></div>
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
  </div>
</div>

<script>
let cur=0;
const track=document.getElementById('track');
const dots=document.querySelectorAll('.dot');
const vp=document.getElementById('vp');
const W=420,TOTAL=6;
function goTo(n){{cur=Math.max(0,Math.min(n,TOTAL-1));track.style.transform=`translateX(${{-cur*W}}px)`;dots.forEach((d,i)=>d.classList.toggle('active',i===cur));}}
function nextSlide(){{goTo(cur+1);}}
function prevSlide(){{goTo(cur-1);}}
document.addEventListener('keydown', (e) => {{
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
}});
let sx=0,drag=false;
vp.addEventListener('pointerdown',e=>{{sx=e.clientX;drag=true;vp.setPointerCapture(e.pointerId);}});
vp.addEventListener('pointerup',e=>{{if(!drag)return;drag=false;const dx=e.clientX-sx;if(Math.abs(dx)>40)goTo(dx<0?cur+1:cur-1);}});
</script>
</body>
</html>"""

    output_path = Path(r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\saas_usage_carousel.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Generated: {output_path}")

if __name__ == "__main__":
    generate_saas_usage_carousel()
