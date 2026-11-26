# Event Taxonomy — Avalia Solar 2026
**Padrão:** GA4 Recommended Events + PostHog + LGPD Consent Mode V2  
**Versão do Contrato:** `2.0.0` (`ANALYTICS_CONTRACT_VERSION = '2026.04.14'`)  

---

## 1. Princípios de Governança da Taxonomia

1. **Snake_case Unificado:** Todos os nomes de eventos devem seguir rigorosamente o padrão `snake_case` (ex: `whatsapp_click`, `quote_requested`, `company_profile_viewed`).
2. **Conformidade com GA4 Recommended Events:** Onde houver equivalência direta no GA4, o evento deve mapear para o evento recomendado (`generate_lead`, `select_item`, `view_item_list`, `contact`, `search`).
3. **Privacidade e LGPD (Zero PII):**
   * Nenhum dado pessoal identificável (e-mail, CPF, telefone, nome completo, endereço IP raw) pode ser transmitido como parâmetro de evento ou user property no GA4.
   * Identificadores de usuário devem ser ofuscados via hash SHA-256 (`opaqueUserId`).
4. **Isolamento Multi-tenant:**
   * Todo evento associado a uma empresa deve conter `company_id` (inteiro) e `company_slug` (string canônica).
5. **Deduplicação Determinística:**
   * Todo evento de clique em CTA ou submissão de formulário deve conter `event_id` gerado via fingerprint (`timestamp + event_name + user_id/session_id + entity_id`).

---

## 2. Dicionário Canônico de Eventos

### 2.1 Descoberta e Navegação

| Evento de Negócio | Evento GA4 Equivalente | Gatilho no Produto | Parâmetros Obrigatórios | Parâmetros Opcionais |
|---|---|---|---|---|
| `page_view` | `page_view` | Mudança de rota SPA ou carregamento SSR | `page_path`, `page_title`, `surface` | `source`, `referrer` |
| `search_submitted` | `search` | Usuário executa busca na navbar ou `/search` | `search_term` | `filter_category`, `results_count` |
| `search_no_results`| `search` | Busca não retorna nenhuma empresa/produto | `search_term` | `filter_category` |
| `category_selected`| `select_content` | Usuário clica em uma categoria no ribbon | `content_type: "category"`, `item_id` | `category_slug`, `category_name` |
| `location_selected`| `select_content` | Usuário filtra por estado/cidade | `content_type: "location"`, `item_id` | `state`, `city` |

### 2.2 Engajamento com Perfis e Produtos (Buyer Intent)

| Evento de Negócio | Evento GA4 Equivalente | Gatilho no Produto | Parâmetros Obrigatórios | Parâmetros Opcionais |
|---|---|---|---|---|
| `company_profile_viewed` | `view_item` | Visualização da Brand Page da empresa | `item_id: company_id`, `item_name: company_name` | `category_name`, `tier`, `verified` |
| `product_viewed` | `view_item` | Visualização da página de detalhe do produto | `item_id: product_id`, `item_name: product_name` | `category_name`, `manufacturer_id` |
| `company_card_impression`| `view_item_list` | Card da empresa entra na viewport | `item_list_name`, `item_id` | `position_index`, `sponsored` |
| `company_card_clicked` | `select_item` | Clique no card da empresa no diretório/busca | `item_list_name`, `item_id` | `position_index`, `cta_origin` |
| `comparator_toggle` | `select_content` | Empresa adicionada/removida do comparador | `content_type: "comparator"`, `item_id` | `action: "add" \| "remove"`, `total_items` |
| `comparator_viewed` | `view_item_list` | Visualização da página `/compare` | `item_list_name: "comparator"` | `company_ids: "1,2,3"` |

### 2.3 Conversão e Geração de Oportunidades (Key Events)

