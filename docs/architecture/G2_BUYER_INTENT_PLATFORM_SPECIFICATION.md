# Especificação Arquitetural e Operacional: G2 Buyer Intent Platform

> **Status:** Implementado & Ativo  
> **Referência Canônica:** G2 Buyer Intent Documentation & Avalia Solar 2026 Engine  
> **Data:** 2026-10-14  

---

## 1. Visão Geral

A plataforma de **Buyer Intent (Intenção de Compra)** do Avalia Solar replica com fidelidade a arquitetura de sinais, scoring e relatórios do **G2 Buyer Intent**, adaptando-a estrategicamente para o mercado de energia solar B2B e B2C no Brasil.

Esta inteligência permite aos integradores, distribuidores e fabricantes solares cadastrados no Avalia Solar identificar com precisão:
1. **Quais contas/empresas** estão pesquisando soluções fotovoltaicas na sua região.
2. **Em qual estágio da jornada de compra** a organização se encontra (`Awareness`, `Consideration`, `Decision`).
3. **Qual é o nível de intensidade da pesquisa** (`Low`, `Medium`, `High Activity`).
4. **Com quais concorrentes diretos** a sua empresa foi comparada.

---

## 2. Taxonomia de Sinais (G2 Signals Mapping)

| Sinal no G2 | Sinal no Avalia Solar | Descrição Técnica & Ação de Captura | Peso (1-10) |
| :--- | :--- | :--- | :---: |
| **Profile** | `profile_view` / `review_read` | Comprador visualizou o perfil corporativo, selos de garantia ou avaliações de clientes do integrador. | 4 |
| **Pricing** | `calculator_usage` / `pricing_interaction` | Comprador simulou potência (kWp), payback ou custo de financiamento solar na calculadora integrada. | 7 - 8 |
| **Alternatives** | `alternatives_view` | Comprador navegou em alternativas a um concorrente regional específico na mesma categoria. | 5 |
| **Category** | `category_browse` / `product_search` | Comprador navegou na categoria do setor (ex: *Baterias e Armazenamento*, *Inversores Híbridos*, *Usinas Rurais*). | 4 |
| **Compare** | `comparison_view` / `comparison_usage` | Comprador colocou a sua empresa lado a lado com um concorrente no comparador solar oficial. | 6 |
| **Sponsored Content** | `sponsored_ad_view` | Comprador foi exposto ao banner ou card patrocinado da sua empresa nos trilhos de anúncios. | 3 |
| **Licensed / Reference** | `document_download` | Comprador realizou download de catálogo técnico, estudo de caso ou portfólio de projetos. | 6 |
| **Contact (Hot Signal)** | `whatsapp_hover` / `phone_hover` | Comprador pausou o cursor ou clicou no botão de contato direto / WhatsApp. | 7 |

---

## 3. Matriz de Scoring de Duplo Fator (G2 Standard)

Em substituição a um score unidimensional simples, a plataforma adota o modelo de duplo fator recomendado pelo G2:

### 3.1 Estágio de Compra (Buying Stage)

1. **Descoberta (Awareness - 0 a 30 pts):**  
   - O comprador explora necessidades gerais de transição energética, sem lista definida de integradores.
   - *Ação recomendada pelo Playbook:* Fornecer materiais educativos, simulações de economia média e guias de telhados.
2. **Avaliação (Consideration - 31 a 70 pts):**  
   - O comprador avalia integradores e marcas de equipamentos, lendo avaliações verificadas e comparando reputação técnica.
   - *Ação recomendada pelo Playbook:* Demonstrar diferenciais técnicos, selos de instalador verificado e cases industriais/rurais.
3. **Decisão (Decision - 71 a 100 pts):**  
   - O comprador está em fase final de contratação, avaliando condições comerciais, prazo e proposta.
   - *Ação recomendada pelo Playbook:* Contato imediato do time comercial (SDR/Executivo de Contas) com proposta customizada.

### 3.2 Nível de Atividade (Activity Level)

- **Baixa (Low):** Pesquisa inicial esporádica (1 a 3 páginas).
- **Média (Medium):** Pesquisa ativa em múltiplas sessões (4 a 10 sinais).
- **Alta (High):** Engajamento intenso recente ou múltiplos sinais quentes (`hot signals >= 3`).

---

## 4. Arquitetura da Solução Técnica

### 4.1 Backend (Ruby on Rails)
- **Modelos:**
  - `BuyerIntentActivity`: armazena cada micro-interação (`hover`, `click`, `comparison`, `calculator_usage`, `page_path`, `session_id`, `anonymous_id`, `ip_hash`).
  - `IntentScore`: armazena a agregação da conta com `buying_stage`, `activity_level`, `direct_pageviews`, `competitive_pageviews`, decaimento temporal (`decay_factor`) e histórico de transições (`IntentScoreHistory`).
- **Endpoints REST `/api/v1/intent_scores`:**
  - `GET /api/v1/intent_scores?company_id=...&buying_stage=...&activity_level=...&days=...`: consulta filtrada por ICP.
  - `GET /api/v1/intent_scores/reporting?company_id=...`: agrega distribuições de Buying Stage, Activity Level e ratio de tráfego direto vs concorrentes.
  - `GET /api/v1/intent_scores/export_csv?company_id=...`: download do G2 Summary CSV.
  - `GET /api/v1/intent_scores/export_detail_csv?company_id=...`: download do G2 Detail CSV com prefixo `competitive/`.

### 4.2 Frontend (Next.js 14 App Router)
- **Localização:** `app/dashboard/intent/page.tsx` e aba `buyer-intent` em `EnterpriseDashboard.tsx`.
- **Componentes:**
  - `IcpFilterPanel`: filtros com critérios de data, estágio, nível de atividade e Saved Filters.
  - `BuyerIntentReporting`: KPIs visuais e gráficos do funil de decisão.
  - `BuyerIntentTable`: tabela interativa com chips de concorrentes comparados, badges dinâmicos e botões de exportação.
  - `AccountDetailDrawer`: gaveta lateral com a timeline cronológica granular da conta e ações de fechamento comercial (WhatsApp, proposta).
