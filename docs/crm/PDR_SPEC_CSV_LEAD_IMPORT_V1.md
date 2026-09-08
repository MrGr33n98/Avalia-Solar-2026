# PDR Spec A++ — Avalia Solar CRM: CSV Lead Import Engine V1

> **Documento:** Master Implementation Spec & PDR  
> **Status:** Aprovado para Arquitetura & Desenvolvimento  
> **Data:** Setembro de 2026  
> **Autor:** AI Engineering Lead / Pair Programmer  
> **Escopo:** Backend Rails 7 (`AB0-1-back`), Frontend Next.js 14 (`AB0-1-front`), Sidekiq Async Workers, PostgreSQL (`sales_imports`, `sales_import_rows`)

---

## 1. Visão Geral e Objetivo

Permitir a importação nativa, segura, assíncrona e massiva de leads via arquivos `.csv`, `.tsv` ou `.txt` no **Avalia Solar CRM**, respeitando rigorosamente a arquitetura multi-tenant (`Sales::TenantScope.for(user)`).

A importação alimenta nativamente o domínio comercial existente:
- **`Sales::Lead`** (Entrada principal do pipeline de prospecção)
- **`Sales::Account`** (Criação/vinculação opcional de empresas)
- **`Sales::Contact`** (Pessoas de contato associadas)

> **Regra de Ouro:** A importação **não gera `Sales::Opportunity` automaticamente**, preservando a integridade do funil comercial, win rate, forecast e conversão. A transição para oportunidade ocorre posteriormente via qualificação formal com `Sales::LeadConversionService` (`POST /leads/:id/convert`).

---

## 2. Diagrama de Arquitetura e Fluxo de Dados

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ENGINE DE IMPORTAÇÃO CSV                               │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ FRONTEND WIZARD (Next.js 14 App Router) ]
   1. Upload (.csv / .tsv / .txt) ──► POST /api/v1/sales/imports (ActiveStorage)
   2. Detecção (Delimiter / Encoding / Aliases de Colunas)
   3. Mapeamento Manual/Sugerido  ──► PATCH /api/v1/sales/imports/:id/mapping
   4. Validação & Deduplicação   ──► POST /api/v1/sales/imports/:id/validate (AnalyzeImportJob)
   5. Review & Preview (Totais: Válidos, Avisos, Inválidos, Duplicados)
   6. Confirmação & Disparo      ──► POST /api/v1/sales/imports/:id/commit (ProcessImportJob)
                                               │
                                               ▼
 [ BACKEND SIDEKIQ WORKER (Rails 7) ]
   ProcessImportJob (Batching: 500 rows/transação)
     ├── LeadRowNormalizer (Email, Phone E.164, UF, Website URL, Tags)
     ├── LeadRowValidator (Presença Empresa/Contato + Canal de Contato Ativo)
     ├── LeadDuplicateDetector (Match por External ID, Email, Phone, WhatsApp, Account+Domain)
     └── LeadUpsert (Idempotent Fingerprint + Transactional Batch Commit)
                                               │
                                               ▼
 [ DOMÍNIO SALES & POSTGRESQL ]
   Sales::TenantScope ──► Sales::Lead / Account / Contact
   Audit & Events     ──► AuditLog (sales.import.completed, sales.lead.imported)
