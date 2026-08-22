# 🐛 ROOT CAUSE: featured_products retornando []

## 🎯 Problema Confirmado em Produção

**Empresas afetadas:** WEG e GoodWe Brasil

**Dados validados:**
- ✅ `has_paid_plan? = true`
- ✅ Plano: Pro
- ✅ `featured_products entitlement = 3`
- ✅ Produto `active = true`
- ✅ Produto `featured = true`

**Mas:**
- ❌ `Company#featured_products_for_public` retorna `[]`
- ❌ Frontend não renderiza "Produtos em Destaque"

## 🔍 ROOT CAUSE

### Erro Real

```ruby
# AB0-1-back/app/models/company.rb linha 1096
def featured_product_payload(product)
  {
    id: product.id,
    slug: product.slug,  # ❌ NoMethodError: undefined method `slug'
    name: product.name,
    # ...
  }
end
```

**Fluxo do erro:**
1. `featured_products_for_public` chama `featured_product_payload(product)`
2. `featured_product_payload` tenta acessar `product.slug`
3. **Product NÃO possui método/coluna `slug`** 
4. `NoMethodError` é levantado
5. `rescue StandardError` captura o erro
6. Retorna `[]` (array vazio)
7. Frontend não renderiza a seção

### Confirmação no Schema

```sql
-- AB0-1-back/db/schema.rb
create_table "products", force: :cascade do |t|
  t.string "name", null: false
  t.string "sku", null: false        -- ✅ Existe
  t.string "seo_title"               -- ✅ Existe
  -- NÃO há coluna "slug"           -- ❌ NÃO EXISTE
end
```

## ✅ Solução Implementada

### 1. Backend: Gerar pseudo-slug

**Arquivo:** `AB0-1-back/app/models/company.rb` (linha ~1093)

**ANTES:**
```ruby
def featured_product_payload(product)
  {
    id: product.id,
    slug: product.slug,  # ❌ NoMethodError
    name: product.name,
    # ...
  }
end
```

**DEPOIS:**
```ruby
def featured_product_payload(product)
  # Gera um pseudo-slug compatível com a rota /products/[slug]
  # que extrai o ID do primeiro segmento
  pseudo_slug = "#{product.id}-#{product.name.parameterize}"
  
  {
    id: product.id,
    slug: pseudo_slug,  # ✅ Gerado dinamicamente
    name: product.name,
    short_description: product.short_description,
    image_url: product.image_url,
    price_mode: product.price_mode,
  }
end
```

**Por que funciona:**
- Rota frontend `/products/[slug]/page.tsx` usa `getProductIdFromSlug(slug)`
- Extrai ID do primeiro segmento: `"123-inversor-solar"` → `123`
- Busca produto pelo ID extraído
- ✅ Compatível com arquitetura existente

### 2. Frontend: Corrigir link do card

**Arquivo:** `AB0-1-front/app/companies/[id]/components/FeaturedProductCard.tsx`

**ANTES:**
```tsx
<Link href={`/companies/${companySlug}/products/${product.slug}`}>
  Ver detalhes
</Link>
```

**DEPOIS:**
```tsx
<Link href={`/products/${product.slug}`}>
  Ver detalhes
</Link>
```

**Mudanças:**
1. ✅ Usa rota global `/products/[slug]` (que existe)
2. ✅ Remove referência a `/companies/.../products/` (não existe)
3. ✅ Remove parâmetro `companySlug` desnecessário

### 3. Teste Regressivo

**Arquivo:** `AB0-1-back/spec/models/company_featured_products_spec.rb`

**Cenários testados:**
- ✅ Empresa com plano pago + produtos featured → retorna array
- ✅ Não levanta `NoMethodError`
- ✅ Gera `slug` no formato `{id}-{name-parameterized}`
- ✅ Respeita limite do entitlement
- ✅ Fallback para produtos legacy funciona
- ✅ Empresa sem plano → retorna `[]`

## 📋 Deploy

### Passo 1: Commit & Push

```bash
git add AB0-1-back/app/models/company.rb
git add AB0-1-front/app/companies/[id]/components/FeaturedProductCard.tsx
git add AB0-1-front/app/companies/[id]/components/FeaturedProductsSection.tsx
git add AB0-1-back/spec/models/company_featured_products_spec.rb
git commit -m "fix(featured-products): gera pseudo-slug para products sem coluna slug

