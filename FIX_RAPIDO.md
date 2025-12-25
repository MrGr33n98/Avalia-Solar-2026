# ⚡ FIX RÁPIDO - EXECUTAR NO SERVIDOR

## 🎯 PROBLEMA
```
TypeError: Cannot read properties of null (reading 'digest')
```

## ✅ SOLUÇÃO (3 comandos)

```bash
# 1. Conectar ao servidor
ssh root@ubuntu-s-1vcpu-2gb-70gb-intel-nyc3-01

# 2. Ir para diretório do projeto
cd ~/Avalia-Solar-2026

# 3. Executar quick fix
docker exec avalia_frontend_prod rm -rf /app/.next && docker restart avalia_frontend_prod && sleep 10 && docker logs --tail 30 avalia_frontend_prod
```

## 🔍 VERIFICAR SUCESSO
Se o erro persistir após o comando acima, os arquivos não foram atualizados.

**Execute diagnóstico:**
```bash
docker exec avalia_frontend_prod cat /app/app/categories/layout.tsx | head -3
```

**✅ Deve mostrar:**
```typescript
import { ReactNode } from 'react';

export default function CategoryLayout
```

**❌ Se mostrar:**
```typescript
'use client';
```

**Então os arquivos precisam ser atualizados. Execute:**
```bash
# MÉTODO RÁPIDO: Editar diretamente no servidor
nano AB0-1-front/app/categories/layout.tsx
```

**Substituir TODO o conteúdo por:**
```typescript
import { ReactNode } from 'react';

export default function CategoryLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

**Salvar:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Repetir para outro arquivo:**
```bash
nano AB0-1-front/app/categories/[slug]/layout.tsx
```

**Substituir TODO o conteúdo por:**
```typescript
export default function CategorySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Salvar:** `Ctrl+O`, `Enter`, `Ctrl+X`

## 🔨 REBUILD APÓS EDITAR
```bash
docker-compose down && docker-compose build --no-cache frontend && docker-compose up -d && sleep 15 && docker logs --tail 30 avalia_frontend_prod
```

## ✅ SUCESSO ESPERADO
```
✓ Ready in 2.5s
○ Compiling /categories ...
✓ Compiled /categories in 800ms
```

## 📚 Documentação Completa
- `GUIA_URGENTE_FIX.md` - Guia detalhado
- `FIX_DIGEST_ERROR_NEXTJS.md` - Explicação técnica
- Scripts disponíveis:
  - `quick-fix-cache.sh` - Fix rápido (1 min)
  - `diagnose-nextjs-error.sh` - Diagnóstico
  - `force-fix-nextjs.sh` - Fix completo (10 min)
