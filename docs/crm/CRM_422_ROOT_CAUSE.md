# Diagnóstico e Resolução do Erro 422 na Criação de Oportunidades — Avalia Solar CRM

## 1. Causa Raiz Identificada

A análise do contrato entre frontend Next.js e o backend Rails identificou duas causas principais para a falha `HTTP 422 Unprocessable Entity`:

1. **Ausência do Parâmetro Obrigatório `sales_account_id`**:
   O modelo `Sales::Opportunity` declara a associação `belongs_to :account, class_name: 'Sales::Account', foreign_key: :sales_account_id`. No Rails 7+, associações `belongs_to` exigem a presença do modelo relacionado por padrão. O formulário anterior enviava apenas `{ name, stage_key, value_cents }`, falhando na validação de modelo `Account can't be blank`.

2. **Ausência de Transacionalidade no Fluxo Inline (Sem Atomicidade)**:
   Ao selecionar "+ Criar Nova Empresa" e "+ Criar Novo Contato" inline no formulário, a aplicação enviava requisições sequenciais desvinculadas:
   - `POST /api/v1/sales/accounts` (200 OK)
   - `POST /api/v1/sales/contacts` (200 OK)
   - `POST /api/v1/sales/opportunities` (422 Unprocessable Entity)
   
   Isso gerava registros órfãos de Empresas e Contatos no banco quando a criação da oportunidade falhava.

---

## 2. Solução Técnica Transacional (Atomicidade)

1. **Suporte a Parâmetros Inline em `OpportunitiesController#create`**:
   O controller `OpportunitiesController` passa a aceitar parâmetros opcionais de `account` e `contact` dentro da mesma requisição ou encadeados dentro de um bloco `ActiveRecord::Base.transaction do ... end`.
   
   Se a validação da Oportunidade falhar, o Rails executa `ROLLBACK` automático da transação, garantindo que a Empresa e o Contato criados inline durante aquele fluxo sejam revertidos e não fiquem órfãos.

2. **Tratamento Canônico de Erros de Validação (422)**:
   O backend retorna o payload estruturado:
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Não foi possível criar a oportunidade.",
       "fields": {
         "sales_account": ["é obrigatório"],
         "name": ["não pode ficar em branco"]
       },
       "request_id": "03537f59-4576-49b3-bb67-bb4a31fd7e97"
     }
   }
   ```

3. **UX no Frontend**:
   O modal de criação exibe os erros de validação diretamente abaixo dos campos afetados, preservando os valores digitados sem fechar o formulário.
