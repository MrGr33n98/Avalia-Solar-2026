Abaixo está o **prompt único, concatenado e pronto para colar no GSD/Copilot**, juntando: modal por vertical, discovery, comparação de avaliações, roteamento por categoria/produto, links internos, captura de contato para orçamento e mapeamento da intenção de compra. Ele consolida o fluxo anterior de modal inteligente por vertical e amplia o objetivo principal para levar o usuário até **reviews + comparação + orçamento**. 

```text
/gsd-discuss-phase "Fase 5.1 — Discovery Inteligente no Chatbot: Modal por Vertical, Reviews, Comparação, Categorias, Produtos e Orçamento

Contexto:
Estamos no projeto Avalia Solar / MobiVolt AI.

A Fase 5 principal trata de Reviews Premium + ReviewCaptureFlow + Reputação. Porém, antes de avançar com Wave 2, precisamos encaixar uma subfase estratégica:

Fase 5.1 — Discovery Inteligente no Chatbot.

O objetivo é transformar o chatbot em uma jornada guiada de descoberta, comparação e conversão.

Hoje não queremos apenas um formulário genérico de lead. Queremos um fluxo inteligente, dinâmico e guiado por botões, em que o usuário consiga:

1. Descobrir o que precisa.
2. Escolher entre Energia Solar e Mobilidade Elétrica.
3. Comparar empresas e avaliações.
4. Entender categorias e produtos/serviços.
5. Ser direcionado por links internos do próprio chatbot.
6. Encontrar empresas compatíveis por cidade, estado, categoria e necessidade.
7. Ver reviews antes de pedir orçamento.
8. Deixar contato com consentimento LGPD.
9. Permitir que o Avalia Solar mapeie a intenção de compra, momento da jornada, urgência, perfil e temperatura do lead.

Nome da subfase:
Fase 5.1 — Smart Discovery Lead Modal

Objetivo principal:
Criar uma jornada dinâmica no ChatWidget em que o discovery tenha como foco:
- ajudar o cliente a encontrar avaliações confiáveis;
- comparar empresas;
- entender qual categoria/produto/serviço faz sentido;
- direcionar para empresas da cidade/estado/categoria;
- capturar contato para orçamento;
- mapear intenção de compra do lead.

Importante:
Não implementar código agora.
Não fazer commit.
Não fazer push.
Não rodar testes.
Apenas discutir, planejar e gerar um plano executável em Markdown.

====================================================================
1. PRINCÍPIO CENTRAL DO FLUXO
====================================================================

O chatbot deve funcionar como um assistente de decisão:

Usuário abre chatbot
↓
MobiVolt AI identifica ou pergunta a vertical
↓
Abre modal inteligente
↓
Usuário responde por botões
↓
Sistema monta lead_profile
↓
Sistema identifica categoria/produto/serviço
↓
Sistema identifica cidade/estado
↓
Sistema identifica momento de compra
↓
Sistema mostra empresas e reviews
↓
Usuário pode comparar avaliações
↓
Usuário pode pedir orçamento
↓
Sistema captura contato com LGPD
↓
Lead é salvo com score, temperatura e intenção

O fluxo principal é:

Chatbot → Discovery → Vertical → Categoria → Momento de compra → Cidade/Estado → Empresas → Reviews → Comparação → Orçamento → Lead qualificado

====================================================================
2. VERTICAIS DO MODAL
====================================================================

O modal deve ter 3 caminhos principais:

A) Energia Solar
B) Mobilidade Elétrica
C) Indefinido / Quero explicar

O modal deve abrir automaticamente quando o IntentRouterService detectar intenção comercial, de comparação, orçamento, busca por empresa, busca por reviews ou descoberta de solução.

Não abrir modal automaticamente para dúvida técnica pura. Dúvida técnica deve continuar indo para SupportAgent / Knowledge Base.

====================================================================
3. BOTÕES INICIAIS DO CHATBOT
====================================================================

O chatbot deve apresentar botões rápidos como:

- ☀️ Energia Solar
- 🔌 Mobilidade Elétrica
- ⭐ Ver avaliações
- 📊 Comparar empresas
- 💰 Quero orçamento
- 🏢 Encontrar empresas
- 📄 Entender minha proposta
- ✍️ Quero explicar o que preciso

Cada botão deve iniciar um fluxo específico.

Mapeamento:

☀️ Energia Solar
→ abre SolarLeadFlow

🔌 Mobilidade Elétrica
→ abre ElectricMobilityLeadFlow

⭐ Ver avaliações
→ abre ReviewsDiscoveryFlow

📊 Comparar empresas
→ abre CompanyComparisonDiscoveryFlow

💰 Quero orçamento
→ pergunta vertical e inicia lead capture

🏢 Encontrar empresas
→ pergunta categoria + cidade/estado

📄 Entender minha proposta
→ por enquanto encaminhar para fluxo educativo/futuro ProposalAnalyzer, sem implementar upload agora

✍️ Quero explicar o que preciso
→ abre FreeTextDiscoveryFlow

====================================================================
4. OBJETO lead_profile ESPERADO
====================================================================

Ao final do fluxo, o sistema deve montar um objeto lead_profile com campos como:

{
  "vertical": "solar | electric_mobility | unknown",
  "category": "residential_solar | commercial_solar | rural_solar | condominium_solar | residential_ev_charger | commercial_ev_charger | condominium_ev_charger | fleet_ev_charger | public_charging_station | unknown",
  "product_or_service": "solar_panel_system | solar_financing | solar_maintenance | wallbox | ev_charger_installation | condo_charging | fleet_charging | public_charging | unknown",
  "property_type": "house | apartment | business | rural | condominium | industry | parking | fleet | other",
  "city": "string",
  "state": "string",
  "buying_stage": "researching | comparing | has_proposal | ready_to_buy | urgent | support",
  "monthly_bill_range": "up_to_300 | 300_600 | 600_1000 | 1000_3000 | above_3000 | unknown",
  "ev_ownership": "owns_ev | owns_plugin_hybrid | buying_soon | business_condo | researching | unknown",
  "has_electrical_point": "true | false | unknown",
  "needs_technical_assessment": "true | false | unknown",
  "needs_financing": "true | false | unknown",
  "wants_reviews": true,
  "wants_comparison": true,
  "wants_quote": true,
  "selected_company_ids": [],
  "review_interest": "see_best_rated | compare_reviews | read_negative_reviews | see_recent_reviews | unknown",
  "free_text": "texto breve do usuário",
  "lead_score": 0,
  "lead_temperature": "cold | warm | hot",
  "lgpd_consent": true
}

====================================================================
5. FLUXO DE ENERGIA SOLAR
====================================================================

Tela 1 — Abertura:
Mensagem:
"Legal! Vou te ajudar a encontrar empresas de energia solar confiáveis e ver avaliações antes de pedir orçamento."

Pergunta:
"Qual tipo de projeto você procura?"

Botões:
- 🏠 Energia solar para casa
- 🏢 Energia solar para empresa/comércio
- 🌾 Energia solar rural/fazenda
- 🏘️ Energia solar para condomínio
- 🔧 Manutenção de sistema solar
- 💳 Financiamento solar
- 🤔 Ainda não sei
- ✍️ Quero explicar

Mapeamento:
Energia solar para casa → category = residential_solar; property_type = house
Energia solar para empresa/comércio → category = commercial_solar; property_type = business
Energia solar rural/fazenda → category = rural_solar; property_type = rural
Energia solar para condomínio → category = condominium_solar; property_type = condominium
Manutenção de sistema solar → product_or_service = solar_maintenance
Financiamento solar → product_or_service = solar_financing; needs_financing = true
Ainda não sei → category = solar_unknown
Quero explicar → free_text

Tela 2 — Produto/serviço:
Pergunta:
"O que você está buscando agora?"

Botões:
- Instalar um sistema novo
- Comparar empresas
- Ver avaliações de empresas
- Entender se vale a pena
- Tenho uma proposta e quero comparar
- Preciso de manutenção
- Quero financiamento
- Quero orçamento

Mapeamento:
Instalar sistema novo → product_or_service = solar_panel_system
Comparar empresas → wants_comparison = true
Ver avaliações → wants_reviews = true
Tenho proposta → buying_stage = has_proposal
Manutenção → product_or_service = solar_maintenance
Financiamento → needs_financing = true
Quero orçamento → wants_quote = true

Tela 3 — Momento de compra:
Pergunta:
"Em qual momento você está?"

Botões:
- 🔎 Estou pesquisando
- ⭐ Quero ver avaliações primeiro
- 📊 Quero comparar empresas
- 📄 Já tenho proposta
- 💰 Quero orçamento
- ⚡ Quero instalar logo

Mapeamento:
Estou pesquisando → buying_stage = researching
Quero ver avaliações primeiro → review_interest = see_best_rated; buying_stage = researching
Quero comparar empresas → buying_stage = comparing; wants_comparison = true
Já tenho proposta → buying_stage = has_proposal
Quero orçamento → buying_stage = ready_to_buy; wants_quote = true
Quero instalar logo → buying_stage = urgent; wants_quote = true

Tela 4 — Conta de luz:
Pergunta:
"Qual é a média da sua conta de luz?"

Botões:
- Até R$ 300
- R$ 300 a R$ 600
- R$ 600 a R$ 1.000
- R$ 1.000 a R$ 3.000
- Acima de R$ 3.000
- Não sei informar

Mapeamento:
Até R$ 300 → monthly_bill_range = up_to_300
R$ 300 a R$ 600 → monthly_bill_range = 300_600
R$ 600 a R$ 1.000 → monthly_bill_range = 600_1000
R$ 1.000 a R$ 3.000 → monthly_bill_range = 1000_3000
Acima de R$ 3.000 → monthly_bill_range = above_3000
Não sei informar → monthly_bill_range = unknown

Tela 5 — Localização:
Pergunta:
"Onde seria a instalação ou atendimento?"

Campos:
- Cidade
- Estado

Botões auxiliares:
- Usar minha cidade
- Ver empresas do meu estado
- Ainda não sei

Validação:
Cidade e estado devem ser solicitados antes de buscar empresas. Se não informar cidade, buscar por estado. Se não informar estado, pedir estado.

Tela 6 — Financiamento:
Pergunta:
"Você pretende financiar ou pagar à vista?"

Botões:
- Quero financiar
- À vista
- Quero comparar financiamento e à vista
- Ainda não sei

Mapeamento:
Quero financiar → needs_financing = true
À vista → needs_financing = false
Comparar opções → needs_financing = unknown; buying_stage = comparing
Ainda não sei → needs_financing = unknown

Tela 7 — Reviews:
Pergunta:
"Antes do orçamento, que tipo de avaliação você quer ver?"

Botões:
- Melhores avaliadas
- Mais reviews
- Reviews mais recentes
- Comparar notas por critério
- Ver reclamações/pontos negativos
- Ir direto para orçamento

Mapeamento:
Melhores avaliadas → review_interest = see_best_rated
Mais reviews → review_interest = high_review_volume
Reviews recentes → review_interest = see_recent_reviews
Comparar notas por critério → review_interest = compare_reviews
Reclamações/pontos negativos → review_interest = read_negative_reviews
Ir direto para orçamento → wants_quote = true

Resultado Solar:
Buscar empresas compatíveis por:
- vertical = solar
- category
- product_or_service
- city
- state
- active = true
- public_profile = true
- reviews approved
- reputation score

Se houver empresas:
Mensagem:
"Encontrei empresas de energia solar que atendem sua necessidade em [cidade/estado]. Você pode comparar avaliações antes de pedir orçamento."

Mostrar cards com:
- nome da empresa
- nota média
- total de reviews
- reputação/tier
- cidade/estado
- serviços
- selo verificado
- botão Ver reviews
- botão Comparar
- botão Pedir orçamento
- botão Ver perfil
- botão WhatsApp, se permitido

Se não houver empresas:
Mensagem:
"Ainda não encontrei empresas cadastradas exatamente para essa necessidade em [cidade/estado]. Posso te mostrar empresas próximas, empresas do estado ou registrar sua demanda."

Botões:
- Ver empresas próximas
- Ver empresas do estado
- Registrar minha necessidade
- Ler guia sobre energia solar
- Falar com atendimento

====================================================================
6. FLUXO DE MOBILIDADE ELÉTRICA
====================================================================

Tela 1 — Abertura:
Mensagem:
"Perfeito! Vou te ajudar a encontrar empresas de mobilidade elétrica e carregadores com avaliações confiáveis."

Pergunta:
"Que tipo de solução você procura?"

Botões:
- 🏠 Carregador residencial
- 🏢 Carregador comercial
- 🏘️ Carregador para condomínio
- 🚗 Carregador para garagem
- 🚚 Solução para frota elétrica
- ⚡ Eletroposto / recarga pública
- 🔧 Instalação/manutenção de carregador
- 🤔 Ainda não sei
- ✍️ Quero explicar

Mapeamento:
Carregador residencial → category = residential_ev_charger
Carregador comercial → category = commercial_ev_charger
Condomínio → category = condominium_ev_charger
Garagem → category = garage_ev_charger
Frota elétrica → category = fleet_ev_charger
Eletroposto → category = public_charging_station
Instalação/manutenção → product_or_service = ev_charger_installation
Ainda não sei → category = ev_unknown
Quero explicar → free_text

Tela 2 — Produto/serviço:
Pergunta:
"O que você precisa comparar ou contratar?"

Botões:
- Comprar e instalar wallbox
- Só instalação do carregador
- Avaliação elétrica do local
- Projeto para condomínio
- Projeto para empresa
- Projeto para frota
- Ver avaliações de instaladores
- Comparar empresas

Mapeamento:
Comprar e instalar wallbox → product_or_service = wallbox
Só instalação → product_or_service = ev_charger_installation
Avaliação elétrica → needs_technical_assessment = true
Projeto condomínio → category = condominium_ev_charger
Projeto empresa → category = commercial_ev_charger
Projeto frota → category = fleet_ev_charger
Ver avaliações → wants_reviews = true
Comparar empresas → wants_comparison = true

Tela 3 — Veículo:
Pergunta:
"Você já tem veículo elétrico ou está se planejando?"

Botões:
- Já tenho carro elétrico
- Tenho híbrido plug-in
- Vou comprar em breve
- Sou empresa/condomínio
- Tenho frota ou planejo frota
- Ainda estou pesquisando

Mapeamento:
Já tenho carro elétrico → ev_ownership = owns_ev
Tenho híbrido plug-in → ev_ownership = owns_plugin_hybrid
Vou comprar em breve → ev_ownership = buying_soon
Sou empresa/condomínio → ev_ownership = business_condo
Tenho frota → ev_ownership = fleet
Pesquisando → ev_ownership = researching

Tela 4 — Local:
Pergunta:
"Onde seria instalado?"

Botões:
- Casa
- Apartamento
- Condomínio
- Empresa
- Estacionamento
- Frota
- Eletroposto
- Outro

Mapeamento:
Casa → property_type = house
Apartamento → property_type = apartment
Condomínio → property_type = condominium
Empresa → property_type = business
Estacionamento → property_type = parking
Frota → property_type = fleet
Eletroposto → property_type = public_charging
Outro → property_type = other

Tela 5 — Infraestrutura:
Pergunta:
"Você já tem ponto de energia preparado?"

Botões:
- Sim
- Não
- Não sei
- Preciso de avaliação técnica
- O condomínio precisa aprovar
- Preciso adequar quadro elétrico

Mapeamento:
Sim → has_electrical_point = true
Não → has_electrical_point = false
Não sei → has_electrical_point = unknown
Avaliação técnica → needs_technical_assessment = true
Condomínio precisa aprovar → category = condominium_ev_charger; needs_technical_assessment = true
Adequar quadro → needs_technical_assessment = true

Tela 6 — Momento de compra:
Pergunta:
"Quando você pretende instalar?"

Botões:
- Imediatamente
- Em até 30 dias
- Em 1 a 3 meses
- Ainda pesquisando
- Só quero entender melhor
- Quero ver avaliações antes

Mapeamento:
Imediatamente → buying_stage = urgent
Até 30 dias → buying_stage = ready_to_buy
1 a 3 meses → buying_stage = comparing
Pesquisando → buying_stage = researching
Entender melhor → buying_stage = support
Ver avaliações → wants_reviews = true

Tela 7 — Localização:
Pergunta:
"Em qual cidade e estado você precisa da instalação?"

Campos:
- Cidade
- Estado

Tela 8 — Reviews:
Pergunta:
"Que tipo de avaliação você quer comparar?"

Botões:
- Instaladores melhor avaliados
- Empresas com mais reviews
- Reviews recentes
- Comparar atendimento e prazo
- Ver reclamações/pontos negativos
- Ir direto para orçamento

Resultado Mobilidade:
Buscar empresas compatíveis por:
- vertical = electric_mobility
- category
- product_or_service
- city
- state
- active = true
- public_profile = true
- services includes selected service
- reviews approved
- reputation score

Se houver empresas:
Mensagem:
"Encontrei empresas de mobilidade elétrica que atendem sua necessidade em [cidade/estado]. Você pode comparar avaliações antes de pedir orçamento."

Mostrar cards com:
- empresa
- nota média
- total de reviews
- serviços: wallbox, instalação, condomínio, frota, eletroposto
- cidade/estado
- selo verificado
- botão Ver reviews
- botão Comparar
- botão Pedir orçamento
- botão Ver perfil
- botão WhatsApp, se permitido

Se não houver:
Mensagem:
"Ainda não encontrei empresas cadastradas exatamente para essa categoria na sua cidade. Posso mostrar empresas próximas, do estado, ou registrar sua necessidade."

Botões:
- Ver empresas próximas
- Ver empresas do estado
- Registrar minha necessidade
- Ler guia sobre carregadores
- Explicar minha necessidade

====================================================================
7. FLUXO INDEFINIDO / LIVRE
====================================================================

Tela 1:
Mensagem:
"Sem problema. Vou te ajudar a descobrir o melhor caminho."

Pergunta:
"Como posso te ajudar hoje?"

Botões:
- Quero economizar energia
- Quero instalar energia solar
- Quero carregador para carro elétrico
- Quero comparar empresas
- Quero ver avaliações
- Quero pedir orçamento
- Quero entender uma proposta
- Quero escrever o que preciso

Mapeamento:
Quero economizar energia → solar discovery
Quero instalar energia solar → SolarLeadFlow
Quero carregador → ElectricMobilityLeadFlow
Comparar empresas → CompanyComparisonDiscoveryFlow
Ver avaliações → ReviewsDiscoveryFlow
Pedir orçamento → LeadQuoteFlow
Entender proposta → ProposalEducationFlow, sem upload nesta fase
Escrever → FreeTextDiscoveryFlow

FreeTextDiscoveryFlow:
Pergunta:
"Descreva em poucas palavras o que você procura."

Campo:
free_text

Classificação:
- Se texto contém energia solar, placa, conta de luz, inversor, financiamento → SolarLeadFlow
- Se texto contém carregador, wallbox, carro elétrico, condomínio, recarga → ElectricMobilityLeadFlow
- Se texto contém avaliação, review, reputação, reclamação → ReviewsDiscoveryFlow
- Se texto contém comparar, melhor empresa, ranking → CompanyComparisonDiscoveryFlow
- Se texto contém orçamento, instalar, contratar → LeadQuoteFlow
- Se texto contém dúvida técnica → SupportAgent
- Se não classificar → fallback honesto e registro de demanda

====================================================================
8. FLUXO DE REVIEWS / AVALIAÇÕES
====================================================================

Objetivo:
Ajudar o usuário a encontrar avaliações antes de pedir orçamento.

Tela 1:
Pergunta:
"Você quer ver avaliações de quê?"

Botões:
- Empresas de energia solar
- Empresas de mobilidade elétrica
- Uma empresa específica
- Empresas da minha cidade
- Melhores avaliadas
- Comparar avaliações

Se escolher Energia Solar:
Perguntar:
"Qual tipo de serviço solar?"

Botões:
- Residencial
- Comercial
- Rural
- Condomínio
- Manutenção
- Financiamento
- Não sei

Se escolher Mobilidade Elétrica:
Perguntar:
"Qual tipo de serviço?"

Botões:
- Carregador residencial
- Condomínio
- Empresa
- Frota
- Eletroposto
- Instalação/manutenção
- Não sei

Depois:
Perguntar cidade/estado.

Resultado:
Mostrar lista de empresas com:
- nota média
- total de reviews
- reputação
- critérios médios
- últimas avaliações aprovadas
- botão Comparar avaliações
- botão Pedir orçamento

====================================================================
9. FLUXO DE COMPARAÇÃO DE AVALIAÇÕES
====================================================================

Objetivo:
Permitir comparar empresas com base em reviews e critérios.

Tela 1:
Pergunta:
"Você quer comparar empresas de qual categoria?"

Botões:
- Energia Solar Residencial
- Energia Solar Comercial
- Energia Solar Rural
- Energia Solar Condomínio
- Carregador Residencial
- Carregador Comercial
- Condomínio com carregador
- Frota elétrica
- Eletroposto
- Ainda não sei

Tela 2:
Pergunta:
"Qual cidade e estado?"

Campos:
- Cidade
- Estado

Tela 3:
Sistema busca empresas compatíveis.

Se houver 2 ou mais empresas:
Mensagem:
"Selecione até 3 empresas para comparar avaliações."

Cards selecionáveis:
- Empresa A
- Empresa B
- Empresa C
- Empresa D

Cada card mostra:
- nota média
- total de reviews
- reputação/tier
- cidade
- selo verificado

Tela 4:
Tabela de comparação:

Critérios:
- Nota geral
- Total de reviews
- Atendimento
- Prazo
- Qualidade do serviço
- Pós-venda
- Custo-benefício
- Reviews recentes
- Reclamações/pontos negativos
- Selo verificado
- Tempo de resposta
- Serviços oferecidos
- Cidade/estado
- CTA orçamento

Botões:
- Ver reviews da empresa A
- Ver reviews da empresa B
- Pedir orçamento da melhor avaliada
- Pedir orçamento de todas
- Salvar comparação
- Falar no WhatsApp

Se houver apenas 1 empresa:
Mensagem:
"Encontrei apenas uma empresa compatível nessa cidade. Você pode ver reviews ou ampliar para o estado."

Botões:
- Ver reviews
- Ampliar busca para o estado
- Pedir orçamento
- Registrar interesse

Se não houver empresas:
Mensagem:
"Ainda não encontrei empresas compatíveis para essa categoria e localidade."

Botões:
- Buscar no estado
- Buscar categorias próximas
- Registrar minha necessidade
- Ver guia educativo

====================================================================
10. DIRECIONAMENTO PARA CATEGORIAS E PRODUTOS POR LINKS
====================================================================

O chatbot deve poder enviar links internos dinâmicos.

Links sugeridos:
- /empresas?vertical=solar
- /empresas?vertical=solar&category=residential_solar
- /empresas?vertical=solar&category=commercial_solar
- /empresas?vertical=solar&category=rural_solar
- /empresas?vertical=solar&category=condominium_solar
- /empresas?vertical=electric_mobility
- /empresas?vertical=electric_mobility&category=residential_ev_charger
- /empresas?vertical=electric_mobility&category=commercial_ev_charger
- /empresas?vertical=electric_mobility&category=condominium_ev_charger
- /empresas?vertical=electric_mobility&category=fleet_ev_charger
- /reviews
- /reviews?vertical=solar
- /reviews?vertical=electric_mobility
- /comparar
- /comparar?vertical=solar
- /comparar?vertical=electric_mobility
- /guias/energia-solar
- /guias/carregador-eletrico
- /orcamento

Os links devem ser montados dinamicamente com query params:
- vertical
- category
- city
- state
- buying_stage
- source=chatbot
- session_id, se não for PII
- lead_temperature, se não for PII

Exemplo:
"/empresas?vertical=solar&category=residential_solar&city=Cuiaba&state=MT&source=chatbot"

Não colocar nome, telefone, e-mail, CPF ou texto livre nos links.

====================================================================
11. CAPTURA DE CONTATO PARA ORÇAMENTO
====================================================================

A captura de contato só deve acontecer depois de o usuário demonstrar intenção:

Gatilhos para pedir contato:
- clicou em Pedir orçamento
- clicou em WhatsApp
- escolheu Quero instalar logo
- escolheu Quero orçamento
- selecionou empresa específica
- pediu orçamento de todas
- pediu para ser avisado quando houver empresa
- registrou necessidade

Campos:
- Nome
- WhatsApp
- E-mail opcional
- Cidade
- Estado
- Consentimento LGPD obrigatório

Texto LGPD:
"Autorizo o Avalia Solar a usar meus dados para contato sobre empresas compatíveis com minha necessidade e para encaminhar minha solicitação de orçamento."

Checkbox obrigatório:
- Aceito ser contatado sobre orçamento e empresas compatíveis.

Não salvar lead com dados pessoais sem consentimento.

====================================================================
12. REGRAS DE LEAD SCORE
====================================================================

Base:
Selecionou vertical → +10
Informou cidade/estado → +15
Clicou em ver avaliações → +10
Clicou em comparar empresas → +20
Selecionou empresa específica → +25
Clicou em orçamento → +40
Clicou em WhatsApp → +40
Deixou contato com consentimento → +50

Energia Solar:
Conta até R$ 300 → +5
Conta R$ 300 a R$ 600 → +15
Conta R$ 600 a R$ 1.000 → +25
Conta R$ 1.000 a R$ 3.000 → +35
Conta acima de R$ 3.000 → +45
Quer financiamento → +20
Já tem proposta → +35
Instalar logo → +50
Manutenção → +20
Projeto comercial/rural/condomínio → +30

Mobilidade Elétrica:
Já tem carro elétrico → +35
Tem híbrido plug-in → +30
Vai comprar em breve → +25
Empresa/condomínio/frota → +40
Eletroposto → +45
Precisa avaliação técnica → +25
Instalar imediatamente → +50
Instalar em até 30 dias → +40
Tem ponto de energia preparado → +20
Não tem ponto preparado → +15

Temperatura:
0 a 29 → cold
30 a 59 → warm
60 ou mais → hot

Prioridade comercial:
Hot + cidade/estado + categoria + contato → lead pronto para orçamento
Warm + reviews/comparação → lead em consideração
Cold + pesquisa/educação → nutrir com conteúdo/reviews

====================================================================
13. REGRAS DE BUSCA E ROTEAMENTO DE EMPRESAS
====================================================================

Busca em ordem:

1. Empresas ativas da cidade exata.
2. Empresas ativas do mesmo estado.
3. Empresas da categoria com atendimento regional.
4. Empresas da vertical com categoria próxima.
5. Empresas mais bem avaliadas da vertical.
6. Se nada existir, registrar demanda.

Filtro mínimo:
- active = true
- public_profile = true
- vertical compatível
- category ou service compatível
- state compatível quando informado

Ordenação:
1. Cidade exata
2. Mesmo estado
3. Categoria exata
4. Serviço compatível
5. Empresas verificadas
6. Reviews aprovados
7. Reputação
8. Total de reviews
9. Recência das avaliações
10. Plano ativo/patrocínio, se permitido e sem manipular reviews

Regra ética:
Plano pago não pode esconder review negativo, alterar nota ou manipular reputação.

====================================================================
14. EVENTOS POSTHOG SEGUROS
====================================================================

Eventos permitidos:
- chatbot_discovery_started
- chatbot_vertical_selected
- chatbot_category_selected
- chatbot_buying_stage_selected
- chatbot_location_submitted
- chatbot_reviews_requested
- chatbot_comparison_started
- chatbot_company_selected
- chatbot_quote_requested
- chatbot_contact_submitted
- chatbot_no_company_found
- chatbot_fallback_selected

Payload permitido:
- vertical
- category
- product_or_service
- city_present boolean
- state
- buying_stage
- lead_temperature
- has_contact boolean
- wants_reviews boolean
- wants_comparison boolean
- wants_quote boolean
- company_count
- selected_company_count
- source = chatbot
- session_id, somente se não for PII

Proibido enviar:
- nome
- telefone
- e-mail
- CPF
- endereço completo
- texto livre do usuário
- comentário completo
- dados sensíveis
- proposta anexada
- qualquer PII

====================================================================
15. COMPONENTES FRONTEND SUGERIDOS
====================================================================

Componentes:
- LeadVerticalModal
- DiscoveryStartStep
- SolarLeadFlow
- ElectricMobilityLeadFlow
- UnknownNeedFlow
- ReviewsDiscoveryFlow
- CompanyComparisonDiscoveryFlow
- LeadQuoteFlow
- FreeTextDiscoveryFlow
- LeadQuestionStep
- LeadOptionButton
- LeadLocationStep
- LeadContactStep
- LeadConsentCheckbox
- LeadResultCompanies
- LeadCompanyCard
- LeadReviewsPreviewCard
- LeadComparisonTable
- LeadNoCompaniesFallback
- ReviewRedirectCard
- CategoryLinkCard
- ProductLinkCard
- ChatbotDiscoveryCTA

Requisitos UX:
- Mobile-first
- Botões grandes
- Fluxo de 3 a 6 perguntas
- Possibilidade de voltar etapa
- Barra de progresso
- Opção "não sei"
- Opção "quero explicar"
- Nunca travar o usuário
- Final sempre com próximo passo claro

====================================================================
16. SERVIÇOS BACKEND SUGERIDOS
====================================================================

Serviços:
- Chat::VerticalIntentClassifierService
- Chat::LeadProfileBuilderService
- Chat::LeadScoreService
- Chat::BuyingStageClassifierService
- Chat::CompanyMatchingService
- Chat::LeadRoutingService
- Chat::ReviewDiscoveryService
- Chat::CompanyComparisonDiscoveryService
- Chat::DynamicLinkBuilderService
- Chat::SafeAnalyticsEventService

Responsabilidades:

VerticalIntentClassifierService:
- classificar solar, mobilidade, review, comparação, orçamento, suporte ou fallback

LeadProfileBuilderService:
- montar lead_profile a partir das respostas

LeadScoreService:
- calcular lead_score e lead_temperature

CompanyMatchingService:
- buscar empresas compatíveis

ReviewDiscoveryService:
- encontrar reviews e aggregates relevantes

CompanyComparisonDiscoveryService:
- montar comparação entre empresas

DynamicLinkBuilderService:
- gerar links internos seguros sem PII

SafeAnalyticsEventService:
- enviar eventos PostHog sanitizados

====================================================================
17. RESTRIÇÕES
====================================================================

Não mexer na Fase 4.
Não quebrar SupportAgent.
Não abrir lead automaticamente para dúvida técnica.
Não enviar PII ao PostHog.
Não criar LeadSyncJob novo.
Não chamar CRM externo.
Não implementar upload de proposta agora.
Não implementar ProposalAnalyzerAgent agora.
Não implementar Claim Profile completo.
Não alterar ranking global sem feature flag.
Não permitir manipulação de reviews por plano pago.
Não enviar texto livre em URL.
Não salvar contato sem LGPD.
Não executar código agora.
Não fazer commit.
Não fazer push.

====================================================================
18. FEATURE FLAGS SUGERIDAS
====================================================================

Criar/planejar flags:
- smart_discovery_modal_enabled default false
- vertical_lead_flow_enabled default false
- reviews_discovery_flow_enabled default false
- company_comparison_discovery_enabled default false
- chatbot_dynamic_links_enabled default false
- chatbot_quote_capture_enabled default false

Todas devem permitir rollback rápido.

====================================================================
19. CRITÉRIOS DE ACEITE
====================================================================

O plano deve garantir que:

1. O chatbot consegue iniciar discovery por botões.
2. O modal muda conforme vertical.
3. Energia Solar tem perguntas próprias.
4. Mobilidade Elétrica tem perguntas próprias.
5. Usuário indefinido consegue explicar em texto curto.
6. O sistema monta lead_profile estruturado.
7. O sistema calcula lead_score e lead_temperature.
8. O sistema busca empresas por cidade, estado, categoria e produto/serviço.
9. O sistema mostra reviews antes do orçamento.
10. O sistema permite comparar avaliações.
11. O sistema gera links internos dinâmicos e seguros.
12. O sistema captura contato apenas com consentimento LGPD.
13. O sistema tem fallback quando não há empresas.
14. Nenhum PII vai para PostHog.
15. Nenhum dado sensível vai para URL.
16. Dúvida técnica continua no SupportAgent.
17. O fluxo é mobile-first.
18. Há feature flags para rollback.
19. A execução é incremental.
20. Não quebra a Fase 4.

====================================================================
20. ENTREGÁVEL ESPERADO
====================================================================

Gerar um documento Markdown com:

1. Visão geral da Fase 5.1
2. Fluxo completo do chatbot
3. Fluxo Solar completo
4. Fluxo Mobilidade Elétrica completo
5. Fluxo Indefinido/Livre
6. Fluxo de busca por reviews
7. Fluxo de comparação de avaliações
8. Fluxo de orçamento
9. Mapeamento de perguntas e respostas
10. Mapeamento de lead_profile
11. Regras de lead_score
12. Regras de lead_temperature
13. Regras de roteamento para empresas
14. Regras de links internos dinâmicos
15. Regras de fallback
16. Componentes frontend
17. Serviços backend
18. Eventos PostHog seguros
19. Feature flags
20. Riscos
21. Critérios de aceite
22. Plano incremental de implementação

Plano incremental sugerido:

Wave 2A.1 — Discovery schema e lead_profile
Wave 2A.2 — Modal frontend com fluxos por vertical
Wave 2A.3 — CompanyMatchingService + ReviewDiscoveryService
Wave 2A.4 — Comparação de avaliações no chatbot
Wave 2A.5 — Captura de contato com LGPD
Wave 2A.6 — Links internos dinâmicos
Wave 2A.7 — PostHog seguro e testes focados

Não implementar nada.
Apenas discutir, consolidar e planejar."
```
 implementar melhoria UI do bloco de categorias da home do Avalia Solar.

