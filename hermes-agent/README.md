# 🤖 Hermes Agent — Avalia Solar & Mobilidade Elétrica

Este diretório concentra todo o ecossistema de **Inteligência de Growth, Outbound e Social Selling** do **Avalia Solar**, unificando as estratégias de aquisição B2B de integradores de **energia solar** e empresas de **mobilidade elétrica** no Brasil.

O Hermes Agent atua como um co-piloto cognitivo orquestrando a triagem de e-mails, social listening em concorrentes, enriquecimento automático de dados de CNPJ no Nutshell CRM, disparos de alertas no Slack e réguas de follow-up para checkouts abandonados.

---

## 🚀 Pilares Técnicos Fundamentais

### 1. Restrição Geográfica Rígida (NÃO NEGOCIÁVEL)
O motor de prospecção só é autorizado a prospectar e qualificar leads sediados em cidades brasileiras com **população igual ou superior a 500 mil habitantes** (lista homologada de 34 cidades no Nordeste, Sudeste, Sul, Norte e Centro-Oeste). Qualquer lead fora desta cobertura é automaticamente descartado para proteger a reputação do domínio e otimizar custos.

### 2. Dupla Segmentação Híbrida
* **Energia Solar**: Mapeamento de instaladoras e integradoras através de indústrias correlatas, utilizando como lead magnet o *Relatório de Competitividade Solar*.
* **Mobilidade Elétrica**: Mapeamento de redes de recarga, locadoras de veículos elétricos e lojas de micromobilidade, oferecendo como lead magnet o *Mapa de Demanda por Pontos de Recarga*.

### 3. Integração Profunda com a Stack
* **Nutshell CRM**: Enriquecimento de campos adicionais customizados (`segmento`, `cidade`, `populacao_cidade`, `potencial_solar`, `potencial_mobilidade`).
* **Gmail / Slack**: Criação automatizada de rascunhos de e-mail e canais dedicados de alertas de vendas (`#growth-solar`, `#growth-mobilidade`, `#sales-alerts`).
* **Instagram**: Auto-reply por inteligência de palavras-chave ("SOLAR" e "ELÉTRICO") via direct messages.

---

## 📈 Como Navegar e Executar
1. Consulte o **[Índice Central (INDEX.md)](file:///c:/Users/Bobi/Desktop/AB0-1-main/hermes-agent/INDEX.md)** para ver os caminhos relativos de todos os scripts e custom skills.
2. Certifique-se de configurar suas chaves de API no arquivo `.env` da raiz baseando-se no **[`config/.env.example`](file:///c:/Users/Bobi/Desktop/AB0-1-main/hermes-agent/config/.env.example)**.
3. Para consolidar os arquivos físicos nesta árvore proposta, execute o script de migração PowerShell **[`reorganize.ps1`](file:///c:/Users/Bobi/Desktop/AB0-1-main/reorganize.ps1)** no seu terminal Windows.

---
*Hermes Growth Ops Engine — 2026.*
