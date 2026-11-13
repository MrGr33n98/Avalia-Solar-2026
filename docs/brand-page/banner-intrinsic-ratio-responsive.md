# Brand Page — Banner sem barras e sem sombras | Web + PWA

**Versão:** 2026-11-13 · **Escopo:** perfil público da empresa (hero standard e premium).  
**Decisão arquitetural:** altura do banner institucional é determinada pela dimensão da imagem e pela largura disponível; evitar `fill` em contêiner de altura fixa.

## Root cause confirmado

1. `CompanyHero.tsx` força `aspect-[3/1]` no mobile e alturas 200/220/230px no desktop.
2. `CompanyPremiumHero.tsx` força `aspect-[3.4/1]` e alturas 176/194/202px.
3. `CompanyFreeBannerPlaceholder.tsx` usava `Image fill` + `object-contain` dentro dessas molduras incompatíveis, criando letterboxing branco.
4. Ambos os heros introduziam overlays escuros `bg-gradient-to-t`; a versão premium também aplicava blur sob imagem de cliente.
5. O fallback `CompanyBannerPlaceholder.tsx` utilizava `object-cover` com altura fixa, sujeitando a imagem institucional a corte.

## Contrato de layout

- Banner institucional e fallback: `<Image width={1024} height={191} className="block h-auto w-full" />` dentro de wrapper `w-full` sem altura fixa.
- Banner de empresa (customizado) também passa a usar uma única imagem fluida (`CompanyFluidBanner`), sem `object-cover`, `object-contain` em caixa fixa ou blur. Imagens mais altas gerarão um hero proporcionalmente mais alto, sem cortes.
- Borda arredondada aplicada ao frame; imagem sem margens artificiais; `bg-white` é apenas cor do frame, não um padding.
- O cabeçalho binário **VP8** de `public/assets/avalia-solar-banner-v3.webp` foi verificado via GitHub em base64: **1024×191**, razão 5,361:1. A declaração antiga 2103×748 (2,811:1) estava incorreta e foi corrigida no placeholder institucional e no fallback. O Jest agora interpreta diretamente o cabeçalho VP8 e rejeita divergências futuras.
- Os arquivos já devem conter margens e gradientes desejados no próprio desenho; o CSS não deve sobrepor camadas artificiais.
- Os arquivos de empresa podem apresentar diversas proporções. A solução preserva a imagem completa e remove o limite de altura. Para evitar deslocamento de layout ANTES do download em banners customizados, falta expor metadata ActiveStorage (`width`/`height`) na API e dimensionar o placeholder antes da decodificação (PR de governança).

## Segurança comercial / consistência

- `resolveCompanyHeroBannerState` e gate `promo_banner` intactos.
- Sem mudanças em upload, banco, plano, contato, WhatsApp ou reivindicação.
- Um único asset responsivo entregue por `next/image` — removido `<source>` que apontava ao mesmo WebP em todos os viewports.
- Não aplicar `object-cover` ao banner institucional para mascarar sobras.

## Critérios de aceite

| ID | Teste | Condição |
|---|---|---|
| BAN-001 | Frame e imagem começam nas mesmas coordenadas | diferença ≤1px |
| BAN-002 | Frame e imagem têm mesma largura e altura | diferença ≤1px |
| BAN-003 | Altura renderizada acompanha a proporção real 1024:191; snapshots Next/Image podem arredondar pixels | ≤1,25px de diferença na altura |
| BAN-004 | Nenhuma camada `bg-gradient` ou blur no frame institucional | zero elementos |
| BAN-005 | Sem recorte/estiramento | `width:100%`, `height:auto` |
| BAN-006 | Sem overflow horizontal | `scrollWidth <= innerWidth +2` |
| BAN-007 | Formatos mobile, PWA, tablet e desktop | 320 a 2560px |
| BAN-008 | Fonte fallback ao falhar o WebP | renderizada uma única vez |
| BAN-009 | Banner personalizado mantém gating, usa imagem fluida sem cortes e sem sombras | regressão preservada |
| BAN-010 | CI Jest, TypeScript, E2E, build | aprovado no PR |

## Diagnóstico do E2E (run #43513538777)

- Erro anterior: `imageWidth / imageHeight` divergiu `0.085228` de `naturalWidth / naturalHeight` com uma tolerância absoluta de `0.015`.
- Causa confirmada: **dimensões HTML não correspondentes ao asset VP8 real**; o Next/Image recalcula pixels de thumbnails otimizados, cuja altura pode ser arredondada.
- Correção: dimensões reais 1024×191 + verificação de metadata no Jest + E2E que mede **altura em pixels** contra a razão original, com tolerância de 1,25px, sem ignorar recortes.
- Asserções de frame/posição, ausência de overlay, ausência de overflow, gating Free e carregamento do WebP continuam obrigatórias.
- Antes do merge, CI principal, E2E Playwright e check `build` devem estar verdes no mesmo SHA.

## Observações sobre PR B — upload personalizado (futuro)

O ActiveAdmin recomenda atualmente 1920×600 (16:5), mas o backend aceita PNG/JPEG/WebP e tamanhos variados sem exigir uma proporção geométrica. Para garantir composição íntegra em toda tela, é necessário definir variações por formato, preview desktop/mobile e validação por proporção — sem rejeitar silenciosamente uploads legados.

## Rollback

Reverter o PR de UI e testes. Nenhuma migração ou mudança persistida; restauração do pipeline E2E por revert na mesma branch de release.
