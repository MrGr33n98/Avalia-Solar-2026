---
name: hermes-competitor-listening
description: Social Listening autônomo e monitoramento estratégico de posts e comentários de concorrentes em redes sociais
---

<context>
**Flags:**
- `--competitor` — Nome do perfil do Instagram do concorrente a ser monitorado (ex: `concorrente_solar`)
- `--interval` — Intervalo de verificação de novos posts e comentários (Default: `daily`, Options: `hourly`, `daily`, `weekly`)
- `--alert-level` — Nível de criticidade de comentários a alertar no Slack (Options: `all`, `high-intent-only`, `complaints-only`)
</context>

<objective>
Monitorar a presença digital e interações de concorrentes diretos nas redes sociais para identificar falhas operacionais, capturar leads insatisfeitos ou de alta intenção e repassar leads qualificados para a equipe do Avalia Solar.

**Gera:**
- Alertas de oportunidades imediatas no Slack (`#instagram-opportunities`).
- Insights e ideias de conteúdo comparativo com base nas dores relatadas por clientes nas redes rivais.
- Oportunidades criadas no Nutshell CRM na etapa `1. Lead Capturado` para abordagens comerciais cirúrgicas.
</objective>

<execution_context>
@.planning/skills/hermes-competitor-listening/workflow.md
@.planning/PROJECT.md
@.planning/config.json
</execution_context>

<process>
Execute o monitoramento periódico definido em `.planning/skills/hermes-competitor-listening/workflow.md`.
Use scrapers éticos e seguros para coletar interações de perfis públicos sem infringir as diretrizes das plataformas sociais.
</process>
