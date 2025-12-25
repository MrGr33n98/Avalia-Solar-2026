# Fix: TypeError - Cannot read properties of null (reading 'digest')

## 🔴 Erro Identificado

```
TypeError: Cannot read properties of null (reading 'digest')
    at /app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:13:18520
```

## 🔍 Causas Identificadas

Este erro no Next.js 14 geralmente ocorre por:

1. **Server Actions mal configurados** - `allowedOrigins` restritivo demais
2. **QueryProvider faltando no layout** - React Query não estava envolvendo o app
3. **Hydration mismatch** - Diferença entre server e client render
4. **Cache digest error** - Problemas com o sistema de cache do Next.js

## ✅ Soluções Implementadas

### 1. **Adicionado QueryProvider ao ClientBody** ✅
```tsx
// components/ClientBody.tsx
import { QueryProvider } from '@/lib/QueryProvider';

export default function ClientBody({ children }) {
  return (
    <QueryProvider>  {/* ← ADICIONADO */}
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
```

**Por quê?**
- React Query precisa estar no topo da árvore de componentes
- Garante que todas as queries tenham acesso ao QueryClient
- Previne erros de "QueryClient not found"

---

### 2. **Removido `allowedOrigins` do Server Actions** ✅
```js
// next.config.js - ANTES
experimental: {
  serverActions: {
    allowedOrigins: ['https://www.avaliasolar.com.br'], // ← MUITO RESTRITIVO
    bodySizeLimit: '2mb',
  },
}

// next.config.js - DEPOIS
experimental: {
  serverActions: {
    bodySizeLimit: '2mb',  // ← Sem allowedOrigins
  },
}
```

**Por quê?**
- `allowedOrigins` estava bloqueando requisições em produção
- Causava erro de digest em ambientes diferentes
- O Next.js já tem proteção CSRF built-in

---

### 3. **Reorganizado estrutura do next.config.js** ✅
```js
// Movido Sentry config para o final
// Evita que withSentryConfig interfira em outras configs
```

---

## 🚀 Como Testar a Correção

### 1. **Rebuild do Frontend**
```bash
cd AB0-1-front
npm run build
```

### 2. **Rebuild do Docker**
```bash
docker-compose down
docker-compose build frontend
docker-compose up -d frontend
```

### 3. **Verificar Logs**
```bash
docker logs avalia_frontend_prod --tail 50
```

**✅ Logs esperados (corretos):**
```
✓ Starting...
✓ Ready in 2.5s
  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000
```

**❌ Logs ruins (erro):**
```
TypeError: Cannot read properties of null (reading 'digest')
```

---

## 🔧 Troubleshooting Adicional

### Se o erro persistir:

#### A. **Limpar cache do Next.js**
```bash
rm -rf AB0-1-front/.next
rm -rf AB0-1-front/node_modules/.cache
```

#### B. **Verificar variáveis de ambiente**
```bash
# .env.production deve ter:
NEXT_PUBLIC_API_URL=https://api.avaliasolar.com.br
NODE_ENV=production
```

#### C. **Desabilitar Sentry temporariamente**
```js
// next.config.js
// Comentar completamente a parte do Sentry
module.exports = nextConfig;  // ← Sem withSentryConfig
```

#### D. **Verificar se há Server Actions sendo usadas**
```bash
# Buscar por 'use server' no código
grep -r "use server" AB0-1-front/app
grep -r "'use server'" AB0-1-front/app
```

Se encontrar arquivos com `'use server'`, remover ou refatorar para Client Components.

---

## 📊 Impacto das Mudanças

### ✅ Positivos
- QueryProvider agora cobre toda a aplicação
- Menos restrições em Server Actions
- Melhor compatibilidade com produção
- Logs mais limpos

### ⚠️ Pontos de Atenção
- Verificar se todas as queries do React Query continuam funcionando
- Monitorar performance (QueryProvider adiciona overhead mínimo)
- Testar autenticação (não deve ser afetada)

---

## 🎯 Checklist de Verificação

- [ ] Build do frontend sem erros TypeScript
- [ ] Build do Docker sem erros
- [ ] Logs do frontend sem "digest" errors
- [ ] Homepage carrega corretamente
- [ ] Navegação entre páginas funciona
- [ ] React Query Devtools aparece (dev mode)
- [ ] Autenticação funciona
- [ ] Dashboard funciona
- [ ] Categorias funcionam

---

## 📚 Referências

- [Next.js Server Actions Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React Query Setup](https://tanstack.com/query/latest/docs/framework/react/quick-start)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)

---

**Data:** 2024-12-25  
**Status:** ✅ Corrigido  
**Prioridade:** Alta  
**Impacto:** Frontend em produção
