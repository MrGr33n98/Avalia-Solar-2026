# ⚡ FIX SUMMARY: Produtos em Destaque

## 🎯 Problema
WEG e GoodWe Brasil (empresas com plano pago) não exibem "Produtos em Destaque".

## 🔍 ROOT CAUSE
```
featured_products: []  // ❌ Nenhum produto marcado como featured=true no banco
```

## ✅ Solução (2 arquivos modificados)

### 1. `AB0-1-back/app/models/company.rb` (linha ~1064)
**Mudança:** Prioriza `catalog_products` (canônico) + fallback para `products` (legacy)

### 2. `AB0-1-back/lib/tasks/fix_featured_products.rake`
**Mudança:** Task atualizado para marcar produtos em ambas as relações

## 📋 Deploy em 3 Passos

### 1️⃣ Commit & Push
```bash
git add AB0-1-back/app/models/company.rb AB0-1-back/lib/tasks/fix_featured_products.rake
git commit -m "fix: prioriza catalog_products em featured_products_for_public"
git push origin main
# CI/CD faz deploy automático
```

### 2️⃣ Marcar Produtos (SSH produção após deploy)
```bash
docker exec ab0-backend bundle exec rails companies:mark_featured_products
```

### 3️⃣ Validar
```bash
# API deve retornar featured_products com 3 itens
curl -s "https://www.avaliasolar.com.br/api/v1/companies/weg" | jq '.company.featured_products | length'

# Navegador deve mostrar seção após "Sobre a Empresa"
# https://www.avaliasolar.com.br/companies/weg
# https://www.avaliasolar.com.br/companies/goodwe-brasil
```

## ✅ Critério de Aceite
- ✅ WEG: Seção "Produtos em Destaque" visível com 1-3 produtos
- ✅ GoodWe Brasil: Mesma regra
- ✅ Empresas sem plano: Continua com Ads (não ganha Featured Products)

## 📊 Antes/Depois

**ANTES:**
```json
{
  "has_paid_plan": true,
  "featured_products": []  // ❌
}
```

**DEPOIS:**
```json
{
  "has_paid_plan": true,
  "featured_products": [
    { "id": 123, "name": "Inversor Solar...", ... },
    { "id": 124, "name": "Motor...", ... },
    { "id": 125, "name": "Drive...", ... }
  ]  // ✅
}
```

## 📁 Arquivos
- `AB0-1-back/app/models/company.rb`
- `AB0-1-back/lib/tasks/fix_featured_products.rake`
- `ROOT_CAUSE_FEATURED_PRODUCTS.md` (documentação completa)
