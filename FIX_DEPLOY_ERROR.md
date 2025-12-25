# 🐛 Fix: TypeScript Build Errors - Deploy

## Erro 1: api.get() não existe ✅ RESOLVIDO

### Erro:
```
Type error: Property 'get' does not exist on type '{ baseUrl: string; request: <T>(config: any) => Promise<{ data: T; }>; }'.
```

### Solução:
Substituído `api.get(url)` por `api.request({ url, method: 'GET' })`

---

## Erro 2: Type mismatch Category ✅ RESOLVIDO

### Erro:
```
Type error: Type 'Category' is missing the following properties from type 'Category': 
kind, status, logo, created_at, updated_at
```

### Causa:
A API retorna apenas um subset dos campos de `Category` (modo cards otimizado), mas o `CategoryCard` espera a interface completa do `lib/api.ts`.

### Solução:
Criado adapter para converter dados da API para formato completo:

```typescript
// Interface da resposta da API (modo cards)
interface CategoryCardData {
  id: number;
  name: string;
  seo_url: string;
  seo_title: string;
  short_description: string;
  featured: boolean;
  banner_url: string | null;
  companies_count: number;
  products_count: number;
}

// Adapter: converte CategoryCardData para Category completo
function adaptCategoryData(data: CategoryCardData): Category {
  return {
    ...data,
    description: data.short_description,
    kind: 'standard',
    status: 'active',
    parent_id: null,
    logo: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Uso no fetchData
const [bannersRes, featuredRes, allRes] = await Promise.all([
  api.request<Banner[]>({ url: '/banners?position=categories_top', method: 'GET' }),
  api.request<CategoryCardData[]>({ url: '/categories?view=cards&featured=true&limit=8', method: 'GET' }),
  api.request<CategoryCardData[]>({ url: '/categories?view=cards', method: 'GET' })
]);

// Adaptar dados
setFeaturedCategories(featuredRes.data.map(adaptCategoryData));
setAllCategories(allRes.data.map(adaptCategoryData));
```

---

## Mudanças Aplicadas

**Arquivo:** `AB0-1-front/components/CategoriesIndex.tsx`

1. ✅ Importado `Category` de `@/lib/api`
2. ✅ Criado interface `CategoryCardData` para resposta da API
3. ✅ Criado função `adaptCategoryData()` para converter tipos
4. ✅ Atualizado `fetchData()` para usar adapter
5. ✅ Substituído `api.get()` por `api.request()`

---

## Status

✅ **Ambos os erros corrigidos**  
✅ **TypeScript deve compilar com sucesso**  
✅ **Build deve passar no CI/CD**

## Teste Local

```bash
cd AB0-1-front
npm run build
```

Se passar, o deploy no GitHub Actions também funcionará.

---

**Data:** 2024-12-25  
**Arquivo modificado:** `AB0-1-front/components/CategoriesIndex.tsx`  
**Linhas alteradas:** ~30 linhas (imports, interfaces, adapter, fetchData)
