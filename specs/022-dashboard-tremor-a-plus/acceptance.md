> V1.2: antes de implementar, cumprir `performance-engineering/00-START-HERE.md`, A0–A3 e gate D0. A extensão é vinculante para performance e ordem de execução; Tremor inspiração only permanece.

# Release gates
| Gate | Condição | Evidência |
| --- | --- | --- |
| G01 | Inventário e baseline completos para domínio | routes/tabs/runtime + deploy SHA + screenshot |
| G02 | Inspiration-only, autoria e stack preservada | referências visuais, diff de dependências/lockfile e revisão de código |
| G03 | Paridade funcional 100% | API/action/role/plan matrix, N/A aprovado |
| G04 | Tenant security zero leakage | server policy + deferred switch + export/ws tests |
| G05 | Design tokens e responsive | screenshots light/dark, 10 widths, zoom |
| G06 | WCAG AA sem serious/critical | axe + manual keyboard/contrast |
| G07 | Dados reais e estados | tests null/zero/error + export parity |
| G08 | Performance | baseline/candidate e budgets; exceptions aprovadas |
| G09 | Suíte CI | typecheck/lint/Jest/build/E2E/RSpec afetado |
| G10 | Staging UAT | owner/comercial/reviewer/admin por domínio |
| G11 | Rollback e flags | staging off/on, no loss |
| G12 | PR/evidence e release authorization | review, changelog, blockers, sem deploy automático |

Gate bloqueante: qualquer vazamento, autorização incorreta, mutação duplicada, cobrança/envio indevido, rota crítica quebrada ou falha de rollback. MVP W0–W7 não significa dashboard inteiro; release completo exige W8–W11 ou exclusão formal aprovada. Não marcar PASS sem artefato. Usar templates/release-gates.csv e evidence-manifest.
