# 📚 ÍNDICE GERAL - Company Dashboard Documentation

**Documentação Técnica Completa do Dashboard da Empresa**  
**Avalia Solar - Marketplace Energia Solar**

---

## 📖 DOCUMENTOS DISPONÍVEIS

### 1. **SUMARIO-DASHBOARD.md** (Principal) ⭐
   - **Tamanho:** ~60KB / 50+ páginas
   - **Conteúdo:**
     - ✅ Visão geral da arquitetura
     - ✅ Stack tecnológico completo
     - ✅ Estrutura de diretórios (frontend + backend)
     - ✅ Componentes React detalhados
     - ✅ API endpoints documentados
     - ✅ Models e Services Ruby
     - ✅ Fluxo de autenticação/autorização
     - ✅ Funcionalidades por tab (13 tabs)
     - ✅ WebSockets e real-time
     - ✅ Code snippets essenciais
     - ✅ Melhorias futuras
   - **Público:** Senior Developers, Tech Leads, Arquitetos

### 2. **DASHBOARD-DIAGRAMS.md** (Complementar)
   - **Tamanho:** ~45KB
   - **Conteúdo:**
     - ✅ 8 diagramas ASCII art
     - ✅ Component Hierarchy
     - ✅ Data Flow (Update Info)
     - ✅ Authentication Flow
     - ✅ WebSocket Real-time Updates
     - ✅ Database Schema
     - ✅ Tab Navigation State
     - ✅ Stats Calculation Flow
     - ✅ Approval Workflow
   - **Público:** Visual learners, novos membros da equipe

---

## 🎯 GUIA DE USO

### Para Novos Desenvolvedores:
1. Leia **SUMARIO-DASHBOARD.md** seções 1-3 (Arquitetura + Stack)
2. Visualize **DASHBOARD-DIAGRAMS.md** diagramas 1-3
3. Retorne ao **SUMARIO-DASHBOARD.md** seção 4 (Componentes)
4. Execute a aplicação seguindo setup do README.md

### Para Code Review:
1. Consulte **SUMARIO-DASHBOARD.md** seção 5 (API Backend)
2. Verifique **Code Snippets Essenciais** (seção 12)
3. Compare com **DASHBOARD-DIAGRAMS.md** fluxos de dados

### Para Debugging:
1. Identifique o componente no **Diagrama 1** (Component Hierarchy)
2. Veja API relacionada no **SUMARIO-DASHBOARD.md** seção 5
3. Trace fluxo de dados no **Diagrama 2** (Data Flow)
4. Verifique logs usando patterns da seção 6 (Fluxo de Dados)

### Para Novas Features:
1. Revise **Melhorias Futuras** no **SUMARIO-DASHBOARD.md**
2. Analise arquitetura existente nos diagramas
3. Mantenha consistência com padrões documentados

---

## 📊 ESTRUTURA DO SUMARIO-DASHBOARD.md

```
1. Visão Geral da Arquitetura
   - Diagrama de alto nível
   - Camadas da aplicação

2. Stack Tecnológico
   - Frontend (Next.js, React, TypeScript)
   - Backend (Rails, Ruby, PostgreSQL)
   - Infrastructure

3. Estrutura de Diretórios
   - Frontend: /app/dashboard/
   - Backend: /app/controllers/, /app/models/, /app/services/

4. Componentes Frontend
   4.1 Entry Point (page.tsx)
   4.2 Main Container (EnterpriseDashboard.tsx)
   4.3 Sidebar (EnterpriseSidebar.tsx)
   4.4 Header (EnterpriseHeader.tsx)
   4.5 Tab Components (13 tabs)

5. API Backend
   - CompanyDashboardController
   - 16 endpoints documentados
   - Exemplos de request/response

6. Fluxo de Dados
   - Exemplo completo: Update Company Info
   - 8 etapas detalhadas

7. Models e Services
   - Company model
   - StatsService
   - Associações e validações

8. Autenticação e Autorização
   - JWT flow
   - Role-based access control
   - Middleware implementation

9. Funcionalidades por Tab
   9.1 Overview (KPIs, quick actions)
   9.2 Company Info (edit, upload)
   9.3 Categories (manage, approval)
   9.4 Banners (sponsorship)
   9.5 Products (CRUD)
   9.6 Reviews (manage, respond)
   9.7 Media (gallery, videos)
   9.8 Leads (CRM)
   9.9 Campaigns (marketing)
   9.10 Analytics (3 subtabs)
   9.11 Settings (account, team)

10. WebSockets e Real-time
    - ActionCable setup
    - Frontend subscription
    - Event handling

11. Diagramas (referência ao outro arquivo)

12. Code Snippets Essenciais
    - useCompanyData hook
    - handleSubmit function
    - approve pending change
    - stats service

13. Melhorias Futuras
    - Phase 1: Performance
    - Phase 2: Features
    - Phase 3: Analytics
    - Phase 4: Integrations
```

