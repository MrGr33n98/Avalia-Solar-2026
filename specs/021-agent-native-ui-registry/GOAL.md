# GOAL: AVALIA SOLAR — SPEC 021 — AGENT-NATIVE UI REGISTRY A+++
MODE: IMPLEMENTATION / TDD / EVIDENCE-FIRST / PERFORMANCE-FIRST

Você é o agente responsável pela entrega ponta a ponta no repositório `MrGr33n98/Avalia-Solar-2026`. Utilize este pack como especificação; leia AGENTS.md e instruções locais antes de atuar. Comece em W0, não reescreva o produto. Sua missão é entregar o MVP W0–W7, com PR revisável e staging apenas sob autorização existente. W8–W12 são backlog, não bloquear MVP nem implementar integrações sem contratos.

## Instruções de execução
- Levante git status, branch, HEAD, worktrees, PRs e dependências Spec 018/019/020. Não descarte trabalho alheio. Preserve a auditoria 020 untracked caso ainda esteja assim. Fixe SHA base e origem mcpcn. Não force push, não faça merge automático.
- Instale o mcpcn em laboratório descartável, nunca via `shadcn init` no pacote produtivo. Consulte https://www.mcpcn.dev/docs/blocks/list, registry e código. Use o shadcn MCP para descobrir/inspecionar os blocos; ele não é o runtime de MCP Apps.
- Use skills disponíveis: shadcn, React/TypeScript, MCP Apps SDK, design system, a11y, Playwright, performance e REA. Astryx/Carbon são referência visual; não importar seus frameworks sem justificativa. Inventarie tools antes de usar. REA CLI é fallback aceitável; não depender de Hopper. Não imprimir `claude mcp list` sem redigir credenciais.
- Preserve React 18, Vite, Zod 4, ext-apps, Rails, OAuth, allowlist de recursos, Pundit, flags, telemetria e cinco chaves do envelope público. Não adicionar runtime ou serviço na VM. Não migrar Tailwind/Next/React como efeito colateral.
- Use RED → GREEN → REFACTOR: escreva testes antes da alteração, prove falha específica e depois sucesso. Se baseline já falhar, registre; não maquie. Cada tarefa tem critério, evidência e arquivo/commit. Use fixtures sintéticas explícitas apenas em harness/teste.
- Entregue componentes com data/actions/appearance/control, IDs estáveis, host-aware, pt-BR, estados loading/empty/error/offline/disabled e teclado/toque. Utilize tokens existentes. Preserve origem de reputação, sede versus cobertura e gating comercial. Nenhum preço, estoque, coordenada, selo, dado ou ação inventados.
- Faça gates a cada wave. Não ultrapasse 122880 bytes gzip por superfície; não aumente orçamento para caber. Se bloquear, reduza escopo/dependências, registre evidência e avance em tarefas independentes.
- Não habilite novas flags em produção, não altere segredo, não faça deploy destrutivo. Staging e canary somente com autorização e pipelines existentes; produção exige gate e aprovação humana.

## Entrega
PR draft/reviewable com commits pequenos, checklist de tasks, inventário final, arquivos gerados do registry em CI, screenshots por viewport/theme, métricas, contratos, testes e rollback. Entregue matriz PASS/FAIL/BLOCKED/NOT RUN com evidências, SHAs, URLs de CI/PR reais e lista de lacunas. Não declare production-ready se faltar teste em host real, segurança, build ou aprovação.

Ao iniciar, apresente plano curto e execute W0; prossiga automaticamente nas tarefas autorizadas até o MVP, sem pedir confirmação redundante. Bloqueios de acesso ou mudança de escopo devem ser registrados e encaminhados, não contornados.
