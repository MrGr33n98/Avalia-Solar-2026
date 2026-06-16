# Roadmap - Avalia Solar Mobile App

Roadmap estratégico para a transformação do app em um marketplace funcional, eliminando mocks e integrando serviços core.

## Phases

- [ ] **Phase 1: Fundação e Integração da Home (P0)** - Substituição de mocks por Apollo GraphQL na tela principal.
- [ ] **Phase 2: Autenticação e Segurança (P0)** - Implementação de login real e persistência segura.
- [ ] **Phase 3: Conversão e Reputação (P1)** - Fluxos reais de Leads e Reviews via QR Code.
- [ ] **Phase 4: Comunicação Real-time (P2)** - Integração final do Chat P2P via ActionCable.
- [ ] **Phase 5: Polimento e Produção (P3)** - Auditoria final de mocks e refinamento de UX.

## Phase Details

### Phase 1: Fundação e Integração da Home (P0)
**Goal**: Transformar a vitrine principal em um componente dinâmico alimentado pela API real.
**Depends on**: Nada
**Requirements**: HOME-01, MOCK-01
**Success Criteria** (o que deve ser VERDADE):
  1. A tela Home exibe banners reais vindos do GraphQL.
  2. Categorias e Empresas em Destaque são carregadas dinamicamente da API.
  3. O código da `src/app/index.tsx` não contém arrays de dados estáticos (mocks).
**Plans**: 4 plans
- [ ] 01-01-PLAN.md — Infraestrutura de Dados e Skeletons
- [ ] 01-02-PLAN.md — Banners e Categorias Dinâmicas
- [ ] 01-03-PLAN.md — Empresas e Feed do Blog
- [ ] 01-04-PLAN.md — Refinamento, Erros e Remoção de Mocks
**UI hint**: yes

### Phase 2: Autenticação e Segurança (P0)
**Goal**: Garantir acesso seguro e persistência de sessão para usuários reais.
**Depends on**: Phase 1
**Requirements**: AUTH-01
**Success Criteria** (o que deve ser VERDADE):
  1. Usuário consegue realizar login com credenciais válidas e persistir a sessão após fechar o app.
  2. O token de autenticação é armazenado exclusivamente no `SecureStore`.
  3. Estados globais de autenticação (Zustand) refletem o status real do usuário.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Conversão e Reputação (P1)
**Goal**: Ativar os motores de geração de negócio (leads) e confiança (reviews).
**Depends on**: Phase 2
**Requirements**: LEAD-01, QR-01
**Success Criteria** (o que deve ser VERDADE):
  1. O formulário de orçamento envia leads reais para o backend Rails com sucesso.
  2. O scanner de QR Code identifica IDs de empresas e abre o formulário de review correspondente.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Comunicação Real-time (P2)
**Goal**: Substituir a comunicação simulada por um chat funcional em tempo real.
**Depends on**: Phase 3
**Requirements**: CHAT-01
**Success Criteria** (o que deve ser VERDADE):
  1. Mensagens são enviadas e recebidas instantaneamente sem necessidade de refresh manual (WebSockets).
  2. A implementação legada em `/chat` foi removida em favor da `/p2p_chat`.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Polimento e Produção (P3)
**Goal**: Garantir consistência visual e performance para lançamento.
**Depends on**: Phase 4
**Requirements**: MOCK-01 (Finalização)
**Success Criteria** (o que deve ser VERDADE):
  1. Nenhuma referência a "mock" ou "dummy data" existe no diretório `src/`.
  2. A interface segue rigorosamente os tokens de design (cores/tipografia) definidos.
**Plans**: TBD
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Fundação e Integração da Home | 0/4 | Not started | - |
| 2. Autenticação e Segurança | 0/1 | Not started | - |
| 3. Conversão e Reputação | 0/1 | Not started | - |
| 4. Comunicação Real-time | 0/1 | Not started | - |
| 5. Polimento e Produção | 0/1 | Not started | - |