```

---

## 3. Especificação do Banco de Dados (Schema PostgreSQL)

Criação das tabelas `sales_imports` e `sales_import_rows` via Migration Rails:

```ruby
class CreateSalesImportsAndRows < ActiveRecord::Migration[7.0]
  def change
    create_table :sales_imports, id: :uuid do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.string :entity_type, null: false, default: 'lead'
      t.string :filename, null: false
      t.string :status, null: false, default: 'uploaded'

      t.integer :total_rows, default: 0
      t.integer :processed_rows, default: 0
      t.integer :valid_rows, default: 0
      t.integer :invalid_rows, default: 0
      t.integer :duplicate_rows, default: 0
      t.integer :created_rows, default: 0
      t.integer :updated_rows, default: 0
      t.integer :skipped_rows, default: 0

      t.jsonb :mapping, default: {}
      t.jsonb :options, default: {}
      t.jsonb :error_summary, default: {}

      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end

    add_index :sales_imports, [:company_id, :created_at]
    add_index :sales_imports, [:company_id, :status]

    create_table :sales_import_rows do |t|
      t.references :sales_import, type: :uuid, null: false, foreign_key: { on_delete: :cascade }
      t.integer :row_number, null: false

      t.jsonb :raw_data, default: {}
      t.jsonb :normalized_data, default: {}

      t.string :status, null: false, default: 'pending'
      t.string :fingerprint

      t.jsonb :errors_json, default: []
      t.jsonb :warnings_json, default: []

      t.string :duplicate_type
      t.string :duplicate_record_type
      t.bigint :duplicate_record_id

      t.string :result_record_type
      t.bigint :result_record_id

      t.timestamps
    end

    add_index :sales_import_rows, [:sales_import_id, :row_number], unique: true
    add_index :sales_import_rows, [:sales_import_id, :status]
    add_index :sales_import_rows, [:sales_import_id, :fingerprint]
  end
end
```

---

## 4. Normalização & DTO Intermediário (`Sales::Imports::LeadRowDTO`)

### 4.1 Contrato do DTO

```ruby
module Sales
  module Imports
    class LeadRowDTO
      attr_accessor :company_name, :contact_name, :email, :phone, :whatsapp,
                    :website, :city, :state, :segment, :job_title,
                    :estimated_value, :source, :owner_identifier,
                    :stage_identifier, :tags, :notes, :external_id

      def initialize(attrs = {})
        @company_name     = attrs[:company_name]
        @contact_name     = attrs[:contact_name]
        @email            = attrs[:email]
        @phone            = attrs[:phone]
        @whatsapp         = attrs[:whatsapp]
        @website          = attrs[:website]
        @city             = attrs[:city]
        @state            = attrs[:state]
        @segment          = attrs[:segment]
        @job_title        = attrs[:job_title]
        @estimated_value  = attrs[:estimated_value]
        @source           = attrs[:source]
        @owner_identifier = attrs[:owner_identifier]
        @stage_identifier = attrs[:stage_identifier]
        @tags             = Array(attrs[:tags])
        @notes            = attrs[:notes]
        @external_id      = attrs[:external_id]
      end
    end
  end
