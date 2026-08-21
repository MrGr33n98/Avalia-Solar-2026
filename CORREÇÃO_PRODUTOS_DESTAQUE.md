# Correção: Seção "Produtos em Destaque" não aparece

## Problema Identificado

As empresas WEG e GoodWe Brasil (que estão em produção e possuem planos pagos) não estavam exibindo a seção "Produtos em Destaque" logo abaixo da seção "Sobre a Empresa" no perfil público.

## Causa Raiz

O backend não estava serializando três campos essenciais para o frontend:

1. **`featured_products`** - Array de produtos em destaque da empresa
2. **`has_paid_plan`** - Flag booleana indicando se a empresa tem plano pago
3. **`feature_access`** - Mapa de entitlements/features da empresa

Sem esses campos, o frontend não conseguia:
- Determinar se a empresa tinha direito de exibir produtos em destaque
- Obter a lista de produtos para renderizar
- Verificar permissões de features

## Arquivos Modificados

### 1. Backend: `AB0-1-back/app/serializers/company_serializer.rb`

**Alteração 1: Adicionados campos aos `attributes`**

```ruby
attributes :id, :name, :description, # ... outros campos
           :featured_products,       # ← NOVO
           :has_paid_plan,           # ← NOVO
           :feature_access,          # ← NOVO
           :actions
```

**Alteração 2: Adicionados métodos de serialização**

```ruby
def featured_products
  return [] unless object.respond_to?(:featured_products_for_public)

  object.featured_products_for_public
end

def has_paid_plan
  object.respond_to?(:has_paid_plan?) ? object.has_paid_plan? : false
end

def feature_access
  return {} unless object.respond_to?(:feature_access)

  object.feature_access || {}
end
```

### 2. Rake Task: `AB0-1-back/lib/tasks/fix_featured_products.rake`

Criado um rake task para marcar produtos como `featured: true` nas empresas de teste:

```bash
# Marcar produtos como featured para WEG e GoodWe Brasil
bundle exec rails companies:mark_featured_products

# Remover flag featured de todos os produtos (rollback)
bundle exec rails companies:unmark_all_featured_products
```

## Como Funciona a Feature

### Backend (`Company` model)

1. **Método `featured_products_for_public`** (já existente em `app/models/company.rb`):
   - Verifica se a empresa tem plano pago (`has_paid_plan?`)
   - Busca o limite de produtos em destaque do plano via `feature_value_from_plan(:featured_products)`
   - Retorna produtos com `featured: true` até o limite (padrão: 3)
   - Serializa apenas campos públicos (id, slug, name, short_description, image_url, price_mode)

### Frontend (`OverviewTab.tsx`)

1. **Lógica de exibição**:
   ```typescript
   const paidPlan = hasPaidPlan(company);
   const showFeaturedProducts = paidPlan && isFeatureEnabled(company.feature_access, "featured_products");
   ```

2. **Renderização condicional**:
   - Se `showFeaturedProducts` é `true` → exibe `<FeaturedProductsSection />`
   - Caso contrário, se empresa não tem plano pago → exibe banners de anúncios

3. **Componente `FeaturedProductsSection`**:
   - Grid 3 colunas em desktop (md+)
   - Carrossel horizontal em mobile
   - Renderiza `FeaturedProductCard` para cada produto

## Como Testar

### Opção 1: Build Local e Teste (Desenvolvimento)

#### 1.1. Build da imagem backend local

```bash
cd /home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026
docker build -f Dockerfile.backend -t avalia-solar-backend:featured-products .
```

#### 1.2. Parar o backend atual e subir com a nova imagem

```bash
docker compose stop backend
docker run -d --name ab0-backend-test \
  --network ab0-network \
  -p 3001:3001 \
  --env-file .env \
  avalia-solar-backend:featured-products
```

#### 1.3. Marcar produtos como featured

```bash
docker exec ab0-backend-test bundle exec rails companies:mark_featured_products
```

### Opção 2: Deploy em Produção

#### 2.1. Commit e push das alterações

