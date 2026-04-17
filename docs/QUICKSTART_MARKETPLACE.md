# 🚀 QUICK START - MARKETPLACE MATERIAIS CONSTRUÇÃO

**Guia Rápido de Implementação**

---

## ⚡ 5 MINUTOS PARA COMEÇAR

### 1. Clonar Template

```bash
# Criar monorepo
mkdir materials-marketplace
cd materials-marketplace

# Backend
git clone <template-backend> backend

# Frontend
git clone <template-frontend> frontend

# Docker
mkdir infra
```

### 2. Variáveis de Ambiente

```bash
# backend/.env.local
DATABASE_URL="postgresql://user:password@localhost:5432/materials_marketplace"
REDIS_URL="redis://localhost:6379"
ELASTICSEARCH_URL="http://localhost:9200"
JWT_SECRET="seu-secret-super-seguro-aqui"
STRIPE_KEY="sk_test_..."
SENDGRID_API_KEY="SG..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET="materials-marketplace-images"
NODE_ENV="development"
```

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_STRIPE_KEY="pk_test_..."
```

### 3. Iniciar Stack

```bash
# Terminal 1: Database + Cache + Search
docker-compose up -d

# Terminal 2: Backend
cd backend && npm install && npm run dev

# Terminal 3: Frontend
cd frontend && npm install && npm run dev
```

**Done!** 🎉
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

---

## 🎯 FEATURES ESSENCIAIS (MVP)

### User Authentication
```typescript
// POST /api/auth/register
{
  "email": "user@example.com",
  "password": "123456",
  "name": "João Silva",
  "role": "customer"
}
```

### Listar Produtos
```typescript
// GET /api/products?page=1&limit=20&category=cimento&sort=price_asc
```

### Busca Full-Text
```typescript
// GET /api/products/search?q=cimento+branco
```

### Adicionar Carrinho
```typescript
// POST /api/cart
{
  "product_id": "uuid",
  "quantity": 5
}
```

### Criar Pedido
```typescript
// POST /api/orders
{
  "items": [{ "product_id": "uuid", "quantity": 5 }],
  "shipping_address": {},
  "payment_method": "stripe"
}
```

---

## 📊 BANCO DE DADOS INICIAL

```sql
-- Categorias principais
INSERT INTO categories (name, slug) VALUES
('Cimento', 'cimento'),
('Tijolos e Blocos', 'tijolos'),
('Estruturas Metálicas', 'ferro'),
('Madeira', 'madeira'),
('Tintas e Vernizes', 'tintas'),
('Hidráulica', 'hidraulica'),
('Elétrica', 'eletrica'),
('Ferramentas', 'ferramentas');

-- Fornecedor de teste
INSERT INTO users (email, password_hash, name, role, company_name, cnpj) VALUES
('fornecedor@example.com', '$2a$10$hash', 'Fornecedor Test', 'supplier', 'Empresa LTDA', '12.345.678/0001-90');

