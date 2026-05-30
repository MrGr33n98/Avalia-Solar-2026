# Fase 3: Visão Geral Premium e Sidebar - Contexto

**Gathered:** 2026-05-30 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

O escopo da Fase 3 é a transformação da aba **Visão Geral** e da **Barra Lateral (Sidebar)** em áreas de alto impacto comercial e conversão, englobando:
- O novo componente `OverviewTab` contendo Sobre a Empresa com botão de ler mais.
- O grid de diferenciais `CompanyHighlightsGrid` (dados consolidados e conquistas).
- O carrossel responsivo de `RelatedCompaniesCarousel` (respeitando `show_alternatives`).
- O mural compacto de pré-visualização de depoimentos (`ReviewsPreview`) e de portfólio (`ProjectsPreview`).
- A nova barra lateral `SidebarPremium` contendo contatos protegidos por login, caixa de FAQ e reivindicação de perfil (`ClaimProfileCard`).
Nenhuma alteração de backend Rails ou das abas internas dedicadas de produtos ou reviews completos será executada nesta fase.
</domain>

<decisions>
## Implementation Decisions

### D-01: Proteção de Contatos por Login
Para manter a aquisição de novos leads de usuários intacta:
- Se o usuário estiver autenticado (`isAuthenticated === true`), exibe telefone e e-mail completos com links clicáveis de ação (`tel:` e `mailto:`).
- Se não autenticado (`isAuthenticated === false`), oculta metade dos caracteres e exibe o badge "Ver". O clique dispara o formulário de login/registro `openSignupGate` legado de forma idêntica.

### D-02: Bloqueio Condicional de Alternativas
Se a empresa ativa pertencer aos planos Pro/Enterprise e seu entitlement bloquear concorrência direta (`show_alternatives === false`), o carrossel de concorrentes similares no rodapé e banners rivais no sidebar serão suprimidos, preservando a exclusividade da conta paga.

### D-03: Mapeamento Dinâmico de Destaques
O grid de destaques rápidos exibirá as seguintes métricas calculadas em tempo de execução:
- Anos no mercado: Diferença entre o ano atual e `founded_year` ou ano de criação.
- Soluções: Total de produtos cadastrados (`products.length`).
- Depoimentos: Total de reviews publicadas (`reviews_count`).
- Credibilidade: Nota média da empresa formatada em uma casa decimal.

### D-04: Telemetria de FAQs e Banners
A expansão de perguntas de FAQ expansível na barra lateral e o clique nos banners de parceiros dispararão os hooks legados de rastreamento de intenção de compra (`trackQuestion`, `trackFaqEngagement` e `trackCTAClick`), garantindo integridade de dados analíticos para RevOps.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- [CompanyOverview.tsx](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/companies/%5Bid%5D/components/CompanyOverview.tsx) — Componente de visão geral legado do frontend.
- [CompanySidebar.tsx](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/companies/%5Bid%5D/components/CompanySidebar.tsx) — Componente de barra lateral legado.
- [ClaimCompanyCard.tsx](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/companies/%5Bid%5D/components/ClaimCompanyCard.tsx) — Card de reivindicação de perfil.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `openSignupGate` de `@/lib/signup-gate` para bloqueio de contatos não autenticados.
- `useFaqExpand` de `@/lib/analytics/hooks/useIntentTracking` para tracking de sanfonas de FAQ.
</code_context>