```bash
git add AB0-1-back/app/serializers/company_serializer.rb
git add AB0-1-back/lib/tasks/fix_featured_products.rake
git commit -m "fix: adiciona featured_products, has_paid_plan e feature_access ao CompanySerializer

- Adiciona campos featured_products, has_paid_plan e feature_access ao serializer
- Permite que o frontend exiba a seção 'Produtos em Destaque' para empresas com plano pago
- Cria rake task para marcar produtos como featured"
git push origin main
```

#### 2.2. Aguardar CI/CD fazer o deploy

O workflow `deploy-v1.yml` será acionado automaticamente e fará:
- Build da nova imagem
- Push para GHCR
- Deploy em produção com zero-downtime

#### 2.3. Marcar produtos como featured em produção

```bash
# Após o deploy, conectar no servidor de produção
ssh user@production-server

# Executar o rake task
docker compose exec backend bundle exec rails companies:mark_featured_products
```

### Opção 3: Teste Manual via Rails Console (Mais Rápido)

Se você tem acesso ao Rails console do container em produção:

```bash
# Conectar ao Rails console
docker compose exec backend bundle exec rails console

# No console, executar:
companies = Company.where(slug: ['weg', 'goodwe-brasil'])

companies.each do |company|
  puts "\n=== #{company.name} ==="
  
  # Marcar produtos como featured
  products = company.products.active_status.limit(3)
  products.each do |p|
    p.update(featured: true)
    puts "✅ #{p.name}"
  end
end

# Limpar cache se existir
Rails.cache.clear if Rails.cache.respond_to?(:clear)
```

### 1. Reiniciar o backend para carregar o serializer atualizado

### Verificação da API (após aplicar as mudanças)

```bash
# WEG
curl -s http://localhost:3001/api/v1/companies/weg | jq '{
  name: .name,
  has_paid_plan: .has_paid_plan,
  featured_products_count: (.featured_products | length),
  featured_products: .featured_products
}'

# GoodWe Brasil
curl -s http://localhost:3001/api/v1/companies/goodwe-brasil | jq '{
  name: .name,
  has_paid_plan: .has_paid_plan,
  featured_products_count: (.featured_products | length),
  featured_products: .featured_products
}'
```

### 4. Verificar no navegador

Acessar:
- http://localhost:3000/companies/weg
- http://localhost:3000/companies/goodwe-brasil

A seção "Produtos em Destaque" deve aparecer logo após "Sobre a Empresa".

## Planos de Contingência

Se a seção ainda não aparecer:

1. **Verificar se a empresa tem plano pago:**
   ```bash
   docker compose exec backend bundle exec rails runner "
   Company.find_by(slug: 'weg').tap { |c| puts c.has_paid_plan? }
   "
   ```

2. **Verificar se o entitlement está correto:**
   ```bash
   docker compose exec backend bundle exec rails runner "
   c = Company.find_by(slug: 'weg')
   puts c.feature_value_from_plan(:featured_products, include_defaults: true)
   "
   ```

3. **Verificar se existem produtos featured:**
   ```bash
   docker compose exec backend bundle exec rails runner "
   c = Company.find_by(slug: 'weg')
   puts c.products.active_status.where(featured: true).count
   "
   ```

4. **Verificar logs do frontend:**
   - Abrir DevTools > Console
   - Procurar por erros relacionados a `FeaturedProductsSection` ou `company.featured_products`

## Checklist de Validação

- [ ] Backend reiniciado
- [ ] Rake task executado com sucesso
- [ ] API retorna `has_paid_plan: true`
- [ ] API retorna `featured_products` com array de produtos
- [ ] API retorna `feature_access` com entitlements
- [ ] Seção aparece no frontend em empresas com plano pago
- [ ] Seção NÃO aparece para empresas sem plano pago
- [ ] Layout responsivo funciona (desktop 3 cols, mobile carrossel)
- [ ] Cards de produtos exibem imagem, nome, descrição

## Referências

- Modelo: `AB0-1-back/app/models/company.rb` (método `featured_products_for_public`)
- Serializer: `AB0-1-back/app/serializers/company_serializer.rb`
- Frontend: `AB0-1-front/app/companies/[id]/components/OverviewTab.tsx`
- Componente: `AB0-1-front/app/companies/[id]/components/FeaturedProductsSection.tsx`
- Feature Access: `AB0-1-front/lib/feature-access.ts`
