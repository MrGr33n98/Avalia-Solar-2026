# Design Critique Report: SPEC 026 — Agentic Storefront

**Fase EGM:** Estágio 7 — Design Critique (Adversarial Engineering Audit)  
**Revisores:** `egm-design` (Hostile Critic), `egm-structural`, `as-rails-reviewer`, `as-multitenant-reviewer`, `as-security-reviewer`  
**Data da Auditoria:** 26 de Novembro de 2026  
**Status da Rodada:** **CONCLUÍDO (BLOCKERS RESOLVIDOS)**  
**Referência Canônica:** `specs/026-agentic-storefront/spec.md`  

---

## 1. Visão Geral da Auditoria Adversária

O **Estágio 7 (Design Critique)** é a etapa mais agressiva e rigorosa do Elephant-Goldfish Model. Os revisores assumem a postura de um atacante externo, um engenheiro de confiabilidade (SRE) sob incidente de produção e um auditor forense de segurança, buscando ativamente falhas arquiteturais, brechas de isolamento multi-tenant, vetores de injeção e gargalos de banco de dados.

---

## 2. Findings e Apontamentos do Estágio 7

### [F-07-01] [BLOCKER] Vulnerabilidade IDOR no Painel B2B do Storefront
* **Apontamento (`as-multitenant-reviewer` & `as-security-reviewer`):**
  A especificação prevê que na rota `app/controllers/app/storefronts_controller.rb`, a empresa seria localizada via `Company.find_by(slug: params[:company_slug])`. Isso abre uma brecha direta de **IDOR (Insecure Direct Object Reference)**: um integrador mal-intencionado autenticado poderia alterar a headline, cores e projetos de outra empresa bastando enviar o slug dela na requisição PUT/PATCH!
* **Ação Corretiva Obrigatória:**
  1. A empresa **nunca** deve ser buscada no escopo global `Company`.
  2. A resolução deve ser restrita ao tenant autenticado:
     ```ruby
     @company = current_user.companies.find(params[:company_id])
     ```
  3. Aplicar policy estrita do Pundit (`authorize @company, :manage_storefront?, policy_class: StorefrontPolicy`):
     ```ruby
     class StorefrontPolicy < ApplicationPolicy
       def update?
         user.present? && (user.admin? || record.user_id == user.id || record.company_members.exists?(user_id: user.id, role: %w[owner admin]))
       end
     end
     ```
* **Classificação:** `RESOLVED` (incorporado à especificação com regra de bloqueio).

---

### [F-07-02] [MAJOR] Risco de N+1 Queries na Serialização do Storefront
* **Apontamento (`as-rails-reviewer`):**
  O `Storefront::PublicProfileService` monta um payload consolidando a empresa, suas configurações, seus projetos instalados e os produtos/marcas comercializados.
  Sem o carregamento prévio explícito de associações, o Rails disparará dezenas de queries separadas (`SELECT * FROM company_projects...`, `SELECT * FROM company_products...`, `SELECT * FROM products...`), degradando o tempo de resposta em cenários de alto tráfego.
* **Ação Corretiva:**
  Garantir `eager loading` com `includes` no service object:
  ```ruby
  Company.includes(
    :storefront_setting,
    :company_projects,
    company_products: :product
  ).find_by!(slug: slug, status: :active)
  ```
  Testar com a gem `Bullet` ativa no ambiente de teste para falhar o build caso ocorra N+1.
* **Classificação:** `RESOLVED`.

---

### [F-07-03] [MAJOR] Proteção de Dados Pessoais (LGPD) nos Orçamentos Diretos
* **Apontamento (`as-security-reviewer`):**
  O formulário de rascunho de orçamento (`quote-draft`) recebe nome, e-mail, telefone e consumo de energia do consumidor final. Esses dados não podem trafegar de forma insegura, ser logados em texto puro nos servidores nem transmitidos em logs de analytics do GA4.
* **Ação Corretiva:**
  1. No frontend, validar os campos com Zod sanitizando tags HTML (`sanitizeHtml`).
  2. No backend, ofuscar o e-mail e telefone nos logs de aplicação (`Rails.logger`).
  3. No evento de telemetria despachado ao GA4 (`lead_form_submitted`), enviar apenas o `lead_id` ofuscado e o `company_id`, **jamais transmitindo o telefone ou e-mail nos parâmetros de evento**.
* **Classificação:** `RESOLVED`.

---

### [F-07-04] [MAJOR] Content Security Policy (CSP) na Superfície MCP Apps SDK
* **Apontamento (`as-apps-sdk-reviewer`):**
  A superfície interativa `ui://avalia-solar/storefront/v1.html` roda dentro do ambiente sandboxed de hosts como ChatGPT e Claude. Se o bundle do Vite tentar carregar fontes do Google Fonts via CDN externo ou scripts não autocontidos, o host MCP bloqueará a renderização com erro de CSP.
* **Ação Corretiva:**
  1. O pacote do Storefront em `packages/mcp-ui` deve ser compilado em modo **Singlefile Autocontido** (HTML com CSS e JS inlineados via plugin `vite-plugin-singlefile`).
  2. As fontes devem utilizar a pilha do sistema (`system-ui`, `-apple-system`, `sans-serif`) sem requisições HTTP externas.
  3. O tamanho total gzip deve ser rigorosamente auditado no CI para manter-se $\le 120\text{ KiB}$.
* **Classificação:** `RESOLVED`.

---

### [F-07-05] [NIT] Rate Limiting no Endpoint Público do Storefront
* **Apontamento (`egm-structural`):**
  Como o endpoint `/api/v1/storefronts/:slug` será público e consumido tanto pela web quanto por agentes MCP, deve haver proteção contra raspagem abusiva e negação de serviço.
* **Ação Corretiva:**
  Adicionar regra no `config/initializers/rack_attack.rb`:
  ```ruby
  throttle('storefronts/ip', limit: 60, period: 1.minute) do |req|
    req.ip if req.path.start_with?('/api/v1/storefronts')
  end
  ```
* **Classificação:** `RESOLVED`.

---

## 3. Conclusão do Estágio 7

Todos os 5 findings levantados na auditoria adversária — incluindo o `[BLOCKER]` de IDOR e os 3 `[MAJOR]` de performance, LGPD e CSP — foram devidamente tratados e incorporados aos contratos da SPEC 026.

**Avanço para Estágio 8 (Intermediate Zoom Out) autorizado.**
