# 🔋 Avalia Solar + Mobilidade Elétrica — Outbound & Growth Engine

Este diretório contém a especificação e os scripts executáveis da infraestrutura de prospecção fria e automação de crescimento adaptada especificamente para o ecossistema do **Avalia Solar**.

O sistema está configurado para atender a **dois segmentos B2B distintos** em âmbito nacional, aplicando uma **regra geográfica obrigatória e não negociável** de densidade populacional (apenas municípios com mais de 500 mil habitantes).

---

## 🗺️ Cidades Permitidas (População ≥ 500.000)

O motor de prospecção filtra e valida rigidamente a localização de todos os leads B2B. Cidades brasileiras homologadas no filtro geográfico:

| Região | Cidades Homologadas |
| :--- | :--- |
| **Sudeste** | São Paulo (SP), Rio de Janeiro (RJ), Belo Horizonte (MG), Guarulhos (SP), Campinas (SP), São Bernardo do Campo (SP), Santo André (SP), Osasco (SP), Ribeirão Preto (SP), Uberlândia (MG), Sorocaba (SP), Niterói (RJ), São José dos Campos (SP), Juiz de Fora (MG). |
| **Nordeste** | Salvador (BA), Fortaleza (CE), Recife (PE), São Luís (MA), Maceió (AL), Natal (RN), Teresina (PI), João Pessoa (PB), Aracaju (SE), Feira de Santana (BA). |
| **Centro-Oeste** | Brasília (DF), Goiânia (GO), Campo Grande (MS), Cuiabá (MT), Aparecida de Goiânia (GO). |
| **Sul** | Curitiba (PR), Porto Alegre (RS), Joinville (SC), Londrina (PR), Florianópolis (SC), Caxias do Sul (RS). |
| **Norte** | Manaus (AM), Belém (PA), Ananindeua (PA). |

---

## ⚡ Segmentos B2B Alvo e Parametrização

O sistema unifica a captura e prospecção de dois mercados complementares utilizando o **Hermes Agent** como orquestrador central cognitivo:

### 1. Energia Solar
* **Indústrias Filtro**: `"Energia Solar"`, `"Geração Distribuída"`, `"Instalação de Painéis Solares"`.
* **Lead Magnet**: *"Relatório de Competitividade Solar em [Cidade]"* — contendo volume de buscas na região, perfil das top 3 integradoras concorrentes e estimativa de leads não atendidos.
* **Plano Proposto**: Upgrade para os planos SaaS (Essencial, Pro, Enterprise).

### 2. Mobilidade Elétrica
* **Indústrias Filtro**: `"Veículos Elétricos"`, `"Infraestrutura de Recarga"`, `"Mobilidade Sustentável"`, `"Micromobilidade"`.
* **Lead Magnet**: *"Mapa de Demanda por Pontos de Recarga em [Cidade]"* ou *"Estudo de Viabilidade para Infraestrutura de Frota Elétrica"*.
* **Plano Proposto**: Planos comerciais dedicados a redes de recarga, lojas de veículos elétricos e micromobilidade.

---

## 📁 Estrutura de Pastas Implementada

```
├── README-AVALIASOLAR-MOBILIDADE.md (Este documento de referência)
├── roadmap-avaliasolar-mobilidade.md (Roadmap de fases estratégicas)
├── .env.example (Variáveis de ambiente customizadas com APIs brasileiras)
└── skills/
    └── avaliasolar/
        ├── prospeo-lead-export.ts (Filtro por segmento + cidades permitidas)
        ├── instagram-keyword-reply.ts (Respostas automáticas segmentadas por palavra-chave)
        ├── linkedin-regional-prospector.ts (Pesquisa, enriquecimento e pitch automatizado)
        ├── gmail-classifier.ts (Triador e classificador de inbox)
        ├── nutshell-lead-enrichment.ts (CNPJ, receita e campos customizados CRM)
        ├── abandoned-checkout-recovery.ts (Campanha de recuperação Stripe SaaS)
        └── verify-credentials-avaliasolar.ts (Validador geral de APIs e conexões)
```

---

## 🛡️ Integração com Nutshell CRM (Campos Customizados)
O script de enriquecimento realiza o mapeamento dos seguintes campos adicionais obrigatórios no Nutshell CRM:
- `segmento` (`solar` ou `mobilidade_eletrica`)
- `cidade` (Nome da cidade limpo e higienizado)
- `populacao_cidade` (População estimada com base na lista)
- `potencial_solar` (Baixo, Médio, Alto com base na irradiação regional)
- `potencial_mobilidade` (Baixo, Médio, Alto com base na frota de VEs e pontos de recarga estimados)

---

## 📈 Instruções de Execução Rápida

Para iniciar a validação dos integradores ou empresas de mobilidade no Brasil, utilize:

```bash
# 1. Verificar se as APIs estão conectadas e operacionais
npx tsx skills/avaliasolar/verify-credentials-avaliasolar.ts

# 2. Scrape e filtro rígido de leads de Energia Solar
npx tsx skills/avaliasolar/prospeo-lead-export.ts --segmento solar --output leads-solar.csv

# 3. Scrape e filtro de leads de Mobilidade Elétrica
npx tsx skills/avaliasolar/prospeo-lead-export.ts --segmento mobilidade --output leads-mobilidade.csv
```
