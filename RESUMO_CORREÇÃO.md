# ✅ Correção: Produtos em Destaque não aparecem

## 🎯 Problema
As empresas **WEG** e **GoodWe Brasil** (com planos pagos) não exibem a seção "**Produtos em Destaque**" logo abaixo de "Sobre a Empresa" no perfil público.

## 🔍 Causa
O backend não estava enviando 3 campos essenciais na API:
- `featured_products` (array de produtos)
- `has_paid_plan` (boolean)
- `feature_access` (mapa de permissões)

## ✨ Solução Implementada

### Arquivo modificado: `AB0-1-back/app/serializers/company_serializer.rb`

**Adicionados 3 campos aos attributes:**
```ruby
:featured_products,
:has_paid_plan,
:feature_access
```

**Adicionados 3 métodos de serialização:**
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

### Arquivo criado: `AB0-1-back/lib/tasks/fix_featured_products.rake`

Rake task para marcar produtos como featured:
```bash
bundle exec rails companies:mark_featured_products
```

## 📋 Checklist de Deploy

### Passo 1: Commit e Push
```bash
git add AB0-1-back/app/serializers/company_serializer.rb
git add AB0-1-back/lib/tasks/fix_featured_products.rake
git commit -m "fix: adiciona suporte a produtos em destaque no perfil público"
git push origin main
```

### Passo 2: Aguardar Deploy Automático
O GitHub Actions fará automaticamente:
- ✅ Build da nova imagem backend
- ✅ Push para GitHub Container Registry
- ✅ Deploy em produção

### Passo 3: Marcar Produtos como Featured
Após o deploy, executar no servidor de produção:
```bash
docker compose exec backend bundle exec rails companies:mark_featured_products
```

### Passo 4: Validar
Acessar no navegador:
- https://avaliasolar.com.br/companies/weg
- https://avaliasolar.com.br/companies/goodwe-brasil

**Resultado esperado:** Seção "Produtos em Destaque" visível logo após "Sobre a Empresa"

## 🎨 Layout da Feature

**Desktop (3 colunas):**
```
┌─────────────────────────────────────────────┐
│ Produtos em Destaque                        │
├─────────┬─────────┬─────────┐
│ Produto │ Produto │ Produto │
│    1    │    2    │    3    │
└─────────┴─────────┴─────────┘
```

**Mobile (carrossel horizontal):**
```
┌───────────────────────────────┐
│ Produtos em Destaque          │
├──────┬──────┬──────┬──────────┤
│ Prod │ Prod │ Prod │    →     │
│  1   │  2   │  3   │          │
└──────┴──────┴──────┴──────────┘
```

## 🔐 Regras de Negócio

1. **Seção só aparece para empresas com plano pago**
   - Verificado via `has_paid_plan === true`

2. **Feature precisa estar habilitada**
   - Verificado via `feature_access.featured_products`

3. **Produtos precisam estar marcados como `featured: true`**
   - Campo no banco de dados `products.featured`

4. **Limite de produtos respeitado**
   - Definido no plano da empresa
   - Padrão: 3 produtos

## 🚀 Próximos Passos

1. ✅ Fazer commit das alterações
2. ✅ Push para `main`
3. ⏳ Aguardar deploy (CI/CD automático)
4. ⏳ Executar rake task em produção
5. ⏳ Validar no navegador

## 📚 Documentação Completa

Ver: `CORREÇÃO_PRODUTOS_DESTAQUE.md` para detalhes técnicos completos, incluindo:
- Testes de validação
- Planos de contingência
- Troubleshooting
- Referências de código
