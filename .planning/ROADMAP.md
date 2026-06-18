# Avalia Solar Mobile App - Roadmap para Versão 100% Android

Este roadmap descreve as fases e objetivos para a transição do aplicativo mobile Avalia Solar de sua base React Native/Expo para uma versão 100% nativa Android, utilizando Kotlin e o SDK do Android.

## Phases

- [ ] **Phase 1: Foundation & Architecture (Android Native)** - Estabelecer o projeto Android nativo, arquitetura e integrações fundamentais.
- [ ] **Phase 2: Authentication & User Management (Android Native)** - Implementar autenticação e gestão de sessão seguras na app Android nativa.
- [ ] **Phase 3: Native Home & Data Display** - Exibir o conteúdo principal da aplicação (Categorias, Banners, Empresas em Destaque) com UI nativa Android.
- [ ] **Phase 4: Engagement & Conversion Features (Part 1)** - Implementar o Formulário de Orçamento e o fluxo de Review via QR Code.
- [ ] **Phase 5: Real-time Communication (Chat)** - Integrar a funcionalidade de chat P2P em tempo real usando ActionCable.
- [ ] **Phase 6: Performance, Polish & Release Prep** - Otimizar o desempenho geral, refinar a UI/UX e preparar para o lançamento.

## Phase Details

### Phase 1: Foundation & Architecture (Android Native)
**Goal**: Estabelecer o projeto Android nativo básico, a arquitetura central e as integrações fundamentais.
**Depends on**: Nothing
**Requirements**: AND-01, AND-03, AND-04
**Success Criteria** (what must be TRUE):
  1. Um projeto Android nativo (Kotlin) é inicializado e configurado para desenvolvimento.
  2. Uma arquitetura escalável (ex: MVVM) é implementada com exemplos básicos de tela.
  3. A biblioteca de cliente GraphQL é configurada e capaz de fazer uma query básica para a API.
  4. O ambiente de build e CI/CD para Android nativo é configurado.
**Plans**: TBD

### Phase 2: Authentication & User Management (Android Native)
**Goal**: Habilitar usuários a autenticar e gerenciar suas sessões de forma segura dentro do aplicativo Android nativo.
**Depends on**: Phase 1
**Requirements**: AUTH-01, AND-06
**Success Criteria** (what must be TRUE):
  1. Usuários podem se registrar e fazer login usando credenciais reais da API.
  2. Tokens de autenticação são armazenados de forma segura utilizando as APIs nativas do Android.
  3. A sessão do usuário é persistida e restaurada corretamente entre as reinicializações do aplicativo.
  4. Usuários podem fazer logout de suas contas.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Native Home & Data Display
**Goal**: Exibir o conteúdo principal da aplicação (Categorias, Banners, Empresas em Destaque) de fontes de dados reais com uma interface de usuário nativa Android.
**Depends on**: Phase 1, Phase 2
**Requirements**: HOME-01, MOCK-01, AND-02, NFR-01
**Success Criteria** (what must be TRUE):
  1. A tela inicial exibe categorias, banners e empresas em destaque populados por dados reais da API.
  2. A interface da tela inicial adere às diretrizes do Material Design do Android.
  3. A tela inicial carrega e exibe o conteúdo em menos de 2 segundos em condições de rede 4G estáveis.
  4. Nenhum dado mockado ou hardcoded está presente na tela inicial.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Engagement & Conversion Features (Part 1)
**Goal**: Implementar funcionalidades críticas de interação do usuário e conversão: Formulário de Orçamento e Review por QR Code.
**Depends on**: Phase 3
**Requirements**: LEAD-01, QR-01, MOCK-01, NFR-03
**Success Criteria** (what must be TRUE):
  1. Usuários podem preencher e enviar um formulário de orçamento, e os leads são registrados na API.
  2. Usuários podem escanear um QR Code para iniciar o fluxo de review.
  3. O fluxo de review via QR Code integra-se com a API de reputação.
  4. Todas as telas de formulários e reviews estão em PT-BR.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Real-time Communication (Chat)
**Goal**: Integrar a funcionalidade de chat P2P em tempo real usando ActionCable.
**Depends on**: Phase 2, Phase 3
**Requirements**: CHAT-01, AND-05
**Success Criteria** (what must be TRUE):
  1. Usuários podem enviar e receber mensagens em tempo real em um chat P2P.
  2. A interface do chat é fluida e responsiva, alinhada com a experiência nativa do Android.
  3. As conversas anteriores são carregadas corretamente ao acessar um chat existente.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Performance, Polish & Release Prep
**Goal**: Otimizar o desempenho geral do aplicativo, refinar a UI/UX e preparar para o lançamento.
**Depends on**: Phase 4, Phase 5
**Requirements**: AND-07, NFR-01, NFR-02, AND-02
**Success Criteria** (what must be TRUE):
  1. O aplicativo demonstra um desempenho geral suave, sem lentidão ou travamentos perceptíveis.
  2. Todas as interações da interface do usuário são responsivas e animadas conforme o Material Design.
  3. Um processo de revisão de segurança verifica que nenhum dado sensível é armazenado de forma insegura.
  4. O aplicativo está pronto para ser publicado na Google Play Store.
**Plans**: TBD
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Architecture (Android Native) | 0/3 | Not started | - |
| 2. Authentication & User Management (Android Native) | 0/4 | Not started | - |
| 3. Native Home & Data Display | 0/4 | Not started | - |
| 4. Engagement & Conversion Features (Part 1) | 0/4 | Not started | - |
| 5. Real-time Communication (Chat) | 0/3 | Not started | - |
| 6. Performance, Polish & Release Prep | 0/4 | Not started | - |
