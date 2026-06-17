# Plano Técnico: MobiVolt AI Conversion v2 + Lead Sync

Este documento apresenta a especificação arquitetural, técnica e de interface para a implementação do **MobiVolt AI Conversion v2 + Lead Sync**, focando em impulsionar a taxa de conversão de leads qualificados no portal Avalia Solar, mantendo total conformidade com a LGPD e priorizando parceiros patrocinados.

---

## 1. Mapeamento e Estruturação de Banco de Dados

Atualmente, o chatbot do portal armazena dados em `chat_leads`, enquanto a aba comercial de leads do portal utiliza a tabela principal `leads`. Faremos a extensão da tabela `leads` para permitir o sincronismo perfeito de dados e contexto enriquecido pela IA.

### [NEW] Migration: `AddChatAttributionToLeads`
Desenho da migration para estender a tabela principal `leads`:

```ruby
class AddChatAttributionToLeads < ActiveRecord::Migration[7.0]
  def change
    change_table :leads, bulk: true do |t|
      # Relacionamentos com a sessão e lead do chat
      t.references :chat_lead, null: true, foreign_key: true
      t.references :chat_session, null: true, foreign_key: true
      t.string :source, default: 'portal', null: false
      
      # Informações de RAG e Interações
      t.jsonb :recommended_company_ids, default: [], null: false
      t.bigint :clicked_company_id, null: true
      t.bigint :quote_requested_company_id, null: true
      t.bigint :whatsapp_clicked_company_id, null: true
      t.jsonb :comparison_company_ids, default: [], null: false
      
      # Enriquecimento de IA e Contexto Comercial
      t.string :intent_type
      t.text :ai_summary
      t.string :next_best_action
      t.text :initial_question
      t.text :last_user_message
      t.string :source_page_url
      
      # LGPD Auditoria
      t.string :lgpd_consent_version
      t.datetime :lgpd_consent_at
    end

    add_index :leads, :source
    add_index :leads, :clicked_company_id
    add_index :leads, :quote_requested_company_id
    add_index :leads, :recommended_company_ids, using: :gin
  end
end
```

---

## 2. Serviço de Sincronização e Idempotência (LeadSyncService)

Criaremos o serviço centralizado `Chat::Mobivolt::LeadSyncService` para criar ou atualizar o `Lead` principal a partir do `ChatLead` submetido no formulário de consultoria.

```
+-------------------------------------------------------------+
|               Submissão do Form no ChatWidget               |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|    Salva ChatLead no Banco + Trigger de Transação de Sync   |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|           Chat::Mobivolt::LeadSyncService.sync!(lead)       |
+-------------------------------------------------------------+
                               |
       +-----------------------+-----------------------+
       |                                               |
       v (Mecanismo Idempotente)                       v (Mapeamento de Dados)
+-------------------------------+               +-------------------------------+
| Trava de concorrência por:    |               | Copia: Nome, Telefone, E-mail,|
| session_id + phone + 5min     |               | Cidade, Estado, e enriquecidos|
+-------------------------------+               | como score, resumo e tags.    |
                                                +-------------------------------+
                                                               |
                                                               v
                                                +-------------------------------+
                                                |  Persiste Lead Principal com  |
                                                |     source = 'mobivolt_ai'    |
                                                +-------------------------------+
```

### Detalhes da Lógica de Idempotência e Fallback
1.  **Idempotência:** A trava de duplicados utilizará uma consulta rápida com janela temporal no Postgres:
    ```ruby
    existing_lead = Lead.where(chat_session_id: chat_lead.chat_session_id)
                        .where(phone: chat_lead.phone)
                        .where('created_at > ?', 5.minutes.ago)
                        .first
    return existing_lead if existing_lead.present?
    ```
2.  **Fallback Resiliente:** A chamada será executada dentro do controller de forma assíncrona usando ActiveJob (`Chat::Mobivolt::LeadSyncJob.perform_later(chat_lead.id)`). Se houver falha de infraestrutura no banco principal de Leads, o job fará retries automáticos com exponential backoff, salvaguardando a criação do `ChatLead` que já terá sido salvo e retornado com 200 ao usuário.

---

## 3. Identidade Visual e Paleta de Cores Premium (Aesthetics)

Os cards visuais e o formulário do ChatWidget serão integrados à interface seguindo rigorosamente a paleta moderna e harmoniosa do Avalia Solar, criando uma transição suave:

*   **Azul Principal Avalia Solar:** `#0F172A` (Slate 900 - base de textos e headers dark) e `#2563EB` (Blue 600 - botões primários neutros).
*   **Verde/Ciano Limpo:** `#06B6D4` (Cyan 500) e `#10B981` (Emerald 500) para selo "Verificada" e destaque de sustentabilidade.
*   **Destaque Patrocinado (Premium):** `#F59E0B` (Amber 500) e `#D97706` (Amber 600) para bordas premium, estrelas de avaliação e badges "Destaque".
*   **Cinza de Fundo:** `#F9FAFB` (Gray 50) e `#E5E7EB` (Gray 200) para bordas e fundos dos cards.
*   **Textos:** `#18181B` (Zinc 900 - alta legibilidade).

