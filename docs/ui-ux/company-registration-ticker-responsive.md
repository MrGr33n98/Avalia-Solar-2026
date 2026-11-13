# Avalia Solar — Ticker de cadastro B2B (web + PWA)

**Versão:** 2026-11-13 · **Superfície:** Navbar público · **Objetivo:** marquee contínuo em qualquer viewport, CTA fixo e compacto, mantendo WhatsApp/WAHA + analytics.

## Contrato de comportamento

- O fundo azul `#062653` ocupa 100% da largura do Navbar; nenhuma quebra horizontal.
- A mensagem “Cadastre sua empresa no Avalia Solar” percorre continuamente a faixa **da direita para a esquerda**, apenas na área livre antes do CTA.
- Dois grupos duplicados têm **largura idêntica**; sua largura é superior ao viewport do texto, evitando lacunas na animação.
- O cálculo de repetições usa `ResizeObserver` (viewport e largura do texto), sem User-Agent e sem bibliotecas de animação.
- A duração é calculada pela distância total e velocidade-alvo de 38 px/s, mantendo velocidade visual semelhante em telas diferentes.
- O CTA fica **fixo à direita**, enquanto só a mensagem anima.
- Desktop/tablet ≥768 px: faixa 40 px, CTA visual 30 px, alvo clicável ≥40 px.
- Mobile/PWA <768 px: faixa 48 px, CTA visual 30 px, alvo clicável ≥44 px.
- Padding horizontal com `env(safe-area-inset-*)`; fades de 12 px (mobile) e 18 px (desktop), sem máscara percentual excessiva.
- Pausar movimento em hover/foco; `prefers-reduced-motion: reduce` mantém a mensagem estática.
- Acessibilidade: descrição única para leitor de tela; cópias visuais `aria-hidden`; botão com rótulo WhatsApp e foco visível.

## Contratos imutáveis

- URL: `https://wa.me/5565993465055?text=CADASTRAR`.
- Analytics: `cta_click`, `cta_type: whatsapp_company_signup`, `cta_location: navbar_top_ticker`, `keyword: CADASTRAR`.
- O WhatsApp/WAHA é acionado **somente** após o visitante enviar a mensagem; clicar abre o aplicativo.
- Não alterar regras globais de botões, navbar, modal, autenticação, backend, schema nem pricing.

## Matriz de aceite

| Plataforma | Viewport | Critérios |
| --- | --- | --- |
| PWA Android compacto | 320 px | faixa 48 px, CTA visual ≤32 px, hit target ≥44 px, grupos cobrem mensagem |
| PWA / iPhone | 390 px | idem + sem overflow |
| Tablet | 768 px | faixa 40 px, grupos idênticos, CTA fixo |
| Web desktop | 1440 px | faixa 100% largura, mensagem anima continuamente |
| Ultrawide | 2560 px | nenhum vão vazio, dois grupos ≥ viewport |

## Testes

- Jest: estrutura dos grupos, cálculo de repetições 320–3840 px, velocidade, fallback, WhatsApp e tracking.
- Playwright Chromium: dimensões reais em 320, 390, 768, 1440 e 2560 px; translação contínua; respeito a redução de movimento.
- CI: validação responsiva integrada à etapa crítica E2E; guardas de deploy existentes preservadas.

## Rollback

Reverter os commits de `CompanyRegistrationTicker.tsx`, `.module.css`, testes e inclusão no workflow. Sem migrações, API ou estado persistido. Usar evidências de Playwright para avaliar regressões antes de merge.
