> V1.2: antes de implementar, cumprir `performance-engineering/00-START-HERE.md`, A0–A3 e gate D0. A extensão é vinculante para performance e ordem de execução; Tremor inspiração only permanece.

# Plano / roadmap

| Wave | Entrega | Dependência | Gate |
| --- | --- | --- | --- |
| W0 | Baseline e discovery | checkout e autorização | evidência por tarefa |
| W1 | Segurança, tokens e primitives | W anterior; trilhas independentes após W2 | evidência por tarefa |
| W2 | Shell, navegação e mobile | W anterior; trilhas independentes após W2 | evidência por tarefa |
| W3 | Overview, analytics, charts | W anterior; trilhas independentes após W2 | evidência por tarefa |
| W4 | Reputação, presença e catálogo | W anterior; trilhas independentes após W2 | evidência por tarefa |
| W5 | Intelligence | W anterior; trilhas independentes após W2 | evidência por tarefa |
| W6 | Leads, propostas e atendimento | W anterior; trilhas independentes após W2 | evidência por tarefa |
| W7 | Conta, integrações e MVP | W anterior; trilhas independentes após W2 | MVP |
| W8 | CRM Sales | W anterior; trilhas independentes após W2 | evidência por tarefa |
| W9 | Reviewer | W anterior; trilhas independentes após W2 | evidência por tarefa |
| W10 | Compatibilidade e domínio admin | W anterior; trilhas independentes após W2 | evidência por tarefa |
| W11 | Release | W anterior; trilhas independentes após W2 | Release |

W0 bloqueia refactor até baseline mínimo dos domínios afetados. W1–W2 shell/segurança, W3–W7 empresa, W8 CRM e W9 reviewer podem ocorrer em PRs separadas depois dos primitives, W10 compatibilidade, W11 release. Sequência preferencial, não promessa de prazo. Estimativa só após descoberta e baseline. Uma PR por wave ou domínio, reviewer de design + engenharia + segurança conforme risco. Não executar big bang. Cada PR deve incluir before/after, routes touched, test commands, artifact hashes, budgets, policies, rollback.

Definition of Ready: contrato existente identificado, baseline, fixture e critérios. Definition of Done: testes green, paridade, documentação, revisão, CI, flags off default. Bloqueio: registrar razão, owner, impacto e próxima ação; seguir tarefas independentes.
