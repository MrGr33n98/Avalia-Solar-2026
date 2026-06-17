# Fase 2: Layout Base, Shell e Hero Premium - Contexto

**Gathered:** 2026-05-30 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

O escopo da Fase 2 é a construção do novo invólucro visual (Shell unificado) contendo:
- O cabeçalho da página de perfil com o Breadcrumb responsivo.
- O componente `<CompanyPremiumHero>` (Capa com gradientes/imagens, Logo circular e reputação estelar).
- O grupo de CTAs de alta performance (Orçamento, WhatsApp e Compartilhamento).
- O menu horizontal de 6 abas com rolagem horizontal suave no mobile.
- A Feature Flag que controla a exibição isolada do novo layout.
Nenhuma das abas internas detalhadas (ex. abas de produtos, reviews ou projetos) será implementada nesta fase.
</domain>

<decisions>
## Implementation Decisions

### D-01: Feature Flag de Chaveamento Visual
A refatoração base será integrada em `CompanyDetailClient.tsx` chaveada pela Feature Flag `process.env.NEXT_PUBLIC_ENABLE_PREMIUM_PROFILE === 'true'`. Se inativa, o frontend renderiza o layout antigo. Se ativa, renderiza o novo `CompanyProfileShell` de forma isolada.

### D-02: Grade de Grid de 12 Colunas (Tailwind)
O invólucro do Shell dividirá a área útil de visualização em uma grade responsiva com Tailwind CSS:
- Grid base: `grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8`
- Conteúdo principal (onde renderiza a aba ativa): `lg:col-span-8`
- Barra lateral (onde renderiza a sidebar): `lg:col-span-4`

### D-03: Fallback de Banner do Hero Premium
Para assegurar a excelência visual Premium Leve solicitada:
- Se a empresa for Pro/Enterprise e possuir imagem de cobertura válida, renderiza a imagem com cantos arredondados (`rounded-3xl` / `rounded-[28px]`).
- Se a empresa for Free/Essential, ou se o banner de cobertura não carregar, o Hero aplicará um gradiente suave do azul-escuro institucional com elementos discretos da marca Avalia Solar, evitando placeholders brancos ou quebrados.

### D-04: Rolagem de Abas Mobile (ScrollArea)
O menu de abas de 6 botões será envolvido por um componente `<ScrollArea orientation="horizontal">` do shadcn/ui. Isso assegura que em smartphones (telas de 320px a 480px), as abas deslizem suavemente sem forçar quebras ou overflow na largura do perfil.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- [CompanyHero.tsx](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/companies/%5Bid%5D/components/CompanyHero.tsx) — Componente de Hero legado usado como base de dados.
- [CompanyDetailClient.tsx](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/companies/%5Bid%5D/CompanyDetailClient.tsx) — Client component master do perfil público.
- [UI_SPEC.md](file:///c:/Users/Bobi/Desktop/AB0-1-main/.planning/UI_SPEC.md) — Manual visual Premium Leve do portal.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ComparisonToggleButton` e `WhatsappButton` importados de `@/components/` para compor as ações nobres do card de identidade.
- `useHoverIntent` para telemetria de cliques pendentes de WhatsApp e formulário de orçamento.
</code_context>