---

## 4. Frontend: Cards Visuais no ChatWidget

Quando a resposta da IA contiver recomendações de empresas, o `ChatWidget` detectará os metadados e renderizará um carrossel ou lista empilhada de cards interativos, em vez de texto puro.

### Contrato JSON Estruturado de Recomendação (`metadata`)
```json
{
  "type": "company_recommendations",
  "source": "mobivolt_ai",
  "companies": [
    {
      "id": 123,
      "name": "Enerzee",
      "slug": "ocenergia-materiais-eletricos",
      "profile_url": "https://www.avaliasolar.com.br/companies/ocenergia-materiais-eletricos",
      "logo_url": "https://www.avaliasolar.com.br/logos/enerzee.png",
      "city": "Cuiabá",
      "state": "MT",
      "rating_avg": 4.8,
      "rating_count": 32,
      "verified": true,
      "sponsored": true,
      "plan_tier": "sponsored",
      "services": ["Instalação solar", "Homologação", "Manutenção"],
      "niches": ["Residencial", "Rural"],
      "review_snippet": "Clientes destacam atendimento rápido e suporte pós-venda.",
      "cta": {
        "view_profile": true,
        "request_quote": true,
        "compare": true,
        "whatsapp": false
      },
      "recommendation_reason": "Empresa destaque com selo de confiança e excelente suporte em Cuiabá."
    }
  ]
}
```

### Feature Flags (Configuráveis no Frontend/Backend)
*   `MOBIVOLT_COMPANY_CARDS_ENABLED` (Default: `true`): Habilita a renderização em cards em vez de texto puro.
*   `MOBIVOLT_SPONSORED_CARDS_ENABLED` (Default: `true`): Habilita o estilo premium dourado/destaque para patrocinados.
*   `MOBIVOLT_CARD_WHATSAPP_ENABLED` (Default: `false` em produção até validação): Exibe botão direto de falar com empresa no WhatsApp.
*   `MOBIVOLT_COMPARE_BUTTON_ENABLED` (Default: `true`): Habilita o botão de comparação rápida.

### Estados de Interface
1.  **Skeleton Loader:** Quando a IA estiver "digitando", exibiremos esqueletos pulsantes na largura exata do card.
2.  **Estado Vazio (Fernando de Noronha):** Se a busca retornar 0 empresas qualificadas, exibiremos um card amigável:
    > "Não encontramos instaladores na sua região ainda. Quer que façamos uma busca personalizada grátis?" 
    > [Botão: Solicitar Busca Personalizada]
3.  **Variação Premium (Patrocinados):** Borda suave amarela/dourada (`amber-400`), badge "Destaque Avalia Solar", fundo ligeiramente contrastado e botão principal "Quero Orçamento" brilhante.
4.  **Mobile-First Layout:** No celular, os cards serão exibidos em um carrossel com scroll horizontal suave ou lista vertical empilhada, com CTAs grandes para toque de polegar (mínimo `44px` de altura).

---

## 5. Jornada de Conversão e Consentimento LGPD

O fluxo de captura de lead será ativado via clique no botão **"Quero Orçamento"** de qualquer card ou quando a IA disparar a flag `should_trigger_lead`.

```
         +--------------------------------------------+
         |            CLIQUE EM QUERO ORÇAMENTO       |
         +--------------------------------------------+
                               |
                               v
         +--------------------------------------------+
         |   Formulário de Consultoria dentro do Chat  |
         |   - Nome                                   |
         |   - WhatsApp                               |
         |   - E-mail                                 |
         |   - Cidade / Estado                        |
         |   - Tipo de Interesse (Solar/Eletromob)    |
         +--------------------------------------------+
                               |
                               v
         +--------------------------------------------+
         |               Consentimento LGPD           |
         | [ ] "Aceito compartilhar meus dados..."    |
         +--------------------------------------------+
                               |
                               v
         +--------------------------------------------+
         |           BOTÃO: RECEBER ORÇAMENTOS        |
         +--------------------------------------------+
```

---

## 6. Lógica de Lead Score Comercial

O `Lead` principal criado pelo canal `mobivolt_ai` calculará o score de 0 a 100 com as regras ponderadas:

*   **Cidade identificada:** +15 pontos
*   **Intenção comercial clara:** +20 pontos
*   **Empresa recomendada:** +10 pontos
*   **Clicou no card da empresa:** +15 pontos
*   **Clicou em "Quero Orçamento":** +20 pontos
*   **Informou WhatsApp com consentimento:** +20 pontos
*   **Informou E-mail:** +5 pontos
*   **Urgência expressa detectada:** +10 pontos
*   **Possui proposta concorrente para análise:** +10 pontos
*(Nota: Ponderação clampada para o teto de 100 pontos)*

### Classificação do Lead
*   `0 a 39`: **Frio** (Tratamento via e-mail marketing automático)
*   `40 a 69`: **Morno** (Nutrição com informativos da plataforma)
*   `70 a 100`: **Quente** (Envio imediato via WhatsApp e alerta comercial!)

