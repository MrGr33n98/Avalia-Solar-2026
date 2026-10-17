# Avalia Solar — Pricing Media Kit v1

Assets separados e exportados para a página de planos, preparados para copiar a pasta `pricing` para `AB0-1-front/public/pricing/`.

## Arquivos

- `devices/hero-laptop.{svg,png,webp}`: laptop isolado com fundo transparente (1600×1000).
- `devices/hero-phone.{svg,png,webp}`: celular isolado com fundo transparente (600×1120).
- `devices/hero-devices-composed.{png,webp}`: composição pronta (2400×1500, transparente).
- `backgrounds/`: cinco fundos de hero desktop/mobile, pricing, benefícios e CTA, em SVG/PNG/WebP.
- `illustrations/`: seis imagens solares vetoriais individualizadas, em SVG/PNG/WebP.
- `decor/`: sol, raios, ondas e pontos, em SVG/PNG/WebP.
- `icons/`: 12 ícones lineares, em SVG e PNG.
- `previews/contact-sheet.jpg`: visão geral do pacote, somente para inspeção.
- `asset-manifest.json`: relação de arquivos, dimensões e tamanhos.

## Uso em Next.js

```tsx
<section className="relative isolate overflow-hidden">
  <div aria-hidden className="absolute inset-0 bg-[url('/pricing/backgrounds/hero-desktop.svg')] bg-cover bg-center" />
  <div className="relative mx-auto grid max-w-[1200px] items-center gap-8 px-5 py-10 lg:grid-cols-2">
    <div>{/* H1, parágrafo, CTAs e links devem ser componentes HTML reais */}</div>
    <img src="/pricing/devices/hero-devices-composed.webp"
         alt="Ilustração do perfil empresarial em laptop e celular"
         width={2400} height={1500} className="h-auto w-full object-contain" />
  </div>
</section>
```

Para controle de camadas, use o laptop e o celular em arquivos individuais. No mobile, alterne o fundo para `hero-mobile.svg` via CSS. SVG escala sem perder nitidez; WebP é recomendado em composições grandes.

## Importante

O kit visual é uma ilustração, não uma captura de produção. **Não coloque preços, avaliações, contagens de usuários, métricas, depoimentos ou selos pagos em imagem.** Dados e direitos de cada plano devem vir das fontes reais do Avalia Solar. Cards de pricing, tabela comparativa, FAQ e botões devem ser componentes acessíveis e responsivos (não recortes de screenshot).

**Logotipo:** reutilizar o símbolo original já existente em `AB0-1-front/public/avalia_symbol.png`, sem substituir a marca oficial pelo desenho ilustrativo dos dispositivos. Não foi possível incluir uma cópia binária do logo original neste ambiente; o projeto já o contém.

## Identidade visual do pack

Azul `#0B59E8`, azul-marinho `#07163C`, amarelo solar `#FFC629`, azul pálido `#EEF6FF`, texto auxiliar `#536582`, bordas `#D8E4F1`. Ícones pretos; azul e amarelo reservados ao branding e às superfícies ilustrativas.

## Validação sugerida

360 / 390 / 430 / 768 / 1024 / 1440 / 1920px; `prefers-reduced-motion`, alt text, contraste e ausência de overflow horizontal. As renderizações SVG/WebP/PNG podem ter pequenas diferenças de antialiasing.
