# 🚨 PROMPT - Resolução de Erros 404 em Banners e Imagens

## 📋 CONTEXTO DO PROBLEMA

Estou tendo problemas com renderização de banners e imagens no meu sistema de marketplace (Avalia Solar).

### **Stack Tecnológica:**
- **Backend:** Ruby on Rails 7 + PostgreSQL + Active Storage
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind
- **Deploy:** Docker Compose na VM Ubuntu
- **Storage:** Active Storage com disk service

---

## ❌ ERROS ENCONTRADOS

### **1. Erros 404 em Active Storage**

```
GET https://api.avaliasolar.com.br/rails/active_storage/disk/eyJfcmFpbHM...png 404 (Not Found)
```

**Ocorre em:**
- ✅ Banners de categorias (funcionando em `/categories/{slug}`)
- ❌ Banners na landing page `/` (NÃO aparecem)
- ❌ Logos de empresas (CompanyCard)
- ❌ Banners de empresas

### **2. Logs do Backend**

```
I, [2026-01-08T03:19:08] {"method":"GET","path":"/rails/active_storage/disk/...","status":404}
```

---

## 📊 O QUE JÁ FIZEMOS

### ✅ **Correções Aplicadas:**

1. **Limpeza de anexos quebrados via Rails:**
```bash
docker compose exec backend bash -c "cd /app/AB0-1-back && bundle exec rails runner '
Category.find_each { |c| c.banner.purge if c.banner.attached? }
Company.find_each { |c| c.logo.purge if c.logo.attached? }
Banner.find_each { |b| b.image.purge if b.image.attached? }
'"
```

2. **Upload manual via Admin Panel:**
- Acessado: `https://api.avaliasolar.com.br/admin/categories`
- Upload de algumas imagens de categorias
- **Resultado:** Funciona em páginas específicas, mas não na landing page

3. **Adicionado componentes de banner no frontend:**
```typescript
// AB0-1-front/app/page.tsx
import BannerByLocation from '@/components/BannerByLocation';

<BannerByLocation location="home_top" className="mb-8" />
<BannerByLocation location="categories_top" className="mb-8" />
<BannerByLocation location="companies_top" className="mb-8" />
```

---

## 🔍 DIAGNÓSTICO ATUAL

### **Teste Manual da API:**

```bash
# Windows CMD
curl "https://api.avaliasolar.com.br/api/v1/banners"
# Retorna: [] (array vazio)

curl "https://api.avaliasolar.com.br/api/v1/banners?position=home_top"
# Retorna: [] (array vazio)
```

### **Verificação no banco via Rails Console:**

```bash
docker compose exec backend bash -c "cd /app/AB0-1-back && bundle exec rails runner '
puts \"Total Banners: #{Banner.count}\"
puts \"Total Categories com banner: #{Category.where.not(banner: nil).count}\"
puts \"Total Companies com logo: #{Company.where.not(logo: nil).count}\"
'"
```

---

## 🎯 OBJETIVOS

Preciso que você me ajude a:

1. **Identificar a causa raiz dos erros 404**
   - Por que alguns banners funcionam e outros não?
   - Por que logos de empresas não aparecem?
   - O problema é no Active Storage, no Nginx, ou na URL gerada?

2. **Corrigir renderização de banners na landing page**
   - Banners devem aparecer em 3 posições: `home_top`, `categories_top`, `companies_top`
   - Atualmente retornam array vazio da API

3. **Garantir que imagens funcionem em todos os dispositivos**
   - Desktop
   - Mobile
   - Tablets

---

## 📂 ESTRUTURA DO PROJETO

### **Backend (Rails):**
```
AB0-1-back/
├── app/
│   ├── models/
│   │   ├── banner.rb          # Modelo de Banner
│   │   ├── category.rb        # has_one_attached :banner
│   │   └── company.rb         # has_one_attached :logo, :banner
│   ├── controllers/api/v1/
│   │   ├── banners_controller.rb
│   │   ├── categories_controller.rb
│   │   └── companies_controller.rb
│   └── serializers/
│       ├── banner_serializer.rb
│       ├── category_serializer.rb
│       └── company_serializer.rb
└── storage/                   # Active Storage disk
```

### **Frontend (Next.js):**
```
AB0-1-front/
├── app/
│   └── page.tsx              # Landing page (problema aqui)
├── components/
│   ├── BannerByLocation.tsx  # Componente de banner
│   ├── BannerContainer.tsx
│   ├── CategoryCard.tsx
│   └── CompanyCard.tsx       # Logos não aparecem
└── hooks/
    └── useBanners.ts         # Hook para buscar banners
```

---

## 🔧 CONFIGURAÇÕES RELEVANTES

### **Active Storage (Rails):**

```yaml
# config/storage.yml
local:
  service: Disk
  root: <%= Rails.root.join("storage") %>

production:
  service: Disk
  root: <%= Rails.root.join("storage") %>
```

