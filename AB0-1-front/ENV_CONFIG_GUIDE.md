# 🔧 Configuração de Variáveis de Ambiente - VM

## 📁 Arquivos de Ambiente

Na VM, você tem dois arquivos principais:

### 1. `.env.local` (Frontend - Next.js)
**Localização:** `C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front\.env.local`

**Configuração Atual (já atualizada):**
```env
# LinkedIn Authentication
LINKEDIN_CLIENT_ID=your_linkedin_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_secret_here

# Google Authentication
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_GTM_ID=GTM-5RV76ZKR

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
API_PROXY_TARGET=http://localhost:3001              # ✅ JÁ ADICIONADO
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
```

**Status:** ✅ **JÁ ESTÁ CONFIGURADO CORRETAMENTE**

---

### 2. `.env` (Backend - Rails)
**Localização:** `C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back\.env`

**Configurações Recomendadas:**
```env
# Database Configuration
DATABASE_URL=postgresql://localhost/avaliasolar_development
# OU se tiver usuário/senha:
# DATABASE_URL=postgresql://usuario:senha@localhost/avaliasolar_development

# Server Configuration
PORT=3001
RAILS_ENV=development
RACK_ENV=development

# CORS Configuration (permitir frontend)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# API Configuration
API_VERSION=v1
API_HOST=localhost
API_PORT=3001

# Secret Keys (gere novas em produção)
SECRET_KEY_BASE=your_secret_key_here
# Para gerar: rails secret

# Session Configuration
SESSION_SECRET=your_session_secret_here

# Redis (se usar cache)
# REDIS_URL=redis://localhost:6379/0

# Outras configurações que já podem existir
# Mantenha as existentes, adicione apenas o que estiver faltando
```

---

## 🔍 Como Verificar se Precisa Configurar

### Passo 1: Verificar se `.env` existe no Backend
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back
dir .env
```

**Se não existir:**
```bash
# Criar arquivo .env
type nul > .env
# Depois edite com notepad
notepad .env
```

### Passo 2: Verificar Configuração Atual
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back
type .env
```

---

## ⚙️ Configurações ESSENCIAIS

### Frontend (.env.local) - ✅ JÁ CONFIGURADO
Nenhuma ação necessária! O arquivo já está correto.

### Backend (.env) - VERIFICAR

**Mínimo necessário:**
```env
# Porta do servidor (IMPORTANTE!)
PORT=3001

# Ambiente
RAILS_ENV=development

# CORS (permitir frontend)
CORS_ORIGINS=http://localhost:3000

# Database (se não estiver no database.yml)
# DATABASE_URL=postgresql://localhost/avaliasolar_development
```

---

## 🎯 Configuração Específica para VM Windows

### Arquivo: `AB0-1-back\.env`

```env
# ==========================================
# CONFIGURAÇÃO PARA VM WINDOWS - DESENVOLVIMENTO
# ==========================================

# Porta do Backend Rails
PORT=3001

# Ambiente
RAILS_ENV=development
RACK_ENV=development

# CORS - Permitir Frontend
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Database - PostgreSQL Local
# Ajuste conforme sua configuração do PostgreSQL
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/avaliasolar_development

# OU se usar SQLite para desenvolvimento:
# DATABASE_URL=sqlite3:storage/development.sqlite3

# Secret Keys
# Execute: rails secret
# E cole o resultado abaixo
SECRET_KEY_BASE=development_secret_key_change_in_production

# API Configuration
API_VERSION=v1
API_HOST=localhost
API_PORT=3001

# Se usar autenticação JWT
# JWT_SECRET=your_jwt_secret_here

# Se usar Redis
# REDIS_URL=redis://localhost:6379/0

# Logs
LOG_LEVEL=debug

# Desabilitar HTTPS no desenvolvimento
FORCE_SSL=false
```

---

## 📝 Checklist de Configuração

### Frontend (AB0-1-front)
- [x] `.env.local` existe
- [x] `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` ✅
- [x] `API_PROXY_TARGET=http://localhost:3001` ✅
- [x] `NEXT_PUBLIC_SITE_URL=http://localhost:3000` ✅

