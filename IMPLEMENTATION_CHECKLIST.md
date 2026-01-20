# ✅ Checklist de Implementação - Avalia Solar

## 🎯 Tarefas Prioritárias (Semana 1-2)

### Backend Rails - Corrigir Estrutura Atual

- [ ] **TASK-001: Corrigir 404s - Criar API Endpoints Básicos**
  ```bash
  # No backend (AB0-1-back/):
  rails g controller Api::V1::Products index show --skip-routes
  rails g controller Api::V1::Posts index show --skip-routes
  rails g controller Api::V1::Companies index show --skip-routes
  ```
  - [ ] Implementar controllers em `app/controllers/api/v1/`
  - [ ] Adicionar rotas em `config/routes.rb`
  - [ ] Testar endpoints com Postman/curl

- [ ] **TASK-002: Criar Models Essenciais**
  ```bash
  rails g model Company name:string slug:string cnpj:string email:string phone:string city:string state:string description:text average_rating:decimal reviews_count:integer verified:boolean
  
  rails g model Product name:string slug:string company:references category:references description:text price:decimal power_rating:decimal manufacturer:string warranty_years:integer featured:boolean
  
  rails g model Category name:string slug:string description:text active:boolean products_count:integer
  
  rails g model Review user:references company:references rating:integer title:string content:text approved:boolean
  
  rails g model Post title:string slug:string content:text excerpt:text meta_title:string meta_description:text category:references author:references published:boolean published_at:datetime views_count:integer
  
  rails g model Lead user:references company:references name:string email:string phone:string city:string state:string consumption_kwh:decimal message:text status:integer
  
  rails g model LocalPage city:string state:string slug:string content:text meta_title:string meta_description:text latitude:decimal longitude:decimal
  ```
  - [ ] Executar migrations: `rails db:migrate`
  - [ ] Adicionar validações nos models
  - [ ] Adicionar associations (has_many, belongs_to)
  - [ ] Implementar FriendlyId para slugs SEO

- [ ] **TASK-003: Seed Data Inicial**
  ```ruby
  # db/seeds.rb
  # Criar 5 categorias
  # Criar 10 empresas (incluindo WEG Solar, Canadian Solar BR)
  # Criar 20 produtos
  # Criar 5 posts de blog
  # Criar páginas locais para SC, PR, RS
  ```
  - [ ] Executar: `rails db:seed`
  - [ ] Verificar no Rails console: `rails c`

### Frontend Next.js - Criar Páginas Faltantes

- [ ] **TASK-004: Corrigir /products**
  ```bash
  # No frontend (AB0-1-front/):
  mkdir -p app/products
  touch app/products/page.tsx
  touch app/products/[slug]/page.tsx
  ```
  - [ ] Implementar ProductsPage com grid
  - [ ] Implementar ProductDetailPage
  - [ ] Conectar com API Rails
  - [ ] Adicionar loading states

- [ ] **TASK-005: Corrigir /blog**
  ```bash
  mkdir -p app/blog
  touch app/blog/page.tsx
  touch app/blog/[slug]/page.tsx
  ```
  - [ ] Implementar BlogPage com lista
  - [ ] Implementar BlogPostPage
  - [ ] Schema.org Article markup
  - [ ] Related posts section

- [ ] **TASK-006: Criar /companies**
  ```bash
  mkdir -p app/companies
  touch app/companies/page.tsx
  touch app/companies/[slug]/page.tsx
  ```
  - [ ] Lista com filtros (cidade, estado, rating)
  - [ ] Página individual com reviews
  - [ ] Schema.org LocalBusiness
  - [ ] Formulário de orçamento

### SEO Básico - Core Implementation

- [ ] **TASK-007: Sitemap Dinâmico**
  - [ ] Criar `app/sitemap.ts`
  - [ ] Fetch all companies, products, posts, local pages
  - [ ] Definir priorities e change frequencies
  - [ ] Testar em `/sitemap.xml`

- [ ] **TASK-008: Robots.txt**
  - [ ] Criar `app/robots.ts`
  - [ ] Disallow /admin/, /api/, /_next/
  - [ ] Adicionar sitemap URL
  - [ ] Testar em `/robots.txt`

- [ ] **TASK-009: Meta Tags Dinâmicas**
  - [ ] Implementar `generateMetadata()` em todas as páginas dinâmicas
  - [ ] OpenGraph tags
  - [ ] Twitter Card tags
  - [ ] Canonical URLs

- [ ] **TASK-010: Schema.org JSON-LD**
  - [ ] Componente SchemaMarkup reutilizável
  - [ ] Organization schema na homepage
  - [ ] Product schema em /products/[slug]
  - [ ] Article schema em /blog/[slug]
  - [ ] LocalBusiness schema em /companies/[slug]
  - [ ] Validar em schema.org validator

### Performance - Core Web Vitals

