# Quickstart — /companies Performance A+++

## Como Executar Localmente

### 1. Frontend
```bash
cd AB0-1-front
npm install
npm run dev
```
Acesse `http://localhost:3000/companies`.

### 2. Backend
```bash
cd AB0-1-back
bundle exec rails s -p 3001
```

### 3. Validação dos Testes
```bash
# Frontend
cd AB0-1-front
npm run typecheck
npm run lint
npm run test -- components/CompanyCard.spec.tsx

# Backend
cd AB0-1-back
bundle exec rspec spec/requests/api/v1/companies_spec.rb
```