```ruby
# config/environments/production.rb
config.active_storage.service = :local
config.active_storage.resolve_model_to_route = :rails_storage_proxy

Rails.application.routes.default_url_options = {
  host: 'api.avaliasolar.com.br',
  protocol: 'https'
}
```

### **Docker Compose:**

```yaml
services:
  backend:
    volumes:
      - ./AB0-1-back/storage:/app/AB0-1-back/storage
    environment:
      RAILS_ENV: production
      RAILS_SERVE_STATIC_FILES: true
```

### **Nginx (Proxy Reverso):**

```nginx
# Backend
location /api/ {
    proxy_pass http://localhost:3001/api/;
}

location /rails/ {
    proxy_pass http://localhost:3001/rails/;
}

location /admin {
    proxy_pass http://localhost:3001/admin;
}

# Frontend
location / {
    proxy_pass http://localhost:3000/;
}
```

---

## 📝 MODELOS RELEVANTES

### **Banner Model:**

```ruby
class Banner < ApplicationRecord
  has_one_attached :image
  
  enum banner_type: {
    rectangular_large: 0,
    rectangular_small: 1,
    square: 2
  }
  
  enum position: {
    navbar: 0,
    sidebar: 1,
    categories_top: 2,
    home_top: 3,
    companies_top: 4
  }
  
  enum status: { active: 0, inactive: 1, draft: 2 }
  
  validates :title, presence: true
  validates :banner_type, presence: true
  validates :position, presence: true
end
```

### **Category Model:**

```ruby
class Category < ApplicationRecord
  has_one_attached :banner
  
  # Serialization
  def banner_url
    return nil unless banner.attached?
    Rails.application.routes.url_helpers.rails_blob_url(banner, only_path: false)
  end
end
```

---

## 🧪 CENÁRIOS DE TESTE

### **Cenário 1: Página de Categoria (✅ FUNCIONA)**
```
URL: https://www.avaliasolar.com.br/categories/recarga-condominios
Resultado: Banner aparece corretamente
```

### **Cenário 2: Landing Page (❌ NÃO FUNCIONA)**
```
URL: https://www.avaliasolar.com.br/
Resultado: Banners não aparecem
Console: [useBanners] Received: 0 banners
```

### **Cenário 3: Company Cards (❌ NÃO FUNCIONA)**
```
URL: https://www.avaliasolar.com.br/
Resultado: Logos não aparecem (404)
```

---

## 🚀 AÇÕES ESPERADAS

Por favor, me ajude a:

### **1. Diagnóstico Completo:**
- Criar script para verificar consistência do Active Storage
- Verificar permissões da pasta `storage/`
- Verificar se URLs geradas estão corretas
- Verificar se modelo Banner tem registros

### **2. Correção do Problema:**
- Corrigir geração de URLs do Active Storage
- Garantir que `rails_blob_url` funcione corretamente
- Criar banners de teste para `home_top`, `categories_top`, `companies_top`
- Corrigir renderização de logos de empresas

### **3. Script de Criação de Banners:**
- Script Rails para criar 3 banners com imagens placeholder
- Verificar se imagens são armazenadas corretamente
- Testar URLs geradas

### **4. Validação Final:**
- Verificar se banners aparecem em `/`
- Verificar se logos aparecem em company cards
- Sem erros 404 no console
- Funciona em mobile e desktop

---

## 📦 COMANDOS ÚTEIS

### **Acessar container:**
```bash
docker compose exec backend bash
cd /app/AB0-1-back
```

### **Rails Console:**
```bash
bundle exec rails console
```

### **Verificar storage:**
```bash
ls -la storage/
du -sh storage/
```

### **Logs:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

---

## ⚡ PRIORIDADES

1. 🔴 **CRÍTICO:** Resolver 404 em banners/imagens
2. 🟡 **IMPORTANTE:** Fazer banners aparecerem na landing page
3. 🟢 **DESEJÁVEL:** Documentar solução para evitar reincidência

---

## 💡 PERGUNTAS PARA IA RESPONDER

1. Por que `Banner.count` retorna 0 (ou poucos registros)?
2. Como criar banners via Rails Console com imagens funcionando?
3. Por que algumas imagens funcionam (páginas de categoria) e outras não (landing page)?
4. O problema está no backend (Active Storage), frontend (URLs) ou infraestrutura (Nginx)?
5. Como garantir que Active Storage funcione em produção com Docker?

---

## 📊 RESULTADOS ESPERADOS

Após seguir suas instruções, espero:

✅ Landing page mostrando 3 banners (home_top, categories_top, companies_top)  
✅ Company cards mostrando logos  
✅ Sem erros 404 no console do browser  
✅ Funciona em todos os dispositivos  
✅ Active Storage funcionando 100%

---

## 🔗 LINKS ÚTEIS

- Admin Panel: `https://api.avaliasolar.com.br/admin`
- API Backend: `https://api.avaliasolar.com.br/api/v1/`
- Frontend: `https://www.avaliasolar.com.br/`
- Documentação Active Storage: https://guides.rubyonrails.org/active_storage_overview.html

---

**Última atualização:** 2026-01-08 17:38:15 UTC