- [ ] **TASK-011: Otimização de Imagens**
  - [ ] Usar next/image em todos os lugares
  - [ ] Converter para WebP/AVIF
  - [ ] Lazy loading (exceto above-the-fold)
  - [ ] Definir sizes e srcset adequados

- [ ] **TASK-012: Code Splitting**
  - [ ] Dynamic imports para componentes pesados
  - [ ] Lazy load calculadora
  - [ ] Suspense boundaries

- [ ] **TASK-013: Caching Strategy**
  ```typescript
  // next.config.js headers
  Cache-Control: public, max-age=31536000, immutable (imagens)
  Cache-Control: public, s-maxage=3600, stale-while-revalidate (páginas)
  ```

---

## 🚀 Tarefas Médio Prazo (Semana 3-6)

### Features Essenciais

- [ ] **TASK-014: Sistema de Reviews**
  - [ ] Form de criação de review
  - [ ] Validação (min 50 chars)
  - [ ] Aprovação por admin (ActiveAdmin)
  - [ ] Cálculo de average_rating
  - [ ] Display com estrelas

- [ ] **TASK-015: Formulário de Leads**
  - [ ] Form com validação (Zod)
  - [ ] POST para `/api/v1/leads`
  - [ ] Email notification (ActionMailer)
  - [ ] Integração WhatsApp (opcional)
  - [ ] Thank you page

- [ ] **TASK-016: Calculadora de Payback**
  - [ ] Sliders para consumo, tarifa, custo
  - [ ] Select de cidade (para radiação solar)
  - [ ] Cálculo dinâmico
  - [ ] Visualização com Recharts
  - [ ] Share results

- [ ] **TASK-017: Comparador de Produtos**
  - [ ] Seleção de até 3 produtos
  - [ ] Tabela comparativa side-by-side
  - [ ] Destacar diferenças
  - [ ] Export to PDF

- [ ] **TASK-018: Páginas Locais**
  - [ ] Template para /local/[state]/[city]
  - [ ] Google Maps embed
  - [ ] Lista de empresas locais
  - [ ] Conteúdo SEO otimizado
  - [ ] 20 páginas (SC: 10, PR: 5, RS: 5)

### Blog & Content

- [ ] **TASK-019: 10 Posts Evergreen**
  - [ ] "Melhor Inversor Solar 2026" (slug: melhor-inversor-solar-2026)
  - [ ] "Painel Solar: Guia Completo" (slug: guia-completo-paineis-solares)
  - [ ] "Quanto Custa Energia Solar?" (slug: quanto-custa-energia-solar)
  - [ ] "Energia Solar Santa Catarina" (slug: energia-solar-santa-catarina)
  - [ ] "Financiamento Energia Solar" (slug: financiamento-energia-solar)
  - [ ] "Como Funciona Energia Solar" (slug: como-funciona-energia-solar)
  - [ ] "Retorno Investimento Solar" (slug: retorno-investimento-solar)
  - [ ] "Manutenção Sistema Solar" (slug: manutencao-sistema-solar)
  - [ ] "Incentivos Governo" (slug: incentivos-governo-energia-solar)
  - [ ] "Top 10 Empresas SC" (slug: top-empresas-energia-solar-sc)
  
  **Requisitos por post:**
  - [ ] 1500+ palavras
  - [ ] Headings H2/H3 com keywords
  - [ ] Imagens otimizadas (alt text)
  - [ ] Internal links (3+)
  - [ ] CTA no final
  - [ ] Meta description < 160 chars

### Integrações

- [ ] **TASK-020: Google Analytics 4**
  - [ ] Criar propriedade GA4
  - [ ] Script no layout.tsx
  - [ ] Event tracking (form submissions, clicks)
  - [ ] Conversions setup

- [ ] **TASK-021: Google Search Console**
  - [ ] Verificação de propriedade
  - [ ] Submit sitemap
  - [ ] Monitor indexação
  - [ ] Fix erros de crawling

- [ ] **TASK-022: Google Maps API**
  - [ ] Obter API key
  - [ ] Embed maps em /local pages
  - [ ] Markers para empresas
  - [ ] Directions API (opcional)

---

## 🔒 Segurança & Qualidade (Semana 7-8)

### Security

- [ ] **TASK-023: Rate Limiting**
  - [ ] Rack::Attack configurado
  - [ ] Throttle API endpoints
  - [ ] Block suspicious IPs
  - [ ] Whitelist admin IPs

- [ ] **TASK-024: CORS Configuration**
  - [ ] Rack-CORS setup
  - [ ] Permitir apenas frontend domain
  - [ ] Headers corretos

- [ ] **TASK-025: Environment Variables**
  - [ ] .env.example atualizado
  - [ ] Secrets no GitHub Secrets
  - [ ] Nunca commitar .env

### Testing

- [ ] **TASK-026: Backend Tests (RSpec)**
  - [ ] Model specs (validations, associations)
  - [ ] Request specs (API endpoints)
  - [ ] Coverage > 80%
  - [ ] CI/CD integration

