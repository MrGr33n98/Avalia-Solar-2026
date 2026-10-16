# ARQUITETURA — Fluxo de Propostas do Buyer (Avalia Solar)

> **Documento de Engenharia & Arquitetura de Software**  
> **Escopo:** Descoberta, navegação, comparação e decisão do comprador na aba de propostas (`/review-dashboard/proposals`).  
> **Baseline de código:** `AB0-1-back` (Rails 7 API), `AB0-1-front` (Next.js 14 App Router) e `docs/proposals/` (16/10/2026).

---

## 1. Architecture — Components & Connections

### 1.1 Diagrama de Componentes e Fronteiras de Rede
```mermaid
graph TD
  subgraph Client_Layer ["Camada Cliente (PWA / Mobile 390px)"]
    PWA["Next.js 14 PWA Client<br/>(App Router: /review-dashboard/proposals)"]
    Workspace["MarketplaceProposalsWorkspace.tsx"]
    HookList["useBuyerProposalsList()"]
    HookDetail["useBuyerProposalDetail()"]
    HookComp["useProposalComparison()"]
    ChipsLib["ProposalChips.tsx (C1-C20)"]
    Stepper["ModernProposalStepper.tsx (5 etapas)"]
    CompView["ProposalComparison.tsx"]
    ChatView["ProposalConversation.tsx"]
  end

  subgraph BFF_Proxy ["Camada BFF / Edge Proxy"]
    NextProxy["Next.js Route Handler<br/>app/api/v1/[...path]/route.ts"]
    JWT["Validação JWT & Bearer Auth"]
  end

  subgraph Backend_Rails ["Backend Rails 7 (API Rest & Cable)"]
    Controller["Api::V1::MarketplaceProposalsController"]
    DecisionSvc["Marketplace::ProposalDecisionService"]
    MeetingSvc["Marketplace::ProposalMeetingService"]
    PunditPolicy["MarketplaceProposalPolicy"]
    CableChannel["ProposalChatChannel (ActionCable)"]
  end

  subgraph Storage_Layer ["Persistência & Mensageria"]
    PG[(PostgreSQL 14+<br/>marketplace_proposals,<br/>versions, items, terms, meetings)]
    Redis[(Redis 7<br/>Sidekiq + ActionCable PubSub)]
    Spaces[(DO Spaces / S3<br/>PDFs de Propostas Comerciais)]
  end

  PWA --> Workspace
  Workspace --> HookList
  Workspace --> HookDetail
  Workspace --> HookComp
  Workspace --> Stepper
  Workspace --> ChipsLib
  Workspace --> CompView
  Workspace --> ChatView

  HookList --> NextProxy
  HookDetail --> NextProxy
  HookComp --> NextProxy
  ChatView -.-> CableChannel

  NextProxy --> JWT
  JWT --> Controller

  Controller --> PunditPolicy
  Controller --> DecisionSvc
  Controller --> MeetingSvc

  DecisionSvc --> PG
  MeetingSvc --> PG
  Controller --> PG
  Controller --> Spaces
  CableChannel --> Redis
  DecisionSvc -.-> Redis
```

### 1.2 Responsabilidades de Cada Componente
- **`MarketplaceProposalsWorkspace.tsx`**: Orquestrador de estado do comprador. Gerencia URL params (`?proposal=:id&view=<screen>`), abas de status (`received`, `under_review`, `chosen`), drawer de filtros e layout responsivo.
- **`useBuyerProposalsList`**: Consume `GET /api/v1/proposals`. Agrupa propostas por projeto via `groupProposalsByProject()`, aplica filtros no cliente e cancela requisições pendentes via `AbortController`.
- **`useBuyerProposalDetail`**: Consume `GET /api/v1/proposals/:id`. Dispara `POST /view` automaticamente no primeiro acesso para telemetria e classificação de erros tipada (401, 403 IDOR, 404, 429).
- **`useProposalComparison`**: Gerencia array de IDs (2 a 3 propostas) em memória/localStorage e consome `GET /api/v1/proposals/compare?ids=1,2,3`.
- **`ProposalChips.tsx`**: Biblioteca tipada com os 20 micro-componentes de estado, métricas e identificação (C1 a C20).
- **`MarketplaceProposalsController`**: Controlador Rails com filtro de acesso IDOR estrito (`ensure_buyer_access!`) que garante que a proposta pertença a `current_user.id` ou `LOWER(leads.email) = LOWER(current_user.email)`.

---

## 2. IT Current-State — Legacy Landscape vs Modernization

