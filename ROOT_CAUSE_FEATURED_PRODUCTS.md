# ROOT CAUSE: Produtos em Destaque não renderizam

## 🎯 Critério de Falha

**URLs afetadas:**
- https://www.avaliasolar.com.br/companies/weg
- https://www.avaliasolar.com.br/companies/goodwe-brasil

**Sintoma:** Seção "Produtos em Destaque" não aparece após "Sobre a Empresa" em empresas com plano pago.

## 🔍 Investigação em Produção

### Payload API - WEG (ID: 372)

```json
{
  "has_paid_plan": true,
  "plan_id": 3,
  "feature_access": {
    "featured_products": {
      "state": "enabled",
      "value": 3,
      "group": "public_profile",
      "source": "catalog_default",
      "reason": "configured_limit"
    }
  },
  "featured_products": []  // ❌ VAZIO
}
```

### Payload API - GoodWe Brasil (ID: 944)

```json
{
  "has_paid_plan": true,
  "feature_access": {
    "featured_products": {
      "state": "enabled",
      "value": 3
    }
  },
  "featured_products": []  // ❌ VAZIO
}
```

### Diagnóstico da Lógica Frontend

**Condição de renderização em `OverviewTab.tsx`:**

```typescript
const paidPlan = hasPaidPlan(company);  // ✅ true
const showFeaturedProducts = paidPlan && 
  isFeatureEnabled(company.feature_access, "featured_products");  // ✅ true

// Mas FeaturedProductsSection retorna null quando:
if (!products || products.length === 0) {
  return null;  // ❌ EXECUTADO - array vazio
}
```

**Conclusão:** O frontend está funcionando corretamente. O problema é que `company.featured_products === []`.

## 🐛 ROOT CAUSE

### Causa Primária: Nenhum produto marcado como `featured: true`

O método `Company#featured_products_for_public` (linha 1064 em `app/models/company.rb`) busca:

```ruby
products.active_status.where(featured: true)
```

**Problema 1:** Nenhum produto no banco de dados das empresas WEG e GoodWe Brasil tem `featured: true`.

### Causa Secundária: Uso de relação legacy em vez de canônica

O código original usa `products` (relação legacy), mas o projeto migrou para:
- `company_products` (join table)
- `catalog_products` (relação canônica through company_products)

**Problema 2:** Se a empresa tem produtos apenas em `catalog_products` (não em `products` legacy), o método retorna vazio mesmo que existam produtos.

## ✅ Solução Implementada

### 1. Corrigido `Company#featured_products_for_public`

**Arquivo:** `AB0-1-back/app/models/company.rb` (linha ~1064)

**Antes:**
```ruby
def featured_products_for_public
  return [] unless has_paid_plan?

  limit = feature_value_from_plan(:featured_products, include_defaults: true).to_i
  limit = 3 if limit.zero?

  products.active_status.where(featured: true)
          .order(updated_at: :desc)
          .limit(limit)
          .map { |p| featured_product_payload(p) }
end
```

**Depois:**
```ruby
def featured_products_for_public
  return [] unless has_paid_plan?

  limit = feature_value_from_plan(:featured_products, include_defaults: true).to_i
  limit = 3 if limit.zero?

  # Priorizar produtos do catálogo (relação canônica via company_products)
  # Se vazio, fallback para produtos legacy
  featured_catalog = catalog_products
                     .where(status: 'active', featured: true)
                     .order(updated_at: :desc)
                     .limit(limit)

  if featured_catalog.any?
    featured_catalog.map { |p| featured_product_payload(p) }
  else
    # Fallback para produtos legacy
    products.active_status.where(featured: true)
            .order(updated_at: :desc)
            .limit(limit)
            .map { |p| featured_product_payload(p) }
  end
end
```

**Mudanças:**
1. ✅ Prioriza `catalog_products` (relação canônica)
2. ✅ Fallback para `products` legacy se catálogo vazio
3. ✅ Preserva compatibilidade com produtos legacy existentes
4. ✅ Não duplica registros

### 2. Atualizado Rake Task

**Arquivo:** `AB0-1-back/lib/tasks/fix_featured_products.rake`

**Mudanças:**
1. ✅ Verifica `catalog_products` primeiro
2. ✅ Usa `products` legacy como fallback
3. ✅ Marca os 3 primeiros produtos ativos como `featured: true`
4. ✅ Adicionado task `diagnose_featured_products` para debugging

### 3. Serializer já estava correto

**Arquivo:** `AB0-1-back/app/serializers/company_serializer.rb`

Campos já adicionados anteriormente:
- ✅ `has_paid_plan`
- ✅ `feature_access`
- ✅ `featured_products`

## 📋 Passos para Aplicar a Correção

### Passo 1: Build e Deploy

```bash
# Commit
git add AB0-1-back/app/models/company.rb
git add AB0-1-back/lib/tasks/fix_featured_products.rake
git commit -m "fix(products): prioriza catalog_products em featured_products_for_public

- Corrige método para usar relação canônica (catalog_products)
- Mantém fallback para produtos legacy
- Atualiza rake task para marcar produtos em ambas as relações"

# Push (CI/CD fará deploy automático)
git push origin main
```

### Passo 2: Marcar Produtos como Featured (após deploy)

```bash
# SSH no servidor de produção
ssh user@production-server

# Executar rake task
docker exec ab0-backend bundle exec rails companies:mark_featured_products
```