| Evento de Negócio | Evento GA4 Equivalente | Gatilho no Produto | Parâmetros Obrigatórios | Parâmetros Opcionais |
|---|---|---|---|---|
| **`whatsapp_click`** | **`contact`** | Clique no botão de WhatsApp da empresa | `item_id: company_id`, `item_name`, `contact_type: "whatsapp"` | `placement`, `button_text` |
| **`phone_click`** | **`contact`** | Clique no telefone comercial | `item_id: company_id`, `item_name`, `contact_type: "phone"` | `placement` |
| **`website_click`** | **`select_content`** | Clique no link externo para o site da empresa | `item_id: company_id`, `item_name`, `destination_url` | `placement` |
| **`quote_wizard_started`** | **`begin_checkout`** | Usuário inicia o wizard de solicitação de proposta | `item_id: company_id`, `wizard_template` | `step_index: 0` |
| **`quote_step_completed`**| **`checkout_progress`** | Usuário avança uma etapa do wizard | `item_id: company_id`, `step_index`, `step_name` | `energy_consumption`, `property_type` |
| **`lead_form_submitted`** | **`generate_lead`** | Submissão bem-sucedida de lead | `item_id: company_id`, `lead_id`, `value` | `currency: "BRL"`, `city`, `state` |
| **`b2b_plan_selected`** | **`add_to_cart`** | Seleção de plano na tabela de preços B2B | `item_id: plan_id`, `item_name: plan_title`, `value` | `currency: "BRL"`, `billing_cycle` |
| **`purchase`** | **`purchase`** | Confirmação de assinatura Stripe/MercadoPago | `transaction_id`, `value`, `currency: "BRL"`, `items` | `coupon`, `payment_method` |

---

## 3. Dimensões Personalizadas Obrigatórias no GA4

Para que o GA4 processe adequadamente os parâmetros da taxonomia acima, as seguintes **20 Dimensões Personalizadas de Escopo de Evento** devem ser cadastradas:

| Nome da Dimensão | Parâmetro de Evento | Escopo | Descrição |
|---|---|---|---|
| ID da Empresa | `company_id` | Evento | ID numérico da empresa associada ao evento |
| Nome da Empresa | `company_name` | Evento | Nome comercial da empresa avaliada |
| Slug da Empresa | `company_slug` | Evento | Identificador amigável de URL |
| Tipo de CTA | `cta_type` | Evento | Tipo de chamada de ação (`whatsapp`, `quote`, `call`, `link`) |
| Posição do CTA | `placement` | Evento | Local do componente (`hero`, `sidebar`, `sticky_bar`, `card`) |
| Categoria Principal | `category_name` | Evento | Categoria do produto ou empresa |
| Estado (UF) | `target_state` | Evento | Unidade federativa de atendimento do integrador |
| Cidade | `target_city` | Evento | Município de interesse |
| ID do Produto | `product_id` | Evento | ID do equipamento no marketplace |
| Nome do Produto | `product_name` | Evento | Nome do módulo, inversor ou bateria |
| Template do Wizard | `wizard_template` | Evento | Tipo do fluxo de orçamento (`residencial`, `comercial`) |
| Índice da Etapa | `step_index` | Evento | Número da etapa do fluxo |
| Tipo de Superfície | `surface` | Evento | Ambiente (`web`, `pwa`, `mobile`, `mcp`) |
| Tipo de Contato | `contact_type` | Evento | Canal selecionado (`whatsapp`, `phone`, `email`) |
| Score de Intenção | `buyer_intent_score`| Evento | Score preditivo de conversão (0-100) |
| ID do Lead | `lead_id` | Evento | ID anônimo do lead gerado |
| Ciclo de Cobrança | `billing_cycle` | Evento | Periodicidade do plano (`mensal`, `anual`) |
| Tipo de Consentimento | `consent_type` | Evento | Status LGPD (`all`, `analytics`, `marketing`, `none`) |
| Tipo de Agente IA | `ai_agent_type` | Evento | Identificador de agente quando aplicável (`chatgpt`, `perplexity`) |
| ID de Deduplicação | `event_id` | Evento | Hash único para reconciliação |