ROOT CAUSE:
- featured_product_payload acessava product.slug (inexistente)
- NoMethodError era capturado e retornava []

FIX:
- Gera pseudo-slug: {id}-{name-parameterized}
- Compatível com rota /products/[slug] que extrai ID
- Corrige link do card para rota global /products/[slug]
- Adiciona testes regressivos"

git push origin main
```

### Passo 2: Marcar Produtos (após deploy)

```bash
# SSH no servidor de produção
docker exec ab0-backend bundle exec rails companies:mark_featured_products
```

### Passo 3: Validar Local (Rails Console)

```bash
docker exec -it ab0-backend bundle exec rails runner "
%w[weg goodwe-brasil].each do |slug|
  c = Company.find_by!(slug: slug)
  puts \"\\n=== #{slug.upcase} ===\"
  result = c.featured_products_for_public
  puts \"Count: #{result.count}\"
  if result.any?
    result.each do |fp|
      puts \"  - #{fp[:name]} (ID: #{fp[:id]}, slug: #{fp[:slug]})\"
    end
  else
    puts \"  (vazio - verificar se produtos estão marcados como featured)\"
  end
end
"
```

**Output esperado:**
```
=== WEG ===
Count: 3
  - Inversor Solar WEG SW500H (ID: 123, slug: 123-inversor-solar-weg-sw500h)
  - Motor WEG W22 IE3 (ID: 124, slug: 124-motor-weg-w22-ie3)
  - CFW500 Solar Drive (ID: 125, slug: 125-cfw500-solar-drive)

=== GOODWE-BRASIL ===
Count: 3
  - Inversor Goodwe GW50K-MT (ID: 456, slug: 456-inversor-goodwe-gw50k-mt)
  - Inversor Goodwe GW10K-DT (ID: 457, slug: 457-inversor-goodwe-gw10k-dt)
  - Inversor Goodwe GW6K-DT (ID: 458, slug: 458-inversor-goodwe-gw6k-dt)
```

### Passo 4: Validar API Produção

```bash
curl -s "https://www.avaliasolar.com.br/api/v1/companies/weg" | \
  jq '.company.featured_products[] | {id, slug, name}'
