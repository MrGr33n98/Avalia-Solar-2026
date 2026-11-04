# Crawler ENF Solar Brasil (2.386 Instaladores) — Avalia Solar 2026

Módulo de extração, tratamento e enriquecimento de dados da **ENF Solar** (`https://www.enfsolar.com/directory/installer/Brazil`) para o catálogo e marketplace do **Avalia Solar 2026**.

---

## 1. Visão Geral da Base de Dados Alvo

A ENF Solar cataloga **2.386 instaladores solares ativos no Brasil**, divididos em **24 páginas** de listagem (100 empresas/pág.).

Para cada empresa, existem duas camadas de dados:

1. **Dados de Listagem (Índice - 24 Páginas):**
   - ID único da ENF Solar (`data-company-id`)
   - Razão Social / Nome da Empresa
   - Slug e URL de perfil
   - Estado (UF) de atuação
   - Capacidade de Armazenamento por Baterias (`Yes` / `No`)
   - Porte de Instalações (`Smaller Installations` / `1MWp+ Installations`)
   - País (`Brazil`)

2. **Dados de Perfil Aprofundado (Páginas Individuais):**
   - Endereço físico completo (Logradouro, Número, Bairro, Cidade, UF, CEP)
   - Telefone comercial / WhatsApp de contato
   - Website oficial da empresa
   - Logotipo em alta resolução (CDN ENF)
   - Fornecedores/Marcas de Inversores homologados (ex: Fronius, Canadian Solar, Deye, Sungrow, Victron)
   - Fornecedores/Marcas de Módulos Fotovoltaicos homologados
   - Data da última atualização cadastral

---

## 2. Estrutura de Arquivos

```
AB0-1-main/
├── data/
│   └── enf_solar/
│       ├── enf_installers_index.json      # Catálogo consolidado dos 2.386 instaladores
│       ├── enf_companies_details.jsonl    # Detalhes aprofundados (endereço, telefone, site)
│       └── crawler_progress.json          # Estado de checkpoint para pausar e retomar
├── scripts/
│   └── crawler/
│       ├── enf_crawler.js                 # Motor de parsing e lógica central
│       ├── import_local_page1.js          # Ingestor da página 1 local já salva
│       └── README.md                      # Esta documentação técnica
└── docs/
    └── audits/
        └── RELATORIO_ENGENHARIA_REVERSA_ENF_SOLAR_DIRETORIO_BRASIL.md
```

---

## 3. Segurança de Borda & Cloudflare WAF

A ENF Solar opera sob **Cloudflare WAF** com verificação rigorosa de cabeçalhos e fingerprints TLS/JA3:
- Requisições diretas simples (`fetch`, `curl`, `requests`) recebem **HTTP 403 Forbidden**.
- O crawler opera via pipeline stealth do **Firecrawl** (disponível via MCP ou API com tokens residenciais) para contornar bloqueios e garantir entrega contínua sem CAPTCHAs.

---

## 4. Como Executar

### 4.1 Carregar Página 1 (Já capturada)
```bash
node scripts/crawler/import_local_page1.js
```

### 4.2 Rodar Coleta de Lote
O script armazena checkpoints em `crawler_progress.json`. Se o processo for interrompido, ao rodar novamente ele retoma exatamente do último registro não coletado.
