import base64
import os
from pathlib import Path

def get_base64_img(path):
    if not os.path.exists(path):
        return ""
    with open(path, "rb") as image_file:
        ext = os.path.splitext(path)[1].replace(".", "")
        if ext == "ico": ext = "x-icon"
        return f"data:image/{ext};base64," + base64.b64encode(image_file.read()).decode('utf-8')

def generate_deck_background():
    # Assets
    FAVICON = r"c:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\public\favicon.ico"
    img_favicon = get_base64_img(FAVICON)
    
    output_path = r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\deck_background.html"
    
    # Using the user's provided template with the logo addition
    html = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fundo Deck Avalia Solar</title>
  <style>
    * {{ box-sizing: border-box; }}
    html, body {{
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: 'Inter', Arial, sans-serif;
      background: #ffffff;
    }}

    .slide {{
      position: relative;
      width: 100vw;
      height: 100vh;
      background:
        radial-gradient(circle at 18% 78%, rgba(120, 210, 255, 0.18), transparent 28%),
        radial-gradient(circle at 82% 18%, rgba(34, 110, 255, 0.18), transparent 30%),
        radial-gradient(circle at 74% 82%, rgba(94, 225, 190, 0.16), transparent 24%),
        linear-gradient(135deg, #eaf2ff 0%, #f7fbff 42%, #ffffff 100%);
      isolation: isolate;
    }}

    .shape {{
      position: absolute;
      border-radius: 999px;
      filter: blur(8px);
      opacity: 0.9;
      pointer-events: none;
    }}

    .shape.s1 {{
      width: 52vw;
      height: 52vw;
      right: -12vw;
      top: -10vw;
      background: radial-gradient(circle at 40% 40%, rgba(0, 106, 255, 0.16), rgba(0, 106, 255, 0.03) 52%, transparent 72%);
    }}

    .shape.s2 {{
      width: 40vw;
      height: 40vw;
      left: -10vw;
      bottom: -14vw;
      background: radial-gradient(circle at 58% 44%, rgba(0, 195, 255, 0.16), rgba(0, 195, 255, 0.03) 54%, transparent 72%);
    }}

    .shape.s3 {{
      width: 28vw;
      height: 28vw;
      right: 12vw;
      bottom: 8vh;
      background: radial-gradient(circle at 50% 50%, rgba(84, 232, 191, 0.15), rgba(84, 232, 191, 0.02) 58%, transparent 76%);
    }}

    .wave {{
      position: absolute;
      inset: auto;
      pointer-events: none;
      opacity: 0.95;
    }}

    .wave.top {{
      top: -12vh;
      right: -6vw;
      width: 66vw;
      height: 44vh;
    }}

    .wave.bottom {{
      left: -8vw;
      bottom: -10vh;
      width: 76vw;
      height: 42vh;
      transform: rotate(-4deg);
      opacity: 0.88;
    }}

    .line-grid {{
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(20, 82, 204, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(20, 82, 204, 0.035) 1px, transparent 1px);
      background-size: 54px 54px;
      mask-image: radial-gradient(circle at center, rgba(0,0,0,0.28), transparent 72%);
      opacity: 0.3;
      pointer-events: none;
    }}

    .sparkle {{
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.95);
      box-shadow: 0 0 18px rgba(94, 180, 255, 0.45);
      opacity: 0.7;
    }}

    .sparkle.a {{ top: 18%; left: 19%; }}
    .sparkle.b {{ top: 23%; right: 22%; }}
    .sparkle.c {{ top: 62%; left: 13%; }}
    .sparkle.d {{ bottom: 18%; left: 44%; }}
    .sparkle.e {{ bottom: 22%; right: 18%; }}
    .sparkle.f {{ top: 38%; right: 10%; }}

    .corner-shape {{
      position: absolute;
      right: 6.5vw;
      top: 7vh;
      width: 160px;
      opacity: 0.22;
      filter: blur(0.2px);
    }}

    .content-safe {{
      position: absolute;
      inset: 7vh 6vw;
      border-radius: 28px;
      background: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06));
      border: 1px solid rgba(255,255,255,0.32);
      backdrop-filter: blur(3px);
      pointer-events: none;
      opacity: 0.4;
    }}

    /* Logo at bottom */
    .bottom-brand {{
      position: absolute;
      bottom: 4vh;
      right: 6vw;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 100;
    }}
    .small-logo {{
      width: 40px;
      height: 40px;
      object-fit: contain;
    }}
    .brand-text {{
      font-size: 16px;
      font-weight: 800;
      color: #0B66FF;
      letter-spacing: 1px;
      text-transform: uppercase;
    }}
  </style>
