## 🔐 Autenticação e Fluxo de Cadastro

### Fluxo de Registro e Aprovação

1. **Registro (Frontend)**:
   - Usuário acessa `/register-user`.
   - Preenche: Nome, Email Corporativo, Senha, Confirmação, Data de Nascimento.
   - Validações: Complexidade de senha, maioridade, termos aceitos.
   - Criação via API: Usuário criado com status `pending`.

2. **Aprovação (Active Admin)**:
   - Administradores recebem notificação (email/dashboard) de novos usuários pendentes.
   - Acessam `/admin/users` -> Filtro "Pendentes".
   - Ações:
     - **Aprovar**: Define status `active`. Envia email de boas-vindas/aprovação.
     - **Rejeitar**: Define status `rejected` e exige motivo. Envia email com o motivo.

3. **Status do Usuário**:
   - `pending` (0): Padrão. Login bloqueado.
   - `active` (1): Acesso liberado.
   - `rejected` (2): Login bloqueado. Motivo registrado.
   - `blocked` (3): Login bloqueado manualmente.

4. **Emails Transacionais**:
   - `approval_email`: Enviado ao ativar.
   - `rejection_email`: Enviado ao rejeitar.

### Testes
- **E2E**: `cypress/e2e/registration_spec.cy.ts` cobre o fluxo de cadastro.
- **RSpec**: `spec/requests/authentication_flow_spec.rb` cobre a lógica de API e status.
