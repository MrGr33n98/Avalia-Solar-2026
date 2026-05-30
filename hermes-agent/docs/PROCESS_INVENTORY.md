# 📋 Inventário de Processos Operacionais: Avalia Solar & Mobilidade Elétrica

Este inventário apresenta todas as atividades operacionais mapeadas para o **Avalia Solar & Mobilidade Elétrica**. Ele serve como um catálogo de processos para auditoria, governança e orquestração de desenvolvimento de software e IA.

---

## 📊 Tabela Geral de Processos

| ID | Nome do Processo | Área | Dono | Gatilho | Entrada | Saída | Sistemas Envolvidos | Tipo | Risco | Métrica Principal (KPI) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CE-01** | Cadastro e Validação CNPJ | Cadastro B2B | Operações | Novo cadastro no site | CNPJ e dados básicos | CNPJ validado e lead salvo | Site, BD, API CNPJ, Nutshell | Automático | Médio | Tempo de Validação (< 10s) |
| **CE-02** | Lead Scoring Inicial B2B | Comercial | RevOps | Saneamento concluído | Dados da empresa e local | Score do lead de 0 a 100 | Banco de Dados, CRM | Automático | Baixo | Acurácia do Score (%) |
| **CU-01** | Cadastro de Usuários B2C | Cadastro B2C | Suporte | Novo usuário no site | Nome, e-mail, senha | Conta B2C ativa no banco | Site, Banco de Dados | Automático | Baixo | Taxa de Conversão Cadastro (%) |
| **CU-02** | Sugestão de Orçamentos | Comercial | Vendas | Solicitação de orçamento B2C | Demanda B2C e localização | Empresas sugeridas via e-mail | Site, Banco de Dados, Gmail | Automático | Médio | CTR de orçamentos aceitos (%) |
| **LK-01** | Enriquecimento Outbound | Growth | Marketing | Lead frio sinalizado | Nome e empresa no LinkedIn | CNPJ, e-mail e cargo do lead | Prospeo, LinkedIn, CRM | Automático | Médio | Taxa de Enriquecimento OK (%) |
| **LK-02** | Abordagem LinkedIn | Growth | Marketing | Lead score >= 70 | Dados enriquecidos do decisor | Convite + DM customizada | LinkedIn API (Smartlead), CRM | Híbrido | Alto | Taxa de Aceitação de Convite (%) |
| **IG-01** | Instagram Inbound Triager | Growth | Marketing | Comentário/DM recebidos | Texto da mensagem | Resposta e lead no CRM | Meta Instagram API, CRM | Automático | Médio | Tempo de Resposta (< 5 min) |
| **GM-01** | Classificação de Entrada Gmail | Operações | TI | Novo e-mail na caixa | Conteúdo do e-mail corporativo | Mensagem categorizada e log | Gmail IMAP, OpenAI API, CRM | Automático | Médio | Precisão da Classificação (%) |
| **GM-02** | Rascunho Cognitivo Gmail | Comercial | Vendas | E-mail categorizado "Lead" | Histórico do lead no CRM | Rascunho de resposta criado | Gmail SMTP, Nutshell CRM | Automático | Médio | Rascunhos aprovados sem edições |
| **FU-01** | Cadência de Follow-up B2B | Comercial | Vendas | Lead sem retorno no Nutshell | Sequência temporal programada | E-mail de follow-up enviado | Gmail SMTP, Nutshell CRM | Automático | Baixo | Taxa de Resposta de Follow-up |
| **ST-01** | Checkout Stripe e Ativação | Financeiro | Operações | Transação Stripe confirmada | Evento de webhook de pagamento | Conta premium ativa e NFe | Stripe, BD, Nutshell, Slack | Automático | Alto | Sucesso de Faturamento (%) |
| **ST-02** | Carrinho SaaS Abandonado | Financeiro | Vendas | Carrinho abandonado Stripe | E-mail do checkout iniciado | Fluxo de e-mail de recuperação | Stripe, Gmail SMTP, CRM | Automático | Baixo | Taxa de Recuperação de SaaS (%) |
| **RT-01** | Monitoramento de Inatividade | CS | CS | Cron diário de acessos | Logins e dados de uso premium | Alerta de CS ou e-mail enviado | Banco de Dados, Slack, Gmail | Automático | Médio | Redução de Churn Prematuro (%) |
| **RT-02** | Resgate CS Humano | CS | CS | Alerta crítico de inatividade | Lead com risco alto de churn | Cliente reengajado ou retido | Slack, Telefone, Nutshell | Humano | Alto | Taxa de Retenção de CS (%) |
| **RV-01** | Triagem de Sentimento Reviews | Reputação | CS | Review submetido por B2C | Texto e estrelas do review | Sentimento e publicação | Site, BD, OpenAI API, Slack | Automático | Médio | NPS do Avalia Solar |
| **RV-02** | Contenção de Review Ruim | Reputação | CS | Review recebido < 4 estrelas | Alerta crítico e review oculto | Contato humano e negociação | Slack, Nutshell CRM, Suporte | Humano | Alto | Reviews revertidos / resolvidos |
| **SEO-01** | Geração Conteúdo Local | Growth | Marketing | Gatilho semanal de SEO | Palavras-chaves GSC e Cidades | Rascunho de post de blog | GSC API, OpenAI, WordPress | Automático | Médio | Posição Média de Rank (SEO) |
| **SEO-02** | Aprovação e Distribuição Blog | Growth | Marketing | Rascunho de SEO gerado | Texto do post no WordPress | Artigo publicado e compartilhado | WordPress CMS, Redes Sociais | Híbrido | Baixo | Cliques orgânicos mensais |
| **CRM-01** | Monitoramento SLA CRM | RevOps | Operações | Novo lead registrado | Hora de criação e atual | Alerta Slack se tempo estourar | Nutshell CRM, Slack | Automático | Médio | SLA de Primeiro Contato (< 1h) |
| **DA-01** | Auditoria LGPD e Opt-Out | Governança | TI | Solicitação de Opt-Out/LGPD | E-mail ou texto do contato | Dados limpos e log de auditoria | Banco de Dados, CRM, Gmail | Automático | Alto | Conformidade com Regulamento (%) |
| **AP-01** | Gate de Ação Sensível | Governança | Operações | Ação sensível acionada | Dados da transação (ex. disparo) | Aprovação gravada e executada | Slack, Banco de Dados, CRM | Híbrido | Alto | Tempo de Aprovação Humana (min) |
| **I-01** | Deliverability DNS Audit | Infra | TI | Cron diário de e-mails | Registros SPF/DKIM e Bounce | Status OK ou bloqueio preventivo | Servidor SMTP, DNS, Slack | Automático | Alto | Entregabilidade de E-mail (%) |

---

## ⚠️ Análise de Níveis de Risco Operacional

1.  **Risco Baixo**: Processos internos de coleta e armazenamento passivo que não interagem de forma externa com o cliente final (ex: *CU-01 - Cadastro de Usuários B2C*).
2.  **Risco Médio**: Processos com automação de envio de mensagens baseadas em modelos padronizados, ou rotinas de enriquecimento cadastral público (ex: *CE-01 - Cadastro e Validação CNPJ*).
3.  **Risco Alto**: Processos que envolvem processamento de dados confidenciais (Stripe), e-mails críticos de compliance (LGPD/Opt-Out), abordagens ativas que podem queimar a reputação do domínio (Prospecção LinkedIn) ou contenção de danos em crises de clientes (Reviews Negativos). Exigem maior volume de portões humanos de validação.
