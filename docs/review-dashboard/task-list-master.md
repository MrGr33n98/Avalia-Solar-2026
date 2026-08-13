# Controle de Tarefas Master — Review Dashboard

Este arquivo gerencia as tarefas, status e o roadmap técnico da estabilização do domínio **Review Dashboard** no Avalia Solar 2026.

## 📋 Lista de Atividades

### 1. Backend (Ruby on Rails)
- [x] **TASK 01–05: Estabilização e Fontes de Dados** — Remover fallbacks fictícios de Green Score/ranking e preservar estados nulos.
- [x] **TASK 06–11: Reviewer Solutions** — Persistência real em PostgreSQL via modelo `ReviewerSolution`.
- [x] **TASK 18–21, 48: Reviewer Profile** — Persistência do perfil associada a `User` e carregamento de foto via Active Storage.
- [x] **TASK 73: ActiveAdmin Overview** — Otimização de consultas para cálculo de Green Score médio (prevenção de N+1 queries).
- [x] **Ajuste de Bloco Actions no ActiveAdmin** — Yieldar recurso no `actions` do CRUD de soluções.
- [x] **Specs de Modelos** — Criar testes unitários para `ReviewerSolution` e `ReviewerProfile`.

### 2. Frontend (Next.js)
- [x] **Verificação de Conquistas** — Corrigir verificação no frontend para lidar com os status em português returned pelo Rails (`'bloqueado'` / `'desbloqueado'`).
- [x] **Menu e Dashboard Dinâmico** — Exibir conquistas e progresso de completude do perfil reais a partir dos dados do usuário logado e do summary.
- [x] **Redes Sociais Dinâmicas** — Tratar o status de redes sociais completas dinamicamente caso preenchido pelo menos um link de rede.
- [x] **Polimento de Impacto Ambiental** — Substituir estimativa fictícia calculada localmente no frontend por `Indisponível` nas soluções.

### 3. Garantia de Qualidade (QA) e Homologação
- [x] Executar typecheck (`tsc --noEmit`) para validação estática de tipos TS.
- [ ] Executar suíte completa de RSpec integrado.
- [ ] Executar suíte E2E do Playwright (`npm run test` contra ambiente unificado).

## 🚀 Roadmap e Próximos Passos
1. **Ledger Auditável para Recompensas** — Implementar banco de dados transacional de pontos de Green Score antes de ativar Rewards/Redemptions.
2. **CRUD de Publicações (Publications)** — Desenhar o domínio e modelo para publicações de avaliadores (hoje desativado).
3. **Throttling e Limites de Rate** — Refinar regras de rate limit para criação de novas soluções por usuário.