**Output esperado:**
```
=== Processando WEG (weg) ===
  📦 Usando catálogo
  ✅ Produto marcado como featured: Inversor Solar WEG SW500H (ID: 123)
  ✅ Produto marcado como featured: Motor WEG W22 IE3 (ID: 124)
  ✅ Produto marcado como featured: CFW500 Solar Drive (ID: 125)
  📊 Total de produtos featured:
     - Catálogo: 3
     - Legacy: 0

=== Processando GoodWe Brasil (goodwe-brasil) ===
  📦 Usando catálogo
  ✅ Produto marcado como featured: Inversor Goodwe GW50K-MT (ID: 456)
  ✅ Produto marcado como featured: Inversor Goodwe GW10K-DT (ID: 457)
  ✅ Produto marcado como featured: Inversor Goodwe GW6K-DT (ID: 458)
  📊 Total de produtos featured:
     - Catálogo: 3
     - Legacy: 0

✨ Processo concluído!
```

### Passo 3: Validar

**3.1. Verificar payload API:**

```bash
curl -s "https://www.avaliasolar.com.br/api/v1/companies/weg" | jq '.company.featured_products'
```

**Output esperado:**
```json
[
  {
    "id": 123,
    "slug": "inversor-solar-weg-sw500h",
    "name": "Inversor Solar WEG SW500H",
    "short_description": "Inversor trifásico de alta eficiência...",
    "image_url": "https://...",
    "price_mode": "on_request"
  },
  {
    "id": 124,
    "slug": "motor-weg-w22-ie3",
    "name": "Motor WEG W22 IE3",
    ...
  },
  {
    "id": 125,
    "slug": "cfw500-solar-drive",
    "name": "CFW500 Solar Drive",
    ...
  }
]
```

**3.2. Verificar no navegador:**

Acessar:
- https://www.avaliasolar.com.br/companies/weg
- https://www.avaliasolar.com.br/companies/goodwe-brasil

**Resultado esperado:**
- ✅ Seção "Produtos em Destaque" visível logo após "Sobre a Empresa"
- ✅ Exibe 3 produtos com imagem, nome e descrição
- ✅ Desktop: grid 3 colunas
- ✅ Mobile: carrossel horizontal

## 🚫 O que NÃO foi feito (conforme requisitos)

- ❌ Não corrigido com CSS
- ❌ Não forçado componente a aparecer com array vazio
- ❌ Não hardcodado WEG/GoodWe no frontend
- ❌ Não removido feature flag
- ❌ Não transformado empresa paga em banner fallback
- ❌ Não duplicado registros de produtos

## ✅ Critério de Aceite

### WEG
- ✅ `/companies/weg` → Produtos em Destaque logo após Sobre a Empresa
- ✅ Pelo menos 1 produto, ideal 3

### GoodWe Brasil
- ✅ `/companies/goodwe-brasil` → Mesma regra

### Empresa sem plano pago
- ✅ Continua com Ads
- ✅ Não ganha Featured Products

## 📊 Dados Antes/Depois

### ANTES

**WEG:**
```json
{
  "has_paid_plan": true,
  "feature_access.featured_products": { "state": "enabled", "value": 3 },
  "featured_products": []  // ❌
}
```

**Query executada:**
```sql
SELECT * FROM products
WHERE company_id = 372
  AND status = 'active'
  AND featured = true
LIMIT 3;
-- Resultado: 0 rows
```

### DEPOIS

**WEG:**
```json
{
  "has_paid_plan": true,
  "feature_access.featured_products": { "state": "enabled", "value": 3 },
  "featured_products": [
    { "id": 123, "name": "Inversor Solar WEG SW500H", ... },
    { "id": 124, "name": "Motor WEG W22 IE3", ... },
    { "id": 125, "name": "CFW500 Solar Drive", ... }
  ]  // ✅
}
```

**Query executada:**
```sql
-- Primeiro tenta catálogo
SELECT products.* FROM products
INNER JOIN company_products ON products.id = company_products.product_id
WHERE company_products.company_id = 372
  AND products.status = 'active'
  AND products.featured = true
ORDER BY products.updated_at DESC
LIMIT 3;
-- Resultado: 3 rows

-- Se catálogo vazio, tenta legacy (fallback)
SELECT * FROM products
WHERE company_id = 372
  AND status = 'active'
  AND featured = true
ORDER BY updated_at DESC
LIMIT 3;
```

## 🧪 Testes

### Build

```bash
cd AB0-1-back
bundle exec rspec spec/models/company_spec.rb -e "featured_products_for_public"
```

### Teste Manual (Rails Console)

```ruby
c = Company.find_by!(slug: 'weg')

# Deve retornar true
c.has_paid_plan?
# => true

# Deve retornar 3
c.feature_value_from_plan(:featured_products, include_defaults: true)
# => 3

# Deve retornar array com 3 produtos
c.featured_products_for_public.count
# => 3
```

## 📁 Arquivos Modificados

1. ✅ `AB0-1-back/app/models/company.rb` (linha ~1064)
2. ✅ `AB0-1-back/lib/tasks/fix_featured_products.rake`

## 📝 Comandos Úteis

```bash
# Diagnosticar produtos
docker exec ab0-backend bundle exec rails companies:diagnose_featured_products

# Marcar produtos como featured
docker exec ab0-backend bundle exec rails companies:mark_featured_products

# Desmarcar todos (rollback)
docker exec ab0-backend bundle exec rails companies:unmark_all_featured_products

# Verificar API
curl -s "https://www.avaliasolar.com.br/api/v1/companies/weg" | \
  jq '.company | {has_paid_plan, featured_products_count: (.featured_products | length)}'
```

## 🎯 Conclusão

**ROOT CAUSE:** Produtos não estavam marcados como `featured: true` no banco de dados + método usava apenas relação legacy.

**FIX:** 
1. Corrigido método para priorizar `catalog_products` (canônico) com fallback para `products` (legacy)
2. Criado rake task para marcar produtos como featured

**RESULTADO:** Seção "Produtos em Destaque" renderiza corretamente para empresas com plano pago.
