# Baseline da PR 1 e Mapeamento de Gaps — Track Your Prospects (Gate Zero)

**Data:** 15 de Outubro de 2026  
**Repositório:** `MrGr33n98/Avalia-Solar-2026`  
**Base Git:** `main` @ `b8a1ce36` (inclui PR 1 `a01b7f58` + hotfix de namespace `b8a1ce36`)  
**Remoto:** `origin/main` sincronizado  

---

## 1. Auditoria de Hashes e Git Baseline

| Parâmetro | Valor Verificado |
|---|---|
| **Diretório Atual (`pwd`)** | `/home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026` |
| **Branch Ativa** | `main` |
| **HEAD SHA** | `b8a1ce36` (`fix(back): resolve company namespace and spec fixtures in outbound clicks`) |
| **Commit Base PR 1** | `a01b7f58` (`feat(back): implementar redirecionamento de outbound clicks com token assinado`) |
| **Remoto Git** | `https://github.com/MrGr33n98/Avalia-Solar-2026.git` |
| **Status Remoto** | Em dia com `origin/main` |

---

## 2. Inventário de Arquivos e Componentes

### 2.1 Backend Rails (`AB0-1-back`)
- **Outbound & Redirecionamento (PR 1):**
  - `app/controllers/api/v1/outbound_controller.rb`: Controller com `redirect_to_target`, validação de `destination_type`, anti-open-redirect via whitelist oficial de domínios da empresa, geração de token assinado e parâmetro `as_click_id`.
  - `app/models/outbound_click.rb`: Modelo com chave primária UUID, associação com `company`, validação de fontes e destinos permitidos, hashes unidirecionais de IP e User-Agent (`anonymize_ip` e `hash_user_agent`).
  - `app/services/outbound_token_service.rb`: Serviço HMAC-SHA256 (`cid`, `src`, `clk`, `iat`, `exp`, `nonce`) com TTL configurável (padrão 30 dias) e proteção contra adulteração.
  - `app/models/company.rb`: Extensão com `resolve_outbound_destination`, `authorized_outbound_origins` e associação `has_many :outbound_clicks`.
  - `db/migrate/20261014180000_create_outbound_clicks.rb`: Tabela `outbound_clicks` com índices em `company_id + clicked_at`, `click_token_signature` e `idempotency_key`.

- **Tracking Existente no Backend:**
  - `app/models/sales/tracking_site.rb`: Configuração de site por empresa, `public_key` única gerada via `SecureRandom.urlsafe_base64(32)`, `allowed_origins` normalizado (HTTPS e localhost em dev).
  - `app/models/sales/tracking_session.rb`: Tabela `sales_tracking_sessions`, com `session_id` (UUID), `utm_*`, `referrer_host`, `landing_path`, `traffic_class`.
  - `app/models/sales/tracking_event.rb`: Tabela `sales_tracking_events`, com `event_name`, `path`, `properties` (jsonb), idempotência por `event_uuid`.
  - `app/services/sales/tracking/script_renderer.rb`: Gera script JS injetável no site parceiro.
  - `app/services/sales/tracking/properties_sanitizer.rb`: Sanitizador de propriedades impedindo dados sensíveis (email, senha, telefone, etc.).
  - `app/controllers/api/v1/public/sales/tracking_controller.rb`: Endpoints públicos para sessões e eventos com CORS restrito a `allowed_origins` e limite de 16KB por payload.

### 2.2 Frontend Next.js (`AB0-1-front`)
- **Dashboard e Navegação:**
  - `config/navigation.ts`: Grupo Performance contém item `tracking-attribution` (`id: 'tracking-attribution'`, `label: 'Tracking & Atribuição'`).
  - `app/dashboard/components/tracking/TrackingAttributionWorkspace.tsx`: Workspace legado de tracking.
  - `app/dashboard/components/intent/BuyerIntentWorkspace.tsx`: Workspace de Buyer Intent.

---

## 3. Matriz AS-IS vs TO-BE

