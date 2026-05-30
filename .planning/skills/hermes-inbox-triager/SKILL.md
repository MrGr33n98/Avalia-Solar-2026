---
name: hermes-inbox-triager
description: Classificação cognitiva, triagem de e-mails, criação automática de rascunhos de resposta e sincronização de funil Nutshell CRM
---

<context>
**Flags:**
- `--unread-only` — Processar apenas e-mails não lidos na caixa de entrada (Default: `true`)
- `--draft` — Criar rascunhos automáticos de e-mail na conta conectada (Default: `true`)
- `--channels` — Canais do Slack para disparar os alertas baseados em classificação (Default: `#growth-leads,#sales-alerts`)
</context>

<objective>
Gerenciar a caixa de entrada comercial de e-mails do Avalia Solar, separando leads qualificados, dúvidas comuns, problemas de suporte e propostas de parcerias, gerando respostas personalizadas automatizadas ou semiautomatizadas e orquestrando o CRM em tempo real.

**Gera:**
- Rascunhos de resposta prontos na conta do Gmail comercial para revisão em 1 clique.
- Oportunidades estruturadas e tarefas de follow-up associadas no Nutshell CRM.
- Notificações de urgência e oportunidades de alta receita no Slack.
</objective>

<execution_context>
@.planning/skills/hermes-inbox-triager/workflow.md
@.planning/PROJECT.md
@.planning/config.json
</execution_context>

<process>
Execute a triagem e processamento cognitivo periódico definido em `.planning/skills/hermes-inbox-triager/workflow.md`.
Garanta a consistência nas respostas utilizando a base de FAQ e catálogo de planos `/pricing` integrado do Avalia Solar.
</process>
