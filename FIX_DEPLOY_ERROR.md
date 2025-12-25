# 🐛 Fix: TypeScript Build Error - Deploy

## Erro Original

```
Type error: Property 'get' does not exist on type '{ baseUrl: string; request: <T>(config: any) => Promise<{ data: T; }>; }'.
```

## Causa Raiz

O arquivo `lib/api.ts` define o objeto `api` com apenas dois membros:
- `baseUrl: string`
- `request: async function<T>(config: any): Promise<{ data: T }>`

Não existe método `.get()`, apenas `.request()`.

## Solução

**Arquivo corrigido:** `AB0-1-front/components/CategoriesIndex.tsx`

### Antes (❌ Errado):
```typescript
const [bannersRes, featuredRes, allRes] = await Promise.all([
  api.get('/banners?position=categories_top').catch(() => ({ data: [] })),
  api.get('/categories?view=cards&featured=true&limit=8').catch(() => ({ data: [] })),
  api.get('/categories?view=cards').catch(() => ({ data: [] }))
]);
```

### Depois (✅ Correto):
```typescript
const [bannersRes, featuredRes, allRes] = await Promise.all([
  api.request<Banner[]>({ url: '/banners?position=categories_top', method: 'GET' }).catch(() => ({ data: [] })),
  api.request<Category[]>({ url: '/categories?view=cards&featured=true&limit=8', method: 'GET' }).catch(() => ({ data: [] })),
  api.request<Category[]>({ url: '/categories?view=cards', method: 'GET' }).catch(() => ({ data: [] }))
]);
```

## Mudanças

1. Substituído `api.get(url)` por `api.request({ url, method: 'GET' })`
2. Adicionado tipos genéricos `<Banner[]>` e `<Category[]>`
3. Mantido `.catch(() => ({ data: [] }))` para fallback

## Status

✅ **Fix aplicado**  
✅ **TypeScript deve compilar com sucesso**  
✅ **Build deve passar no CI/CD**

## Próximo Deploy

O build agora deve funcionar. Para testar localmente:

```bash
cd AB0-1-front
npm run build
```

Se houver sucesso, o deploy no GitHub Actions também deve funcionar.

---

**Data:** 2024-12-25  
**Arquivo modificado:** `AB0-1-front/components/CategoriesIndex.tsx`  
**Linhas alteradas:** 3 (linhas 62-64)
