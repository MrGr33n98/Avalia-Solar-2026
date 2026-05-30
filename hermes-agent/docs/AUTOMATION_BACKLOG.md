# 📅 Backlog de Automações Operacionais: Hermes Agent

Este backlog organiza por prioridade (de P0 a P3) as automações e integrações cognitivas orquestradas pelo **Hermes Agent** para impulsionar a operação e RevOps do **Avalia Solar & Mobilidade Elétrica**, unindo fluxos tradicionais com as tabelas e lógicas do backend Rails real.

---

## 🛑 Prioridade P0: Core Operacional, Segurança, Governança e Compliance

Automações fundamentais de infraestrutura jurídica, saneamento cadastral, governança técnica e moderação sensível.

### 1. Sistema de Validação de CNPJ, Deduplicação e Ingestão B2B
*   **Objetivo**: Garantir dados limpos no banco de dados e no Nutshell CRM desde o primeiro contato, evitando dados incorretos ou duplicações operacionais.
*   **Gatilho**: Evento `signup_started` ou `company_registered` emitido no site.
*   **Ação Hermes**: Consome a API de CNPJ para validar a existência da empresa; consulta o banco de dados interno e o Nutshell CRM por CNPJ/E-mail duplicados; mescla se existente ou cria novo lead com dados estruturados.
*   **Sistemas Integrados**: Site/App, Banco de Dados, Nutshell CRM, API Externa de CNPJ.
*   **Métrica de Sucesso**: 100% de cadastros sanitizados sem duplicações ativas.

### 2. Moderação Preventiva de Perfis Premium B2B (`pending_changes`)
*   **Objetivo**: Reter e auditar de forma segura alterações feitas por empresas premium antes que reflitam publicamente no portal.
*   **Gatilho**: Inserção de registro de edição de perfil na tabela `pending_changes` do PostgreSQL.
*   **Ação Hermes**: Retém as alterações na fila temporária, monta um card visual interativo comparativo de dados editados no Slack do Moderador e aguarda a decisão humana.
*   **Sistemas Integrados**: Banco de Dados PostgreSQL, Slack Canais.
*   **Métrica de Sucesso**: Tempo médio de moderação inferior a 30 minutos em dias úteis.

### 3. Anonimização LGPD e Descadastro Automático (Opt-Out)
*   **Objetivo**: Respeitar a legislação de proteção de dados e manter a integridade jurídica da marca em tempo real.
*   **Gatilho**: Identificação de intenção de descadastro em e-mails (`email_received`) ou mensagens sociais.
*   **Ação Hermes**: Executa o script de anonimização no banco de dados; remove contatos de todas as listas de marketing ativas no CRM; encerra sequências de e-mails em andamento e loga a ação técnica de conformidade.
*   **Sistemas Integrados**: Banco de Dados, Nutshell CRM, Servidor SMTP/Gmail.
*   **Métrica de Sucesso**: Opt-out processado em menos de 10 segundos da recepção.

### 4. Validação de JSON Schema, Auditoria e Estornos Stripe
*   **Objetivo**: Assegurar a consistência estrutural dos dados de tráfego e travar privilégios premium preventivamente em caso de estornos.
*   **Gatilho**: Webhook do Stripe `payment_failed` ou disputas registradas.
*   **Ação Hermes**: Trava preventivamente os privilégios da empresa no BD Rails, gera alerta crítico no Slack e envia card de estorno/disputa para a equipe financeira humana.
*   **Sistemas Integrados**: Stripe Webhooks, Banco de Dados, Slack, Nutshell.
*   **Métrica de Sucesso**: Zero perdas de controle de estornos no faturamento recorrente.

---

## ⚡ Prioridade P1: Conversão, Faturamento, Reivindicações e Atribuição

Automações focadas em impulsionar a conversão comercial direta, processamento de reivindicações de integradores e atribuição ponderada de leads.

### 1. Faturamento Stripe, Ativação Premium e Onboarding SaaS
*   **Objetivo**: Automatizar a ativação de planos pagos do Avalia Solar (B2B Solar/Mobilidade) e iniciar a experiência do cliente sem fricção.
*   **Gatilho**: Recebimento do webhook do Stripe `payment_succeeded`.
*   **Ação Hermes**: Atualiza a assinatura premium do integrador no banco de dados; move a oportunidade no CRM para "Fechado Ganho"; dispara e-mail de boas-vindas customizado com o guia de onboarding.
*   **Sistemas Integrados**: Stripe, Banco de Dados, Nutshell CRM, Gmail SMTP, Slack.
*   **Métrica de Sucesso**: Ativação premium concluída em menos de 5 segundos do pagamento.

### 2. Fluxo de Reivindicação de Perfis Integradores (`company_access_requests`)
*   **Objetivo**: Automatizar e validar de forma veloz a reivindicação de páginas de empresas pré-cadastradas no portal.
*   **Gatilho**: Criação de registro na tabela `company_access_requests`.
*   **Ação Hermes**: Compara o domínio do e-mail do solicitante com o website cadastrado da integradora. Se coincidir, libera a chave provisória e notifica por e-mail; se houver divergência, aciona auditoria no Slack.
*   **Sistemas Integrados**: Site BD, Gmail SMTP, Slack, Nutshell CRM.
*   **Métrica de Sucesso**: Liberação automática segura em 100% de domínios validados em menos de 2 minutos.