</head>
<body>
  <div class="slide">
    <div class="shape s1"></div>
    <div class="shape s2"></div>
    <div class="shape s3"></div>

    <svg class="wave top" viewBox="0 0 900 420" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M916 -6C742 52 610 140 526 258C468 340 376 392 230 414L916 420V-6Z" fill="url(#g1)" fill-opacity="0.9"/>
      <path d="M919 34C736 92 600 182 511 301C462 366 394 404 304 420H919V34Z" fill="url(#g2)" fill-opacity="0.72"/>
      <defs>
        <linearGradient id="g1" x1="916" y1="0" x2="315" y2="420" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0A5CFF" stop-opacity="0.22"/>
          <stop offset="1" stop-color="#65D7FF" stop-opacity="0.06"/>
        </linearGradient>
        <linearGradient id="g2" x1="919" y1="34" x2="364" y2="420" gradientUnits="userSpaceOnUse">
          <stop stop-color="#5BE6C0" stop-opacity="0.18"/>
          <stop offset="1" stop-color="#0A5CFF" stop-opacity="0.03"/>
        </linearGradient>
      </defs>
    </svg>

    <svg class="wave bottom" viewBox="0 0 1100 430" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M-20 430C136 331 277 286 404 294C572 305 705 253 803 139C875 55 981 9 1120 0V430H-20Z" fill="url(#bg1)" fill-opacity="0.92"/>
      <path d="M-16 430C158 352 300 321 410 331C560 344 690 299 800 195C892 108 998 54 1125 40V430H-16Z" fill="url(#bg2)" fill-opacity="0.82"/>
      <defs>
        <linearGradient id="bg1" x1="16" y1="430" x2="930" y2="56" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0B66FF" stop-opacity="0.17"/>
          <stop offset="1" stop-color="#67E1C8" stop-opacity="0.13"/>
        </linearGradient>
        <linearGradient id="bg2" x1="31" y1="430" x2="980" y2="74" gradientUnits="userSpaceOnUse">
          <stop stop-color="#7FD9FF" stop-opacity="0.11"/>
          <stop offset="1" stop-color="#0B66FF" stop-opacity="0.06"/>
        </linearGradient>
      </defs>
    </svg>

    <div class="line-grid"></div>

    <div class="sparkle a"></div>
    <div class="sparkle b"></div>
    <div class="sparkle c"></div>
    <div class="sparkle d"></div>
    <div class="sparkle e"></div>
    <div class="sparkle f"></div>

    <svg class="corner-shape" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
      <path d="M92 10L156 28L148 95L82 124L40 72L92 10Z" fill="#5D9DFF"/>
      <path d="M40 42L74 66L54 104L14 88L40 42Z" fill="#9CC2FF"/>
      <path d="M96 130L134 147L108 176L78 159L96 130Z" fill="#6FE3C7"/>
    </svg>

    <div class="content-safe"></div>

    <div class="bottom-brand">
        <img src="{img_favicon}" class="small-logo">
    </div>
  </div>
</body>
</html>
    """
    
    Path(output_path).write_text(html, encoding="utf-8")
    print(f"Fundo de Deck gerado com logo pequeno: {output_path}")

if __name__ == "__main__":
    generate_deck_background()
