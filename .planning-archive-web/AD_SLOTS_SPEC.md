# AD SLOTS SPEC — Monetização Estratégica de Banners

Este documento detalha o posicionamento, as regras de negócio e a integração dos slots de banners publicitários (anúncios) na nova página de perfil de empresa.

---

## 1. Inventário de Slots Mapeados

Para rentabilizar o perfil sem poluir a navegação do usuário final, o design acomoda os seguintes slots estratégicos:

| Nome do Slot (Identificador) | Localização Física | Finalidade / Regra de Negócio |
|-----------------------------|--------------------|-------------------------------|
| `profile_top_horizontal` | Logo abaixo do Hero, antes das abas. | Exibe uma oferta promocional do próprio parceiro se o plano for Pro/Enterprise. Se for Free/Essential, exibe publicidade institucional da Avalia Solar. |
| `profile_sidebar_top` | No topo da Sidebar direita. | Destaque regional do portal. Espaço premium vendido a terceiros para a categoria Energia Solar da região. |
| `profile_related_native` | Aninhado no grid de Empresas Relacionadas. | Injeta uma empresa parceira Pro/Enterprise com a tag de "Destaque Patrocinado". |
| `profile_bottom_cta` | Acima do Footer da página. | Banner chamando empresas não registradas a conhecerem os planos de destaque da plataforma. |
| `profile_category_sponsored` | Aba de Produtos ou Projetos. | Um banner nativo estilizado como oferta especial de fabricante da categoria. |

---

## 2. Regras de Exibição e Conformidade

- **Label de Transparência Obrigatório:** Todo e qualquer ad renderizado deve exibir o rótulo de publicidade de forma visível e legível nos breakpoints. Os rótulos permitidos são: `Patrocinado`, `Destaque Premium` ou `Anúncio no Avalia Solar`.
- **Proteção contra Banners de Concorrentes:** Se o plano da empresa ativa tiver `show_competitor_banners = false` nos entitlements (planos Pro/Enterprise), banners de concorrentes diretos não serão exibidos na barra lateral ou no rodapé do perfil desta empresa. O slot renderizará anúncios não conflitantes (ex. marcas parceiras, produtos de energia) ou fallbacks institucionais da Avalia Solar.
- **Leitura Limpa de Reviews:** Nenhum banner ou anúncio patrocinado poderá ser injetado no meio da lista de depoimentos e reviews de clientes na aba Avaliações, preservando a transparência e credibilidade da reputação.
