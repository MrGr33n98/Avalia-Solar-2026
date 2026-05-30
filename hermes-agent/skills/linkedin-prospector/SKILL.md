---
name: hermes-linkedin-prospector
description: Prospecção B2B ativa regional no LinkedIn para donos de empresas solares com enriquecimento de dados CNPJ em tempo real
---

<context>
**Flags:**
- `--region` — Região/Estado alvo para filtrar a busca (ex: `SP`, `MG`, `PR`)
- `--limit` — Limite diário de conexões seguras para enviar (Default: `20`, Max: `30` para evitar bloqueios)
- `--auto` — Envio automático imediato de convites (se desativado, gera apenas rascunhos para revisão do SDR)
</context>

<objective>
Localizar, enriquecer, qualificar e prospectar donos e diretores comerciais de empresas instaladoras de energia solar em regiões específicas do Brasil.

**Gera:**
- Conexões personalizadas e rascunhos de follow-up na inbox do LinkedIn.
- Contatos pré-qualificados enriquecidos com CNPJ e porte no Nutshell CRM.
- Alertas ricos de prospecção e taxa de conversão no Slack (`#linkedin-prospecting`).
</objective>

<execution_context>
@.planning/skills/hermes-linkedin-prospector/workflow.md
@.planning/PROJECT.md
@.planning/config.json
</execution_context>

<process>
Execute o workflow de prospecção regional ativo conforme detalhado em `.planning/skills/hermes-linkedin-prospector/workflow.md`.
Garanta o cumprimento estrito dos gates de segurança, LGPD e limites diários declarados na flag `--limit`.
</process>