- [ ] **TASK-027: Frontend Tests (Jest)**
  - [ ] Component tests (React Testing Library)
  - [ ] Integration tests
  - [ ] E2E tests (Playwright)
  - [ ] Coverage > 70%

### Monitoring

- [ ] **TASK-028: Sentry Setup**
  - [ ] Frontend (@sentry/nextjs)
  - [ ] Backend (sentry-rails)
  - [ ] Error alerts configurados

- [ ] **TASK-029: Logging**
  - [ ] Lograge no Rails
  - [ ] Structured logs
  - [ ] Log rotation

---

## 📊 Deploy & Infrastructure (Semana 9-10)

### Production Deploy

- [ ] **TASK-030: Frontend Deploy (Vercel)**
  - [ ] Conectar repositório GitHub
  - [ ] Environment variables
  - [ ] Custom domain (www.avaliasolar.com.br)
  - [ ] SSL certificate

- [ ] **TASK-031: Backend Deploy (Railway/Heroku)**
  - [ ] Procfile configurado
  - [ ] Database (PostgreSQL addon)
  - [ ] Redis addon
  - [ ] Environment variables
  - [ ] Domain (api.avaliasolar.com.br)

- [ ] **TASK-032: CDN & Assets**
  - [ ] CloudFlare/Cloudinary para imagens
  - [ ] S3 bucket para uploads
  - [ ] Active Storage configurado

- [ ] **TASK-033: CI/CD Pipeline**
  - [ ] GitHub Actions workflow
  - [ ] Auto-deploy on merge to main
  - [ ] Run tests before deploy
  - [ ] Rollback strategy

### Backups & Monitoring

- [ ] **TASK-034: Database Backups**
  - [ ] Daily automated backups
  - [ ] Retention policy (30 days)
  - [ ] Restore procedure documented

- [ ] **TASK-035: Uptime Monitoring**
  - [ ] Pingdom/UptimeRobot
  - [ ] Alert on downtime
  - [ ] Status page

---

## 🎨 UI/UX Refinements (Semana 11-12)

- [ ] **TASK-036: Mobile Optimization**
  - [ ] Responsive design (320px+)
  - [ ] Touch targets > 48px
  - [ ] Fast tap interactions

- [ ] **TASK-037: Accessibility (a11y)**
  - [ ] ARIA labels
  - [ ] Keyboard navigation
  - [ ] Color contrast (WCAG AA)
  - [ ] Screen reader testing

- [ ] **TASK-038: Loading States**
  - [ ] Skeletons
  - [ ] Spinners
  - [ ] Error boundaries

- [ ] **TASK-039: Animations**
  - [ ] Framer Motion transitions
  - [ ] Smooth scrolling
  - [ ] Micro-interactions

---

## 📈 Growth & Marketing (Mês 4+)

- [ ] **TASK-040: Link Building**
  - [ ] Parcerias com empresas
  - [ ] Guest posts em blogs
  - [ ] Diretórios de negócios
  - [ ] Link recíprocos

- [ ] **TASK-041: Content Marketing**
  - [ ] 2 posts/semana
  - [ ] Newsletter
  - [ ] Social media (Instagram, LinkedIn)

- [ ] **TASK-042: Paid Ads**
  - [ ] Google Ads (keywords research)
  - [ ] Facebook/Instagram Ads
  - [ ] Retargeting

---

## ✅ Definition of Done

Cada task é considerada "Done" quando:

1. ✅ **Código implementado** e testado localmente
2. ✅ **Tests escritos** (backend: RSpec, frontend: Jest)
3. ✅ **Code review** aprovado
4. ✅ **Documentação** atualizada
5. ✅ **Deploy em staging** e validado
6. ✅ **Deploy em production** sem erros
7. ✅ **Monitoramento** (Sentry sem novos erros)

---

## 🏆 Métricas de Sucesso

### Semana 4 (MVP)
- [ ] 0 páginas 404
- [ ] Homepage carrega em < 3s
- [ ] 50+ empresas no DB
- [ ] Sitemap com 100+ URLs
- [ ] Google Search Console ativo

### Mês 3
- [ ] 500+ visitantes/mês
- [ ] 20+ leads/mês
- [ ] 10 posts publicados
- [ ] Core Web Vitals "Good"
- [ ] 50+ páginas indexadas no Google

### Mês 6
- [ ] 10k visitantes/mês
- [ ] 100+ leads/mês
- [ ] 100 reviews de usuários
- [ ] 20+ backlinks
- [ ] Domain Authority > 20

---

**Status Tracking:** Use GitHub Projects ou Trello para acompanhar progresso  
**Daily Standup:** O que fiz ontem? O que farei hoje? Algum blocker?  
**Weekly Review:** Revisar KPIs e ajustar prioridades

**Última Atualização:** 2026-01-19
