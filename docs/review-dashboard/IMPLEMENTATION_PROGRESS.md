# Progresso de implementação — Review Dashboard

## TASK 01–05 — Estabilização e fontes de dados

Status: DONE

### O que foi feito

- Fallback fictício de Green Score/ranking removido.
- Estados nulos/indisponíveis preservados na UI.
- Soluções, perfil, notificações e conquistas usam fontes reais.
- Navegação e cálculos locais divergentes reduzidos.

### Testes

- TypeScript, ESLint e Prettier do frontend: OK.

## TASK 06–11 — Reviewer Solutions

Status: DONE

### Arquivos alterados

- `AB0-1-back/app/models/reviewer_solution.rb`
- `AB0-1-back/app/controllers/api/v1/reviewer_solutions_controller.rb`
- migrations reviewer_solutions/status/events
- ActiveAdmin e request specs
- API client, contexto, modal e E2E

### Banco/API

- PostgreSQL persistente.
- Ownership por `current_user`.
- Soft-delete auditável e status operacional.
- Rate limit de criação.

### Evidências

- `rails db:migrate`: migrations aplicadas.
- `rails db:migrate:status`: migrations novas `up`.
- Rotas Rails carregadas.
- Sintaxe Ruby/specs: OK na imagem Rails.

## TASK 18–21, 48 — Reviewer Profile

Status: DONE

- Profile, avatar e atualização persistentes.
- `Reviewer::ProfileCompletionService` é fonte única.
- PATCH/PUT/GET/avatar protegidos por role.

## TASK 30–35 — Reputation

Status: PARTIAL

- Achievement engine backend centralizado.
- XP retornado como `earned_points`.
- Frontend não deriva regras.
- Rewards permanecem desabilitados até ledger auditável.
- Green Score ainda não possui ledger/eventos explicativos completos.

## TASK 27–29 — Publications

Status: PARTIAL

- Feature explicitamente marcada “em desenvolvimento”.
- KPIs/CTAs fictícios removidos.
- CRUD ainda não implementado por ausência de domínio aprovado neste ciclo.

## TASK 53–60 — Testes

Status: PARTIAL

- E2E de summary/null/solutions criado e atualizado.
- Request specs de solutions/profile/summary criados.
- Suíte backend completa depende de execução RSpec com dependências do ambiente.

## TASK 52 — Observabilidade e TASK 73 — ActiveAdmin overview

Status: DONE

- Eventos de mutation reviewer registrados via analytics lazy.
- Visão operacional ActiveAdmin criada com contagens reais e score médio indisponível quando não calculável.
- Dashboard operacional ampliado com filas reais de moderação, verificação de soluções, publicações recentes, comentários, visualizações e ações rápidas.
- Request specs adicionados para métricas, filas e estados vazios.

## Dívida restante

- Executar RSpec completo e E2E Playwright contra stack integrada.
- Executar RSpec completo e E2E Playwright contra stack integrada.
- Adicionar documentação RSwag dos endpoints novos.
- Integrar eventos PostHog de todas as mutations.
- Implementar ledger de Green Score antes de Rewards.
- Teste manual de responsividade/PWA/acessibilidade.
