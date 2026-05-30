# 📊 Especificação Técnica: Dashboard Geral de RevOps — Hermes Agent

Este documento descreve a especificação técnica de arquitetura de dados e visualização do **Dashboard Geral de RevOps** do Avalia Solar. O painel unifica métricas agregadas do **Nutshell CRM, Stripe, Google Search Console, WordPress e logs do Hermes Agent**, permitindo que o Solo Operator tenha uma visão integrada da performance de atração, conversão, retenção e infraestrutura.

---

## 📈 Tabela Detalhada de Especificação de Métricas

| Métrica | Fonte de Dados | Fórmula Matemática Exata | Frequência | Gatilho de Alerta no Slack | Responsável | Ação de Negócios / Decisão Orientada |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Receita Recorrente Mensal (MRR)** | Stripe API | `MRR = Somatório (Valor de todas as assinaturas SaaS ativas mensalizadas)` | Semanal / Mensal | MRR cair abaixo da meta ou queda > 5% no mês. | Direção | Redefinir meta de vendas B2B, recalcular pricing dos planos ou intensificar outbound. |
| **Custo de Aquisição de Clientes (CAC)** | Stripe, Nutshell, Logs de Prospecção | `CAC = (Custo Total de Marketing + Custo Infra de Prospecção) / Novos Assinantes` | Mensal | CAC ultrapassar o Lifetime Value da conta (LTV/CAC < 3). | Growth | Otimizar campanhas de tráfego, pausar canais caros ou aumentar a automatização do Hermes. |
| **Taxa de Conversão Cadastro B2B** | Site BD, Nutshell CRM | `Conversão = (Integradores Ativados / Cadastros Iniciados) * 100` | Diário / Semanal | Taxa de ativação de cadastro B2B cair abaixo de 70% na semana. | Operações | Identificar gargalos no fluxo de validação de CNPJ ou simplificar formulário de cadastro. |
| **Tempo de Resposta a Leads (SLA)** | Nutshell CRM, Logs Gmail | `SLA = Média (Hora de Criação do Lead - Hora do Primeiro Contato Humano)` | Diário | Lead quente sem resposta por mais de 2 horas em dias úteis. | Vendas | Priorizar leads pendentes ou remanejar a responsabilidade comercial de primeiro contato. |
| **Churn Rate Mensal** | Stripe Webhooks | `Churn = (Contas Canceladas no Mês / Total de Contas no Início do Mês) * 100` | Mensal | Churn ultrapassar 4.5% no fechamento mensal. | Customer Success | Lançar plano de contenção de danos, revisar propostas de valor ou realizar auditoria de satisfação. |
| **Índice de Clientes Premium Inativos** | Site logs (Banco de Dados) | `Inativos = (Premium sem login nos últimos 30 dias / Total de Premium) * 100` | Diário | Índice de integradores premium inativos ultrapassar 15% da base. | Customer Success | Acionar preventivamente o time de CS para suporte consultivo ou disparar automação de reengajamento. |
| **Taxa de Aceitação LinkedIn** | Smartlead API, Logs Hermes | `Aceitação = (Convites Aceitos / Convites Enviados pelo Hermes) * 100` | Semanal | Taxa de aceitação no LinkedIn cair abaixo de 20%. | Marketing | Revisar os templates de copy gerados por IA, reajustar ICP ou testar novos ganchos regionais. |
| **Volume de Orçamentos Gerados (B2C)**| Site BD (quote_requested) | `Orçamentos = Contagem total de solicitações B2C no período` | Semanal | Queda de mais de 25% em orçamentos gerados em relação à semana anterior. | Growth | Aumentar investimentos em anúncios locais B2C ou otimizar fluxo de solicitação no front. |
| **Artigos Publicados (SEO)** | WordPress Rest API | `Artigos = Contagem total de posts novos publicados no blog` | Semanal | Zero artigos publicados no fechamento da semana operacional. | Marketing | Revisar a fila de pauta gerada pelo Hermes, auditar fila de aprovação ou repensar temas locais. |
| **Bounce Rate de Campanhas** | Servidor SMTP / Logs Hermes | `Bounce Rate = (E-mails Devolvidos / E-mails Enviados) * 100` | Diário | Bounce Rate diário ultrapassar a marca de 2%. | TI / Infra | Pausar imediatamente campanhas outbound frias, checar chaves DNS (SPF/DKIM) e aquecer IPs. |
| **Taxa de Erro de Ingestão de Dados** | Logs de Auditoria do Hermes | `Erros Ingestão = (Payloads Rejeitados / Total de Payloads Recebidos) * 100` | Diário | Ocorrência de mais de 3 erros de schema validation no mesmo dia. | TI / Infra | Auditar mudanças recentes no front-end do site ou ajustar os JSON schemas na API do Hermes. |

---

## 🛠️ Arquitetura Técnica do Pipeline de Métricas

Para alimentar o Dashboard sem comprometer a performance do banco de dados operacional, a arquitetura implementa o seguinte fluxo de dados assíncrono:

```
[Fontes: Stripe, Nutshell, Site BD, WordPress, SMTP] 
       │
       ▼ (Eventos Webhook / Cron Jobs)
[Barramento do Hermes Agent IA] (Validação de Schema & Logs de Auditoria)
       │
       ▼ (Ingestão em Lote Assíncrona)
[Data Lake de Performance / ClickHouse ou PostgreSQL Réplica]
       │
       ▼ (Agregação de Dados e Consultas)
[Visualizador / Dashboard RevOps - Metabase ou UI React Customizada]
```

1.  **Ingestão Orientada a Eventos**: O Hermes escuta webhooks em tempo real (Stripe e Nutshell) e grava eventos no Data Lake de forma assíncrona.
2.  **Agregação Preventiva**: As fórmulas complexas (ex: MRR e CAC) são calculadas em views materializadas executadas de forma programada duas vezes ao dia para evitar latência.
3.  **Alertas Push no Slack**: Em vez de exigir que o Solo Operator acesse constantemente a interface visual do dashboard, a lógica do monitor verifica as regras de alerta no fechamento diário de logs e envia notificações consolidadas no canal `#alertas-metricas`.