-- Produto de teste
INSERT INTO products (supplier_id, category_id, name, description, price, quantity_in_stock) VALUES
('uuid', 1, 'Cimento Portland 50kg', 'Cimento de alta qualidade', 45.90, 1000);
```

---

## 🔑 PRINCIPAIS ENDPOINTS

### Auth
```
POST   /api/auth/register       - Registrar
POST   /api/auth/login          - Login
POST   /api/auth/refresh        - Refresh token
POST   /api/auth/logout         - Logout
GET    /api/auth/me             - Perfil atual
```

### Products
```
GET    /api/products            - Listar (com filtros)
GET    /api/products/:id        - Detalhe
POST   /api/products            - Criar (supplier)
PUT    /api/products/:id        - Atualizar
DELETE /api/products/:id        - Deletar
GET    /api/products/search     - Busca full-text
```

### Cart
```
GET    /api/cart                - Ver carrinho
POST   /api/cart                - Adicionar item
PUT    /api/cart/:itemId        - Atualizar quantidade
DELETE /api/cart/:itemId        - Remover item
```

### Orders
```
GET    /api/orders              - Meus pedidos
POST   /api/orders              - Criar pedido
GET    /api/orders/:id          - Detalhe do pedido
PUT    /api/orders/:id/cancel   - Cancelar pedido
```

### Reviews
```
GET    /api/products/:id/reviews   - Avaliações do produto
POST   /api/reviews                - Criar avaliação
```

### Supplier
```
GET    /api/supplier/dashboard     - Dashboard
GET    /api/supplier/products      - Meus produtos
GET    /api/supplier/orders        - Meus pedidos
GET    /api/supplier/analytics     - Análises
```

---

## 🎨 PÁGINAS PRINCIPAIS (Frontend)

```
/                              - Homepage
/products                      - Listagem de produtos
/products/:slug               - Detalhe do produto
/search                       - Busca avançada
/cart                         - Carrinho
/checkout                     - Checkout
/account/login                - Login
/account/register             - Registro
/account/profile              - Meu perfil
/account/orders               - Meus pedidos
/account/addresses            - Endereços
/supplier/dashboard           - Dashboard fornecedor
/supplier/products            - Gerenciar produtos
/supplier/orders              - Gerenciar pedidos
/supplier/analytics           - Análises
/admin/dashboard              - Admin panel
```

---

## 💾 TECNOLOGIAS VERSÃO MÍNIMA

| Tecnologia | Versão | Motivo |
|-----------|--------|--------|
| Node.js | 18+ | Performance, features |
| PostgreSQL | 14+ | JSON support |
| Redis | 6+ | Caching |
| React | 18+ | Hooks, SSR |
| Next.js | 14+ | App Router |
| TypeScript | 5+ | Type safety |
| Tailwind | 3+ | Utility CSS |

---

## 📦 DEPENDÊNCIAS PRINCIPAIS

### Backend

```json
{
  "express": "^4.18.2",
  "typescript": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "zod": "^3.22.0",
  "redis": "^4.6.0",
  "axios": "^1.4.0",
  "stripe": "^13.0.0",
  "nodemailer": "^6.9.0",
  "bull": "^4.11.0",
  "cors": "^2.8.5",
  "helmet": "^7.0.0"
}
```

### Frontend

```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^5.0.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.4.0",
  "react-hook-form": "^7.45.0",
  "zod": "^3.22.0",
  "tailwindcss": "^3.3.0",
  "@radix-ui/react-dialog": "^1.1.0",
  "axios": "^1.4.0",
  "@stripe/react-stripe-js": "^2.0.0"
}
```

---

## 🧪 TESTING

### Backend

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Frontend

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📈 ROADMAP PÓS-MVP

### Fase 2 (Semanas 7-12)
- [ ] Dashboard Analytics avançado
- [ ] Recomendações de produto (ML)
- [ ] Wishlist
- [ ] Comparador de preços
- [ ] Integração com ERP
- [ ] WhatsApp Business API
- [ ] Cupons de desconto

### Fase 3 (Semanas 13+)
- [ ] Mobile app (React Native)
- [ ] Chat em tempo real
- [ ] Video conferência (fornecedor)
- [ ] Marketplace de serviços
- [ ] Blockchain para verificação
- [ ] AR para visualização

---

## 🚀 DEPLOYMENT

### Staging

```bash
# GitHub -> Actions -> Deploy to Staging
# Frontend: vercel.app
# Backend: Railway.app ou Render.com
```

### Production

```bash
# GitHub -> Actions -> Deploy to Production
# Frontend: AWS CloudFront + S3
# Backend: AWS ECS + RDS + ElastiCache
# Database: AWS RDS PostgreSQL
# CDN: CloudFlare
```

### Checklist Deploy

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL/TLS enabled
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Error tracking (Sentry)
- [ ] Logging (CloudWatch/ELK)
- [ ] Auto-scaling configured
- [ ] Rate limiting enabled
- [ ] CORS properly set

---

## 🐛 TROUBLESHOOTING

### Backend não conecta ao PostgreSQL
```bash
# Checar se container está rodando
docker ps

# Ver logs
docker logs materials-marketplace-postgres-1

# Resetar database
docker compose down -v
docker compose up -d
```

### Frontend não consegue acessar API
```bash
# Verificar CORS
curl -i -X OPTIONS http://localhost:3001

# Checar env variables
echo $NEXT_PUBLIC_API_URL

# Limpar cache Next.js
rm -rf .next
npm run dev
```

### Redis connection refused
```bash
# Checar se Redis está rodando
redis-cli ping

# Reiniciar
docker restart materials-marketplace-redis-1
```

---

## 📞 CONTATO & SUPORTE

- GitHub Issues: Para bugs e features
- Discussions: Para dúvidas e ideias
- Email: support@materials-marketplace.com
- Discord: [Link da comunidade]

---

**Última atualização:** 24/02/2026  
**Próxima versão:** 2.0 (com mobile)