### 3. Distribuição Ponderada de Leads (`lead_distributions`)
*   **Objetivo**: Rotear leads de cotação B2C de forma otimizada para os integradores premium da região correspondente.
*   **Gatilho**: Evento `quote_requested` validado.
*   **Ação Hermes**: Consulta integradores parceiros ativos da cidade no banco, gera a distribuição na tabela `lead_distributions`, envia o payload de notificação para o integrador e inicia o monitoramento de SLA de resposta no CRM.
*   **Sistemas Integrados**: Banco de Dados Rails, Nutshell CRM, Slack.
*   **Métrica de Sucesso**: SLA médio de atribuição inferior a 5 minutos.

---

## 📈 Prioridade P2: Prospecção Social, CS, Simulador de Crédito e Fórum

Automações focadas em escalar a atração outbound de leads, retenção contra churn, simulação de parcelamentos e engajamento da comunidade do fórum.

### 1. Simulador de Crédito e Financiamento Solar (`company_financing_profiles`)
*   **Objetivo**: Converter simulações de parcelamentos em leads altamente qualificados de alto ticket para integradores locais e bancos parceiros.
*   **Gatilho**: Início de simulação B2C no hub de financiamentos do portal.
*   **Ação Hermes**: Captura os dados energéticos, calcula a viabilidade econômica pelas configurações da base de dados e envia a proposta aos bancos parceiros (`SYS_Banks`); gera o lead qualificado "Financiamento" no CRM.
*   **Sistemas Integrados**: Site Financeiro, APIs Bancos Parceiros, Nutshell CRM, Slack.
*   **Métrica de Sucesso**: Volume de propostas de financiamento geradas por mês.

### 2. Triagem e Roteamento de Perguntas do Fórum (`forum_questions`)
*   **Objetivo**: Capturar e triar dúvidas técnicas de consumidores finais e transformá-las em ganchos comerciais de atração para integradores locais.
*   **Gatilho**: Evento `forum_question_submitted` registrado no banco.
*   **Ação Hermes**: Classifica a intenção com IA. Se comercial, seleciona 3 empresas próximas e notifica no Slack delas gerando lead no CRM; se dúvida genérica, sugere rascunho de resposta baseado no FAQ.
*   **Sistemas Integrados**: Banco de Dados, Nutshell CRM, Slack, Gmail.
*   **Métrica de Sucesso**: Tempo de resposta de perguntas no fórum inferior a 30 minutos.

### 3. Monitoramento de Inatividade e Prevenção de Churn (CS)
*   **Objetivo**: Reter clientes premium identificando ausência de login ou uso da plataforma antes que ocorra a intenção de cancelamento.
*   **Gatilho**: Log diário aponta integrador premium inativo há 30 dias.
*   **Ação Hermes**: Calcula o score de risco de churn; envia e-mail estratégico automatizado com novas oportunidades locais; se o risco for crítico, cria card urgente no Slack do CS.
*   **Sistemas Integrados**: Banco de Dados, Gmail, Slack, CRM.
*   **Métrica de Sucesso**: Redução de 15% na taxa de churn de CS mensal.

---

## 🎨 Prioridade P3: Conteúdo, SEO, Campanhas de Reviews e ROI de Banners

Automações de atração de tráfego orgânico a longo prazo, captura de social proof em lote e mensuração de relatórios de publicidade.

### 1. Campanhas em Massa de Captura de Reviews B2B (`campaign_reviews`)
*   **Objetivo**: Apoiar integradores premium a impulsionarem sua nota e reputação no portal Avalia Solar enviando pedidos de recomendações para seus clientes antigos.
*   **Gatilho**: Integrador premium cria campanha no Nutshell/Painel.
*   **Ação Hermes**: Extrai a lista de contatos, dispara sequências programadas personalizadas por Gmail SMTP e WhatsApp, compila os links de avaliações e atualiza a tabela `campaign_reviews`.
*   **Sistemas Integrados**: Nutshell CRM, Gmail SMTP, WhatsApp API, BD.
*   **Métrica de Sucesso**: Aumento de 30% na taxa de reviews coletados no portal.

### 2. Monitoramento de Performance e ROI de Banners B2B
*   **Objetivo**: Fornecer aos distribuidores relatórios consolidados em tempo real de cliques e conversões de seus anúncios no portal.
*   **Gatilho**: Evento `banner_clicked` registrado no banco de dados.
*   **Ação Hermes**: Incrementa os dados consolidados, calcula o CTR e CPC por distribuidor, gera o relatório de ROI semanal e o envia diretamente ao distribuidor no Nutshell e por e-mail.
*   **Sistemas Integrados**: Banners BD, Nutshell CRM, Gmail.
*   **Métrica de Sucesso**: Retenção de assinantes de banners publicitários (%).