Objetivo:
Transformar a seção atual de categorias da home em um carrossel horizontal moderno, mantendo o mesmo tamanho/altura visual atual, porém permitindo que cada categoria tenha um banner/imagem próprio configurável via upload no Active Admin.

Contexto:
Hoje a home exibe cards de categorias em linha, com ícone, nome e seta. Quero manter a mesma área visual, mas melhorar a apresentação como carrossel. Não quero banner de propaganda externo/azul por enquanto. Quero apenas o carrossel de categorias, usando assets enviados pelo admin.

Escopo permitido:
- UI do carrossel de categorias na home;
- upload/configuração de imagem/banner da categoria no Active Admin;
- exibição da imagem/banner no card da categoria;
- navegação horizontal com setas;
- responsividade desktop/mobile;
- fallback quando categoria não tiver banner.

Não implementar banner publicitário externo agora.
Não criar área de ads.
Não mexer em chatbot.
Não mexer em ranking.
Não mexer na Fase 4.
Não alterar lógica de leads.

1. Active Admin / Category

Na tela de edição/criação de categorias, dentro da seção Assets, adicionar/configurar um campo específico para o banner do carrossel da home.

Campo desejado:
- carousel_banner ou home_carousel_banner

Objetivo:
Permitir upload de uma imagem/banner para ser exibido no carrossel de categorias da home.

