# 🌞 Avalia Solar - Índice de Documentação

## 📚 Documentação Completa do Projeto

Bem-vindo ao Avalia Solar! Este índice organiza toda a documentação do marketplace de energia solar.

---

## 🎯 Para Começar AGORA

**Novato no projeto?** Leia nesta ordem:

1. **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** ⚡
   - Setup em 10 minutos
   - Como rodar local/Docker
   - Troubleshooting comum
   - **👉 COMECE AQUI!**

2. **[AVALIA_SOLAR_ARCHITECTURE.md](AVALIA_SOLAR_ARCHITECTURE.md)** 🏗️
   - Visão completa da arquitetura
   - Stack tecnológico detalhado
   - Database schemas
   - Componentes frontend
   - APIs e integrações

3. **[IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)** ✅
   - Tarefas priorizadas (TASK-001 a TASK-042)
   - Roadmap por semanas
   - Definition of Done
   - KPIs de sucesso

4. **[API_REFERENCE.md](API_REFERENCE.md)** 🔌
   - Todos os endpoints REST
   - Request/Response examples
   - Autenticação JWT
   - Error handling

---

## 📖 Guias por Área

### 🚀 Deploy & Infrastructure

- **[COMO_FAZER_DEPLOY.md](COMO_FAZER_DEPLOY.md)** - Deploy manual e automático
- **[CICD_IMPLEMENTATION.md](CICD_IMPLEMENTATION.md)** - CI/CD com GitHub Actions
- **[GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)** - Configurar secrets
- **[docker-compose.yml](docker-compose.yml)** - Orquestração de containers

### 🎨 Frontend (Next.js)

```
AB0-1-front/
├── README.md - Documentação específica do frontend
├── app/ - Next.js 14 App Router
├── components/ - Componentes React reutilizáveis
├── lib/ - Utilitários e configs
└── types/ - TypeScript interfaces
```

**Principais Features:**
- SSR para SEO
- React Query para data fetching
- Shadcn/UI components
- Framer Motion animations
- Better Auth para autenticação

### 🔧 Backend (Rails)

```
AB0-1-back/
├── README.md - Documentação específica do backend
├── app/models/ - ActiveRecord models
├── app/controllers/api/v1/ - API controllers
├── app/serializers/ - JSON serializers
├── app/admin/ - ActiveAdmin dashboard
└── db/migrations/ - Database migrations
```

**Principais Features:**
- RESTful API
- JWT authentication
- Sidekiq para background jobs
- Redis caching
- PostgreSQL full-text search

---

## 🐛 Fixes e Troubleshooting

### Documentos de Correções Anteriores

- **[FIX_DIGEST_ERROR.md](FIX_DIGEST_ERROR.md)** - Erro de Digest no Next.js
- **[FIX_IMAGENS_404.md](FIX_IMAGENS_404.md)** - Imagens não carregam
- **[FIX_REDIS_UPLOAD.md](FIX_REDIS_UPLOAD.md)** - Redis connection issues
- **[FIX_TYPESCRIPT_ERRORS.md](FIX_TYPESCRIPT_ERRORS.md)** - Erros TypeScript
- **[BACKEND_BUILD_FIX.md](BACKEND_BUILD_FIX.md)** - Build issues Rails
- **[FRONTEND_BUILD_FIX.md](FRONTEND_BUILD_FIX.md)** - Build issues Next.js

### Troubleshooting Comum

**Problema: "Port 3000 already in use"**
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Problema: "Database does not exist"**
```bash
cd AB0-1-back
rails db:create db:migrate db:seed
```

**Problema: "Module not found"**
```bash
cd AB0-1-front
rm -rf node_modules .next
npm install
```

---

## 📊 Análises e Relatórios

### Performance & SEO

- **[TECHNICAL_ANALYSIS_COMPLETE.md](TECHNICAL_ANALYSIS_COMPLETE.md)** - Análise técnica completa
- **[PERFORMANCE_OPTIMIZATION_REPORT.md](AB0-1-front/PERFORMANCE_OPTIMIZATION_REPORT.md)** - Otimizações aplicadas
- **lighthouse_report.json** - Lighthouse CI results

