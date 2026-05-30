# Fase 2: Layout Base, Shell e Hero Premium - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-05-30
**Phase:** 02-layout-base-shell-hero
**Mode:** assumptions
**Areas analyzed:** UI Shell Grid, Hero Dynamic Cover & Fallbacks, Mobile Tabs Overflow

---

## Assumptions Presented

### Area: UI Shell Grid
| Assumption | Confidence | Evidence | Consequence if wrong |
|------------|:----------:|----------|----------------------|
| O Shell unificado usará um grid responsivo com Tailwind CSS de 12 colunas, separando a aba ativa (8 colunas) da sidebar de conversão (4 colunas) em desktops. | Confident | Padrão existente em `CompanyDetailClient.tsx` | Desalinhamento visual ou quebra na largura útil do perfil corporativo. |

### Area: Hero Cover & Fallbacks
| Assumption | Confidence | Evidence | Consequence if wrong |
|------------|:----------:|----------|----------------------|
| Se a empresa não possuir imagem de cobertura configurada, o frontend renderizará um gradiente corporativo premium suave com a identidade Avalia Solar. | Confident | Padrão de resiliência visual do `CompanyHero.tsx` legado | Exibição de placeholders brancos áridos ou imagens quebradas no topo do perfil. |

### Area: Mobile Tabs Overflow
| Assumption | Confidence | Evidence | Consequence if wrong |
|------------|:----------:|----------|----------------------|
| As 6 abas horizontais serão envolvidas em um `<ScrollArea>` com orientação horizontal para rolagem deslizante em celulares de 320px+. | Confident | Implementação segura em `CompanyDetailClient.tsx` legado | Quebra de responsividade com barra de rolagem geral indesejada na tela inteira. |
