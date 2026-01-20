# 🚀 Quick Start Guide - Avalia Solar

## 📋 Pré-requisitos

### Software Necessário

- **Ruby:** 3.2+ ([rbenv](https://github.com/rbenv/rbenv) ou [RVM](https://rvm.io/))
- **Node.js:** 18+ ([nvm](https://github.com/nvm-sh/nvm))
- **PostgreSQL:** 14+ ([download](https://www.postgresql.org/download/))
- **Redis:** 6+ ([download](https://redis.io/download))
- **Git:** Última versão

### Verificar Instalações

```bash
ruby -v        # 3.2.0 ou superior
node -v        # 18.0.0 ou superior
npm -v         # 9.0.0 ou superior
psql --version # 14.0 ou superior
redis-cli --version # 6.0.0 ou superior
git --version
```

---

## 🏁 Setup em 10 Minutos

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/AB0-1-main.git
cd AB0-1-main
```

### 2. Setup Backend (Rails)

```bash
cd AB0-1-back

# Instalar dependências
bundle install

# Configurar database
cp .env.development.example .env.development

# Editar .env.development com suas credenciais:
# DATABASE_URL=postgresql://postgres:senha@localhost:5432/avaliasolar_dev
# REDIS_URL=redis://localhost:6379/0

# Criar e popular banco de dados
rails db:create
rails db:migrate
rails db:seed

# Iniciar servidor (porta 3001)
rails s -p 3001
```

**Testar backend:**
- API: http://localhost:3001/api/v1/companies
- Admin: http://localhost:3001/admin (email: admin@avaliasolar.com.br, senha: password)

### 3. Setup Frontend (Next.js)

```bash
# Em outro terminal
cd AB0-1-front

# Instalar dependências
npm install

# Configurar environment
cp .env.example .env.local

# Editar .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Iniciar dev server
npm run dev
```

**Testar frontend:**
- Homepage: http://localhost:3000
- Companies: http://localhost:3000/companies
- Products: http://localhost:3000/products
- Blog: http://localhost:3000/blog

---

## 🐳 Setup com Docker (Recomendado)

### 1. Instalar Docker

- **Windows/Mac:** [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** [Docker Engine](https://docs.docker.com/engine/install/)

### 2. Iniciar Containers

```bash
cd AB0-1-main

# Build e start
docker-compose up -d

# Aguardar containers subirem (~2 min)
docker-compose ps

# Setup database
docker-compose exec backend rails db:create db:migrate db:seed

# Ver logs
docker-compose logs -f
```

### 3. Acessar Aplicação

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api/v1
- **Admin Panel:** http://localhost:3001/admin
- **PostgreSQL:** localhost:5432 (user: postgres, senha: postgres)
- **Redis:** localhost:6379

### Comandos Úteis Docker

```bash
# Parar containers
docker-compose stop

# Restart
docker-compose restart

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Executar comandos no container
docker-compose exec backend rails c
docker-compose exec backend rails routes
docker-compose exec frontend npm run build

# Rebuild após mudanças no Dockerfile
docker-compose build
docker-compose up -d

# Limpar tudo
docker-compose down -v
```

---

## 🔧 Configuração Avançada

### Database Seeds Customizado

```ruby
# AB0-1-back/db/seeds.rb

# Criar admin user
admin = User.create!(
  email: 'seu-email@example.com',
  password: 'sua-senha-segura',
  name: 'Seu Nome',
  role: 'admin'
)

# Criar categorias
categories = [
  { name: 'Painéis Solares', description: 'Módulos fotovoltaicos' },
  { name: 'Inversores', description: 'Inversores grid-tie e off-grid' },
  { name: 'Estruturas', description: 'Sistemas de fixação' },
  { name: 'Baterias', description: 'Armazenamento de energia' }
].map { |attrs| Category.create!(attrs) }

# Executar
rails db:seed
```

### Environment Variables Completas

#### Backend (.env.development)

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/avaliasolar_dev

# Redis
REDIS_URL=redis://localhost:6379/0

# Rails
RAILS_ENV=development
RAILS_LOG_LEVEL=debug
SECRET_KEY_BASE=development_secret_key

# JWT
JWT_SECRET_KEY=jwt_development_secret

# CORS (frontend URL)
FRONTEND_URL=http://localhost:3000

# Email (development - Letter Opener)
SMTP_ADDRESS=localhost
SMTP_PORT=1025

# Active Storage (local)
ACTIVE_STORAGE_SERVICE=local

# Background Jobs
SIDEKIQ_CONCURRENCY=5

# Optional: Sentry, Scout (deixar vazio em dev)
SENTRY_DSN=
SCOUT_KEY=
```

#### Frontend (.env.local)

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Auth (gerar com: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (opcional em dev)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Maps (obter em: https://console.cloud.google.com)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Analytics (deixar vazio em dev)
NEXT_PUBLIC_GA_ID=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 🧪 Testes

### Backend (RSpec)

```bash
cd AB0-1-back

# Rodar todos os testes
bundle exec rspec

# Rodar testes de um arquivo específico
bundle exec rspec spec/models/company_spec.rb

# Rodar com coverage
COVERAGE=true bundle exec rspec

# Ver relatório de coverage
open coverage/index.html
```

### Frontend (Jest)

```bash
cd AB0-1-front

# Rodar todos os testes
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Ver relatório
open coverage/lcov-report/index.html
```

### E2E (Playwright)

```bash
cd AB0-1-front

# Instalar browsers
npx playwright install

# Rodar testes E2E
npx playwright test

# Modo UI
npx playwright test --ui

# Ver relatório
npx playwright show-report
```

---

## 🗃️ Comandos Úteis Rails

```bash
cd AB0-1-back

# Console interativo
rails c

# Rotas
rails routes | grep api

# Migrations
rails db:migrate
rails db:rollback
rails db:migrate:status

# Reset database (⚠️ CUIDADO: apaga dados)
rails db:drop db:create db:migrate db:seed

# Criar nova migration
rails g migration AddVerifiedToCompanies verified:boolean

# Criar model
rails g model Product name:string price:decimal

# Criar controller
rails g controller Api::V1::Products index show

# Limpar cache
rails cache:clear

# Assets precompile (production)
rails assets:precompile

# Logs
tail -f log/development.log
```

---

## 🎨 Comandos Úteis Next.js

```bash
cd AB0-1-front

# Dev server
npm run dev

# Build production
npm run build

# Start production
npm start

# Lint
npm run lint

# Limpar cache do Next.js
rm -rf .next
npm run dev

# Analisar bundle size
npm run build -- --profile
```

---

## 🐛 Troubleshooting

### Problema: "Database does not exist"

```bash
cd AB0-1-back
rails db:create
rails db:migrate
```

### Problema: "Redis connection refused"

```bash
# Linux/Mac
redis-server

# Windows (WSL)
sudo service redis-server start

# Docker
docker-compose up -d redis
```

### Problema: "Port 3000 already in use"

```bash
# Matar processo na porta 3000
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou usar porta diferente
npm run dev -- -p 3002
```

### Problema: "Module not found" (Frontend)

```bash
cd AB0-1-front
rm -rf node_modules package-lock.json
npm install
```

### Problema: "Bundler version mismatch" (Backend)

```bash
cd AB0-1-back
gem install bundler:2.4.22
bundle install
```

### Problema: Imagens não carregam

```bash
# Verificar Active Storage
cd AB0-1-back
rails active_storage:install
rails db:migrate

# Criar storage folder
mkdir -p storage
```

---

## 📚 Recursos de Aprendizado

### Documentação Oficial

- **Rails:** https://guides.rubyonrails.org/
- **Next.js:** https://nextjs.org/docs
- **TypeScript:** https://www.typescriptlang.org/docs/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Redis:** https://redis.io/docs/

### Tutoriais Recomendados

- **Rails API:** https://www.hotrails.dev/
- **Next.js + TypeScript:** https://www.totaltypescript.com/
- **SEO Next.js:** https://nextjs.org/learn/seo/introduction-to-seo

### Ferramentas Úteis

- **Postman:** Testar API endpoints
- **TablePlus:** GUI para PostgreSQL
- **RedisInsight:** GUI para Redis
- **Chrome DevTools:** Performance, Network, Lighthouse

---

## 🎯 Próximos Passos

Após setup completo:

1. ✅ **Verificar que tudo funciona:**
   - [ ] Backend API responde em `/api/v1/companies`
   - [ ] Frontend carrega homepage
   - [ ] Admin panel acessível
   - [ ] Database tem seed data

2. ✅ **Começar desenvolvimento:**
   - [ ] Ler [AVALIA_SOLAR_ARCHITECTURE.md](AVALIA_SOLAR_ARCHITECTURE.md)
   - [ ] Ler [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)
   - [ ] Escolher primeira task (recomendado: TASK-001)

3. ✅ **Configurar ferramentas:**
   - [ ] Git branch strategy (feature branches)
   - [ ] IDE setup (VSCode recommended)
   - [ ] Instalar extensões (ESLint, Prettier, Ruby)

---

## 💡 Dicas de Produtividade

### VSCode Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "rebornix.ruby",
    "kaiwood.endwise",
    "castwide.solargraph",
    "alexcvzz.vscode-sqlite"
  ]
}
```

### Git Workflow

```bash
# Criar feature branch
git checkout -b feature/task-001-fix-404s

# Commits semânticos
git commit -m "feat: add products API endpoint"
git commit -m "fix: resolve 404 on /products"
git commit -m "docs: update API documentation"

# Push e criar PR
git push origin feature/task-001-fix-404s
```

### Aliases Úteis

```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc

alias be="bundle exec"
alias rs="rails s"
alias rc="rails c"
alias rr="rails routes"
alias dm="rails db:migrate"

alias nd="npm run dev"
alias nb="npm run build"
alias nt="npm test"
```

---

## 🆘 Ajuda e Suporte

- **Issues:** GitHub Issues do repositório
- **Documentação:** Ver arquivos .md na raiz do projeto
- **Email:** contato@avaliasolar.com.br

---

**Última Atualização:** 2026-01-19  
**Versão:** 1.0.0