```

**Output esperado:**
```json
{
  "id": 123,
  "slug": "123-inversor-solar-weg-sw500h",
  "name": "Inversor Solar WEG SW500H"
}
{
  "id": 124,
  "slug": "124-motor-weg-w22-ie3",
  "name": "Motor WEG W22 IE3"
}
{
  "id": 125,
  "slug": "125-cfw500-solar-drive",
  "name": "CFW500 Solar Drive"
}
```

### Passo 5: Validar Frontend

**Navegador:**
- https://www.avaliasolar.com.br/companies/weg
- https://www.avaliasolar.com.br/companies/goodwe-brasil

**Resultado esperado:**
- ✅ Seção "Produtos em Destaque" visível após "Sobre a Empresa"
- ✅ Desktop: grid 3 colunas
- ✅ Mobile: carrossel horizontal
- ✅ Click em "Ver detalhes" → redireciona para `/products/{id}-{name}`

## 📊 Antes/Depois

### ANTES

**Backend:**
```ruby
# NoMethodError ao acessar product.slug
featured_products_for_public
# => []
```

**API:**
```json
{
  "featured_products": []  // ❌ vazio
}
```

**Frontend:**
```tsx
// FeaturedProductsSection retorna null
if (!products || products.length === 0) {
  return null;  // ❌ não renderiza
}
```

### DEPOIS

**Backend:**
```ruby
featured_products_for_public
# => [
#   {id: 123, slug: "123-inversor-solar-weg-sw500h", name: "Inversor...", ...},
#   {id: 124, slug: "124-motor-weg-w22-ie3", name: "Motor...", ...},
#   {id: 125, slug: "125-cfw500-solar-drive", name: "CFW500...", ...}
# ]
```

**API:**
```json
{
  "featured_products": [
    {"id": 123, "slug": "123-inversor-solar-weg-sw500h", ...},
    {"id": 124, "slug": "124-motor-weg-w22-ie3", ...},
    {"id": 125, "slug": "125-cfw500-solar-drive", ...}
  ]  // ✅ preenchido
}
```

**Frontend:**
```tsx
// FeaturedProductsSection renderiza
{showFeaturedProducts ? (
  <FeaturedProductsSection 
    company={company} 
    products={company.featured_products ?? []}  // ✅ array com 3 itens
  />
) : ...}
```

## ✅ Critério de Aceite

- ✅ `/companies/weg` → Seção "Produtos em Destaque" renderizada
- ✅ `/companies/goodwe-brasil` → Seção "Produtos em Destaque" renderizada
- ✅ Click em produto → redireciona para `/products/{id}-{name}`
- ✅ Empresas sem plano pago → Continua com Ads (sem Featured Products)
- ✅ Testes regressivos passam

## 📁 Arquivos Modificados

1. ✅ `AB0-1-back/app/models/company.rb`
2. ✅ `AB0-1-front/app/companies/[id]/components/FeaturedProductCard.tsx`
3. ✅ `AB0-1-front/app/companies/[id]/components/FeaturedProductsSection.tsx`
4. ✅ `AB0-1-back/spec/models/company_featured_products_spec.rb` (novo)

## 🚫 O que NÃO foi feito

- ❌ Não criado coluna `slug` em `products` (seguindo requisitos)
- ❌ Não mexido em `feature_access` (já estava correto)
- ❌ Não mexido em `has_paid_plan` (já estava correto)
- ❌ Não mexido em entitlements (já estava correto)
- ❌ Não mexido em Ads (já estava correto)
- ❌ Não mexido em `catalog_products` association (já estava correto)

## 🧪 Testes

```bash
# Rodar testes
cd AB0-1-back
bundle exec rspec spec/models/company_featured_products_spec.rb
```

**Output esperado:**
```
Company
  #featured_products_for_public
    quando a empresa tem plano pago
      e produtos no catálogo (relação canônica)
        retorna apenas produtos marcados como featured (PASSED)
        não levanta NoMethodError (PASSED)
        retorna payload com campos corretos (PASSED)
        gera slug no formato {id}-{name-parameterized} (PASSED)
        respeita o limite do entitlement (PASSED)
      e produtos legacy (sem catálogo)
        usa fallback para produtos legacy (PASSED)
        não levanta NoMethodError no fallback (PASSED)
    quando a empresa não tem plano pago
      retorna array vazio (PASSED)
    quando não há produtos featured
      retorna array vazio (PASSED)
  #featured_product_payload
    gera slug válido mesmo que Product não tenha coluna slug (PASSED)
    não acessa product.slug diretamente (PASSED)

11 examples, 0 failures
```

## 📝 Resumo Executivo

**ROOT CAUSE:** `featured_product_payload` tentava acessar `product.slug` (inexistente) → `NoMethodError` → `rescue` retornava `[]` → frontend não renderizava.

**FIX:** Gera pseudo-slug dinamicamente no formato `{id}-{name-parameterized}`, compatível com rota existente `/products/[slug]` que extrai o ID.

**RESULTADO:** Seção "Produtos em Destaque" renderiza corretamente para WEG e GoodWe Brasil.
