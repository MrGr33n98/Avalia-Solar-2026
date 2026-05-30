# 📅 Backlog de Automações Operacionais: Hermes Agent

Este backlog organiza por prioridade (de P0 a P3) as automações e integrações cognitivas orquestradas pelo **Hermes Agent** para impulsionar a operação e RevOps do **Avalia Solar & Mobilidade Elétrica**.

---

## 🛑 Prioridade P0: Core Operacional, Segurança e Compliance

Automações fundamentais de infraestrutura jurídica, saneamento cadastral primário e governança técnica de dados.

### 1. Sistema de Validação de CNPJ, Deduplicação e Ingestão B2B
*   **Objetivo**: Garantir dados limpos no banco de dados e no Nutshell CRM desde o primeiro contato, evitando dados incorretos ou duplicações operacionais.
*   **Gatilho**: Evento `signup_started` ou `company_registered` emitido no site.
*   **Ação Hermes**: Consome a API de CNPJ para validar a existência da empresa; consulta o banco de dados interno e o Nutshell CRM por CNPJ/E-mail duplicados; mescla se existente ou cria novo lead com dados estruturados.
*   **Sistemas Integrados**: Site/App, Banco de Dados, Nutshell CRM, API Externa de CNPJ.
*   **Dependência Técnica**: Chaves de API de CNPJ e conexão Nutshell RPC ativas.
*   **Risco**: Médio (Instabilidade temporária da API de consulta).
*   **Métrica de Sucesso**: 100% de cadastros sanitizados sem duplicações ativas.

### 2. Anonimização LGPD e Descadastro Automático (Opt-Out)
*   **Objetivo**: Respeitar a legislação de proteção de dados e manter a integridade jurídica da marca em tempo real.
*   **Gatilho**: Identificação de intenção de descadastro em e-mails (`email_received`) ou mensagens sociais.
*   **Ação Hermes**: Executa o script de anonimização no banco de dados; remove contatos de todas as listas de marketing ativas no CRM; encerra sequências de e-mails em andamento e loga a ação técnica de conformidade.
*   **Sistemas Integrados**: Banco de Dados, Nutshell CRM, Servidor SMTP/Gmail.
*   **Dependência Técnica**: Parser semântico de e-mails ativado por modelo NLP.
*   **Risco**: Alto (Falha em remover o lead pode resultar em multas de compliance).
*   **Métrica de Sucesso**: Opt-out processado em menos de 10 segundos da recepção.

### 3. Validação de JSON Schema e Central de Logs de Auditoria
*   **Objetivo**: Assegurar a consistência estrutural dos dados de tráfego e comportamento antes do processamento e analytics.
*   **Gatilho**: Ingestão de qualquer evento de dados no barramento do Hermes.
*   **Ação Hermes**: Valida se o payload recebido atende ao esquema de dados mínimo; grava o log de auditoria técnica; redireciona transações com erros para sandbox técnica.
*   **Sistemas Integrados**: Data Lake, Barramento de Eventos, Central de Logs.
*   **Dependência Técnica**: Estruturas de JSON Schema consolidadas na aplicação.
*   **Risco**: Baixo.
*   **Métrica de Sucesso**: 100% dos dados consistentes com schema validados.

---

## ⚡ Prioridade P1: Conversão, Faturamento e Atendimento

Automações focadas diretamente em impulsionar a conversão comercial, cobrança automatizada e rascunhos consultivos para leads.

### 1. Faturamento Stripe, Ativação Premium e Onboarding SaaS
*   **Objetivo**: Automatizar a ativação de planos pagos do Avalia Solar (B2B Solar/Mobilidade) e iniciar a experiência do cliente sem fricção.
*   **Gatilho**: Recebimento do webhook do Stripe `payment_succeeded`.
*   **Ação Hermes**: Atualiza a assinatura premium do integrador no banco de dados; move a oportunidade no CRM para "Fechado Ganho"; dispara e-mail de boas-vindas customizado com o guia de onboarding.
*   **Sistemas Integrados**: Stripe, Banco de Dados, Nutshell CRM, Gmail SMTP, Slack.
*   **Dependência Técnica**: Endpoint seguro de webhook Stripe e chaves configuradas.
*   **Risco**: Alto (Falha de faturamento ou ativação gera reclamações sérias de clientes).
*   **Métrica de Sucesso**: Ativação premium concluída em menos de 5 segundos do pagamento.

### 2. Triagem e Inbox Classifier de E-mails Corporativos (Gmail)
*   **Objetivo**: Processar, priorizar e redigir automaticamente rascunhos para todas as mensagens comerciais recebidas.
*   **Gatilho**: Recepção de nova mensagem corporativa no Gmail corporativo.
*   **Ação Hermes**: Classifica a intenção (Lead B2B, Suporte, Jurídico, Cancelamento); se for comercial, gera um rascunho de resposta contextualizada com IA, notifica o Slack e cria tarefa no CRM.
*   **Sistemas Integrados**: Gmail SMTP/IMAP, Nutshell CRM, OpenAI API, Slack.
*   **Dependência Técnica**: Modelos LLM e integrador IMAP configurados.
*   **Risco**: Médio (IA pode redigir rascunho com tom inapropriado).
*   **Métrica de Sucesso**: 85% de redução de esforço de redação manual no suporte/vendas.