end
```

### 4.2 Aliases Inteligentes para Mapeamento de Cabeçalhos

```ruby
ALIASES = {
  company_name: %w[empresa company companhia razão_social razao_social nome_empresa],
  contact_name: %w[nome contato pessoa contact nome_contato],
  email: %w[email e-mail correio],
  phone: %w[telefone phone tel celular mobile whatsapp],
  city: %w[cidade city municipio município],
  state: %w[estado state uf],
  segment: %w[segmento setor ramo atividade],
  estimated_value: %w[valor valor_estimado ticket orcamento orçamento],
  owner_identifier: %w[responsavel responsável vendedor owner usuario usuário],
  stage_identifier: %w[estagio estágio fase status stage]
}.freeze
```

---

## 5. Estratégia de Deduplicação, Idempotência e Tenant Isolation

### 5.1 Regras de Deduplicação no Tenant

1. `external_id` (se presente no CSV)
2. `email` normalizado
3. `phone` / `whatsapp` normalizado no formato E.164 (`+55...`)
4. `company_name` + `website` (domínio sanitizado)
5. `company_name` + `contact_name`

### 5.2 Estratégias Escolhidas pelo Usuário na Confirmação

- **`update_blank_fields_only` (Default):** Preenche apenas atributos que estavam `nil`/vazios no cadastro existente.
- **`overwrite_all`:** Sobrescreve todos os atributos mapeados.
- **`skip_duplicates`:** Ignora a linha e registra no relatório como duplicada.

### 5.3 Idempotência via Hash Fingerprint

Calcula-se o hash SHA256 por linha:
$$\text{Fingerprint} = \text{SHA256}(\text{company\_id} + \text{normalized\_email} + \text{normalized\_phone} + \text{normalized\_company})$$

Isso garante que um re-envio acidental de formulário ou re-tentativa de Sidekiq não gere duplicatas.

---

## 6. Endpoints da API REST (`/api/v1/sales/imports`)

```text
POST   /api/v1/sales/imports                   # Upload CSV & Criar Registro
GET    /api/v1/sales/imports                   # Listar Histórico do Tenant
GET    /api/v1/sales/imports/:id               # Status & Progresso Real-time
POST   /api/v1/sales/imports/:id/analyze       # Análise Automática de Cabeçalhos
PATCH  /api/v1/sales/imports/:id/mapping       # Configurar Mapeamento Colunas
POST   /api/v1/sales/imports/:id/validate      # Enfileirar Validação de Prévia
POST   /api/v1/sales/imports/:id/commit        # Iniciar Processamento Assíncrono
GET    /api/v1/sales/imports/:id/rows          # Listar Linhas e Diagnósticos
GET    /api/v1/sales/imports/:id/errors.csv    # Download de Relatório de Erros
POST   /api/v1/sales/imports/:id/cancel        # Cancelar Importação em Fila
```

---

## 7. UX & Interface (Wizard 5 Passos no Frontend)

O botão **`[ ↓ Importar CSV ]`** será inserido na tela de Leads (`/dashboard/sales/leads`), redirecionando para o workspace completo em `/dashboard/sales/import?entity=leads`.

```text
┌────────────────────────────────────────────────────────────────────────┐
│ ① Arquivo ──► ② Mapear Colunas ──► ③ Validar ──► ④ Revisar ──► ⑤ Importar │
└────────────────────────────────────────────────────────────────────────┘
```

- **Step 1 — Arquivo:** Seletor drag & drop com suporte a CSV (`,`, `;`, `tab`), UTF-8/ISO-8859-1, Google Sheets público e botão de download da planilha modelo.
- **Step 2 — Mapeamento:** Selectors de colunas pré-preenchidos pela inteligência de aliases.
- **Step 3 — Validação:** Análise assíncrona dos registros exibindo contadores em tempo real.
- **Step 4 — Revisão & Preview:** Tabela paginada com status colorido por linha (✓ Válida, ⚠ Aviso, ✕ Inválida, ↔ Duplicada).
- **Step 5 — Processamento:** Polling a cada 2 segundos exibindo porcentagem de progresso real sem spinner infinito.

---

## 8. Segurança & P0 Rules

1. **Escopo de Tenant Obrigatório:** Nenhuma query acessa tabelas sem filtrar via `Sales::TenantScope.for(current_user)`.
2. **Proteção contra Injeção de Fórmulas CSV:** Qualquer célula iniciada por `=`, `+`, `-`, `@` é prefixada com `'` ao gerar o arquivo de erros `errors.csv`.
3. **Limites de Proteção:** Tamanho máximo de arquivo: **25 MB**; Linhas máximas por importação: **50.000**; Concorrência máxima: **5 importações ativas por tenant**.
4. **Auditoria Integrada:** Cada lote processado emite eventos para o `AuditLog` (`sales.import.completed`, `sales.lead.imported`).

---

## 9. Plano de Testes & Critérios de Aceite

- **RSpec (Backend):** Testes unitários para `CsvParser`, `HeaderMapper`, `LeadRowNormalizer`, `LeadDuplicateDetector`, `ImportProcessor`, `ProcessImportJob` e `ImportsController`.
- **Jest (Frontend):** Testes dos componentes do Wizard e formatadores.
- **Playwright E2E:** Teste completo `sales-import-leads.spec.ts` cobrindo upload fixture, mapping, commit e verificação de isolamento tenant entre Tenant A e Tenant B.

<!-- GOAL_COMPLETE -->
