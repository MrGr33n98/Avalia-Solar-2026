# Sprint 3: Expansão Local & Landing Pages (Máquina de SEO)
**Epic:** MVP Top Companies & SEO Base
**Objetivo do Sprint:** Dominar as buscas locais no Google (ex: "melhor energia solar florianopolis") criando rotas dinâmicas, copywriting focado e filtros de nicho para segmentação.

---

## 📋 Histórias Entregues

| ID | Título | Status | Notas Técnicas |
| :--- | :--- | :---: | :--- |
| **US11** | Dynamic City Pages | ✅ DONE | Nova rota `/melhores-empresas/[categoria]/[estado]/[cidade]`. Componente reutiliza a lógica da listagem com pré-filtros injetados nativamente. |
| **US12** | SEO Copywriting | ✅ DONE | O `generateMetadata` agora lista ativamente as Top 3 empresas locais diretamente na Meta Description. O layout da landing page possui cabeçalho de copywriting dinâmico focado na cidade. |
| **US13** | Filtros de Nicho | ✅ DONE | Backend atualizado (migration `niche_tags: jsonb`), model e controller. Frontend recebeu o filtro "Especialidades" no Sidebar. |
| **US14** | Breadcrumbs Pro | ✅ DONE | Reuso inteligente do `CategoryClientComponent` que já cuida da injeção de JSON-LD Breadcrumb para SEO e Schema.org. |

---

## 🛠️ Resumo de Modificações
*   **Backend:** Migration gerada (`AddNicheTagsToCompanies`), constantes criadas no `Company`, e filtros ajustados na API de categorias. Active Admin atualizado para suportar inserção de "Tags de Nicho".
*   **Frontend:** Rota SEO construída e Otimizada (`LocalRankingPage`). `SidebarFilter.tsx` expandido para as novas frentes.

**Status Geral:** Sprint 100% pronta para deploy.