### Backend (AB0-1-back)
- [ ] `.env` existe (verificar)
- [ ] `PORT=3001` (importante!)
- [ ] `RAILS_ENV=development`
- [ ] `CORS_ORIGINS` inclui http://localhost:3000
- [ ] `DATABASE_URL` configurado (se necessário)
- [ ] `SECRET_KEY_BASE` definido

---

## 🛠️ Comandos para Configurar Backend

### 1. Criar arquivo .env se não existir
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back

# Verificar se existe
dir .env

# Se não existir, criar
echo # Backend Environment > .env
```

### 2. Editar arquivo .env
```bash
notepad .env
```

### 3. Adicionar configuração mínima
Cole no notepad:
```env
PORT=3001
RAILS_ENV=development
CORS_ORIGINS=http://localhost:3000
```

### 4. Gerar SECRET_KEY_BASE (se necessário)
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back
rails secret
```
Copie o resultado e adicione no .env:
```env
SECRET_KEY_BASE=cole_aqui_o_resultado_do_comando_rails_secret
```

---

## 🔥 Configuração Rápida - Copie e Cole

Se o arquivo `.env` do backend não existir ou estiver vazio, crie com este conteúdo:

```env
# Backend Rails - Desenvolvimento Local
PORT=3001
RAILS_ENV=development
RACK_ENV=development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
LOG_LEVEL=debug
FORCE_SSL=false

# Database (ajuste conforme necessário)
# Se usar PostgreSQL:
# DATABASE_URL=postgresql://postgres:senha@localhost:5432/avaliasolar_development
# Se usar SQLite (padrão dev):
# DATABASE_URL=sqlite3:storage/development.sqlite3

# Secret (gere com: rails secret)
SECRET_KEY_BASE=development_secret_key_only_change_this_in_production
```

---

## 🧪 Testar Configuração

### 1. Testar Backend
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back
rails server -p 3001
```

**Acesse:** `http://localhost:3001/api/v1/companies`

### 2. Testar Frontend
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front
npm run dev
```

**Acesse:** `http://localhost:3000/companies`

### 3. Executar Diagnóstico
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front
node diagnose-companies-issue.js
```

---

## ❓ Perguntas Frequentes

### Q: Preciso configurar o .env do backend?
**A:** Sim, se você estiver rodando o backend Rails. O mínimo necessário é:
- `PORT=3001`
- `RAILS_ENV=development`
- `CORS_ORIGINS=http://localhost:3000`

### Q: E se o backend usar database.yml?
**A:** Se o Rails já estiver configurado via `config/database.yml`, você não precisa do `DATABASE_URL` no `.env`.

### Q: O .env.local do frontend já está ok?
**A:** ✅ Sim! Já atualizei com a variável `API_PROXY_TARGET` necessária.

### Q: Preciso reiniciar após alterar .env?
**A:** Sim! Sempre reinicie os servidores após alterar arquivos .env:
```bash
# Frontend: Ctrl+C e depois
npm run dev

# Backend: Ctrl+C e depois
rails server -p 3001
```

---

## 📊 Resumo

| Arquivo | Localização | Status | Ação Necessária |
|---------|-------------|--------|-----------------|
| `.env.local` | Frontend | ✅ Configurado | Nenhuma |
| `.env` | Backend | ❓ Verificar | Criar/Configurar se necessário |

---

## 🎯 Próximos Passos

1. **Verificar se `.env` existe no backend:**
   ```bash
   cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back
   dir .env
   ```

2. **Se não existir ou estiver vazio, criar com configuração mínima:**
   ```env
   PORT=3001
   RAILS_ENV=development
   CORS_ORIGINS=http://localhost:3000
   ```

3. **Reiniciar backend:**
   ```bash
   rails server -p 3001
   ```

4. **Testar:**
   ```bash
   cd ..\AB0-1-front
   node diagnose-companies-issue.js
   ```

---

**Dica:** Se tiver dúvidas sobre qual configuração usar, execute o diagnóstico primeiro. Ele vai te dizer se o backend está acessível ou não!

```bash
node diagnose-companies-issue.js
```
