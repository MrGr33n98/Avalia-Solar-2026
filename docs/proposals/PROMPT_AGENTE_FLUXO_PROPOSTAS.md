# PROMPT AGENTE — Implementação do Fluxo de Propostas (Avalia Solar)

> **Companheiro do documento:** [`REFERENCIA_VISUAL_FLUXO_PROPOSTAS.md`](file:///c:/Users/Bobi/Desktop/AB0-1-main/docs/proposals/REFERENCIA_VISUAL_FLUXO_PROPOSTAS.md)  
> **Objetivo:** Guia de implementação técnica, arquitetura de componentes, hooks de dados e contratos de API para o Fluxo de Propostas do Avalia Solar (PWA Next.js 14 e Mobile Expo).  
> **Hierarquia de decisão:** Este prompt > `REFERENCIA_VISUAL_FLUXO_PROPOSTAS.md` > imagens de referência (`rfp3.png` / `rfp.png`).

---

## 1. Visão Geral e Princípios Arquiteturais

O Fluxo de Propostas do Avalia Solar é a jornada central de conversão e acompanhamento do comprador de energia solar fotovoltaica.

### 1.1 Premissas Invioláveis
1. **Fidelidade Visual 100% (Mobile-First 390px):** Cores, proporções, escala de espaçamento (4, 8, 12, 16, 20, 24, 32), bordas e sombras conforme definido em `REFERENCIA_VISUAL_FLUXO_PROPOSTAS.md`.
2. **Sem Truncamento Indevido:** Nomes de empresas, preços em destaque, especificações principais e títulos de seção nunca são truncados.
3. **Resiliência e IDOR:** Toda requisição a `/api/v1/proposals/:id` valida se a proposta pertence ao comprador autenticado. Erros 403 geram aviso de segurança apropriado e nunca disparam loop ou retry cego.
4. **Alinhamento PWA / Mobile:** Componentes devem ser compartilháveis em padrão visual no Next.js (`AB0-1-front/components/reviewer/proposals/` e `app/review-dashboard/proposals/`) e no Expo (`AB0-1-mobile/src/app/proposals.tsx`).

---

## 2. Mapa das 10 Telas do Fluxo

> **Estado real (verificado em 16/10/2026):** o fluxo do comprador é uma página única
> [`app/review-dashboard/proposals/page.tsx`](../../AB0-1-front/app/review-dashboard/proposals/page.tsx)
> que renderiza `MarketplaceProposalsWorkspace.tsx`. A navegação entre telas usa query params
> `?proposal=:id&view=<screen>` (ver `proposalChatUrl` em `lib/marketplace-proposals.ts`).
> **Não existem** rotas `/review-dashboard/proposals/[id]/*`. Não crie rotas novas sem decisão explícita;
> reaproveite os `view` existentes.

| # | Tela | URL atual | Componente existente | BottomNav | StickyActionBar |
|---|---|---|---|:---:|:---:|
| **1** | **Lista de propostas recebidas** | `/review-dashboard/proposals` | `MarketplaceProposalsWorkspace` + `ProposalCompactCard` | Sim | Não |
| **2** | **Detalhes da proposta** | `?proposal=:id&view=summary` | `ProposalSummary` | **Não** | Sim (`Conversar` + `Escolher empresa`) |
| **3** | **Proposta completa (PDF)** | `?proposal=:id&view=complete` | `ProposalSummary` (modo completo) | Sim | Sim (`Baixar PDF` + `Escolher empresa`) |
| **4** | **Comparar propostas** | `?proposal=:id&view=compare` | `ProposalComparison` | Sim | Sim (`Solicitar ajuste` + `Escolher empresa`) |
| **5** | **Personalizar solicitação** | **A VALIDAR** — sem `view` correspondente no workspace | a criar ou reaproveitar fluxo de lead/solicitação existente | Sim | Sim (`Enviar solicitação`) |
| **6** | **Conversa com a empresa (Chat)** | `?proposal=:id&view=conversation` | `ProposalConversation` | **Não** | Composer Fixo |
| **7** | **Escolher empresa (Sucesso)** | `?proposal=:id&view=choose` | `ProposalChoose` | Sim | Sim (`Ver proposta` + `Ir para conversas`) |
| **8** | **Acompanhamento de obra** | `?proposal=:id&view=project` | `ProposalProject` | Sim | Não |
| **9** | **Perfil da empresa** | `/companies/[id]` | página pública existente em `app/companies/[id]` | **Não** | Sim (`Conversar` + `Solicitar proposta`) |
| **10** | **Conclusão de projeto** | `?proposal=:id&view=completed` | `ProposalCompleted` (+ `ProposalReview` em `view=review`) | Sim | Sim (`+ Avaliar empresa` + `Ver meus projetos`) |

Outros `view` existentes fora das 10 telas: `meeting` (`ProposalMeeting`), `negotiation` (`ProposalNegotiation`).

---

## 3. Catálogo de Chips e Componentes Reutilizáveis

Todos os chips listados em `REFERENCIA_VISUAL_FLUXO_PROPOSTAS.md` devem ter componentes tipados e acessíveis.
As assinaturas abaixo são **propostas** (ainda não existem com esses nomes). Antes de criar, verifique e
reaproveite `StatusBadge` e `CompanyMark` (exportados de `proposals/ProposalSummary.tsx`) e os primitives de `components/ui/`.

- `<StatusChip status="received|viewed|analyzing|chosen|rejected|expired" date={Date} />` (C1)
- `<HeroOverlayChip text="Proposta recebida" date="06/10/2026" />` (C2)
- `<BenchmarkChip type="below|average|above" />` (C3)
- `<GalleryCounter current={1} total={12} />` (C4)
- `<PdfPageCounter current={1} total={12} />` (C5)
- `<PowerChips options={[5, 8.5, 10, 15]} selected={value} onSelect={fn} />` (C6)
- `<FinanceToggle value={boolean} onChange={fn} />` (C7)
- `<QuickActionChips chips={["Agendar visita", "Tirar dúvida", "Solicitar ajuste"]} onSelect={fn} />` (C8)
- `<ContextChip proposalCode="AS-2026-D00000016" value={45000} status="Recebida" onClick={fn} />` (C11)
- `<VerifiedBadge size={16} />` (C13)
- `<RatingBadge rating={4.8} reviewCount={126} />` (C14)
- `<ComparisonTile company={company} onRemove={fn} />` (C16)

---

## 4. Contratos de API & Hooks de Dados

### 4.1 Endpoints Backend (Rails 7 REST) — verificados

Fonte: `AB0-1-back/config/routes.rb` (`resources :proposals, controller: 'marketplace_proposals'`)
e cliente `marketplaceProposalsApi` em `AB0-1-front/lib/api.ts`.

| Método e rota | Cliente frontend | Uso |
|---|---|---|
| `GET /api/v1/proposals` | `list()` | Lista do comprador autenticado |
| `GET /api/v1/proposals/:id` | `get(id)` | Detalhe (403 = proteção IDOR, nunca retry) |
| `GET /api/v1/proposals/compare?ids=1,2,3` | `compare(ids)` | Comparação (rota de coleção, não de membro) |
| `POST /api/v1/proposals/:id/view` | `view(id)` | Marca visualização |
| `POST /api/v1/proposals/:id/accept` | `accept(id, versionId)` | **Escolher empresa** — exige `version_id` |
| `POST /api/v1/proposals/:id/decline` | `decline(id, reason?)` | Recusar |
| `POST /api/v1/proposals/:id/request_change` | `requestChange(id, reason)` | **Solicitar ajuste** |
| `GET /api/v1/proposals/:id/meetings` | — | Lista de reuniões/visitas |
| `POST /api/v1/proposals/:id/meetings` | `createMeeting(id, payload)` | Agendar visita |
| `GET /api/v1/proposals/:id/versions/:version_id/documents/:document_id/download` | `documentDownloadUrl(...)` | PDF (`?preview=1` para visualizar) |

**Não existem:** `POST /proposals/:id/choose`, `POST /proposals/:id/compare`, `GET /companies/:id/profile`.
Perfil da empresa usa `resources :companies` existente; campos como `priceBenchmark`, selos de confiança e
métricas de conclusão (geração, economia, CO₂) **não foram verificados** no payload — renderize só se a API enviar.

### 4.2 Hooks (Frontend) — `AB0-1-front/hooks/reviewer/`
- `useBuyerProposalsList()` — **existe**. Lista com `AbortController`.
- `useBuyerProposalDetail(proposalId)` — **existe**. Detalhe com classificação tipada de erros (401/403/404/429/5xx).
- `useProposalComparison()` — **existe**. Seleção de 2 a 3 propostas.
- Chat: **não existe** `useProposalChat`. A conversa atual vive em `ProposalConversation.tsx`; investigue o transporte
  real (REST/ActionCable) antes de extrair hook.

---

## 5. Checklist de Verificação e Quality Gates

- [ ] Viewport 390px sem scroll horizontal indesejado.
- [ ] Safe-area-insets respeitados nas barras fixas (`StickyActionBar` e `BottomNav`).
- [ ] Botão de decisão CTA amarelo com contraste adequado (`text-[#0F172A] font-bold`).
- [ ] Todos os botões e áreas de toque com mínimo de 40px úteis.
- [ ] Zero erros de TypeScript (`npm run typecheck`).
- [ ] Suíte de testes unitários Jest cobrindo renderização e estados de erro.
