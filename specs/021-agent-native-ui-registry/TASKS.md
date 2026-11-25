# TASKS — ordem executável
Todas as tarefas começam desmarcadas. W0–W7 = MVP. W8–W12 = backlog condicionado. Cada wave depende do gate da anterior; paralelizar apenas testes/docs sem conflitos. Ao concluir, anexar prova RED/GREEN, SHA e arquivos. Não marcar por inferência.

## W0 — Baseline e instalação isolada
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T001 | [ ] Inventariar status/HEAD/PRs/specs e criar worktree | git / AGENTS.md | AC11 |
| T002 | [ ] Revalidar versões e engines, lockfiles e licença mcpcn | SETUP / package.json | AC02 |
| T003 | [ ] Capturar registry upstream, SHA, 30 blocos e dependências | MCPCN_SCAN | AC07 |
| T004 | [ ] Rodar baseline typecheck/unit/build/e2e/Rails | packages/mcp-ui / spec | AC01 |
| T005 | [ ] Registrar gzip e screenshots via harness | manifest / evidence | AC03/04 |
| T006 | [ ] Reconciliar 019/020 e segredos expostos sem reproduzir | BASELINE / SECURITY | AC09/11 |
| T007 | [ ] Preparar laboratório shadcn e instalar product-list/table | lab descartável | AC02 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W1 — Tokens e host theme
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T008 | [ ] Mapear tokens reais frontend e MCP | tokens.css / globals | AC02 |
| T009 | [ ] Adicionar escala tipográfica e spacing aliases sem breaking | design/tokens.css | AC04 |
| T010 | [ ] Mapear host styles e temas sem global overwrite | bridge / tokens | AC04 |
| T011 | [ ] Reproduzir e corrigir container-query da própria frame se confirmado | primitives / CSS | AC04 |
| T012 | [ ] Capturar baseline versus candidato | Playwright | AC03/04 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W2 — Primitives
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T013 | [ ] Inventariar exports e aliases, evitar duplicatas | design/primitives.tsx | AC01 |
| T014 | [ ] Padronizar Button/IconButton/Avatar/Badge/label | design / tests | AC04 |
| T015 | [ ] Padronizar loading/empty/error/focus/reduced motion | design / tests | AC04 |
| T016 | [ ] Testar fallback de imagens e URLs inválidas | bridge / unit | AC09 |
| T017 | [ ] Gate de bundle e a11y | build / e2e | AC03/04 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W3 — Search e categorias
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T018 | [ ] Extrair SolarCompanyCard/List sem alterar domínio | IntegratorCard/SearchWidget | AC01/05 |
| T019 | [ ] Implementar variantes list/grid com IDs | blocks / unit | AC05 |
| T020 | [ ] Extrair GeographicFilter e testar city drop | SearchWidget / schemas | AC06 |
| T021 | [ ] Reproduzir fallback solar e preservar semântica do contrato | SearchWidget | AC06 |
| T022 | [ ] Preservar cursor, ordenação e concorrência de requests | bridge / SearchWidget | AC06 |
| T023 | [ ] CategorySelector/QuickActions e fluxo categories→search | CategoriesWidget | AC01 |
| T024 | [ ] E2E search→profile→back e gate gzip | tests | AC01/03 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W4 — Brand e catálogo
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T025 | [ ] Preservar BrandHero 16:5 e swipe/fallback | BrandHero | AC04 |
| T026 | [ ] Extrair BrandIdentity/Metrics sem dados novos | ProfileView | AC05 |
| T027 | [ ] Portar Product List list/grid/carousel conforme contrato | CatalogPreview / blocks | AC05 |
| T028 | [ ] Eliminar defaults, fake stock, EUR, carrinho | unit / build | AC05 |
| T029 | [ ] Preservar portfolio/gallery/trust e gating | ProfileView / sections | AC01/09 |
| T030 | [ ] Verificar URI v2/manifest e fallback de flags | Rails ResourceRegistry | AC08 |
| T031 | [ ] Testar imagens, keyboard e bundle | tests | AC03/04 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W5 — Compare
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T032 | [ ] Extrair picker com seleção por ID e limite 2–3 | SearchWidget / blocks | AC06 |
| T033 | [ ] Padronizar CompanyComparisonTable sem critérios falsos | CompareView | AC05 |
| T034 | [ ] Testar tabela em container pequeno e fullscreen | tests | AC04 |
| T035 | [ ] Testar reorder, remover empresa, unknown e rollback | unit/e2e | AC01/06 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W6 — Reputation e Evidence
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T036 | [ ] Extrair ReputationBadge e ReviewDistribution | ReputationView / primitives | AC05 |
| T037 | [ ] Preservar rating null, total aprovado, fonte e limitação | schemas / tests | AC05 |
| T038 | [ ] Construir EvidenceCard a partir de SourceNote; sem ID fictício | blocks | AC05/08 |
| T039 | [ ] Testar sem avaliações e dados parciais | unit/e2e | AC05 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W7 — Registry e Quality Lab
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T040 | [ ] Criar registry versionado com paths e licenças | packages/ui-registry | AC07 |
| T041 | [ ] Validar schema/dep graph, paths e ausência de secrets | registry scripts | AC07/09 |
| T042 | [ ] Testar 3 instalações em sandbox | CI / lab | AC07 |
| T043 | [ ] Criar playground host harness, tema, viewport, states | playground | AC10 |
| T044 | [ ] Executar matriz E2E/a11y/perf/contratos | tests / manifest | AC01–AC11 |
| T045 | [ ] Criar relatório final e draft PR com rollback | HANDOFF / CI | AC12 |
| T046 | [ ] Staging/real-host se autorizado; registrar gates | ROLLOUT | AC10/12 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W8 — Mapa e expansão de catálogo (diferido)
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T047 | [ ] Validar dados de localização e licença tiles; POC isolada | map / CSP | AC09 |
| T048 | [ ] Avaliar novos contratos de reviews, FAQ, produtos e vídeo | Rails public registry | AC08/09 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W9 — Orçamento (diferido)
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T049 | [ ] Spec de autorização, entitlements, consentimento e idempotência | backend / policy | AC09 |
| T050 | [ ] Form/confirm/progress e testes de envio explícito | UI / backend | AC09 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W10 — Analytics privado (diferido)
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T051 | [ ] Definir scope OAuth/tenant/plan e schemas | private registry | AC09 |
| T052 | [ ] Cards/benchmark/buyer intent com dados autorizados | dashboard / MCP | AC05/09 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W11 — Generative UI (diferido)
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T053 | [ ] Avaliar OpenUI/json-render em sandbox com allowlist e limites | lab | AC09 |
| T054 | [ ] Provar rejeição de scripts, componentes e ações arbitrárias | tests | AC09 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.

## W12 — Distribuição (diferido)
| ID | Tarefa | Alvo | Aceite |
|---|---|---|---|
| T055 | [ ] Revisar licença e publicar registry somente com aprovação | registry / release | AC07/09 |
| T056 | [ ] Avaliar eventos/social e contratos separados | backlog | AC09 |

**Gate da wave:** revisar diff, executar testes afetados, build gzip e registrar PASS/FAIL/BLOCKED/NOT RUN; se vermelho, corrigir ou documentar dependência, não habilitar flags.
