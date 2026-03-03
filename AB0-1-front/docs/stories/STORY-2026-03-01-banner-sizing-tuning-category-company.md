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
- Na Home, o banner de `categories_top` passou a ocupar a linha inteira do grid de categorias, em vez de ficar preso a meia largura.
- Na Home, o bloco de `categories_top` passou a entregar todos os banners recebidos ao carousel, permitindo rotacao automatica de patrocinados em vez de exibir apenas o primeiro item.
- `SponsoredBanner` do company detail passou a usar aspect ratios responsivos fixos:
  - inline: `3:1` mobile / `4:1` desktop
  - sidebar: `16:10`
- Os banners patrocinados agora não dependem mais do tamanho bruto da imagem para definir presença visual na página.
- Os slots patrocinados do company detail ganharam borda e sombra leves para se integrarem melhor ao layout.

## Arquivos alterados
- `app/page.tsx`
- `components/BannerContainer.tsx`
- `app/companies/[id]/components/SponsoredBanner.tsx`

## Checklist
- [x] Banner de categoria ocupa a largura do layout
- [x] Banner de categoria ganhou altura visual
- [x] Banner da Home deixou de ficar preso a meia largura no grid de categorias
- [x] Banner patrocinado da Home pode rotacionar automaticamente quando houver mais de um item ativo
- [x] Banners patrocinados do company detail ficaram mais legíveis
- [ ] Validar visualmente em produção após deploy

## File List
- `app/page.tsx`
- `components/BannerContainer.tsx`
- `app/companies/[id]/components/SponsoredBanner.tsx`