### Features Implementadas

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Resumo de implementações
- **[SENIOR_IMPROVEMENTS_FINAL.md](SENIOR_IMPROVEMENTS_FINAL.md)** - Melhorias sênior aplicadas
- **[SOLUCOES_APLICADAS.md](SOLUCOES_APLICADAS.md)** - Soluções técnicas

---

## 🎓 Recursos de Aprendizado

### Tutoriais Internos

- **[roteiro-de-estudo.md](roteiro-de-estudo.md)** - Roteiro de estudos
- **[task.md](task.md)** - Tarefas e sprints
- **[promt.md](promt.md)** - Prompts e guidelines

### Links Externos

**Stack Principal:**
- [Rails Guides](https://guides.rubyonrails.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

**SEO & Performance:**
- [Google Search Central](https://developers.google.com/search)
- [Web.dev (Core Web Vitals)](https://web.dev/vitals/)
- [Schema.org](https://schema.org/)

---

## 🧪 Testing

### Backend (RSpec)

```bash
cd AB0-1-back
bundle exec rspec                    # Todos os testes
bundle exec rspec spec/models/       # Model specs
COVERAGE=true bundle exec rspec      # Com coverage
```

### Frontend (Jest + Playwright)

```bash
cd AB0-1-front
npm test                             # Unit tests (Jest)
npm run test:watch                   # Watch mode
npx playwright test                  # E2E tests
npx playwright test --ui             # UI mode
```

### Scripts de Teste

- **[test-integration.sh](test-integration.sh)** - Testes de integração
- **[test-frontend-build.sh](test-frontend-build.sh)** - Build do frontend
- **[test-categories-refactor.sh](test-categories-refactor.sh)** - Testes de categorias

---

## 🔒 Segurança

### Configuração de Secrets

1. **Backend:** Copie `.env.development.example` para `.env.development`
2. **Frontend:** Copie `.env.example` para `.env.local`
3. **GitHub Secrets:** Siga [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)

### Gems de Segurança

- **Devise:** Autenticação de usuários
- **JWT:** Token-based auth
- **Pundit:** Autorização
- **Rack::Attack:** Rate limiting
- **Brakeman:** Security scanner

---

## 📞 Suporte

### Canais de Comunicação

- **GitHub Issues:** Para bugs e feature requests
- **Pull Requests:** Para contribuições de código
- **Email:** contato@avaliasolar.com.br
- **Documentação:** Este índice e arquivos referenciados

### Como Contribuir

1. Fork o repositório
2. Crie feature branch (`git checkout -b feature/minha-feature`)
3. Commit com mensagens semânticas (`feat:`, `fix:`, `docs:`)
4. Push para o branch (`git push origin feature/minha-feature`)
5. Abra Pull Request

**Commit Guidelines:**
```bash
feat: adiciona endpoint de reviews
fix: corrige 404 em /products
docs: atualiza API documentation
test: adiciona testes para Company model
refactor: melhora performance de queries
style: ajusta formatação de código
chore: atualiza dependências
```

---

## 📈 Roadmap

### ✅ Concluído (MVP Base)

- [x] Estrutura monorepo (Frontend + Backend)
- [x] Docker setup
- [x] CI/CD pipeline
- [x] Autenticação (Devise + JWT)
- [x] Admin panel (ActiveAdmin)
- [x] Models principais (Company, Product, Post)
- [x] API REST básica
- [x] Frontend com Next.js 14
- [x] Documentação inicial

### 🚧 Em Progresso (Semana 1-2)

- [ ] **TASK-001:** Corrigir 404s (/products, /blog)
- [ ] **TASK-002:** Criar models completos
- [ ] **TASK-003:** Seed data inicial
- [ ] **TASK-007:** Sitemap.xml dinâmico
- [ ] **TASK-008:** Robots.txt
- [ ] **TASK-009:** Meta tags dinâmicas
- [ ] **TASK-010:** Schema.org JSON-LD

### 📅 Próximo Sprint (Semana 3-4)

- [ ] **TASK-014:** Sistema de reviews
- [ ] **TASK-015:** Formulário de leads
- [ ] **TASK-016:** Calculadora de payback
- [ ] **TASK-017:** Comparador de produtos
- [ ] **TASK-018:** Páginas locais (20 cidades)
- [ ] **TASK-019:** 10 posts de blog SEO

### 🔮 Futuro (Mês 2+)

- [ ] **TASK-020-022:** Integrações (GA4, GSC, Maps)
- [ ] **TASK-023-025:** Segurança avançada
- [ ] **TASK-026-027:** Test coverage > 80%
- [ ] **TASK-030-033:** Deploy production
- [ ] **TASK-040-042:** Growth & Marketing

---

## 🎯 Métricas de Sucesso

### Technical KPIs

- **Core Web Vitals:**
  - LCP < 2.5s ✅
  - INP < 200ms ✅
  - CLS < 0.1 ✅

- **Code Quality:**
  - Test Coverage > 80% 🚧
  - Lighthouse Score > 90 ✅
  - Zero security vulnerabilities ✅

### Business KPIs

- **SEO (6 meses):**
  - 100+ páginas indexadas
  - 20+ backlinks de qualidade
  - Domain Authority > 30

- **Conversão (6 meses):**
  - 100 leads/mês
  - 10k visitantes/mês
  - 100 reviews de usuários

---

## 📁 Estrutura de Arquivos Importante

```
AB0-1-main/
├── 📘 QUICK_START_GUIDE.md         ⭐ COMECE AQUI
├── 📘 AVALIA_SOLAR_ARCHITECTURE.md  🏗️ Arquitetura
├── 📘 IMPLEMENTATION_CHECKLIST.md   ✅ Tarefas
├── 📘 API_REFERENCE.md              🔌 API Docs
├── 📘 INDEX.md                      📖 Este arquivo
│
├── AB0-1-front/                     🎨 Frontend Next.js
│   ├── app/                         └─ App Router
│   ├── components/                  └─ React Components
│   └── package.json                 └─ Dependencies
│
├── AB0-1-back/                      🔧 Backend Rails
│   ├── app/models/                  └─ ActiveRecord
│   ├── app/controllers/api/v1/      └─ API Controllers
│   └── Gemfile                      └─ Gems
│
├── docker-compose.yml               🐳 Docker Compose
├── .github/workflows/               🚀 CI/CD
└── docs/                            📚 Extra Docs
```

---

## 🆘 Ajuda Rápida

### Comandos Mais Usados

```bash
# Backend
cd AB0-1-back
rails s -p 3001                      # Iniciar servidor
rails c                              # Console
rails db:migrate                     # Rodar migrations
rails routes | grep api              # Ver rotas

# Frontend
cd AB0-1-front
npm run dev                          # Dev server
npm run build                        # Build production
npm test                             # Testes

# Docker
docker-compose up -d                 # Start all
docker-compose logs -f               # Ver logs
docker-compose exec backend rails c  # Rails console
docker-compose down                  # Parar tudo
```

### Variáveis de Ambiente Essenciais

**Backend (.env.development):**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/avaliasolar_dev
REDIS_URL=redis://localhost:6379/0
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🏆 Equipe e Créditos

**Desenvolvido por:** Equipe Avalia Solar  
**Stack:** Ruby on Rails 7 + Next.js 14 + PostgreSQL + Redis  
**Hospedagem:** DigitalOcean (Backend) + Vercel (Frontend)  
**Licença:** MIT

---

## 📝 Atualizações Recentes

**2026-01-19:**
- ✅ Criada documentação arquitetural completa
- ✅ Checklist de implementação com 42 tasks
- ✅ API Reference completo
- ✅ Quick Start Guide
- ✅ Este índice de navegação

**Próximas Atualizações:**
- Exemplos de código para cada TASK
- Vídeos tutoriais
- Swagger/OpenAPI spec
- Postman collection

---

## 🎓 Dicas para Novos Desenvolvedores

1. **Leia primeiro:** QUICK_START_GUIDE.md
2. **Configure ambiente:** Use Docker para facilitar
3. **Entenda a arquitetura:** AVALIA_SOLAR_ARCHITECTURE.md
4. **Escolha uma task:** IMPLEMENTATION_CHECKLIST.md (comece por TASK-001)
5. **Consulte a API:** API_REFERENCE.md quando precisar
6. **Teste localmente:** Sempre rode testes antes de commitar
7. **Siga os padrões:** Commits semânticos, code review, etc
8. **Pergunte:** Use GitHub Issues para dúvidas

---

**Bem-vindo ao time! 🚀**

Qualquer dúvida, consulte esta documentação ou abra uma issue no GitHub.

**Última Atualização:** 2026-01-19  
**Versão da Documentação:** 1.0.0
