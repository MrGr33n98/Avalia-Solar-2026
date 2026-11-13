# Brand Page — Quick Wins de Reivindicação e Publicidade Responsiva

**Versão:** 13/11/2026 · **Status:** implementação isolada em PR, sem mudanças no Rails, produção ou contratos de comercialização.

## Problemas confirmados

1. Ícone `Briefcase` decorativo e quadrado 48×48px nos dois cards de reivindicação causam ruído visual e padding desnecessário.
2. `company_profile_about_inline` usa moldura 3:1 no PWA / 3,5:1 tablet / 4:1 desktop, mas o banner criativo pode ter formato 1200×160 (7,5:1). Com `object-cover`, texto e branding da arte são recortados.
3. `ambientBackground: true` adiciona camada desfocada e sombra artificial neste anúncio.
4. `BannerMedia` inicializava a imagem usando `mobileSrc || src` sem considerar a largura do viewport, podendo servir o criativo de celular no desktop.

## Decisões

- Remover somente a maleta e sua moldura; manter textos, CTA amarelo, rota de claim, gating, painel admin.
- Preservar a geometria atual do anúncio **e do carrossel**; no placement `company_profile_about_inline`, trocar exclusivamente para `contain` e `ambientBackground=false`. Outros placements preservam seus contratos.
- Selecionar variante mobile via `<picture><source media="(max-width: 767px)" srcSet="..."></picture>`, com desktop como `<img>` padrão, sem depender de hidratação/UA.
- Se a imagem mobile falhar, remover seu `source` e deixar o `img` principal tentar carregar a variante desktop.
- A arte mobile é servida diretamente na URL pública normalizada, enquanto a imagem desktop mantém a otimização Next/Image; otimização de `srcSet` para mobile poderá evoluir separadamente.
- O selo Patrocinado e os eventos `banner_view`/`banner_click`/`trackBannerEvent` permanecem.
- **Limite matemático:** se a arte original for 7,5:1 e o card 3:1, preservar 100% da arte exige faixas de preenchimento. A solução definitiva sem faixas e sem recorte requer variantes comerciais 3:1 para mobile e 4:1 para desktop (ou conteúdo HTML separado da arte). Não simular o preenchimento com blur nem recortar o branding.

## Critérios de aceite

| ID | Critério |
|---|---|
| CLM-001 | `ClaimProfileCard` e `ClaimCompanyCard` sem `Briefcase` / caixa dourada decorativa |
| CLM-002 | Texto e link de reivindicação inalterados, inclusive quando `claimed=true` |
| ADS-001 | Placement `company_profile_about_inline` conserva 3:1 / 3,5:1 / 4:1 |
| ADS-002 | Imagem publicitária exibida inteira (`object-contain`), sem crop |
| ADS-003 | Nenhum fundo duplicado desfocado no slot |
| ADS-004 | Media query mobile não se aplica ao desktop; `image_mobile_url` falha para a imagem principal |
| ADS-005 | Carrossel, badge patrocinado, tracking e proteções de plano preservados |
| ADS-006 | Testes Jest dos cards, mídia responsiva e placement passam |
| ADS-007 | Visual manual em 320/393/768/1024/1440/1920 e teste de fallback |
