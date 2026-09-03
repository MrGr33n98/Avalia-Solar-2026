# Schema Real do Banco de Dados PostgreSQL — Avalia Solar CRM

Toda a persistência do CRM utiliza o namespace `Sales::*` e as tabelas com prefixo `sales_*`.

## 1. Tabelas Principais

- `sales_accounts`: Registro de empresas / clientes PJ.
- `sales_contacts`: Pessoas, decisores e contatos comerciais.
- `sales_opportunities`: Oportunidades comerciais e negócios no pipeline.
- `sales_pipelines`: Funis de vendas ativos.
- `sales_stages`: Estágios dos pipelines (posicionamento, probabilidade).
- `sales_tasks`: Tarefas e compromissos com data limite.
- `sales_activities`: Histórico de chamadas, reuniões e interações.
- `sales_quotes`: Propostas comerciais e orçamentos.
- `sales_quote_items`: Itens e dimensionamentos solares da proposta.
- `sales_stage_histories`: Histórico de alteração de estágio e tempo de ciclo.
- `sales_intelligence_signals`: Sinais de intenção e IA.
