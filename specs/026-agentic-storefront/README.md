# Documentation Pack: SPEC 026 — Agentic Storefront MVP A+++

Bem-vindo ao Documentation Pack da **SPEC 026 — Agentic Storefront**.
Este pacote consolida todos os artefatos de especificação, planejamento, dados, tarefas e governança arquitetural com o modelo **Elephant-Goldfish Model (EGM)** e **Spec Kit**.

---

## 📁 Estrutura de Documentos

```
specs/026-agentic-storefront/
├── README.md                          # Este índice
├── spec.md                            # Especificação funcional e ADDENDUM EGM
├── plan.md                            # Plano arquitetural e fases de entrega
├── tasks.md                           # Backlog ordenado de tarefas (TDD)
├── research.md                        # Benchmark e pesquisa de mercado
├── data-model.md                      # Schemas de dados e contratos Zod
├── IMPLEMENTATION_STATUS.md           # Rastreamento de gates G00-G18
├── contracts/                         # Schemas JSON e definições de interface
├── architecture/                      # Diagramas e detalhes técnicos
├── design/                            # Tokens de design e referências visuais
├── testing/                           # Planos de teste RSpec, Vitest e Playwright
├── egm/                               # Relatórios e rastreamento da revisão Goldfish
│   ├── concepts_brief.md              # Breve conceitual da Fase 02
│   ├── design_draft.md                # Rascunho sob revisão
│   ├── zoom_out_report.md             # Estágio 5: Initial Zoom Out
│   ├── comprehension_report.md        # Estágio 6: Comprehension
│   ├── critic_report.md               # Estágio 7: Design Critique
│   ├── intermediate_zoom_out_report.md# Estágio 8: Intermediate Zoom Out
│   ├── implementation_readiness_report.md # Estágio 9: Implementation Readiness
│   ├── consolidated_review_report.md  # Síntese consolidada
│   ├── findings-traceability.md       # Matriz de resolução de findings
│   ├── accepted-risks.md              # Riscos formalmente aceitos
│   ├── architectural-decisions.md     # ADRs da SPEC 026
│   └── drift-report.md                # Relatório de desvios SPEC x Código
└── evidence/                          # Baselines, logs e métricas
```

---

## 🚀 Como Iniciar a Revisão Goldfish no Antigravity / Claude Code

```bash
# Executar a revisão completa de 5 fases sobre a especificação
/egm:egm-review specs/026-agentic-storefront/spec.md

# Executar loop de revisão automatizada até convergência
/egm:egm-review-loop specs/026-agentic-storefront/spec.md
```