### 3. Cadência Inteligente de Follow-up Comercial B2B
*   **Objetivo**: Manter contato ativo com leads frios ou sem resposta, direcionando-os à conversão de forma humanizada.
*   **Gatilho**: Lead em fase de negociação/prospecção sem retorno em D+1, D+3, D+7.
*   **Ação Hermes**: Dispara sequência personalizada de e-mails baseada na dor informada; encerra a cadência e arquiva o lead se o limite for atingido sem respostas.
*   **Sistemas Integrados**: Nutshell CRM, Gmail SMTP.
*   **Dependência Técnica**: Regras de transição de fase ativas no Nutshell CRM.
*   **Risco**: Médio (Spam rate se a cadência for muito invasiva).
*   **Métrica de Sucesso**: Aumento de 20% na taxa de resposta outbound.

---

## 📈 Prioridade P2: Prospecção Social, CS e Escuta Ativa

Automações focadas no crescimento do ecossistema e proteção da base de clientes ativos contra inatividade.

### 1. Monitoramento de Inatividade e Prevenção de Churn (CS)
*   **Objetivo**: Reter clientes premium identificando ausência de login ou uso da plataforma antes que ocorra a intenção de cancelamento.
*   **Gatilho**: Log diário aponta integrador premium inativo há 30 dias.
*   **Ação Hermes**: Calcula o score de risco de churn; envia e-mail estratégico automatizado com novas oportunidades locais; se o risco for crítico, cria card urgente no Slack do CS.
*   **Sistemas Integrados**: Banco de Dados, Gmail, Slack, CRM.
*   **Dependência Técnica**: Rastreamento correto de eventos de login e uso no front/back do site.
*   **Risco**: Médio (Reengajamento ineficiente se a oferta de valor for fraca).
*   **Métrica de Sucesso**: Redução de 15% na taxa de churn mensal.

### 2. Instagram Social Listening e Resposta Inbound por Palavras-Chave
*   **Objetivo**: Capturar menções, comentários e DMs contendo termos chave (ex: "SOLAR", "ELÉTRICO") e iniciar fluxos de prospecção instantaneamente.
*   **Gatilho**: DM recebida ou comentário contendo palavra-chave.
*   **Ação Hermes**: Classifica a intenção por IA; responde imediatamente com o link da plataforma e guia o decisor para o cadastro ou orçamento; cria lead no CRM.
*   **Sistemas Integrados**: Meta Instagram API, Nutshell CRM, Slack.
*   **Dependência Técnica**: Validação da conta corporativa e credenciais da Meta Developer.
*   **Risco**: Médio (Bloqueios de SPAM pelas diretrizes de API do Instagram).
*   **Métrica de Sucesso**: Resposta inicial enviada em menos de 1 minuto da interação.

### 3. Prospecção LinkedIn Regional Automatizada
*   **Objetivo**: Abordar decisores de integradoras solares e empresas de mobilidade nas 34 cidades brasileiras homologadas (>500k habitantes).
*   **Gatilho**: Ingestão de leads qualificados localmente em lote.
*   **Ação Hermes**: Gera mensagens de abordagem customizadas de acordo com o potencial solar/mobilidade local da cidade do decisor; envia convite de conexão.
*   **Sistemas Integrados**: Smartlead / LinkedIn API, Prospeo, CRM.
*   **Dependência Técnica**: Limite de envios configurado por dia para segurança da conta.
*   **Risco**: Alto (Risco de restrição/bloqueio da conta do LinkedIn se não houver governança).
*   **Métrica de Sucesso**: Taxa de conversão de lead frio em reunião agendada >= 5%.

---

## 🎨 Prioridade P3: Conteúdo Automatizado, SEO e Distribuição

Automações focadas no ganho de autoridade digital a longo prazo, otimizando o rankeamento em motores de busca.

### 1. Geração de Conteúdo Localizado de Alta Performance para SEO
*   **Objetivo**: Publicar páginas de alta performance no blog do Avalia Solar com base em dados de termos populares de pesquisa nas cidades brasileiras prioritárias.
*   **Gatilho**: Agenda semanal automatizada de SEO.
*   **Ação Hermes**: Coleta keywords relevantes pelo Google Search Console; redige rascunho completo de artigo de blog direcionado para cidades prioritárias; envia para revisão de marketing no Slack.
*   **Sistemas Integrados**: Google Search Console API, WordPress CMS, OpenAI API, Slack.
*   **Dependência Técnica**: Prompt engineering avançado e conexão REST com WordPress ativa.
*   **Risco**: Baixo (Geração de conteúdo muito genérico sem supervisão humana).
*   **Métrica de Sucesso**: Artigos posicionados na primeira página do Google em 90 dias.

### 2. Distribuição Automatizada nas Redes Sociais
*   **Objetivo**: Multiplicar o alcance de artigos de blog recém-publicados nas redes corporativas (LinkedIn e Instagram).
*   **Gatilho**: Artigo publicado com sucesso no CMS WordPress.
*   **Ação Hermes**: Gera a copy adaptada para redes sociais; agenda e dispara postagem automática nas contas oficiais do Avalia Solar.
*   **Sistemas Integrados**: WordPress CMS, LinkedIn API, Instagram Graph API.
*   **Dependência Técnica**: Integração OAuth2 com redes corporativas.
*   **Risco**: Baixo.
*   **Métrica de Sucesso**: Aumento de 30% no tráfego social referenciado para o blog.