A tela de admin deve ficar com:
- Icon
- Banner
- Carousel Banner / Home Carousel Banner

O novo campo deve ser claro para o admin, com hint:
“Imagem usada no carrossel de categorias da home. Recomendada proporção horizontal/card.”

2. Home — Carrossel de Categorias

Substituir a listagem estática atual por um carrossel horizontal.

Manter:
- mesma largura geral da seção;
- mesma altura aproximada dos cards atuais;
- estilo clean/premium;
- bordas arredondadas;
- sombra suave;
- espaçamento consistente;
- seta lateral para avançar/voltar;
- categoria ativa/featured primeiro.

Cada card deve exibir:
- imagem/banner da categoria, se houver;
- label “Categoria”;
- nome da categoria;
- seta/ícone de navegação;
- hover state;
- clique levando para a página/listagem da categoria.

Exemplo de card:
[imagem/banner pequena à esquerda ou fundo suave]
Categoria
Carregadores Residenciais / Wallbox
→

3. Layout visual

Desktop:
- carrossel em linha horizontal;
- 3 a 4 cards visíveis;
- setas laterais;
- indicadores/dots opcionais;
- altura semelhante à seção atual;
- sem ocupar mais espaço vertical.

Mobile:
- scroll horizontal com snap;
- cards maiores por toque;
- setas podem sumir e usar swipe;
- sem overflow horizontal da página.

