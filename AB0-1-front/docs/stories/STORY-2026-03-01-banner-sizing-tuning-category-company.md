# Story: Ajuste de Tamanho dos Banners em Categoria e Company Detail

## Contexto
Os placements de banner largos estavam respeitando `width` e `height` crus do admin, o que deixava a faixa de categoria estreita demais e os banners patrocinados do company detail com pouca presença visual.

## O que foi ajustado
- `BannerContainer` agora deixa placements largos ocuparem toda a largura útil do container:
  - `categories_top`
  - `companies_footer`
  - `article_footer_cta`
- O banner de categoria ganhou mais altura visual:
  - mobile: `4:1`
  - desktop: `6:1`
- `SponsoredBanner` do company detail passou a usar aspect ratios responsivos fixos:
  - inline: `4:1` mobile / `5:1` desktop
  - sidebar: `4:3`
- Os banners patrocinados agora não dependem mais do tamanho bruto da imagem para definir presença visual na página.

## Arquivos alterados
- `components/BannerContainer.tsx`
- `app/companies/[id]/components/SponsoredBanner.tsx`

## Checklist
- [x] Banner de categoria ocupa a largura do layout
- [x] Banner de categoria ganhou altura visual
- [x] Banners patrocinados do company detail ficaram mais legíveis
- [ ] Validar visualmente em produção após deploy
