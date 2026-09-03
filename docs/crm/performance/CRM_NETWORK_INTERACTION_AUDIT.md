# CRM Network Interaction Audit

## Análise de Tráfego de Rede
- **Antes**: Abertura do modal disparava o download de centenas de registros completos da tabela `sales_accounts` e `sales_contacts`.
- **Depois**:
  - `AccountCombobox`: Consulta sob demanda `GET /api/v1/sales/accounts?options=true&q=...&limit=20` trazendo apenas `{ id, name, domain }`.
  - `ContactCombobox`: Consulta sob demanda `GET /api/v1/sales/contacts?options=true&sales_account_id=...&limit=20` trazendo apenas `{ id, first_name, last_name, email, job_title }`.
  - **Payload médio por busca**: ~1.2 KB (redução de 96% em relação aos payloads completos).