| Componente | Estado Atual (AS-IS) | Estado Desejado (TO-BE — PR 2 a PR 5) |
|---|---|---|
| **Correlação de Clique (as_click_id)** | PR 1 gera o token no redirect e apensa à URL do parceiro (`?as_click_id=...`). O script parceiro ainda não lê nem envia esse token. | Script V2 lê `as_click_id` na landing page, valida e envia ao backend. Backend valida HMAC, TTL e tenant, vinculando a sessão ao `outbound_click_id`. |
| **Banco de Dados (Sessões)** | `sales_tracking_sessions` não possui coluna `outbound_click_id` nem `consent_state`. | Migration reversível adiciona `outbound_click_id` (UUID FK para `outbound_clicks`) e `consent_state` (`granted`, `denied`, `unknown`). |
| **Consentimento & Privacidade** | Script parceiro dispara tracking imediatamente no carregamento da página, sem verificação de consentimento nem hook CMP. | Consent-aware por padrão: tracking não essencial bloqueado até consentimento (`window.avaliaConsent` ou chamada explícita `avaliaTrack.grantConsent()`). Storage limpo em revogação. |
| **Dashboard UI** | Workspace atual é simplificado (`TrackingAttributionWorkspace.tsx`), sem paridade com as 6 abas e densidade da especificação. | Implementar paridade visual e comportamental estrita (Visão Geral, Jornada, Contas e Visitantes, Instalação, Integrações, Configurações, Drawer lateral e Sheet PWA). |
| **Saúde da Tag e Domínios** | Status superficial sem distinção de evidências reais. | Tag Health baseada em telemetria verídica (último evento, origem observada, sem status fake). |
| **Exportação CSV** | Exportação restrita no frontend sem proteção formal de CSV injection. | Endpoint backend seguro com isolamento multi-tenant, sanitização de fórmulas (`=`, `+`, `-`, `@`) e filtros aplicados. |

---

## 4. Correções Críticas Realizadas no Gate Zero (PR 1 Fix)

1. **Namespace Resolution em Rails Controller:**
   - **Problema:** Em `Api::V1::OutboundController#find_target_company`, a chamada `Company.find_by` resolvia para o módulo `Api::V1::Company`, disparando `NoMethodError: undefined method 'find_by' for Api::V1::Company:Module`.
   - **Correção:** Alterado para `::Company.find_by` garantindo resolução para a classe ActiveRecord raiz.
2. **Migração Pendente no Banco de Teste:**
   - Executado `bundle exec rails db:migrate RAILS_ENV=test`, aplicando `20261014180000_create_outbound_clicks.rb` e gerando a tabela `outbound_clicks` em `ab0_test`.
3. **Associação Obrigatória em Specs:**
   - Em `spec/models/outbound_click_spec.rb`, a ausência de uma empresa persistida no banco disparava erro `Company must exist`. Criada fixture com `create(:company)`.
4. **Validação da Suíte:**
   - Execução de `outbound_token_service_spec.rb`, `outbound_click_spec.rb`, `company_outbound_spec.rb`, `outbound_spec.rb` e `outbound_routing_spec.rb`: **37 examples, 0 failures**.
   - Execução de `public_sales_tracking_spec.rb` e `tracking_security_spec.rb`: **14 examples, 0 failures**.
   - Commits registrados e sincronizados com `origin/main`.

---

## 5. Próximos Passos (Transição para PR 2)

- Branch: `feat/tracking-partner-consent-attribution-v2`
- Migration para `sales_tracking_sessions` (`outbound_click_id`, `consent_state`).
- Atualização de `Sales::TrackingSession` (`belongs_to :outbound_click`).
- Implementação de `Sales::Tracking::ScriptRenderer` V2 com suporte a consentimento e leitura de `as_click_id`.
- Atualização de `Api::V1::Public::Sales::TrackingController` com validação criptográfica do `as_click_id`, verificação de pertença ao tenant da tag (`@site.company_id`), deduplicação e prevenção de replay cross-tenant.
- Testes RSpec exaustivos (token expirado, token adulterado, tenant trocado, consentimento revogado).