---

## 📊 ESTRUTURA DO DASHBOARD-DIAGRAMS.md

```
Diagrama 1: Component Hierarchy
   - Tree view de todos os componentes
   - Relação pai-filho
   - Props flow

Diagrama 2: Data Flow - Update Company Info
   - 8 etapas detalhadas
   - Frontend → Backend → DB → WebSocket

Diagrama 3: Authentication Flow
   - 6 etapas: Login → Verify → Load Dashboard

Diagrama 4: WebSocket Real-time Updates
   - Subscription
   - Event triggers
   - Message handling

Diagrama 5: Database Schema (Simplified)
   - 10 tabelas principais
   - Relacionamentos
   - Campos importantes

Diagrama 6: Tab Navigation State Management
   - URL ↔ State sync
   - useSearchParams
   - Router push

Diagrama 7: Stats Calculation Flow
   - Cache strategy
   - Parallel queries
   - Response format

Diagrama 8: Approval Workflow
   - Company submits
   - Admin reviews
   - Notification flow
```

---

## 🔍 QUICK REFERENCE

### Arquivos Principais (Frontend)

| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| `app/dashboard/company/page.tsx` | Entry point | ~50 |
| `components/EnterpriseDashboard.tsx` | Main container | ~400 |
| `components/EnterpriseSidebar.tsx` | Navigation | ~150 |
| `components/EnterpriseHeader.tsx` | Top bar | ~100 |
| `components/OverviewTab.tsx` | Overview tab | ~200 |
| `components/CompanyInfo.tsx` | Info tab | ~300 |
| `hooks/useCompanyData.ts` | Data fetching | ~50 |
| `lib/api.ts` | API client | ~200 |
| `lib/cable.ts` | WebSocket client | ~100 |

### Arquivos Principais (Backend)

| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| `controllers/company_dashboard_controller.rb` | Main API | ~400 |
| `models/company.rb` | Company model | ~500 |
| `models/pending_change.rb` | Approval workflow | ~100 |
| `services/company_dashboard/stats_service.rb` | Stats calc | ~150 |
| `channels/company_dashboard_channel.rb` | WebSocket | ~20 |

### Endpoints Mais Usados

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/v1/company_dashboard/stats` | GET | Load dashboard |
| `/api/v1/company_dashboard/update_info` | POST | Edit company |
| `/api/v1/company_dashboard/notifications` | GET | Notifications |
| `/api/v1/companies/:id` | GET | Company details |
| `/api/v1/companies/:id/products` | GET | Products list |
| `/api/v1/companies/:id/reviews` | GET | Reviews list |
| `/api/v1/companies/:id/leads` | GET | Leads list |

### Components por Categoria

**Layout:**
- EnterpriseDashboard.tsx
- EnterpriseSidebar.tsx
- EnterpriseHeader.tsx

**Tabs (Content):**
- OverviewTab.tsx
- CompanyInfo.tsx
- CategoriesManagement.tsx
- BannersSponsorship.tsx
- ProductsManagement.tsx
- ReviewsManagement.tsx
- MediaGallery.tsx
- LeadsOpportunities.tsx
- CampaignsMarketing.tsx

**Analytics:**
- ReviewsAnalytics.tsx
- PerformanceMetrics.tsx
- CompetitorBenchmark.tsx

**Settings:**
- CompanySettings.tsx

**UI Components:**
- EnterpriseMetricCard.tsx
- MetricCard.tsx
- ThemeToggle.tsx

---

## 🛠️ DEVELOPMENT WORKFLOW

### Setup Inicial
```bash
# Backend
cd AB0-1-back
bundle install
rails db:migrate
rails s -p 3001

# Frontend
cd AB0-1-front
npm install
npm run dev
```

### Acessar Dashboard
```
1. Fazer login: http://localhost:3000/login
2. Acessar: http://localhost:3000/dashboard/company
3. Navegar pelas tabs usando ?tab=<nome>
```

### Debug Backend
```bash
# Logs
tail -f log/development.log

