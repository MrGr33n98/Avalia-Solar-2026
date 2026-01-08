# 🔍 DIAGNÓSTICO - Banners não aparecem na Landing Page

## ❌ **PROBLEMA IDENTIFICADO:**

Os banners NÃO estão aparecendo na landing page (`/`) mesmo após as correções.

### **Logs de Erro:**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
/rails/active_storage/disk/...avalia-solar-recargas-em-condominios.png
```

---

## 📊 **STATUS ATUAL:**

### ✅ **O que está funcionando:**
1. Banners aparecem em: `/categories/recarga-condominios`
2. API do backend está rodando
3. Active Storage configurado
4. Componentes criados:
   - `BannerByLocation.tsx`
   - `useBanners.ts` hook
   - `BannerContainer.tsx`

### ❌ **O que NÃO está funcionando:**
1. Banners não aparecem na landing page `/`
2. Imagens de empresas (company banners) retornam 404
3. Possível falta de registros de Banner no banco

---

## 🔎 **INVESTIGAÇÃO NECESSÁRIA:**

### **1. Verificar se existem banners cadastrados:**

```bash
# Na VM, execute:
docker compose exec backend bash -c "cd /app/AB0-1-back && bundle exec rails runner '
puts \"📊 BANNERS NO BANCO:\"
puts \"Total: #{Banner.count}\"
Banner.all.each do |b|
  puts \"  ID: #{b.id} | Position: #{b.position} | Status: #{b.status} | Image: #{b.image.attached?}\"
end
'"
```

### **2. Verificar posições disponíveis:**

```bash
# Verificar enum de positions no modelo Banner
docker compose exec backend bash -c "cd /app/AB0-1-back && bundle exec rails runner '
puts Banner.positions.keys
'"
```

---

## 🎯 **POSIÇÕES DE BANNER NECESSÁRIAS:**

Para a landing page funcionar, precisamos criar banners nas seguintes posições:

1. **`home_top`** - Banner no topo da homepage (depois do Hero)
2. **`categories_top`** - Banner antes da seção de categorias
3. **`companies_top`** - Banner antes da seção de empresas

---

## ✅ **SOLUÇÃO - Criar Banners via Admin Panel:**

### **Passo 1: Acessar Admin**
```
https://api.avaliasolar.com.br/admin/banners
```

### **Passo 2: Criar 3 banners**

**Banner 1 - Homepage Top:**
- Title: `Banner Homepage Principal`
- Position: `home_top`
- Banner Type: `rectangular_large`
- Status: `active`
- Image: Upload imagem 1200x400px
- Link: `https://www.avaliasolar.com.br/categories` (opcional)

**Banner 2 - Categories Top:**
- Title: `Banner Categorias`
- Position: `categories_top`
- Banner Type: `rectangular_large`
- Status: `active`
- Image: Upload imagem 1200x400px

**Banner 3 - Companies Top:**
- Title: `Banner Empresas`
- Position: `companies_top`
- Banner Type: `rectangular_large`
- Status: `active`
- Image: Upload imagem 1200x400px

---

## 🔧 **ALTERNATIVA - Criar via Rails Console:**

```bash
docker compose exec backend bash -c "cd /app/AB0-1-back && bundle exec rails console" << 'EOF'
require 'open-uri'

# Banner 1 - Home Top
banner1 = Banner.create!(
  title: 'Banner Homepage',
  position: 'home_top',
  banner_type: 'rectangular_large',
  status: 'active'
)

# Anexar imagem placeholder
banner1.image.attach(
  io: URI.open('https://via.placeholder.com/1200x400/4F46E5/FFFFFF?text=Banner+Homepage'),
  filename: 'home_top.png'
)

# Banner 2 - Categories Top
banner2 = Banner.create!(
  title: 'Banner Categorias',
  position: 'categories_top',
  banner_type: 'rectangular_large',
  status: 'active'
)

banner2.image.attach(
  io: URI.open('https://via.placeholder.com/1200x400/4F46E5/FFFFFF?text=Explore+Categorias'),
  filename: 'categories_top.png'
)

# Banner 3 - Companies Top
banner3 = Banner.create!(
  title: 'Banner Empresas',
  position: 'companies_top',
  banner_type: 'rectangular_large',
  status: 'active'
)

banner3.image.attach(
  io: URI.open('https://via.placeholder.com/1200x400/4F46E5/FFFFFF?text=Empresas+Parceiras'),
  filename: 'companies_top.png'
)

puts "✅ 3 banners criados!"
puts "Banner 1: #{banner1.id} - home_top"
puts "Banner 2: #{banner2.id} - categories_top"
puts "Banner 3: #{banner3.id} - companies_top"

exit
EOF
```

---

## 📝 **CHANGELOG - Alterações Feitas:**

### **Frontend (`AB0-1-front/app/page.tsx`):**
```typescript
// Adicionado import
import BannerByLocation from '@/components/BannerByLocation';

// Adicionado 3 áreas de banner:
<BannerByLocation location="home_top" className="mb-8" />
<BannerByLocation location="categories_top" className="mb-8" />
<BannerByLocation location="companies_top" className="mb-8" />
```

---

## 🧪 **TESTES:**

### **1. Testar API diretamente:**
```bash
# Windows CMD
curl "https://api.avaliasolar.com.br/api/v1/banners"
curl "https://api.avaliasolar.com.br/api/v1/banners?position=home_top"
```

### **2. Verificar console do browser (F12):**
```
[useBanners] Fetching: /banners?position=home_top
[useBanners] Received: X banners
```

### **3. Verificar se imagem aparece:**
- Abra: `https://www.avaliasolar.com.br/`
- Deve aparecer 3 banners
- Sem erros 404 no console

---

## 🚀 **PRÓXIMOS PASSOS:**

1. ✅ Execute `test-banners.bat` para verificar API
2. ✅ Se retornar `[]` vazio, crie os 3 banners via Admin Panel
3. ✅ Ou execute o script Rails Console acima
4. ✅ Refresh a página `/` e verifique
5. ✅ Commit das alterações do frontend

---

## 📦 **COMMIT & PUSH:**

```bash
cd C:\Users\Bobi\Desktop\AB0-1-main
git add AB0-1-front/app/page.tsx
git add test-banners.bat
git add DIAGNOSTICO_BANNERS_LANDING.md
git commit -m "feat: Add banner support to landing page

- Added BannerByLocation to homepage
- Created test-banners.bat for debugging
- Added documentation for banner setup
- Support for home_top, categories_top, companies_top positions"
git push origin main
```

---

## 💡 **RESUMO:**

**O problema é:** Banners não aparecem na landing page porque provavelmente **não existem registros de Banner no banco de dados** para as posições `home_top`, `categories_top` e `companies_top`.

**A solução é:** Criar 3 banners via Admin Panel ou Rails Console.

**Status:** ⚠️ Aguardando criação dos banners

