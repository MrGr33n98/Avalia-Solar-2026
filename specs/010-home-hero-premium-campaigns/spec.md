# Especificação Funcional — Hero Premium Gerenciável

**Feature:** `010-home-hero-premium-campaigns`  
**Status:** Proposta de Implementação (Aprovada pós-PR 0)  
**Atores:** Administrador de Publicidade/Editor, Moderador/Revisor, Visitante da Home (Desktop e PWA), Sistema de Anúncios e Analytics.

---

## 1. Objetivo de Negócio

Permitir que a equipe editorial e comercial gerencie campanhas e criativos de alto impacto na homepage, com:
1. Conteúdo textual e botões de chamada à ação (CTA) estruturados e independentes da arte gráfica.
2. Mídia responsiva em alta definição com suporte a ponto focal e arte dedicada para mobile (`image_mobile`).
3. Separação formal e segura do novo slot `home_hero` sem afetar contratos legados de `home_top`.
4. Rastreabilidade auditável de publicação e métricas idôneas de visualização e cliques.

---

## 2. User Stories

### US1 — Administrar Criativo (P0)
**Given** um administrador autenticado no ActiveAdmin,  
**When** cadastra uma nova campanha para o hero,  
**Then** informa nome interno, título público (headline), subtítulo opcional, texto e link do CTA, modo de criativo (`photo_with_html` ou `image_only`), tema/cores e arquivos para desktop e mobile.

### US2 — Ver Prévia Responsiva (P0)
**Given** um criativo em edição ou rascunho,  
**When** o administrador clica em pré-visualizar nas larguras (390px, 768px, 1440px),  
**Then** observa a composição idêntica à homepage pública, sem disparar eventos de telemetria comercial.

### US3 — Publicar com Invalidação Confiável (P0)
**Given** uma campanha aprovada e ativa,  
**When** o administrador publica ou atualiza o criativo,  
**Then** a home passa a servir a nova campanha dentro do SLA aceitável (< 60s), sem exigir purga manual ou global do cache de mídia.

### US4 — Navegação com CTA Íntegro (P0)
**Given** uma campanha exibida na home,  
**When** o visitante clica no botão do CTA,  
**Then** é direcionado para a rota validada, registrando um evento de clique deduplicado com identificador único (`delivery_id`), sem expor dados sensíveis.

### US5 — Mídia Nítida e Sem Distorção (P0)
**Given** um criativo cadastrado,  
**When** servido em qualquer viewport e DPR (1x, 2x, 3x),  
**Then** a imagem exibida preserva nitidez, sem sofrer compressão destrutiva para 160px de altura nem upscale excessivo.

### US6 — Campanhas Patrocinadas com Rotulagem (P1)
**Given** uma campanha comercial vinculada a empresa,  
**When** exibida na home,  
**Then** exibe o identificador visual "Patrocinado / Publicidade", sem influenciar a nota orgânica ou selos da empresa no ranking.

### US7 — Acessibilidade e Redução de Movimento (P2)
**Given** um visitante com `prefers-reduced-motion` ativado no sistema,  
**When** navega pela home,  
**Then** o carrossel desativa trocas automáticas e transições pesadas, mantendo navegação manual acessível via setas, swipe e teclado.

---

## 3. Requisitos Funcionais (MUST)

- **FR-001 (Identidade Própria):** `home_hero` é um placement exclusivo com dimensões de autoria `1920 × 420 px` (desktop) e `780 × 460 px` (mobile), sem herdar a restrição de 160px de altura de `home_top`.
- **FR-002 (Separação de Nomes):** O campo `title` permanece como nome interno; introduzir o campo `headline` para o título público visível na home.
- **FR-003 (CTA Independente):** Adicionar campos `cta_label`, `cta_href` e `cta_enabled` no modelo e formulário, separando o botão do link da peça inteira.
- **FR-004 (Aparência e Contraste):** Administrável por tokens (`theme: dark | light`, `overlay_variant: none | left_soft | left_strong`, `cta_variant: primary_blue | solar_yellow | outline`) ou cores HEX validadas via regex (`#RRGGBB`). Proibida injeção de CSS ou HTML livre.
- **FR-005 (Art Direction Responsiva):** Suporte nativo a dois anexos: `image` (desktop) e `image_mobile` (mobile), com ponto focal percentual (`object_position_desktop_x/y` e `mobile_x/y`).
- **FR-006 (Modos de Criativo):** Suporte a `creative_mode: photo_with_html` (renderiza textos e botões HTML) e `image_only` (suprime headline e overlay para peças que já possuem arte final completa, mantendo o CTA acessível).
- **FR-007 (Validações Seguras no Servidor):** Validar MIME types permitidos (JPEG, PNG, WebP), peso máximo de arquivo (2 MB) e integridade de URLs (apenas HTTPS absoluto ou caminhos internos autorizados como `/companies`, `/pricing`, `/calculadora`).
- **FR-008 (Segurança de Código):** Proibir uploads SVG não sanitizados, scripts inline, iframes e tags HTML arbitrárias.
- **FR-009 (Ciclo de Vida):** Preservar os estados de moderação (`draft`, `submitted`, `approved`, `rejected`) e agendamento por data (`start_date`, `end_date`).
- **FR-010 (Carrossel Seguro):** Se houver apenas 1 campanha ativa, ocultar barras/setas de navegação e desativar timer de autoplay. Se nenhuma estiver ativa, exibir 1 fallback institucional único.
- **FR-011 (Alturas CSS Estáveis):** Alturas fixas no frontend: `210px` (< 640px), `240px` (640–767px), `280px` (>= 768px). Max-width externo de `1320px`.
- **FR-012 (Telemetria):** Integrar o hero ao pipeline de telemetria (`BannerContainer`/`analyticsApi.trackBannerEvent`), com deduplicação de visualizações e cliques via `delivery_id`.
- **FR-013 (Auditoria de Ações):** Registrar toda alteração de criativo, aprovação e publicação no modelo `BannerAuditLog`.

---

## 4. Requisitos Não Funcionais (NFR)

- **NFR-001 (Core Web Vitals):** LCP p75 <= 2,5s e CLS <= 0,1. O primeiro slide do hero deve ter `priority` (`fetchPriority="high"`), enquanto slides subsequentes são carregados sob demanda.
- **NFR-002 (Otimização de Mídia):** O backend Rails deve gerar variantes adequadas à proporção do hero (ex: largura 1920px sem teto arbitrário de 160px de altura), permitindo que o Next.js gere imagens AVIF/WebP limpas.
- **NFR-003 (Resiliência):** Caso a API de banners fique indisponível, a home deve renderizar o banner institucional sem travar o SSR.
- **NFR-004 (Acessibilidade WCAG 2.1 AA):** Contraste mínimo de 4.5:1 para texto normal, touch targets de no mínimo 44 × 44 px e suporte a leitores de tela com `alt_text`.