| Dimensão | Estado Atual (As-Is) | Estado Modernizado (To-Be / Referência Visual) |
|---|---|---|
| **Arquitetura de Rotas** | Página única acoplada a query params: `/review-dashboard/proposals?proposal=:id&view=summary` | Mantém rota base com estados limpos, histórico de navegação navegável via breadcrumb `← Meus projetos` e animações de transição sem recarga. |
| **Descoberta de Propostas** | Card com 3 botões espremidos no mobile ("Ver proposta", "Conversar", "Escolher"), sem distinção de peso. | Card com 2 botões de alta ergonomia: Secundário à esquerda `Ver proposta (PDF)` + Primário à direita `Escolher empresa` (CTA amarelo `#FBBF24` 1.35x maior). |
| **Comparação** | Comparação em tabela funcional, mas com tags de cores conflitantes nas células e sem slots de substituição rápida. | 3 `ComparisonTiles` (C16) com botão `×` de remoção rápida, tabela comparativa com células neutras e borda `--brand` destacando apenas a coluna em foco. |
| **Stepper de Jornada** | Drawer colapsável no mobile com texto vertical. | Stepper horizontal de 5 etapas (Solicitação → Propostas → Em análise → Decisão → Projeto) com círculos numerados, datas e linha conectora contínua (telas 1 e 8). |
| **Chat e Mensagens** | Chat carregado em sub-view com navegação ambígua. | Thread isolada, sem BottomNav (D13), com chips de atalho (`Agendar visita`, `Tirar dúvida`, `Solicitar ajuste`) e composer fixo com botão de anexo. |
| **Segurança & IDOR** | Validação centralizada em `ensure_buyer_access!`. Tratamento de 403 exibia "Verifique sua conexão". | Tratamento tipado: 403 exibe tela amigável de restrição de segurança sem tentar retries cegos ou loops infinitos. |

---

## 3. Flowchart — Decision Logic

```mermaid
flowchart TD
  Start([Buyer entra em /review-dashboard/proposals]) --> CheckAuth{Autenticado & ReviewUser?}

  CheckAuth -- Não --> Login[Redirecionar /auth/entrar]
  CheckAuth -- Sim --> FetchList[GET /api/v1/proposals]

  FetchList --> HasProposals{Existem propostas?}
  HasProposals -- Não --> EmptyState[Exibe Estado Vazio: 'Suas propostas ficam aqui' + CTA Explorar Empresas]
  HasProposals -- Sim --> RenderList[Renderiza Stepper 5 etapas + Tabs + Cards de Proposta]

  RenderList --> ActionSelect{Ação do Buyer no Card}

  ActionSelect -- Clica no Card ou 'Ver proposta' --> OpenDetail[Carrega ?proposal=:id&view=summary<br/>Dispara POST /proposals/:id/view]
  ActionSelect -- Marca 'Comparar' (2 a 3) --> CompareReady[Habilita botão 'Comparar propostas']
  ActionSelect -- Clica 'Escolher empresa' --> ConfirmChoose[Abre Tela 7: Decisão e Escolha]

  CompareReady --> ClickCompare[Clica 'Comparar propostas' -> ?view=compare]
  ClickCompare --> FetchCompare[GET /api/v1/proposals/compare?ids=A,B,C]
  FetchCompare --> CheckSameLead{Mesmo projeto/lead?}
  CheckSameLead -- Não --> ErrorCompare[Erro: Só compare propostas da mesma solicitação]
  CheckSameLead -- Sim --> RenderCompareTable[Renderiza 3 ComparisonTiles C16 + Tabela 4 colunas]

  RenderCompareTable --> CompareChoice{Decisão no Comparador}
  CompareChoice -- 'Solicitar ajuste' --> RequestChangeFlow[POST /proposals/:id/request_change<br/>Abre chat com justificativa]
  CompareChoice -- 'Escolher empresa' --> ConfirmChoose

  OpenDetail --> DetailActions{Ação no Detalhe}
  DetailActions -- 'Conversar' --> OpenChat[?view=conversation<br/>Abre Thread sem BottomNav]
  DetailActions -- 'Ver PDF completo' --> OpenPdf[?view=complete<br/>Renderiza folha A4 + Contador C5]
  DetailActions -- 'Escolher empresa' --> ConfirmChoose

  ConfirmChoose --> SubmitAccept[POST /api/v1/proposals/:id/accept<br/>payload: { version_id }]
  SubmitAccept --> SuccessChoose[Tela 7: Sucesso! Ícone verde + Timeline vertical]
  SuccessChoose --> Tracking[Tela 8: Acompanhamento de obra<br/>?view=project]
  Tracking --> MilestoneInstall[Marcos de Visita -> Contrato -> Instalação]
  MilestoneInstall --> Concluded[Tela 10: Projeto Concluído!<br/>4 Métricas de Geração e Economia]
```

---

## 4. Sequence Diagram — Messages Over Time

