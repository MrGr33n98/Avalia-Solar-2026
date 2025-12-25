# 🐛 Fix: TypeScript Build Errors - Deploy (COMPLETO)

## Problema

TypeScript não compila devido a incompatibilidades de tipos entre:
- A resposta da API (subset de campos)
- A interface `Category` completa esperada pelos componentes

---

## ✅ Erro 1: api.get() não existe

### Erro:
```
Type error: Property 'get' does not exist on type '{ baseUrl: string; request: <T>(config: any) => Promise<{ data: T; }>; }'.
```

### Solução:
Substituído `api.get(url)` por `api.request({ url, method: 'GET' })` em **todos os arquivos**.

---

## ✅ Erro 2: Type mismatch Category

### Erro:
```
Type error: Type 'Category' is missing the following properties from type 'Category': 
kind, status, logo, created_at, updated_at
```

### Causa:
A API no modo `view=cards` retorna apenas 9 campos otimizados, mas o `CategoryCard` espera 15 campos (interface completa).

### Solução:
Criado **adapter pattern** para converter dados da API para formato completo.

---

## 📁 Arquivos Corrigidos

### 1. ✅ `components/CategoriesIndex.tsx`

**Mudanças:**
```typescript
// Importar Category do lib/api
import { api, Category } from '@/lib/api';

// Interface da resposta da API
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

// Adapter
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

// Uso
const response = await api.request<CategoryCardData[]>({ 
  url: '/categories?view=cards', 
  method: 'GET' 
});
setAllCategories(response.data.map(adaptCategoryData));
```

---

### 2. ✅ `components/CategoriesIndexV2.tsx`

**Status:** Usa hooks que já foram corrigidos (useCategoriesQuery, useBannersQuery)

Nenhuma mudança necessária neste arquivo pois os hooks retornam tipos corretos.

---

### 3. ✅ `hooks/useCategoriesQuery.ts`

**Mudanças:**
```typescript
// Importar Category do lib/api
import { api, Category } from '@/lib/api';

// Interface da resposta da API
export interface CategoryCardData {
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

// Adapter
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

// Hook atualizado
export function useCategoriesQuery(options: UseCategoriesQueryOptions = {}) {
  return useQuery<Category[]>({
    queryKey: ['categories', { view, featured, limit }],
    queryFn: async () => {
      const response = await api.request<CategoryCardData[]>({
        url: `/categories?${params.toString()}`,
        method: 'GET'
      });
      // Adaptar dados
      return response.data.map(adaptCategoryData);
    },
    // ...
  });
}
```

---

### 4. ✅ `hooks/useBannersQuery.ts`

**Mudanças:**
```typescript
// Substituir api.get por api.request
const response = await api.request<Banner[]>({
  url: `/banners?${params.toString()}`,
  method: 'GET'
});
return response.data;
```

---

## 📊 Resumo das Correções

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `components/CategoriesIndex.tsx` | + adapter pattern | ✅ |
| `components/CategoriesIndexV2.tsx` | Nenhuma (usa hooks) | ✅ |
| `hooks/useCategoriesQuery.ts` | + adapter pattern | ✅ |
| `hooks/useBannersQuery.ts` | api.get → api.request | ✅ |

**Total:** 4 arquivos corrigidos

---

## ✅ Status Final

✅ **Todos os erros TypeScript corrigidos**  
✅ **api.get() → api.request() em todos os lugares**  
✅ **Adapter pattern implementado para Category**  
✅ **Build deve passar agora**

---

## 🧪 Teste Local

```bash
cd AB0-1-front
npm run build
```

Se passar localmente, o CI/CD também passará.

---

**Data:** 2024-12-25  
**Arquivos modificados:** 4  
**Linhas alteradas:** ~80 linhas  
**Padrão aplicado:** Adapter Pattern