# Console
rails console
> Company.find(1)
> company.stats
```

### Debug Frontend
```bash
# Dev tools
F12 → Network → XHR
F12 → Console → [API] logs

# React DevTools
View component tree
Check props/state
```

---

## 📞 SUPORTE

### Para Dúvidas Técnicas:
1. Consulte primeiro **SUMARIO-DASHBOARD.md**
2. Visualize diagramas relevantes em **DASHBOARD-DIAGRAMS.md**
3. Verifique código-fonte comentado
4. Abra issue no repositório (se aplicável)

### Para Novos Features:
1. Revise seção "Melhorias Futuras"
2. Mantenha padrões de código existentes
3. Documente novos endpoints/componentes
4. Atualize diagramas se necessário

### Para Bugs:
1. Identifique componente/endpoint afetado
2. Trace fluxo usando diagramas
3. Verifique logs (frontend + backend)
4. Reproduza em ambiente local
5. Documente steps e fix aplicado

---

## 📈 MÉTRICAS DO CÓDIGO

### Frontend
```
Total de Componentes: 35+
Total de Linhas: ~8,000
Tecnologias: TypeScript, React, Next.js 14, Tailwind
Testes: Playwright E2E
```

### Backend
```
Total de Controllers: 15+
Total de Models: 20+
Total de Services: 10+
Total de Linhas: ~15,000
Tecnologias: Ruby 3+, Rails 7+, PostgreSQL
Testes: RSpec (unit + integration)
```

### Documentação
```
Total de Páginas: 95+
SUMARIO-DASHBOARD.md: 50 páginas
DASHBOARD-DIAGRAMS.md: 45 páginas
Code Coverage: ~80%
```

---

## 🎯 ROADMAP

### Q1 2026
- [x] Implementação inicial do dashboard
- [x] Sistema de aprovação (pending changes)
- [x] WebSocket real-time
- [ ] Analytics avançados
- [ ] Mobile responsive completo

### Q2 2026
- [ ] AI review response suggestions
- [ ] Automated lead scoring
- [ ] A/B testing framework
- [ ] Integração CRM

### Q3 2026
- [ ] Mobile app (React Native)
- [ ] API v2 (GraphQL)
- [ ] Advanced permissions
- [ ] Multi-tenant support

### Q4 2026
- [ ] Marketplace integrations
- [ ] Payment gateway
- [ ] Automated reporting
- [ ] Predictive analytics

---

## 📝 CHANGELOG

| Data | Versão | Mudanças |
|------|--------|----------|
| 2026-01-20 | 1.0.0 | Documentação inicial completa |
| 2026-01-20 | 1.0.1 | Adicionado índice geral |

---

## 👥 CONTRIBUTORS

- Senior Full-Stack Architect (Documentação)
- Backend Team (Rails API)
- Frontend Team (Next.js Dashboard)
- DevOps Team (Infrastructure)

---

## 📚 LINKS ÚTEIS

**Documentação Externa:**
- Next.js: https://nextjs.org/docs
- Rails Guides: https://guides.rubyonrails.org
- PostgreSQL: https://www.postgresql.org/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs

**Repositórios Relacionados:**
- Frontend: `/AB0-1-front`
- Backend: `/AB0-1-back`
- Shared Types: `/shared` (se houver)

**Ferramentas:**
- shadcn/ui: https://ui.shadcn.com
- Framer Motion: https://www.framer.com/motion
- Lucide Icons: https://lucide.dev

---

**Última Atualização:** 2026-01-20  
**Versão:** 1.0.1  
**Mantido por:** Time de Arquitetura Avalia Solar

---

## 🎓 COMO USAR ESTA DOCUMENTAÇÃO

### Para Estudar:
1. Comece pelo **SUMARIO-DASHBOARD.md** seções 1-3
2. Acompanhe com **DASHBOARD-DIAGRAMS.md** diagramas 1-5
3. Pratique com code snippets da seção 12
4. Execute aplicação localmente

### Para Implementar:
1. Identifique feature similar em "Funcionalidades por Tab"
2. Copie padrão de código dos snippets
3. Adapte para seu caso de uso
4. Mantenha consistência de estilo

### Para Manter:
1. Atualize documentação ao adicionar features
2. Adicione novos diagramas se necessário
3. Versione mudanças no CHANGELOG
4. Mantenha code examples atualizados

---

**FIM DO ÍNDICE**

Total de Documentos: 2  
Total de Páginas: 95+  
Total de Diagramas: 8  
Coverage: Frontend + Backend completo
