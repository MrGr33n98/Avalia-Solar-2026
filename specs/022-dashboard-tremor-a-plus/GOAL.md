# GOAL — SPEC 022 V1.2 — AUDITORIA PRIMEIRO

**Ordem vinculante:** executar `performance-engineering/GOAL-READ-ONLY.md` e `00-START-HERE.md` antes de qualquer implementação. Parar no D0, entregar diagnóstico e aguardar autorização explícita. A fase de implementação abaixo só se aplica após D0 aprovado.

# GOAL — SPEC 022 — DASHBOARD A++
MODE: IMPLEMENTATION / TREMOR UI INSPIRATION ONLY / TDD / EVIDENCE-FIRST / PERFORMANCE-FIRST

Leia primeiro INSPIRATION-ONLY.md, diretriz vinculante.

Transforme TODA a área autenticada do Avalia Solar em uma experiência operacional premium inspirada no Tremor Database (visual), Dashboard (shell e analytics), Insights (CRUD/filtros), Overview (analytics). Não é um clone nem migração de framework. Preserve a marca, todas as funcionalidades, contratos, gates e navegação. Use Spec 017 como baseline obrigatório; não reverta correções das Specs 018–021. Não toque no marketplace público nem altere MCP UI Registry sem aprovação de escopo.

Execute W0–W11 em tasks.md: audite runtime autorizado, baseline, RED/GREEN/REFACTOR, homologação por domínio, PRs revisáveis. MVP W0–W7 cobre workspace empresarial. CRM e Reviewer são ondas separadas para completar todo o app. Se houver dependência de dados ou credencial, bloqueie somente a tarefa afetada, documente e siga com as independentes. Não simule PASS. Não use company_id=372 sem autorização de membership; em staging use tenants sintéticos A/B.

Use agentes/skills disponíveis: Tremor docs como única referência visual, shadcn/Radix existentes para primitives, Playwright para runtime, REA local opcional para evidência, frontend-design, React/Next.js, a11y, performance, security, TDD. Descubra ferramentas de fato disponíveis. Não instalar novos processos em produção. Não atualizar Next/React/Tailwind globalmente. Não instalar, clonar, portar ou copiar Tremor; não adicionar dependências para estética. Implementação própria com stack existente.

Entregue código, testes, evidência antes/depois, inventário atualizado, matrizes de paridade, impacto, CI, PR, rollback e blockers. Não faça merge/deploy produtivo automaticamente. Não marque tarefas sem evidência.
