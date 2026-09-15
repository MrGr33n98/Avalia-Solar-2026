# ADR: modelo canônico de dados CRM V3

## Status

Aceito — 2026-09-02.

## Decisão

A camada Sales mantém tabelas explícitas para dados usados em filtros, relatórios,
regras e integrações. `metadata` permanece somente como extensão não-canônica.
Taxonomias usam `sales_taxonomies` com `kind` e `slug`; campos customizados usam
definição e valores separados; mutações críticas geram `sales_audit_logs`.

## Consequências

O frontend não deve manter listas canônicas próprias. Endpoints de Settings devem
fornecer taxonomias e definições para o tenant. API keys armazenam apenas digest;
o segredo bruto é mostrado uma única vez na emissão.
