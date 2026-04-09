# TODO — Social Login (continuar amanhã)

## ✅ O que já foi feito (hoje)

### Backend (Rails)
- [x] `Gemfile` — adicionado `gem 'omniauth-facebook', '~> 9.0'`
- [x] `config/initializers/devise.rb` — Facebook configurado como provider OmniAuth
- [x] `config/initializers/omniauth.rb` — **criado** — permite GET requests (necessário para SPA)
- [x] `app/controllers/users/omniauth_callbacks_controller.rb` — reescrito com JWT cookies + redirects
- [x] `app/models/user.rb` — adicionado `:facebook` nos providers + nome padrão "Usuario Facebook"

### Frontend (Next.js)
- [x] `contexts/AuthContext.tsx` — social login agora redireciona direto para Rails (`window.location.href`) em vez de usar better-auth
- [x] `app/auth/callback/page.tsx` — **criado** — página que recebe o redirect pós-OAuth do Rails

---

## ❌ O que falta fazer amanhã

### 1. Credenciais do Facebook (5 min)
- [ ] Ir em https://developers.facebook.com → **My Apps → Create App** → tipo **Consumer**
- [ ] Adicionar produto **Facebook Login**
- [ ] Em **Facebook Login → Settings**, adicionar Redirect URI:
  - Dev: `http://localhost:3001/users/auth/facebook/callback`
  - Prod: `https://api.avaliasolar.com.br/users/auth/facebook/callback`
- [ ] Copiar **App ID** e **App Secret** de **Settings → Basic**
- [ ] Adicionar no `AB0-1-back/.env`:
  ```
  FACEBOOK_CLIENT_ID=seu_app_id
  FACEBOOK_CLIENT_SECRET=seu_app_secret
  ```

### 2. Atualizar Redirect URIs nos outros providers (5 min)
Os callbacks agora apontam para o Rails (`localhost:3001`), não mais para o Next.js (`localhost:3000`).

| Provider | Console | Nova URI de callback |
|----------|---------|---------------------|
| Google | https://console.cloud.google.com → APIs & Services → Credentials | `http://localhost:3001/users/auth/google_oauth2/callback` |
| LinkedIn | https://developer.linkedin.com → seu app → Auth | `http://localhost:3001/users/auth/linkedin/callback` |
| Facebook | developers.facebook.com (já feito acima) | `http://localhost:3001/users/auth/facebook/callback` |

> **Produção:** trocar `localhost:3001` por `https://api.avaliasolar.com.br` em cada um.

### 3. Instalar a gem do Facebook (1 min)
```bash
cd AB0-1-back
bundle install
```

### 4. Garantir env var de produção (checar no servidor)
```bash
FRONTEND_URL=https://avaliasolar.com.br
```
Sem isso, Rails redireciona para `localhost:3000` depois do OAuth em produção.

### 5. Testar localmente (10 min)
- [ ] Iniciar Rails: `cd AB0-1-back && rails s -p 3001`
- [ ] Iniciar Next.js: `cd AB0-1-front && npm run dev`
- [ ] Testar botão Google → deve abrir Google OAuth → voltar autenticado
- [ ] Testar botão LinkedIn → deve abrir LinkedIn OAuth → voltar autenticado
- [ ] Testar botão Facebook → deve abrir Facebook OAuth → voltar autenticado
- [ ] Testar fluxo de erro (OAuth cancelado) → deve aparecer tela de erro em `/auth/callback`

---

## Arquitetura do fluxo (para referência)

```
[Botão no frontend]
       ↓ window.location.href
[Rails /users/auth/google_oauth2]   ← GET agora permitido (omniauth.rb)
       ↓ redirect
[Google / LinkedIn / Facebook]
       ↓ callback
[Rails /users/auth/{provider}/callback]
       ↓ seta JWT cookies (httpOnly, SameSite=Lax)
       ↓ redirect
[Next.js /auth/callback?status=success]
       ↓ refreshAuth() → GET /api/v1/users/me com cookie
[Usuário logado ✅]
```

---

## Arquivos modificados nessa sessão

| Arquivo | Tipo |
|---------|------|
| `AB0-1-back/Gemfile` | modificado |
| `AB0-1-back/config/initializers/devise.rb` | modificado |
| `AB0-1-back/config/initializers/omniauth.rb` | **criado** |
| `AB0-1-back/app/controllers/users/omniauth_callbacks_controller.rb` | modificado |
| `AB0-1-back/app/models/user.rb` | modificado |
| `AB0-1-front/contexts/AuthContext.tsx` | modificado |
| `AB0-1-front/app/auth/callback/page.tsx` | **criado** |