4. Fallback

Se a categoria não tiver carousel_banner:
- usar icon atual;
- ou usar banner padrão gerado pelo design system;
- nunca quebrar layout;
- nunca mostrar imagem quebrada.

5. Ordenação

Exibir primeiro:
1. categorias featured;
2. categorias active;
3. categorias com banner;
4. demais categorias.

Não exibir categorias inactive.

6. Performance

- usar lazy loading nas imagens;
- definir sizes adequados;
- evitar layout shift;
- usar alt text com nome da categoria;
- otimizar imagem conforme stack atual.

7. Feature flag

Proteger com feature flag:
home_category_carousel_enabled default false

Se a flag estiver desligada, manter a seção atual.

8. Critérios de aceite

- Active Admin permite upload do banner do carrossel da categoria;
- novo campo aparece em Assets;
- imagem salva corretamente;
- home exibe categorias em carrossel;
- carrossel mantém tamanho visual parecido com o atual;
- não aparece banner de propaganda externo;
- cards usam imagem da categoria quando existir;
- fallback funciona quando não houver imagem;
- desktop mostra carrossel com setas;
- mobile permite swipe sem overflow;
- categorias inactive não aparecem;
- featured aparecem primeiro;
- clique no card leva para a categoria correta;
- feature flag permite rollback;
- não quebra seção “Como o Avalia Solar funciona?”;
- não mexe em chatbot;
- não mexe em backend fora do necessário para o asset;
- não mexe na Fase 4.

9. Entregável

Criar plano e depois executar de forma incremental:
1. verificar modelo Category e sistema atual de upload;
2. adicionar campo de asset para carousel_banner/home_carousel_banner;
3. atualizar Active Admin Category;
4. atualizar serializer/API se necessário;
5. criar componente HomeCategoryCarousel;
6. substituir seção atual atrás da feature flag;
7. aplicar responsividade;
8. validar fallback;
9. testar admin upload e home.

Antes de implementar, verificar como Icon e Banner já são tratados no modelo Category para seguir o mesmo padrão existente.