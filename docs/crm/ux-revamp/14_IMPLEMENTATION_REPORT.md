# 14 — Relatório Detalhado de Implementações & Diffs

## 1. Resumo das Modificações Executadas

Neste lote de estabilização e melhorias P0/P1, foram implementadas as seguintes correções e componentes:

### 1.1 Correção P0: Eliminação de Falso Sucesso no `CallLoggerModal.tsx`
- **Arquivo:** `AB0-1-front/components/sales/CallLoggerModal.tsx`
- **Problema Anterior:** O formulário disparava `setSaved(true)` mesmo quando a requisição falhava (422, 500, timeout), no bloco `catch`, e até mesmo quando `accountId` estava indefinido (sem disparar requisição).
- **Correção Implementada:**
  - Validação prévia de `accountId`: se ausente, exibe erro inline e impede a submissão.
  - Verificação estrita de `res.ok`: somente avança para o estado salvo se o backend responder status 2xx.
  - Verificação de receipt: valida que a resposta contém `{ activity: { id } }`.
  - Tratamento de erro no `catch`: preserva as notas e o outcome digitados pelo usuário, exibindo mensagem de erro sem fechar o modal.
  - Desativação do botão durante envio (`loading`) para prevenir duplo clique.

### 1.2 Correção P0: Alinhamento de Rota e Payload em `CreateActivityModal.tsx` e `ActivitiesController.rb`
- **Arquivos:**
  - `AB0-1-back/config/routes.rb`: Inclusão da rota `resources :activities, only: %i[index create], controller: 'sales/activities'` no escopo de vendas, permitindo `POST /api/v1/sales/activities` direto.
  - `AB0-1-back/app/controllers/api/v1/sales/activities_controller.rb`: Adição de `:sales_account_id` aos parâmetros permitidos em `activity_params` e fallback para `opportunity.account` quando a oportunidade for fornecida sem conta explícita.
  - `AB0-1-front/components/sales/create/CreateActivityModal.tsx`: Suporte à prop `accountId?: number` e envio seguro para o backend com validação de status HTTP.

### 1.3 Implementação P0/P1: Criação da Barra Inferior PWA `CRMMobileBottomNav.tsx`
- **Arquivo:** `AB0-1-front/components/sales/layout/CRMMobileBottomNav.tsx`
- **Funcionalidade:** Fornece barra de navegação móvel nativa com 5 destinos (Hoje, Pipeline, Empresas, Tarefas, Mais), suporte a safe area e destaque de aba ativa, mantendo o marketplace público isolado.
- **Integração:** Adicionado ao `SalesLayoutWrapper.tsx` para exibição exclusiva em telas `< 768px`.