```mermaid
sequenceDiagram
  autonumber
  actor Buyer as Comprador (Buyer)
  participant PWA as Next.js PWA Client
  participant NextBFF as Next.js BFF (/api/v1)
  participant Rails as Rails 7 API Controller
  participant Policy as Pundit (MarketplaceProposalPolicy)
  participant DB as PostgreSQL 14
  participant Cable as ActionCable / Redis

  Note over Buyer, DB: 1. DESCOBERTA E NAVEGAÇÃO DA ABA
  Buyer->>PWA: Acessa /review-dashboard/proposals
  PWA->>NextBFF: GET /api/v1/proposals (JWT Cookie)
  NextBFF->>Rails: GET /api/v1/proposals (Authorization: Bearer)
  Rails->>Policy: visible_buyer_scope(current_user)
  Rails->>DB: SELECT * FROM marketplace_proposals WHERE buyer_user_id = X OR email = Y
  DB-->>Rails: Lista de propostas + versions + items + company
  Rails-->>NextBFF: 200 OK { proposals: [...] }
  NextBFF-->>PWA: JSON Payload normalizado
  PWA->>Buyer: Renderiza Lista (Stepper 5 etapas + Cards com Preço N1 e Chips)

  Note over Buyer, DB: 2. VISUALIZAÇÃO E TELEMETRIA
  Buyer->>PWA: Clica em "Ver proposta (PDF)"
  PWA->>NextBFF: GET /api/v1/proposals/1 + POST /api/v1/proposals/1/view
  NextBFF->>Rails: POST /api/v1/proposals/1/view
  Rails->>Policy: ensure_buyer_access!
  Rails->>DB: UPDATE marketplace_proposals SET status = 'viewed', viewed_at = NOW()
  Rails-->>NextBFF: 200 OK { proposal: { ...detailed } }
  NextBFF-->>PWA: Detalhes carregados
  PWA->>Buyer: Renderiza Tela 2 (Hero image + ValueCard + 3 StatTiles)

  Note over Buyer, DB: 3. COMPARAÇÃO LADO A LADO
  Buyer->>PWA: Seleciona Propostas 1 e 2 -> Clica "Comparar propostas"
  PWA->>NextBFF: GET /api/v1/proposals/compare?ids=1,2
  NextBFF->>Rails: GET /api/v1/proposals/compare?ids=1,2
  Rails->>DB: SELECT WHERE id IN (1,2) AND lead_id = Z
  DB-->>Rails: 2 propostas retornadas
  Rails-->>PWA: 200 OK { proposals: [P1, P2] }
  PWA->>Buyer: Renderiza Tela 4 (ComparisonTiles C16 + Matriz Comparativa)

  Note over Buyer, Cable: 4. CONVERSA E NEGOCIAÇÃO (CHAT)
  Buyer->>PWA: Clica em "Conversar" ou Chip C8 "Tirar dúvida"
  PWA->>Cable: Conecta WebSocket /cable (ProposalChatChannel)
  Buyer->>PWA: Digita mensagem: "A visita técnica é gratuita?"
  PWA->>Cable: Envia mensagem { proposal_id: 1, content: "..." }
  Cable->>DB: Grava mensagem
  Cable-->>Buyer: Confirma entrega (Balão azul à direita)

  Note over Buyer, DB: 5. ESCOLHA DA EMPRESA E TRANSIÇÃO
  Buyer->>PWA: Clica em "Escolher empresa" (CTA Amarelo #FBBF24)
  PWA->>NextBFF: POST /api/v1/proposals/1/accept { version_id: 100 }
  NextBFF->>Rails: POST /api/v1/proposals/1/accept
  Rails->>Policy: ensure_buyer_access!
  Rails->>DB: ProposalDecisionService -> transiciona status para 'accepted'
  Rails->>DB: Cria Project e marcos de instalação
  Rails-->>NextBFF: 200 OK { proposal: { status: 'accepted', project: { ... } } }
  NextBFF-->>PWA: Confirmação recebida
  PWA->>Buyer: Renderiza Tela 7 (Sucesso! Confetes + Timeline Vertical)
```

---

## 5. Regras de Integridade e Recomendações Técnicas

1. **Nunca quebrar IDOR:** Todas as chamadas de detalhe, download e decisão devem passar por `ensure_buyer_access!`. Qualquer tentativa de acesso a propostas de terceiros deve retornar HTTP 403 e ser tratada no frontend sem loop.
2. **Comparação Restrita ao Mesmo Lead:** O endpoint `/compare` bloqueia comparação de propostas com `lead_id` diferentes para evitar misturar requisitos técnicos distintos (ex: sistema trifásico de 15 kWp com residencial monofásico de 5 kWp).
3. **Ergonomia do CTA Amarelo:** O botão "Escolher empresa" (`#FBBF24`) deve permanecer em posição de destaque primário à direita (`flex-[1.35]`), com tipografia `#0F172A` e peso 700+.
4. **Respeito à Decisão D13:** A tela de chat (`view=conversation`) nunca deve exibir `BottomNav` para evitar conflito de toque com o teclado virtual no mobile.
