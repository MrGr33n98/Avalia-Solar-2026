# CRM Mutation 500 Audit

## Causa Raiz do 500 Anterior
1. **Model Validation Failure**: A model validation `validates :status, presence: true` em `Sales::Opportunity` falhava com status ausente, gerando `ActiveRecord::RecordInvalid` sem captura adequada no controller legados.
2. **Contact-Account Mismatch**: Associação de contatos de outras contas gerava erros de chave estrangeira não capturados na camada de serviço.
3. **Pipeline Dynamic Bootstrapping**: Chamadas dinâmicas a `ensure_default_stages!` na requisição quente geravam concorrência de banco e exceções em instâncias de produção.

## Correção Implementada
- Criação do serviço isolado `Sales::Opportunities::Create.call`.
- Captura de `CustomerAccountMismatchError` -> Retorna `422 CONTACT_ACCOUNT_MISMATCH`.
- Captura de `PipelineNotConfiguredError` -> Retorna `422 CRM_PIPELINE_NOT_CONFIGURED`.
- Captura de `ActiveRecord::RecordInvalid` -> Retorna `422 VALIDATION_ERROR` com mapa tipado de campos.