---

## 7. Active Admin: Customização da Aba de Leads

A tela de listagem de Leads do Active Admin será enriquecida com a origem e a qualificação do MobiVolt AI.

### Modificações no `app/admin/leads.rb`:
```ruby
# Filtros Novos
filter :source, as: :select, collection: -> { Lead.pluck(:source).uniq }
filter :lead_score
filter :clicked_company_id, as: :select, collection: -> { Company.pluck(:name, :id) }

# Scopes Rápidos no Painel
scope 'Todos', :all
scope 'MobiVolt AI', ->(leads) { leads.where(source: 'mobivolt_ai') }
scope 'Leads Quentes', ->(leads) { leads.where('lead_score >= 70') }
scope 'Orçamento Solicitado', ->(leads) { leads.where.not(quote_requested_company_id: nil) }

# Index Grid Customizado
column :origem do |lead|
  if lead.source == 'mobivolt_ai'
    status_tag 'MobiVolt AI', class: 'ok'
  else
    status_tag lead.source, class: 'light'
  end
end
column :score do |lead|
  if lead.lead_score.present?
    status_tag "#{lead.lead_score} pts", class: lead.lead_score >= 70 ? 'ok' : 'warning'
  end
end
```

### Visualização do Detalhe do Lead (Show Panel):
Criaremos um painel lateral em Active Admin chamado **"Inteligência de Vendas (MobiVolt AI)"** exibindo:
*   **Resumo Comercial da IA:** `"Usuário buscou instaladores em Cuiabá. O chat indicou Enerzee e WEG. O usuário clicou no botão Quero Orçamento de Enerzee, informou WhatsApp e aceitou consentimento LGPD."`
*   **Próxima Melhor Ação sugerida pela IA:** `"Chamar o cliente no WhatsApp para confirmar o valor da conta de luz mensal e enviar a proposta da Enerzee."`
*   **Status de Consentimento de LGPD:** Detalhes com data, hora, IP de aceite e versão do termo legal para total segurança de compliance.

---

## 8. Telemetria e Inteligência Analítica (PostHog & Metabase)

### Eventos PostHog
1.  `mobivolt_company_card_viewed`: Disparado ao exibir os cards no chat.
2.  `mobivolt_company_profile_clicked`: Clique em "Ver perfil".
3.  `mobivolt_quote_request_clicked`: Clique em "Quero orçamento".
4.  `mobivolt_whatsapp_clicked`: Clique no CTA de WhatsApp da empresa.
5.  `mobivolt_lead_optin_completed`: Sucesso no formulário de sync.

### Dashboards Metabase (Queries recomendadas)
*   **Empresas Recomendadas vs Clicadas:**
    ```sql
    SELECT c.name, COUNT(l.id) as total_recomendado, COUNT(l.clicked_company_id) as total_cliques
    FROM leads l
    JOIN companies c ON c.id = ANY(SELECT jsonb_array_elements_text(l.recommended_company_ids)::bigint)
    WHERE l.source = 'mobivolt_ai'
    GROUP BY c.name
    ORDER BY total_cliques DESC;
    ```
*   **Taxa de Conversão do Funil Chat IA:**
    *   Sessões Iniciadas -> Contexto Exibido -> Clique em Orçamento -> Lead Salvo e Sincronizado.

---

## 9. Regras de Benefícios Comerciais por Planos das Empresas

*   **Gratuito (Free):** Aparece na busca orgânica quando o matcher não encontrar patrocinadores. Card básico sem review e sem link de WhatsApp.
*   **Verificada (Selo de Confiança):** Exibe selo verde "Verificada" que aumenta o lead score e confiança do cliente.
*   **Patrocinada / Destaque (Paid):** Prioridade de rankeamento no matcher. Card premium dourado no carrossel do chat, com link direto, foto e review destacado.
*   **Elite (Parceiro Master):** Notificação em tempo real (WhatsApp) quando o lead solicitar orçamento direto da empresa via MobiVolt AI.

---

## 10. Plano de Verificação e Testes (RSpec & Cypress)

### RSpec (Backend)
1.  `LeadSyncServiceSpec`:
    *   Valida a criação e o mapeamento de campos do `ChatLead` para `Lead` principal.
    *   Garante a idempotência impedindo a gravação de leads duplicados em intervalo de 5 minutos.
    *   Garante que, se a sincronização de `Lead` estourar um erro, o banco salve o `ChatLead` original perfeitamente e envie telemetria de falha ao Sentry.
2.  `LeadScoreCalculatorSpec`:
    *   Valida a atribuição exata de pontuações de acordo com as ações do usuário (WhatsApp, e-mail, cliques, etc.).

### Cypress / Playwright (Frontend)
1.  Testa a abertura do ChatWidget e o carregamento dos cards de empresas.
2.  Testa se os cliques nos CTAs de "Ver perfil" abrem a URL correta da empresa.
3.  Testa a submissão do formulário compactado de orçamento e a transição para a mensagem de agradecimento.
