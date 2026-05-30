# 🗺️ Índice Central — Ecossistema Hermes Agent (Avalia Solar)

Este é o mapa centralizador de todos os componentes e especificações de automação de growth, social selling, triagem e CRM para o **Avalia Solar & Mobilidade Elétrica**.

---

## 📂 Árvore de Diretórios Consolidada (Alvo da Migração)

Após executar o script de migração [`reorganize.ps1`](file:///c:/Users/Bobi/Desktop/AB0-1-main/reorganize.ps1), a estrutura de arquivos do ecossistema do Hermes Agent ficará consolidada sob a pasta `hermes-agent/` da seguinte forma:

```
hermes-agent/
├── README.md                      # Visão geral do Hermes Agent (do mobility-alignment.md)
├── INDEX.md                       # Este arquivo (Mapa Geral de Navegação)
├── docs/
│   ├── growth-automation-map.md   # Plano estratégico de 50+ automações
│   ├── mobility-alignment.md      # Alinhamento de restrições de cidades e segmentos
│   ├── roadmap.md                 # Roadmap de priorização e fases (P0, P1, P2)
│   ├── COMPANY_PROCESS_MASTER_FLOW.md # Fluxos Mermaid e explicações de processos operacionais
│   ├── COMPANY_PROCESS_MASTER_FLOW.mmd # Código Mermaid limpo para Live Editor
│   ├── PROCESS_INVENTORY.md       # Tabela completa detalhando todos os processos mapeados
│   ├── AUTOMATION_BACKLOG.md      # Backlog priorizado de automações (P0 a P3)
│   ├── HUMAN_APPROVAL_MATRIX.md   # Matriz de governança e portões de decisão humana
│   ├── DATA_EVENT_TAXONOMY.md     # Taxonomia de payloads e análise LGPD
│   └── REVOPS_DASHBOARD_SPEC.md   # Métricas do dashboard Nutshell/Stripe/Slack
├── skills/
│   ├── linkedin-prospector/       # Custom Skill GSD: Prospecção de integradores
│   │   ├── SKILL.md
│   │   ├── workflow.md
│   │   └── scripts/
│   │       ├── enrich-lead-data.ts (Qualificação por CNPJ e Score)
│   │       ├── linkedin-outbound-sync.ts (Sincronização Nutshell e Slack)
│   │       └── linkedin-regional-prospector.ts (Outbound geolocalizado)
│   ├── competitor-listening/      # Custom Skill GSD: Escuta de rivais
│   │   ├── SKILL.md
│   │   ├── workflow.md
│   │   └── scripts/
│   │       └── scrape-competitor-comments.ts (Scraper e sentimentos)
│   ├── inbox-triager/             # Custom Skill GSD: Triagem Gmail
│   │   ├── SKILL.md
│   │   ├── workflow.md
│   │   └── scripts/
│   │       ├── gmail-inbox-processor.ts (Triagem IMAP e rascunhos)
│   │       └── gmail-classifier.ts (Filtros de categorização local)
│   ├── solar-mobility-leads/      # Prospecção fria de leads de ambos os setores
│   │   └── prospeo-lead-export.ts (Filtro por indústrias e cidades autorizadas)
│   └── utils/
│       └── utils.ts               # Utilitários compartilhados (CSV, retry, logs)
├── scripts/
│   ├── instagram-keyword-reply.ts # Auto-reply para palavras-chave no Instagram
│   ├── nutshell-lead-enrichment.ts# Sincronizador de custom fields do CRM Nutshell
│   ├── abandoned-checkout-recovery.ts # Recuperador de SaaS checkouts Stripe
│   └── verify-credentials.ts      # Validador de chaves de API e conexões
└── config/
    └── .env.example               # Exemplo de variáveis de ambiente configurado
```

---

## ⚡ Mapeamento de Dependências e Configurações (.env)

| Componente/Script | Variáveis Obrigatórias | Gatilhos / Execução |
| :--- | :--- | :--- |
| `prospeo-lead-export.ts` | `PROSPEO_API_KEY` | `--segmento [solar/mobilidade]` |
| `instagram-keyword-reply.ts` | `META_INSTAGRAM_TOKEN` | Ingestão de directs "SOLAR" / "ELÉTRICO" |
| `linkedin-regional-prospector.ts` | `SMARTLEAD_API_KEY` | Busca de decisores nas 34 cidades permitidas |
| `gmail-classifier.ts` / `gmail-inbox-processor.ts` | `GMAIL_API_KEY`, `OPENAI_API_KEY` | Leitura IMAP e classificação cognitiva de inbox |
| `nutshell-lead-enrichment.ts` | `NUTSHELL_API_KEY` | Sincroniza campos customizados (`segmento`, `cidade`) |
| `abandoned-checkout-recovery.ts`| `GMAIL_API_KEY` | Eventos de carrinho abandonado do Stripe |
| `verify-credentials.ts` | Todas acima | Teste de conectividade geral da stack |

---

## 📈 Comandos Úteis de Execução (Fidelidade GSD)

Para executar qualquer script TypeScript individual após a organização física, utilize o interpretador `tsx`:

```bash
# Validação de credenciais e chaves
npx tsx hermes-agent/scripts/verify-credentials.ts

# Executar exportação segmentada de Energia Solar
npx tsx hermes-agent/skills/solar-mobility-leads/prospeo-lead-export.ts --segmento solar

# Executar exportação segmentada de Mobilidade Elétrica
npx tsx hermes-agent/skills/solar-mobility-leads/prospeo-lead-export.ts --segmento mobilidade

# Rodar triagem e classificação de e-mails recebidos
npx tsx hermes-agent/skills/inbox-triager/scripts/gmail-classifier.ts
```

## 🗺️ Mapeamento Operacional e BPMN Mestre

Consulte os novos documentos operacionais gerados para a estruturação estratégica da empresa:
*   [COMPANY_PROCESS_MASTER_FLOW.md](file:///c:/Users/Bobi/Desktop/AB0-1-main/hermes-agent/docs/COMPANY_PROCESS_MASTER_FLOW.md): Diagrama mestre em Mermaid (dividido por raias de atuação) e documentação teórica completa dos processos.
*   [COMPANY_PROCESS_MASTER_FLOW.mmd](file:///c:/Users/Bobi/Desktop/AB0-1-main/hermes-agent/docs/COMPANY_PROCESS_MASTER_FLOW.mmd): Arquivo contendo unicamente a sintaxe Mermaid completa e limpa para edição no Mermaid Live Editor.
*   [PROCESS_INVENTORY.md](file:///c:/Users/Bobi/Desktop/AB0-1-main/hermes-agent/docs/PROCESS_INVENTORY.md): Tabela detalhada catalogando os 22 processos de cadastros B2B/B2C, social selling, triagens, Stripe e auditoria.
*   [AUTOMATION_BACKLOG.md](file:///c:/Users/Bobi/Desktop/AB0-1-main/hermes-agent/docs/AUTOMATION_BACKLOG.md): Backlog de priorização técnica de desenvolvimento de automações do Hermes Agent, ordenado de P0 a P3.
*   [HUMAN_APPROVAL_MATRIX.md](file:///c:/Users/Bobi/Desktop/AB0-1-main/hermes-agent/docs/HUMAN_APPROVAL_MATRIX.md): Matriz de governança definindo portões manuais para ações sensíveis, e-mails comerciais e financeiro.
*   [DATA_EVENT_TAXONOMY.md](file:///c:/Users/Bobi/Desktop/AB0-1-main/hermes-agent/docs/DATA_EVENT_TAXONOMY.md): Taxonomia de ingestão e tráfego de dados, descrevendo os payloads mínimos JSON e riscos legais sob a ótica da LGPD.
*   [REVOPS_DASHBOARD_SPEC.md](file:///c:/Users/Bobi/Desktop/AB0-1-main/hermes-agent/docs/REVOPS_DASHBOARD_SPEC.md): Especificação detalhada de KPIs comerciais, financeiros, de growth e técnicos, integrando Stripe, CRM, Slack e Hermes.

---
*Índice criado em: 30 de Maio de 2026. Todos os caminhos e referências atualizados.*
