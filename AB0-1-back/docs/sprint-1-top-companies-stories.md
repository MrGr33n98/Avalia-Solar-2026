# Sprint 1: MVP Top Companies & SEO Base
**Epic:** MVP Top Companies & SEO Base - Solar + Mobilidade Elétrica  
**Objetivo do Sprint:** Lançar a infraestrutura de ranking e SEO local para dominar buscas de Energy Intelligence em Florianópolis.  
**Duração:** 2 Semanas (28/02 a 13/03)  
**Definição de Pronto (DoD):** Código revisado, testes unitários passando, 100% de cobertura SEO (Rich Results), funcional em mobile (<375px) e deploy em Staging.

---

## 📋 Tabela de Histórias

| ID | Título | Estimativa | Prioridade | Responsável | Status |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **US01** | Ranking "Melhores em Solar e EV" | 8 SP | Must | Front-end | Ready |
| **US03** | SEO Schema AggregateRating | 3 SP | Must | Back-end | Ready |
| **US04** | Ranking Responsivo (Mobile) | 3 SP | Must | UX/Front | Ready |
| **US05** | Tooltip "Patrocinado" | 1 SP | Should | Front-end | Ready |

---

## 📖 Detalhamento das Histórias

### [US01] Ranking "Melhores em Solar e EV" no Topo
**Descrição:** Como usuário interessado em energia solar em Florianópolis, quero ver um ranking "Melhores em Solar e EV" no topo da página de categoria para identificar rapidamente os líderes do setor.  
**Acceptance Criteria:**
1. Exibir componente de Ranking no topo das listagens de categorias selecionadas.
2. Identificar visualmente as empresas: Ouro (1º), Prata (2º), Bronze (3º).
3. Exibir estrelas de avaliação (rating) e número de reviews conforme dados reais.
4. O clique na empresa deve levar à página de detalhes da empresa.
**Dependências:** US02 (Backend priority_score logic).
**Labels:** `frontend`, `ranking`, `priority-1`

### [US03] SEO Schema AggregateRating (JSON-LD)
**Descrição:** Como Bot do Google, quero ler os dados estruturados de avaliação da empresa no formato AggregateRating para exibir rich snippets (estrelas) nos resultados de busca.  
**Acceptance Criteria:**
1. Implementar script JSON-LD dinâmico em todas as páginas de empresa e ranking.
2. Incluir obrigatoriamente: `ratingValue`, `reviewCount`, `bestRating: 5`.
3. Validar sucesso total na ferramenta [Google Rich Results Test](https://search.google.com/test/rich-results).
**Labels:** `backend`, `seo-dominance`, `priority-1`

### [US04] Ranking Responsivo e Denso (Mobile)
**Descrição:** Como usuário mobile, quero que o ranking seja denso e fácil de ler sem quebras de layout em telas pequenas.  
**Acceptance Criteria:**
1. Layout otimizado para Viewports de 375px a 414px.
2. Utilizar `gap: 1rem` (gap-4) entre os cards de ranking.
3. Garantir que os badges de Ouro/Prata/Bronze não sobreponham o texto em telas estreitas.
**Labels:** `ui-ux`, `mobile-first`, `priority-1`

### [US05] Tooltip Explicativo "Patrocinado"
**Descrição:** Como usuário, quero ver um tooltip ao passar o mouse/clicar no badge "Patrocinado" para entender o critério de destaque.  
**Acceptance Criteria:**
1. Exibir tooltip com o texto: "Empresa com visibilidade prioritária através de parceria com o AvaliaSolar".
2. Funcional em Desktop (hover) e Mobile (click).
**Labels:** `frontend`, `ux-polish`, `priority-2`

---

## 🛠️ Sub-tarefas Técnicas Iniciais

- **[BACK]** Criar migration para adicionar `priority_score:integer` (default: 0) em `Companies`.
- **[BACK]** Criar scope `ordered_by_priority` no model `Company`.
- **[FRONT]** Criar componente `TopCompanyCard` no Storybook.
- **[FRONT]** Adicionar lógica de injeção de `JSONLD` no componente `Head` do Next.js.
- **[QA]** Preparar suite de testes de regressão visual para o Ranking mobile.

---

## 🚀 Notas de Handoff
- **Branch Principal:** `feat/top-companies-sprint-1`
- **Ambiente:** Staging disponível para validação em cada PR.
- **Design:** Consultar tokens de espaçamento em `outputs/design-system/AB0-1/`.
