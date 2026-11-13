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

- Banner institucional e fallback: `<Image width={2103} height={748} className="block h-auto w-full" />` dentro de wrapper `w-full` sem altura fixa.
- Banner de empresa (customizado) mantém a política atual de altura nesta primeira fase, mas sem overlays de gradiente ou blur artificiais; migrar para art-direction em uma fase separada após verificar formatos e autorizações do upload.
- Borda arredondada aplicada ao frame; imagem sem margens artificiais; `bg-white` é apenas cor do frame, não um padding.
- A arte padrão está declarada no código como 2103×748. A correspondência com os metadados reais do arquivo deve ser verificada com navegador / upload ao executar E2E (o conector GitHub retorna erro ao ler o WebP binário).
- Os arquivos já devem conter margens e gradientes desejados no próprio desenho; o CSS não deve sobrepor camadas artificiais.
- Os arquivos de empresa podem apresentar diversas proporções; não é possível garantir simultaneamente imagem 100% visível, frame de altura fixa e zero espaço vazio sem gerar variante/crop autorizado. Sua política visual precisa ser tratada separadamente.

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
| BAN-003 | Aspect ratio renderizado corresponde ao aspect ratio real | desvio < 1,5% |
| BAN-004 | Nenhuma camada `bg-gradient` ou blur no frame institucional | zero elementos |
| BAN-005 | Sem recorte/estiramento | `width:100%`, `height:auto` |
| BAN-006 | Sem overflow horizontal | `scrollWidth <= innerWidth +2` |
| BAN-007 | Formatos mobile, PWA, tablet e desktop | 320 a 2560px |
| BAN-008 | Fonte fallback ao falhar o WebP | renderizada uma única vez |
| BAN-009 | Banner personalizado mantém gating e acesso | regressão preservada |
| BAN-010 | CI Jest, TypeScript, E2E, build | aprovado no PR |

## Observações sobre PR B — upload personalizado (futuro)

O ActiveAdmin recomenda atualmente 1920×600 (16:5), mas o backend aceita PNG/JPEG/WebP e tamanhos variados sem exigir uma proporção geométrica. Para garantir composição íntegra em toda tela, é necessário definir variações por formato, preview desktop/mobile e validação por proporção — sem rejeitar silenciosamente uploads legados.

## Rollback

Reverter o PR de UI e testes. Nenhuma migração ou mudança persistida; restauração do pipeline E2E por revert na mesma branch de release.
