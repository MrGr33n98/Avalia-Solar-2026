# Campaign Workstation — Performance & Query Optimization Report

> **Data:** Setembro 2026  
> **Status:** AUDITADO & OTIMIZADO  
> **Diretório:** `docs/03-campaign/`

---

## 1. Diagnóstico do Log de Produção (Antes da Otimização)

- **Endpoint:** `GET /api/v1/sales/campaigns?page=1&per_page=20`
- **Duração Total:** `4025.37 ms` (p95 desejado < 300 ms)
- **Tempo em Banco (DB):** `670.43 ms`
- **Alocações de Memória:** `97.296 allocations`

---

## 2. Análise Causa Raiz da Lentidão

1. **N+1 Queries na Serialização de Modelos:**
   - Durante o `.map { |c| serialize_campaign_summary(c) }`, a chave `template_name` invocava `c.email_template&.name`.
   - Como `scoped_campaigns` não fazia eager loading de `email_template`, para cada registro retornado no lote era disparada uma query SQL síncrona adicional contra a tabela `sales_email_templates`.
   - **Correção:** Adicionado `.includes(:email_template)` em `CampaignsController#index`.

2. **Sequential Scan & Ausência de Índices Compostos:**
   - As buscas filtravam por `company_id` e ordenavam por `created_at DESC` sem um índice composto.
   - **Correção:** Criada a migração `20260905000005_add_indexes_to_sales_campaigns.rb` adicionando os índices:
     - `(company_id, created_at DESC)`
     - `(company_id, status)`

3. **Serialização Leve para Listagem:**
   - O método `serialize_campaign_summary` retorna estritamente escalares e contadores pré-calculados. Coleções pesadas (`recipients`, `email_messages`, `events`) só são carregadas em `serialize_campaign_detailed` no endpoint `GET /api/v1/sales/campaigns/:id`.

---

## 3. Plano de Manutenção & Budget de Alocações

- **Budget de Resposta Index:** `< 300 ms`
- **Budget de Disparo HTTP (Launch):** `< 500 ms` (validação e enfileiramento assíncrono via Sidekiq)
- **Alocações Alvo:** `< 15.000 allocations` por página de 20 campanhas.
