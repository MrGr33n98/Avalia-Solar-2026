import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

INPUT_HTML = Path(r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\strategy_carousel.html")
OUTPUT_DIR = Path(r"c:\Users\Bobi\Desktop\AB0-1-main\outputs\strategy_slides")

TOTAL_SLIDES = 9  # Cover + 7 Steps + CTA

VIEW_W = 420
VIEW_H = 525
SCALE = 1080 / 420  # = 2.5714...

async def export_slides():
    print(f"Iniciando exportação de {TOTAL_SLIDES} slides...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(
            viewport={"width": VIEW_W, "height": VIEW_H},
            device_scale_factor=SCALE,
        )

        # Usar file:// protocol para carregar o arquivo local
        url = f"file:///{INPUT_HTML.absolute().as_posix()}"
        await page.goto(url, wait_until="networkidle")
        await page.wait_for_timeout(3000)  # Tempo extra para fontes do Google

        # Ajustar o layout para o modo de exportação (esconder UI do IG)
        await page.evaluate("""() => {
            // Esconde o header, dots e actions do frame do Instagram
            const elementsToHide = document.querySelectorAll('.ig-header, .ig-dots, .ig-actions');
            elementsToHide.forEach(el => el.style.display = 'none');

            // Ajusta o frame para ocupar tudo sem bordas ou sombras
            const frame = document.querySelector('.ig-frame');
            if (frame) {
                frame.style.width = '420px';
                frame.style.height = '525px';
                frame.style.maxWidth = 'none';
                frame.style.borderRadius = '0';
                frame.style.boxShadow = 'none';
                frame.style.margin = '0';
                frame.style.overflow = 'hidden';
            }

            // Garante que o viewport esteja fixo
            const viewport = document.querySelector('.carousel-viewport');
            if (viewport) {
                viewport.style.width = '420px';
                viewport.style.height = '525px';
                viewport.style.overflow = 'hidden';
                viewport.style.cursor = 'default';
            }

            document.body.style.padding = '0';
            document.body.style.margin = '0';
            document.body.style.background = 'transparent';
        }""")

        for i in range(TOTAL_SLIDES):
            # Posicionar o carrossel no slide correto
            await page.evaluate(f"""(idx) => {{
                const viewport = document.querySelector('.carousel-viewport');
                if (viewport) {{
                    viewport.scrollTo({{ left: idx * 420, behavior: 'instant' }});
                }}
            }}""", i)
            
            await page.wait_for_timeout(500) # Estabilização

            output_file = OUTPUT_DIR / f"slide_{i+1:02d}.png"
            await page.screenshot(
                path=str(output_file),
                clip={"x": 0, "y": 0, "width": VIEW_W, "height": VIEW_H},
                animations="disabled"
            )
            print(f"Slide {i+1}/{TOTAL_SLIDES} exportado para: {output_file.name}")

        await browser.close()
    print("Exportação concluída com sucesso!")

if __name__ == "__main__":
    asyncio.run(export_slides())
