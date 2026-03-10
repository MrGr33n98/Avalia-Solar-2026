# Estratégia e Mapeamento de Buyer Intent Data

Este documento consolida a análise e mapeamento estratégico dos sinais de **Intenção de Compra (Buyer Intent Data)** dentro do ecossistema do Avalia-Solar. O objetivo desta documentação é servir como um guia para os times de Produto, Vendas (Inside Sales) e Engenharia sobre como os dados de comportamento dos usuários podem ser convertidos em oportunidades de monetização (posicionamento B2B) e repasse de leads altamente qualificados.

---

## 1. O Termômetro da Intenção de Compra

A intenção de compra de um lead (cliente em potencial de serviços solares) não é binária. Ela ocorre num espectro baseado no engajamento, esforço e nível de exposição na plataforma. 

Abaixo documentamos os macro-gatilhos de intenção presentes na plataforma e como devemos analisá-los:

| Gatilho (Trigger) | Onde na Plataforma (Where) | Dados Capturados (What) | Nível de Intenção / Sentimento | O que diz sobre o Lead (Analítico) |
| :--- | :--- | :--- | :--- | :--- |
| **Pesquisa por Nicho / Local** | Busca global e Filtros | Termo exato de busca, localização, tags. | 🧊 **Frio / Descoberta** (Curiosidade) | Identificou o problema (ex: conta alta) e está mapeando o mercado. Fase de descoberta. |
| **Visualizar Perfil da Empresa** | Dashboard do [Company](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/models/company.rb#3-853) | Tempo na página, Categoria, Identificador Único. | 🌤️ **Morno / Topo de Funil** (Avaliação passiva) | Interesse real despertado. Avaliação superficial de uma empresa (vitrine). Ótimo para remarketing. |
| **Ler Reviews / FAQs** | Prova Social do [Company](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/models/company.rb#3-853) | Cliques em "Ler mais", FAQs, Rating reviews. | 🌤️ **Morno / Meio de Funil** (Ceticismo) | Usuário averso ao risco buscando segurança na decisão. Avaliando a credibilidade técnica do integrador. |
| **Engajamento em Banners** | HomePage e Sidebars | Banner ID (Offer/Sub), tempo de visualização. | 🔥 **Quente / Meio de Funil** (Busca de Oportunidades) | Fisgado por um *deal* específico ou posicionamento premium de um integrador. |
| **Download (Gated Content)** | Páginas e LPs Regionais | E-mail, Cargo, Material acessado. | 🔥 **Quente / Foco Transacional** | Aceitou "pagar" com seus dados por informação valiosa (ex: ROI studies). Alta inclinação empírica. |
| **Simulação de Financiamento** | Aba "Financiamento" | Bancos, Juros, Valor da Parcela, Interações. | 🌋 **Fervendo / Fundo de Funil** | Fase de tangibilização. Avaliando a viabilidade de pagamento. O lead já decidiu que quer instalar. |
| **Cliques em Sites e Outbounds** | Cabeçalho do Perfil | Ação de saída e link apontado. | 🌋 **Fervendo / Fundo de Funil** | O lead está validando a empresa for a da plataforma antes do contato ou fechar negócio. |
| **Clique de WhatsApp (!)** | Botões CTA Primários | Clique de abertura, Payload (Template). | 🚨 **Imediato / Decisão** (Urgência) | Lead quer contato humano em tempo real para matar a última objeção ou fechar. O SLA dita a venda. |
| **Wizard Complete (Orçamento)**| Fluxos de Lead | Consumo, CPF/CNPJ, Orçamento, Endereço. | 🎯 **Compra Declarada** (Desejo Explícito) | Pedido direto de proposta técnica. O lead perfeito. |

---

## 2. Inventário Técnico Atual (Tags Implementadas no PostHog e GTM)

O front-end ([AB0-1-front/lib/analytics/index.ts](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/lib/analytics/index.ts)) já possui um robusto sistema de rastreamento de uso. Seguem os eventos em funcionamento para correlação direta com intenção de compra:

| Evento Base | Intenção | Local de Captura / Disparo |
| :--- | :--- | :--- |
| `$pageview` / `page_view` | 🧊 Frio | Todas as rotas (Tráfego geral) |
| `search_submitted` | 🌤️ Morno | Barra de pesquisa (Busca Ativa) |
| `category_selected` / `location_selected` | 🌤️ Morno | Filtros, menus e *dropdowns* (Segmentação de Perfil) |
| `company_card_click` / `company_tab_change` | 🔥 Quente | Resultados da Busca e Perfis de Empresas (Comparativo Indireto) |
| `scroll_depth_reached` | 🌤️ Morno | LPs Longas (Capacidade de Engajamento e Leitura) |
| `regional_data_exposed` / `roi_expand` | 🔥 Quente | LPs específicas de ROI Regionais (Forte inclinação Técnica/Financeira) |
| `premium_banner_clicked` / `banner_click` | 🔥 Quente | Espaços Patrocinados (Afinidade com Ofertas e Promoções) |
| `comparison_add` | 🔥 Quente | Comparadores de Vários Perfis (Racionalização e Análise de Concorrentes) |
| [cta_click](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/models/company.rb#339-345) / `whatsapp_click` | 🌋 Fervendo | Todo botão primário/WhatsApp do app (Tentativa Imediata de Contato) |
| `Wizard Opened` / `lead_success` | 🎯 Decisão | Submissão bem-sucedida de propostas via formulário na plataforma |

---

## 3. Quick-Wins e Micro-Interações (Onde Capturamos os +40% Faltantes)

Para alcançarmos os 100% da Qualificação de Intenção do Lead (Buyer Intent), precisamos iluminar o que chamamos de "Dark Funnel". A interface precisa ser tagueada em suas micro-interações silenciosas: gestos do usuário que revelam que o lead tem um claro desejo empírico (Sinal Frio → Decisão Quente) na jornada B2B:

### A) Micro-Interações de Formulários Abandonados e Interesse Direto (Peso: +10%)
O abandono não é uma métrica morta; o abandono é uma qualificação incompleta.
*   **1. Formulários Parciais (Ghost Leads):** O usuário preenche parte de uma cotação (ex: Gasto mensal) mas abandona quando a plataforma pede o CPF.
    *   *O que capturar:* Valor dos campos `consumption`, [state](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/models/company.rb#466-472) mesmo no `onBlur` do React.
    *   *Sinal de Intenção:* Lead possui forte interesse, mas hávera fricção. Podemos engajar um marketing B2B sabendo sua dor de consumo exato.
*   **2. Exposição Frequente do Número Oficial (Click to Reveal):**
    *   *Como Funciona:* O número de telefone principal do integrador pode vir ofuscado (Ex: (11) 9892... *Ver Telefone*).
    *   *Sinal de Intenção:* Lead quer bypassar nosso CRM para falar diretamente.
*   **3. Cópia Pragmática de Dados B2B (`copy_clipboard_intent`):**
    *   *Como Funciona:* O usuário arrasta o mouse e aperta Ctrl+C sobre um texto de CNPJ, Telefone não linkado, ou E-mail.
    *   *Sinal de Intenção:* Lead corporativo fazendo sua própria triagem externa ou salvando num Excel B2B para o fluxo de Due Diligence.

### B) Interatividade com Produtos Financeiros (Peso: +10%)
O engajamento financeiro tangibiliza a intenção no mais alto patamar B2B2C.
*   **4. Simulação Frequente de Financiadoras (`financial_intent_shift`):**
    *   *Como Funciona:* O usuário na aba de 'Financiamento' muda os slots (Por exemplo, ele arrasta um Slider de Entrada de R$0 para R$10.000).
    *   *O que capturar:* Os thresholds estipulados de taxa e parcelas aceitas.
    *   *Sinal de Intenção:* Fase transacional *fervendo*. Ele tem noção de fluxo de caixa corporativo/residencial e quer dar Match financeiro. C-Level.
*   **5. Downloads Fechados (Arquivos/Manuais - Gated Content):**
    *   *Como Funciona:* Mapear cliques que engajam com materiais ricos em anexo (ex: "Manual WEG Inversores" atrelado à empresa).
    *   *Sinal de Intenção:* Maturidade extrema. O Lead parou de comparar "estrelas" e está comparando topologias técnicas.

### C) Comportamento Visceral de Análise / Engajamento Negativo (Peso: +15%)
A jornada B2B teme apenas uma coisa: o "Risco".
*   **6. Leitura Densa de "Bad Reviews" (Risco e Ceticismo):**
    *   *Como Funciona:* Trackear quanto tempo e quantos cliques (`read_more`) o usuário dá exclusivamente em avaliações <= 2 Estrelas.
    *   *Sinal de Intenção:* O Lead é maduro. Ele é averso a risco, está fechando projeto e precisa saber os "piores cenários" (Maintenance costs) do integrador antes de assinar. Lead altamente qualificado, mas medroso.
*   **7. Aprofundamento no "About Us" e FAQs Extensas:**
    *   *Como Funciona:* Expansão de "Conheça nossas Certificações" e múltiplos acordions da FAQ (`faq_item_expanded`).
    *   *Sinal de Intenção:* Fase racional de venda corporativa. Validação total do Business do Integrador.
*   **8. External Social Clues (Social Outbound B2B):**
    *   *Como Funciona:* Trackear saídas direcionadas em série para "Company Site", "LinkedIn", "Instagram".
    *   *Sinal de Intenção:* Fobia de Scams Solares / Golpes de Mercado. A empresa está sofrendo um due-diligence (investigação pesada) do comprador B2B.

### D) Intenção C-Level de Segmentação (Peso: +5%)
Sinais em que o lead se cataloga ativamente para nós na Plataforma.
*   **9. Utilização do Micro-Filtro de "Potência" ou "Tipo" (Filtro Long-Tail):**
    *   *Como Funciona:* Usuário passa os filtros globais rasos e clica em filtros profundos (ex: Apenas integradores rurais `agro_subsidized` ou > `500kWp`).
    *   *Sinal de Intenção:* Esse *não* é um pequeno cliente residencial. O Lead acabou de revelar ser de Alto Valor / Key Account.

---

## 4. O Futuro: Novas Features Premium baseadas no Sinal de Compra B2B

O Avalia-Solar atua em um modelo B2B2C, os dados acima precisam virar produto. Sugestões de roadmap para monetização desse *Intent Data*, nos moldes de repositórios gigantes como o G2.com:

### A) Feature: Gated Content Engine (Materiais Ricos dos Integradores)
A infraestrutura back-end já foi iniciada com [CompanyDocuments](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/db/migrate/20260310051813_create_company_documents.rb#1-9) e [BuyerIntentActivities](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/db/migrate/20260310051917_create_buyer_intent_activities.rb#1-9).
* **O que é:** Permitir que as empresas solares parceiras coloquem PDFs atrativos (Cases de Sucesso no Agro, ROI Studies, Manuais) nos seus perfis. O usuário só acessa se fornecer E-mail Corporate e Nome/Cargo (Turnstile/Paywall).
* **Valor Proposto:** "Conectamos você aos leads que estão fazendo pesquisa teórica e técnica agora. Um prato cheio para seu time de Marketing/Vendas."

### B) Feature: Revelação B2B Passiva ("Quem Viu o Perfil")
Inspirado por integrações *Clearbit* ou rastreamentos IPs diretos no servidor (n8n/Logs).
* **O que é:** Expor nos planos Pro/Enterprise um "Painel de Oportunidades", com cards do modelo: *"Um Executivo da Empresa XYZ de São Paulo esteve no seu perfil 3 vezes nesta última semana analisando seus prêmios."*
* **Valor Proposto:** Sinal puro e destilado, sem que um formulário tenha sido sequer preenchido (Sinal Frio → Action Warm Handoff para o Executivo Comercial).

### C) Feature: Wishlisting e Favorite (Shortlisting Privado)
* **O que é:** O botão `❤️ Salvar Empresa` global que alimenta um dashboard comparativo para o consumidor.
* **Valor Proposto:** Ao assuntá-la num painel para o Integrador Partner, sinaliza-se que aquele usuário o incluiu na concorrência formal (RFP Virtual / "Cotar com Estes").

### D) Automação de Carga Rápida (Smart Webhooks Hubspot)
* O *score de intenção* calculado a partir das navegações (`company_feature_daily`) pode desencadear eventos de webhook para o Hubspot do Integrador. 
* Tags de Prioridade enviadas por automação: *"O lead L102 enviou um formulário. Ele também gastou 5 minutos calculando juros de financiamento no seu perfil. Ligue em 5 minutos!".*

---

**Resumo da Direção:** Os dados servem a dois mestres: otimizar o UX interno do lead para fazê-lo navegar pelo funil, e encantar as marcas do Avalia-Solar ao entregarem muito mais que um "clique simples", entregando um dossiê prático de porquê e como contactar esse potencial cliente.
