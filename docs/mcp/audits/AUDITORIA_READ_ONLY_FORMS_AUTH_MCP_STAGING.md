# Auditoria Read-Only: Formulários de Autenticação e Cadastro (MCP Staging)

- **Data da Auditoria:** 23 de Novembro de 2026
- **Ambiente:** `https://mcp-staging.avaliasolar.com.br`
- **Contexto:** Fluxo de autenticação OAuth 2.1 via dispositivo móvel (ChatGPT App / Webview)
- **Modo:** Read-Only (Diagnóstico e Inventário Técnico)

---

## 1. Diagnóstico do Problema ("Pede City, mas não existe o campo")

### 1.1 Causa Raiz Técnica Identificada
O erro ocorre devido a um **desalinhamento em 3 camadas** entre a view de cadastro, o sanitizador do Devise e o modelo `User`:

1. **Validação Obrigatória no Modelo `User` (`AB0-1-back/app/models/user.rb`):**
   ```ruby
   # Linha 68
   validates :city, presence: true, if: -> { regular_user? && provider.blank? }
   ```
   - Ao submeter o formulário de cadastro padrão (sem `company_id`), o callback `after_initialize :set_default_role` define automaticamente `role = 'review'`.
   - O método `regular_user?` retorna `true` quando `role == 'review'`.
   - Como o cadastro é feito via e-mail e senha (e não via Google), `provider.blank?` é `true`.
   - **Consequência:** O Rails exige obrigatoriamente que o atributo `city` seja preenchido.

2. **Ausência Física do Campo no HTML (`AB0-1-back/app/views/devise/registrations/new.html.erb`):**
   O formulário de cadastro possui estritamente os seguintes inputs:
   - `user[name]` (Nome completo)
   - `user[email]` (E-mail)
   - `user[password]` (Senha)
   - `user[password_confirmation]` (Confirmar senha)
   - **Consequência:** Não há nenhum input de `city` (Cidade) ou `state` (Estado). O usuário recebe o erro `Cidade não pode ficar em branco`, mas não possui onde preencher.

3. **Bloqueio de Parâmetros no Controller (`AB0-1-back/app/controllers/application_controller.rb`):**
   ```ruby
   # Linha 13
   def configure_permitted_parameters
     devise_parameter_sanitizer.permit(:sign_up, keys: %i[email password role company_id])
   end
   ```
   - Mesmo que um campo `city` ou `state` fosse enviado pelo cliente, o Devise Strong Parameters (`devise_parameter_sanitizer`) iria descartá-lo silenciosamente por não constar na lista de parâmetros permitidos para `:sign_up`.

4. **Validação de Termos (`terms_accepted`):**
   ```ruby
   # Linha 74 do user.rb
   validates :terms_accepted, inclusion: { in: [true], message: 'must be accepted' }
   ```
   - O formulário também não envia `terms_accepted: true` via input hidden ou checkbox, o que geraria um segundo erro de validação consecutivo caso a cidade fosse preenchida.

---

## 2. Inventário dos Formulários de Autenticação

| Endpoint | View (Template) | Layout | Inputs Presentes | Inputs Ausentes Obrigatórios |
| :--- | :--- | :--- | :--- | :--- |
| **`GET /users/sign_in`** | `devise/sessions/new.html.erb` | `app_auth.html.erb` | `email`, `password`, `remember_me`, `Google OAuth` | Nenhum (funcional) |
| **`GET /users/sign_up`** | `devise/registrations/new.html.erb` | `app_auth.html.erb` | `name`, `email`, `password`, `password_confirmation` | **`city`**, **`state`**, **`terms_accepted`** |
| **`GET /users/password/new`** | `devise/passwords/new.html.erb` | `app_auth.html.erb` | `email` | Nenhum |
| **`GET /oauth/authorize`** | `doorkeeper/authorizations/new.html.erb` | `app_auth.html.erb` | `client_id`, `scope`, `state`, `code_challenge` | Nenhum |

---

## 3. Matriz de Atributos do Modelo `User` vs Formulário de Cadastro

| Atributo | Coluna no Banco (`schema.rb`) | Regra de Validação (`user.rb`) | Presente no Form `sign_up`? | Permitido no Sanitizer? |
| :--- | :--- | :--- | :---: | :---: |
| **`email`** | `string, null: false` | Devise standard (presence, format, uniqueness) | ✅ Sim | ✅ Sim |
| **`password`** | `string, null: false` | Devise + `password_complexity` | ✅ Sim | ✅ Sim |
| **`name`** | `string` | `presence: true, length: 3..100` | ✅ Sim | ❌ **Não** (apenas em `Users::RegistrationsController`, que não está nas rotas) |
| **`city`** | `string` | **`presence: true` se `regular_user?`** | ❌ **NÃO** | ❌ **NÃO** |
| **`state`** | `string(2)` | `length: { is: 2 }, allow_blank: true` | ❌ **NÃO** | ❌ **NÃO** |
| **`terms_accepted`** | `boolean, default: false` | **`inclusion: [true]`** | ❌ **NÃO** | ❌ **NÃO** |

---

## 4. Análise de UX e Mobile (ChatGPT Mobile Webview)

1. **Responsividade do Layout (`app_auth.html.erb`):**
   - Possui `meta viewport` padrão: `width=device-width,initial-scale=1`.
   - Utiliza Tailwind CDN com classes responsivas (`p-4 sm:p-6 lg:p-8`).
2. **Inconsistência Visual de Design System:**
   - **Tela de Login (`sessions/new`):** Atualizada recentemente com o design **Astryx Split-Card** (Logo oficial SVG do Avalia Solar, grid responsiva de duas colunas, coluna lateral com imagem e badge "MCP Server • OAuth 2.0").
   - **Tela de Cadastro (`registrations/new`):** Permanece no formato de **Card Central Legado** (ícone genérico de sol em SVG dentro de um quadrado amarelo, sem o logo vetorial oficial e sem a grade Astryx).
3. **Comportamento no Webview do ChatGPT Mobile:**
   - Ao tentar criar uma conta no pop-up do ChatGPT no smartphone, a submissão falha silenciosamente ou recarrega a página exibindo `City can't be blank` no topo. No mobile, dependendo do scroll e do teclado virtual aberto, a mensagem pode passar despercebida, deixando o usuário preso no formulário.

---

## 5. Recomendações Técnicas para Correção

Quando a implementação for autorizada, as seguintes ações resolvem definitivamente o fluxo:

1. **No Modelo (`app/models/user.rb`):**
   - Ajustar a validação de cidade para não travar o cadastro inicial rápido, ou exigir apenas quando o usuário for preencher uma avaliação formal (ex.: `if: -> { regular_user? && provider.blank? && !new_record? }`), OU manter a exigência inserindo o campo no formulário.
2. **Na View (`app/views/devise/registrations/new.html.erb`):**
   - Inserir os campos de **Cidade** (`user[city]`) e **UF/Estado** (`user[state]`), com máscara/select de UF.
   - Adicionar o checkbox ou campo hidden de **Aceite dos Termos** (`user[terms_accepted]`).
   - Harmonizar visualmente a tela de cadastro com o mesmo layout **Astryx Split-Card** e logotipo oficial utilizado na tela de login.
3. **No Controller (`app/controllers/application_controller.rb`):**
   - Incluir `:name`, `:city`, `:state`, `:terms_accepted` em `devise_parameter_sanitizer.permit(:sign_up)`.
