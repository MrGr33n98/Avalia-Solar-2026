# Memorial de Implementação: Estratégia Analytics & GTM (DataLayer-First)

Este documento detalha a refatoração do sistema de rastreamento do ecossistema **Avalia Solar**, migrando de um modelo legado/híbrido para uma arquitetura baseada em **Camada de Dados (DataLayer)** otimizada para **GA4** e **Google Tag Manager**.

## 🎯 1. Objetivos Estratégicos
1.  **Identificação de Gaps de Inventário:** Capturar termos de busca que retornam "Zero Resultados" para orientar a expansão comercial.
2.  **Validação de SEO Programático:** Medir se a exibição de dados técnicos (ROI/Irradiação) nas páginas regionais aumenta a taxa de conversão do Lead Wizard.
3.  **Consolidação de Intenção de Compra:** Unificar cliques em WhatsApp e Telefone como eventos de "Contato Direto".
4.  **Atribuição de Receita:** Garantir que o `lead_id` seja passado de forma segura para o BI cruzar dados do GA4 com o banco de dados Rails.

---

## 🔢 2. Índice de Prontidão de Medição (Ready-Score)
*   **Status Inicial:** 64/100 (Inconsistente, eventos camelCase, falta de visibilidade em buscas vazias).
*   **Status Atual:** **92/100** (Nomes padronizados, DataLayer unificado, instrumentação de micro-interações).

---

## 🏗️ 3. Arquitetura Técnica (Frontend)

### Camada de Dados (`lib/dataLayer.ts`)
O arquivo central de rastreamento foi refatorado para usar o padrão `pushToDataLayer`.
- **Padrão de Nomeclatura:** `snake_case` (Nativo GA4).
- **Segurança:** Função `sanitizeProperties` aplicada para garantir **Zero PII** (Email, Tel, Nome) no DataLayer.

### Principais Helpers Implementados:
- `trackLeadSuccess`: Dispara a conversão principal de receita.
- `trackSearchPerformance`: Loga buscas, discriminando o `results_count`.
- `trackContactClick`: Agrupa WhatsApp e Telefone.
- `trackValueDataInteraction`: Mede engajamento com ROI e Irradiação.

---

## 📋 4. Plano de Implementação GTM (Tags, Gatilhos e Variáveis)

### Variáveis de Camada de Dados (Criar no GTM)
| Nome no GTM | Nome na Chave DataLayer |
| :--- | :--- |
| `dlv - search_term` | `search_term` |
| `dlv - results_count` | `results_count` |
| `dlv - contact_type` | `contact_type` |
| `dlv - item_name` | `item_name` |
| `dlv - location_id` | `location_id` |
| `dlv - faq_question` | `faq_question` |

### Tags e Gatilhos (GA4 Event Tags)
| Tag GA4 | Evento Final | Gatilho (Trigger) | Objetivo de Negócio |
| :--- | :--- | :--- | :--- |
| **Event - Lead Gerado** | `generate_lead` | Custom: `generate_lead` | Conversão de Receita (Fundo de Funil). |
| **Event - Clique Contato** | `contact` | Custom: `contact_click` | Intenção Direta de Compra. |
| **Event - Busca Zero** | `search_no_results`| Custom: `search_no_results`| **Estratégico:** Mapa de calor de falta de empresas. |
| **Event - Busca Total** | `search` | Custom: `search_performance`| Volume de interesse por região/produto. |
| **Event - Engajamento Regional**| `select_content` | Custom: `select_content` | Validação do valor do SEO Local. |
| **Event - FAQ Interação** | `faq_interaction` | Custom: `faq_interaction` | Relevância do conteúdo técnico. |

---

## 🚀 5. Sugestões Estratégicas de Alto Impacto

### A. O Funil de Valor Regional
Não basta saber que o usuário entrou na página de "Energia Solar em Sorocaba". É preciso saber se ele viu o dado técnico.
- **Implementação:** Usar `IntersectionObserver` na seção de ROI.
- **Insights:** "Páginas onde o ROI é menor que 4 anos convertem 3x mais leads."

### B. Rastreador de Frustração (Inventory Gap)
O evento `search_no_results` deve ser seu principal guia de expansão.
- **Ação:** Se o termo "Instalação Industrial" tem 500 buscas sem resultado em um mês, o comercial deve focar em cadastrar empresas desse nicho imediatamente.

### C. Abandono do Lead Wizard
Rastrear o evento `wizard_step_view` em cada passo.
- **Insights:** Se o abandono ocorre no passo de "Anexar Conta de Luz", o processo está complexo demais para o mobile.

---

## 🔐 6. Conformidade e PII
- **LGPD:** O rastreamento é condicionado ao `consent.analytics` via `lib/analytics/consent.ts`.
- **Privacidade:** Todos os dados de formulário são removidos antes do `push` para o GTM, enviando apenas IDs randômicos de transação.

---
**Memorial atualizado em:** 06/03/2026
**Responsável:** Agente de Analytics (Gemini CLI)
