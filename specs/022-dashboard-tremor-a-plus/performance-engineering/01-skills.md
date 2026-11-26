# Skills selecionadas do inventário fornecido
A lista do usuário confirma nomes, não conteúdos ou compatibilidade. Ler SKILL.md de cada selecionada antes do uso; registrar path, versão/hash, instruções aplicadas e evidências. Não instalar skills novas. REA é opcional, limitado a código próprio, loopback e ambiente autorizado.
| Ordem | Skills | Uso | Saída |
|---|---|---|---|
| 1 | root-cause-analysis, systematic-debugging | hipóteses, reprodução, causalidade | RCA com contraexemplos |
| 2 | profiling, performances, performance-tuning | CPU, long tasks, memória, waterfall, React Profiler | baseline e flamegraphs |
| 3 | playwright-interactive, playwright | sessão autorizada, trace, navegação, regressão | cenários reproduzíveis |
| 4 | vercel-react-best-practices, vercel-composition-patterns | render, boundaries, props, effects, state | mapa de renderizações |
| 5 | caching-strategies, build-optimization | query lifecycle, chunks, dependências | mapa de cache e bundles |
| 6 | animation-performance, review-animations | layout/paint, motion, reduced-motion | orçamento de animação |
| 7 | multi-tenancy, security-audit | cache tenant, sessão, feature gates | testes A/B e IDOR |
| 8 | observability, metrics-and-monitoring, slo-definition | RUM, budgets e alertas | SLO e instrumentação |
| 9 | dashboards, design-system, web-design-guidelines, break-ui | consistência, responsividade e a11y sem mudar a referência Tremor | checklist de paridade |
| 10 | speckit-specify, speckit-plan, speckit-tasks, speckit-analyze, speckit-checklist | formalizar e checar cobertura | spec/plan/tasks |
| B somente | speckit-implement, progressive-delivery, ci-pipelines, feature-flags | implementação e release | PR/CI/rollback |
Condicionais: image-optimization para mídia comprovadamente pesada; distributed-tracing e database-operations se backend for gargalo; load-testing apenas em staging autorizado e com limites acordados; error-budgets para regressões; reverse-engineer-anything (config global) para comparação delimitada, nunca como gate de decompilação total. Não aplicar skills de estética concorrente; design-system é organização técnica, não nova estética. Não usar Kubernetes, multi-cloud, migração de infra ou otimizações SEO públicas para este escopo.
