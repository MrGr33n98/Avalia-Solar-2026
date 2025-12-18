# AB0-1 Backend API

[![Ruby](https://img.shields.io/badge/ruby-3.2.2-red.svg)](https://www.ruby-lang.org/)
[![Rails](https://img.shields.io/badge/rails-7.0.6-red.svg)](https://rubyonrails.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-5.0+-red.svg)](https://redis.io/)

API backend RESTful para a plataforma AB0-1, construída com Ruby on Rails 7 e PostgreSQL. Esta API oferece endpoints para gerenciamento de campanhas, conteúdo, usuários, empresas e analytics.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Testes](#-testes)
- [Performance](#-performance)
- [Segurança](#-segurança)
- [Deploy](#-deploy)
- [Contribuindo](#-contribuindo)

## 🎯 Visão Geral

### Principais Recursos

- **Autenticação JWT**: Sistema de autenticação baseado em tokens JWT
- **Multi-tenancy**: Suporte para múltiplas empresas (companies)
- **Campanhas**: Gerenciamento completo de campanhas com reviews
- **Conteúdo**: Sistema de artigos, banners e feeds personalizados
- **Forum**: Perguntas e respostas para engajamento da comunidade
- **Notificações**: Sistema de notificações em tempo real
- **Analytics**: Endpoints para tracking e analytics
- **Rate Limiting**: Proteção contra abuso com Rack::Attack
- **Background Jobs**: Processamento assíncrono com Sidekiq
- **Caching**: Redis para cache de queries e fragments

### Stack Tecnológica

- **Framework**: Ruby on Rails 7.0.6 (API Mode)
- **Ruby**: 3.2.2
- **Database**: PostgreSQL 14+
- **Cache/Jobs**: Redis 5.0+
- **Background Jobs**: Sidekiq 7.0
- **Logging**: Lograge (structured logging)
- **Pagination**: Kaminari
- **Authentication**: JWT (custom implementation)

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
app/
├── controllers/
│   └── api/v1/          # API controllers (versionamento)
├── models/              # ActiveRecord models
│   └── concerns/        # Model concerns (reusable modules)
├── jobs/                # Background jobs (Sidekiq)
├── mailers/             # Email templates
├── services/            # Business logic services
└── serializers/         # JSON serializers

config/
├── initializers/        # App initialization
├── locales/            # i18n translations
└── routes.rb           # API routes definition

db/
├── migrate/            # Database migrations
└── seeds.rb            # Seed data

docs/                   # API documentation
test/                   # Test suite
```

### Principais Modelos

- **User**: Usuários do sistema (doadores/recipients)
- **Company**: Empresas/organizações
- **Campaign**: Campanhas de doação
- **Content**: Conteúdo editorial
- **Article**: Artigos do blog
- **Banner**: Banners promocionais
- **Lead**: Leads capturados
- **FinancingConfiguration**: Configurações globais de financiamento

## 🔧 Pré-requisitos

- **Ruby**: 3.2.2 (use rbenv ou rvm)
- **PostgreSQL**: 14+ 
- **Redis**: 5.0+
- **Node.js**: 18+ (para assets)
- **Bundler**: 2.3+

## 📦 Instalação

### 🐳 Opção 1: Docker (Recomendado)

**Maneira mais rápida de começar!** Setup completo em menos de 5 minutos.

```bash
# 1. Configurar e iniciar
make setup

# 2. Validar
./scripts/validate-docker-env.sh

# 3. Acessar
open http://localhost:3001/health
```

✅ Inclui: PostgreSQL, Redis, Sidekiq, Adminer, MailCatcher e Redis Commander

📖 **Documentação completa:** [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) | [docs/docker-development.md](docs/docker-development.md)

**Comandos úteis:**
- `make help` - Ver todos os comandos
- `make console` - Rails console
- `make logs` - Ver logs
- `make test` - Executar testes

---

### 💻 Opção 2: Instalação Local

### 1. Clone o repositório

```bash
git clone <repository-url>
cd AB0-1-back
```

### 2. Instale as dependências Ruby

```bash
# Instale a versão correta do Ruby
rbenv install 3.2.2
rbenv local 3.2.2

# Instale as gems
bundle install
```

### 3. Configure o banco de dados

```bash
# Crie os bancos de dados
rails db:create

# Execute as migrations
rails db:migrate

# (Opcional) Carregue dados de exemplo
rails db:seed
```

### 4. Inicie os serviços

```bash
# Inicie Redis (em outro terminal)
redis-server

# Inicie Sidekiq (em outro terminal)
bundle exec sidekiq

# Inicie o servidor Rails
rails server
```

A API estará disponível em `http://localhost:3000`

## ⚙️ Configuração

### Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp .env.secrets.example .env.secrets
```

Edite `.env.secrets` com suas credenciais:

```bash
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/ab01_development
POSTGRES_HOST=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=ab01_development

# Rails
RAILS_MASTER_KEY=your_master_key_here
SECRET_KEY_BASE=generate_with_rails_secret

# JWT Authentication
JWT_SECRET=your_jwt_secret_here

# Redis
REDIS_URL=redis://localhost:6379/0

# Sentry (Error Tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Scout APM (Performance Monitoring)
SCOUT_KEY=your_scout_key_here

# Rate Limiting
BLOCKED_IPS=192.168.1.1,10.0.0.1
```

### Gerando Secrets

```bash
# Gerar JWT_SECRET
rails secret

# Gerar SECRET_KEY_BASE
rails secret

# Gerar RAILS_MASTER_KEY
# Já está em config/master.key (não commite este arquivo!)
```

## 🚀 Uso

### Desenvolvimento Local

```bash
# Servidor Rails
rails server

# Console Rails
rails console

# Rotas disponíveis
rails routes | grep api

# Logs em tempo real
tail -f log/development.log
```

### Com Procfile (Foreman)

```bash
# Instale foreman
gem install foreman

# Inicie todos os serviços
foreman start -f Procfile.dev
```

Isso iniciará:
- Rails server (porta 3000)
- Sidekiq worker
- Redis (se configurado)

## 📚 API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### Autenticação

Todos os endpoints (exceto login/registro) requerem um token JWT no header:

```
Authorization: Bearer <your-jwt-token>
```

### Principais Endpoints

#### Autenticação

```http
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

#### Campanhas

```http
GET    /api/v1/campaigns          # Listar campanhas
GET    /api/v1/campaigns/:id      # Detalhes da campanha
POST   /api/v1/campaigns          # Criar campanha
PUT    /api/v1/campaigns/:id      # Atualizar campanha
DELETE /api/v1/campaigns/:id      # Deletar campanha
```

#### Conteúdo

```http
GET    /api/v1/contents           # Listar conteúdos
GET    /api/v1/content_feed       # Feed personalizado
GET    /api/v1/articles           # Artigos do blog
GET    /api/v1/banners            # Banners ativos
```

#### Empresas

```http
GET    /api/v1/companies          # Listar empresas
GET    /api/v1/companies/:id      # Detalhes da empresa
GET    /api/v1/company_dashboard  # Dashboard da empresa
```

#### Analytics

```http
POST   /api/v1/analytics/track    # Track evento
GET    /api/v1/analytics/stats    # Estatísticas
```

### Paginação

Todos os endpoints de listagem suportam paginação via Kaminari:

```http
GET /api/v1/campaigns?page=2&per_page=20
```

Response headers incluem:
```
X-Total-Count: 100
X-Total-Pages: 5
X-Current-Page: 2
X-Per-Page: 20
```

### Rate Limiting

A API implementa rate limiting via Rack::Attack:

- **Requisições por IP**: 300 requests/5min
- **Login attempts**: 5 requests/20sec
- **API requests**: 100 requests/min (authenticated)

Response quando limite excedido:
```json
{
  "error": "Rate limit exceeded. Try again in 60 seconds."
}
```

## 🧪 Testes

### Executar testes

```bash
# Todos os testes
rails test

# Testes específicos
rails test test/models
rails test test/controllers

# Com coverage
COVERAGE=true rails test
```

### Estrutura de Testes

```
test/
├── models/              # Model tests
├── controllers/         # Controller tests
├── integration/         # Integration tests
├── jobs/               # Background job tests
└── fixtures/           # Test data
```

### Coverage Report

Após executar testes com `COVERAGE=true`, veja o report:

```bash
open coverage/index.html
```

## ⚡ Performance

### Caching

A aplicação usa Redis para caching em múltiplas camadas:

```ruby
# Fragment caching
<% cache campaign do %>
  <%= render campaign %>
<% end %>

# Query caching
Rails.cache.fetch("campaigns/featured", expires_in: 1.hour) do
  Campaign.featured.includes(:company).to_a
end
```

### Background Jobs

Operações pesadas rodam em background via Sidekiq:

```ruby
# Enviar email
NotificationMailer.campaign_created(campaign).deliver_later

# Processar em background
CampaignProcessorJob.perform_later(campaign_id)
```

Monitor Sidekiq em: `http://localhost:3000/sidekiq` (em development)

### Database Optimization

- **Indexes**: Indexes otimizados para queries frequentes
- **Eager Loading**: Uso de `includes` para evitar N+1
- **Bullet Gem**: Detecta N+1 queries em development

```ruby
# Bom ✅
Campaign.includes(:company, :reviews).all

# Ruim ❌ (N+1)
Campaign.all.each { |c| puts c.company.name }
```

## 🔒 Segurança

### Implementações de Segurança

1. **CORS**: Configurado em `config/initializers/cors.rb`
2. **Rate Limiting**: Rack::Attack protege contra abuse
3. **JWT Authentication**: Tokens com expiração
4. **SQL Injection**: ActiveRecord protege automaticamente
5. **XSS**: Rails escapa HTML por padrão
6. **CSRF**: Proteção CSRF habilitada
7. **Secrets**: Credentials encriptadas com `rails credentials`

### Boas Práticas

```ruby
# ✅ Use strong parameters
def campaign_params
  params.require(:campaign).permit(:title, :description)
end

# ✅ Valide inputs
validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

# ✅ Use scopes para autorização
def index
  @campaigns = current_user.company.campaigns
end
```

## 🚢 Deploy

### Preparação

```bash
# Compile assets
rails assets:precompile

# Check da aplicação
rails app:doctor

# Verificar secrets
rails credentials:show
```

### Heroku

```bash
# Login no Heroku
heroku login

# Criar app
heroku create ab01-api

# Adicionar addons
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev

# Set env vars
heroku config:set RAILS_MASTER_KEY=xxxxx
heroku config:set JWT_SECRET=xxxxx

# Deploy
git push heroku main

# Migrate
heroku run rails db:migrate

# Logs
heroku logs --tail
```

### Docker

```bash
# Build
docker build -t ab01-backend .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://... \
  -e REDIS_URL=redis://... \
  ab01-backend
```

### Monitoramento

- **Sentry**: Error tracking e alertas
- **Scout APM**: Performance monitoring
- **Lograge**: Structured logging para análise

## 🤝 Contribuindo

### Workflow

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Convenções

- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/)
- **Code Style**: Siga [Ruby Style Guide](https://rubystyle.guide/)
- **Linting**: Execute `rubocop` antes de commitar
- **Testes**: Mantenha coverage > 80%

### Code Review Checklist

- [ ] Código segue o style guide
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Sem warnings do Rubocop
- [ ] Migrations são reversíveis (ver seção Database Migrations)
- [ ] Sem N+1 queries

## 🗄️ Database Migrations

### Comandos Úteis

```bash
# Aplicar migrations pendentes
rails db:migrate

# Rollback da última migration
rails db:rollback

# Rollback de múltiplas migrations
rails db:rollback STEP=3

# Status de todas as migrations
rails db:migrate:status

# Testar reversibilidade das últimas 5 migrations
bin/test_migrations

# Auditar todas as migrations
rails db:migrate:audit

# Verificar padrões inseguros
rails db:migrate:check_unsafe

# Listar migrations com def down explícito
rails db:migrate:list_reversible
```

### Boas Práticas

Sempre siga as boas práticas documentadas em `docs/MIGRATION_BEST_PRACTICES.md`:

1. ✅ **Teste o rollback** antes de fazer merge
2. ✅ **Use `def change`** apenas para operações reversíveis automaticamente
3. ✅ **Use `def up`/`def down`** para operações como `change_column`, `execute`, etc.
4. ✅ **Adicione guards defensivos** (`column_exists?`, `index_exists?`, etc.)
5. ✅ **Separe data migrations** de schema changes
6. ❌ **Nunca use models** diretamente em migrations (defina inline se necessário)
7. ❌ **Não misture DDL e DML** na mesma migration

### Exemplo de Migration Segura

```ruby
class AddEmailToUsers < ActiveRecord::Migration[7.0]
  def change
    unless column_exists?(:users, :email)
      add_column :users, :email, :string
      add_index :users, :email, unique: true
    end
  end
end
```

### Exemplo de Migration com Reversão Explícita

```ruby
class ChangeUserStatus < ActiveRecord::Migration[7.0]
  def up
    change_column :users, :status, :integer, default: 0
  end

  def down
    change_column :users, :status, :string, default: 'active'
  end
end
```

### Auditoria e Relatórios

O projeto inclui documentação completa sobre migrations:

- 📋 **[Auditoria Completa](./docs/MIGRATIONS_AUDIT.md)** - Análise detalhada de todas as migrations
- 📘 **[Guia de Boas Práticas](./docs/MIGRATION_BEST_PRACTICES.md)** - Templates e exemplos
- 🧪 **[Script de Teste](./bin/test_migrations)** - Testa reversibilidade automaticamente

### Métricas Atuais

- **Total de Migrations**: 71
- **Migrations Reversíveis**: 62/71 (87%)
- **Com `def down` Explícito**: 7/71 (10%)
- **Status Geral**: 🟡 Bom (1 correção aplicada)

Para mais detalhes, consulte `docs/MIGRATIONS_AUDIT.md`.

## 💰 Configuração de Financiamento

O sistema possui um módulo de configuração de financiamento acessível via Active Admin.

### Recursos
- **Abas Organizacionais**: Configurações separadas por contexto (Geral, Taxas, Limites).
- **Validações**: Regras estritas para garantir consistência financeira.
- **Histórico**: Versionamento de todas as alterações via PaperTrail.
- **Ferramentas**:
  - Reset para padrões
  - Importação de JSON
  - Simulação rápida na sidebar

### Como Adicionar Novos Parâmetros
1. Adicione o campo na migration e no model `FinancingConfiguration`.
2. Atualize `app/admin/financing_configurations.rb` para incluir o campo no formulário e `permit_params`.
3. As validações e histórico serão aplicados automaticamente.

## 📄 Licença

[MIT](https://choosealicense.com/licenses/mit/)

## 👥 Time

- **Tech Lead**: [@your-team](https://github.com/your-team)
- **Backend Developers**: Contribuidores do projeto

## 🔗 Links Úteis

- [Documentação da API](./docs/api.md)
- [Guia de Arquitetura](./docs/architecture.md)
- [CHANGELOG](./CHANGELOG.md)
- [Roadmap do Projeto](../TASKS_MASTER.md)
- [Frontend Repository](../AB0-1-front/README.md)

---

**Última atualização**: Outubro 2024  
**Versão**: 1.0.0
