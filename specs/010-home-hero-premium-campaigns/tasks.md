# Backlog Executável de Tarefas — Hero Premium

**Feature:** `010-home-hero-premium-campaigns`  
**Regra de Ouro:** Apenas marcar `[x]` quando houver comprovação empírica realizada.

---

## PR 0 — Discovery e Baseline (READ-ONLY, P0)

- [x] **T001:** Resolver HEAD/branch local (`main`, `beab3fee`), commit em produção (`x-release: beab3feec7772bd75cb3992c554de0568076d94d`) e validar zero divergência.
- [x] **T002:** Registrar fluxo completo `/admin/banners/10/edit` → model → serializer → API → caches → DOM hero.
- [x] **T003:** Inspecionar schema/migrations de banners, attachments, link, moderação, entitlements e tabela `banner_audit_logs`.
- [x] **T004:** Medir ativos de produção: Banner 10 original (2171×724 px, 1.7 MB), variante Rails servida (480×160 px, 143 KB) e upscale Next.js (`w=1920&q=75`).
- [x] **T005:** Documentar alturas CSS do hero atual (210/240/280 px), remoção recente do gradiente e substituição por drop-shadow.
- [x] **T006:** Inspecionar rotas de eventos (`/api/v1/banner_events`, `/api/v1/banner_clicks/:id`), idempotência por `event_key` e ausência de integração no `HomeHeroBanner`.
- [x] **T007:** Validar semântica comercial de `home_top` (1200×160) x necessidade do novo slot `home_hero`.

---

## PR 1 — Contrato e Banco Aditivo (P0)

- [ ] **T008:** Adicionar placement `home_hero` em `BannerPlacements::Catalog` com dimensões `[1920, 420]` sem alterar `home_top`.
- [ ] **T009:** Migration aditiva no Rails para os campos `headline`, `subtitle`, `cta_label`, `cta_href`, `cta_enabled`, `theme`, `cta_variant`, `hero_background_color`, `hero_text_color`, `cta_background_color`, `cta_text_color`, `overlay_variant`, `creative_mode`, `object_position_*`, `whole_banner_clickable`, `creative_version` e anexo `image_mobile`.
- [ ] **T010:** Validações de modelo para segurança de URLs (apenas HTTPS absoluto ou caminhos internos `/...`), tamanho máximo de texto, MIME types e peso de imagem.
- [ ] **T011:** Atualizar serializer público em `Api::V1::BannersController` para incluir os novos atributos mantendo compatibilidade com clientes legados.
- [ ] **T012:** Testes RSpec para `Banner`, `BannerPlacements::Catalog` e `BannersController` cobrindo o novo placement e validações.

---

## PR 2 — ActiveAdmin Criativo e Prévia (P0)

- [ ] **T013:** Segmentar formulário do ActiveAdmin em abas: Identificação, Conteúdo & CTA, Aparência & Cores, Mídia Responsiva, Segmentação e Prévia.
- [ ] **T014:** Adicionar inputs com labels claros: `Título Interno (não exibido)`, `Título Principal (Headline)`, `Subtítulo`, `Texto do Botão`, `Link do Botão` e seletores de tema/overlay.
- [ ] **T015:** Editor avançado de cores HEX (`#RRGGBB`) com verificação visual de contraste e upload separado para `image` (desktop) e `image_mobile`.
- [ ] **T016:** Implementar prévia em iframe isolado para simulação nas larguras 390px, 768px e 1440px sem contabilizar métricas de visualização.
- [ ] **T017:** Integrar auditoria chamando `BannerAuditLog.create!` ao criar ou atualizar banners pelo ActiveAdmin.

---

## PR 3 — Frontend Hero Responsivo (P0)

- [ ] **T018:** Adaptar `HomeHeroBanner.tsx` para consumir dados do contrato `home_hero`, respeitando alturas CSS fixas de 210/240/280 px.
- [ ] **T019:** Implementar elemento `<picture>` com `<source media="(max-width: 639px)" ...>` para art direction entre desktop e smartphone.
- [ ] **T020:** Renderizar o botão CTA em elemento `<a>` acessível e independente, com hover/focus tokens e target >= 44 px.
- [ ] **T021:** Suportar modos `photo_with_html` e `image_only` (suprimindo sobreposição duplicada em artes prontas).
- [ ] **T022:** Remover fallbacks artificiais com IDs 9991–9993; adotar exatamente 1 slide institucional como fallback seguro.
- [ ] **T023:** Testes de renderização com Jest e React Testing Library para acessibilidade, teclado e ausência de overflow.

---

## PR 4 — Qualidade de Mídia e Invalidação de Cache (P0)

- [ ] **T024:** Ajustar variantes do Rails para `home_hero` com `resize_to_limit: [1920, 600]`, eliminando o teto de 160px que causava blur.
- [ ] **T025:** Configurar tamanhos (`sizes`) adequados no Next.js para priorizar LCP no primeiro slide e carregar os demais de forma lazy.
- [ ] **T026:** Integrar webhook seguro de invalidação seletiva via `revalidateTag('home-hero')` no callback `after_save` do banner.
- [ ] **T027:** Testar tempo real de atualização entre salvar no ActiveAdmin e visualizar na home pública (< 60s).
- [ ] **T028:** Testes de performance Core Web Vitals no laboratório (LCP e CLS).

---

## PR 5 — Telemetria e Publicidade Premium (P1)

- [ ] **T029:** Integrar viewability do hero ao `BannerContainer` com `IntersectionObserver` (50% de visibilidade por 1s).
- [ ] **T030:** Integrar clique do botão CTA à rota `/api/v1/banner_clicks/:id` com preservação de UTMs e `delivery_id`.
- [ ] **T031:** Exibir selo de "Patrocinado / Publicidade" exclusivamente quando `sponsored: true`.
- [ ] **T032:** Implementar controle de elegibilidade de contrato comercial via `apply_contract_eligibility`.
- [ ] **T033:** Relatório consolidado no ActiveAdmin de visualizações e cliques reais deduplicados por campanha.
- [ ] **T034:** Testes de requisição simulando cliques concorrentes e prevenção de contagem duplicada.

---

## PR 6 — Movimento Moderado (P2)

- [ ] **T035:** Implementar transições CSS suaves (fade/translate) respeitando a flag `prefers-reduced-motion`.
- [ ] **T036:** Pausa automática do carrossel quando a aba perde o foco (`visibilitychange`) ou durante hover/focus do mouse/teclado.
- [ ] **T037:** Revisão de segurança contra upload de formatos executáveis ou animações excessivas.

---

## PR 7 — E2E e Lançamento (P0/P1)

- [ ] **T038:** Teste E2E do ciclo completo: rascunho → preview → aprovação → publicação → clique → métrica auditada.
- [ ] **T039:** Validação comparativa antes/depois nas larguras 320, 375, 390, 768, 1024, 1440 e 1920 px.
- [ ] **T040:** Execução de suíte de testes de regressão (typecheck, lint, RSpec, Playwright).
- [ ] **T041:** Ativação em produção sob feature flag com campanha institucional piloto.
- [ ] **T042:** Homologação comercial e liberação para anunciantes externos.
