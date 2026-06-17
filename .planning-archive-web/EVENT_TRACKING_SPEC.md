# EVENT TRACKING SPEC — Telemetria de RevOps, Marketing e Conversão

Este documento estabelece a taxonomia completa de telemetria do perfil comercial de empresa. Cada interação de conversão, leitura ou clique será disparada via PostHog ou Google Tag Manager (GTM).

---

## 1. Dicionário de Eventos Mapeados (22 Eventos)

| ID do Evento | Nome Físico do Evento | Gatilho / Ação do Usuário |
|--------------|-----------------------|---------------------------|
| 1 | `company_profile_viewed` | Página do perfil comercial carregada por completo. |
| 2 | `profile_tab_clicked` | Clique em alguma das 6 abas de conteúdo. |
| 3 | `quote_cta_clicked` | Clique no botão principal "Solicitar Orçamento". |
| 4 | `compare_company_clicked` | Clique no botão "Comparar Empresa". |
| 5 | `add_to_reading_list_clicked` | Clique em "Adicionar à Lista de Leitura". |
| 6 | `share_company_clicked` | Clique no botão de compartilhar perfil. |
| 7 | `phone_clicked` | Clique para revelar ou ligar no telefone comercial. |
| 8 | `email_clicked` | Clique no endereço de e-mail público. |
| 9 | `website_clicked` | Clique no link de site oficial da empresa. |
| 10 | `whatsapp_clicked` | Clique no CTA de WhatsApp da empresa. |
| 11 | `claim_profile_clicked` | Clique para reivindicar a posse da empresa. |
| 12 | `review_cta_clicked` | Clique no botão "Deixe sua avaliação" ou similar. |
| 13 | `review_filter_clicked` | Clique para filtrar reviews por nota de estrela. |
| 14 | `review_helpful_clicked` | Clique no botão "Foi útil" de alguma review. |
| 15 | `product_viewed` | Exibição de um card de produto específico em tela. |
| 16 | `product_detail_clicked` | Clique em "Ver detalhes" de um produto do catálogo. |
| 17 | `project_viewed` | Visualização de um card de projeto efetuado. |
| 18 | `project_filter_clicked` | Clique nos filtros horizontais de projetos. |
| 19 | `related_company_clicked` | Clique no card de empresa alternativa. |
| 20 | `sponsored_company_clicked` | Clique em card patrocinado do grid de alternativas. |
| 21 | `ad_impression` | Exibição física de um anúncio em um dos slots de ads. |
| 22 | `ad_click` | Clique em algum banner promocional. |

---

## 2. Payload Padrão de Envio (Data Contract)

Cada evento disparado enviará o seguinte JSON estruturado mínimo para o backend e PostHog:

```json
{
  "company_id": "string",
  "user_id": "string | null",
  "session_id": "string",
  "plan_tier": "free | essential | pro | enterprise",
  "source": "string",
  "page": "company_profile",
  "tab": "string | null",
  "event_name": "string",
  "timestamp": "ISO-8601 DateTime"
}
```
