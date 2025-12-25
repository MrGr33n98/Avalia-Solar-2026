# GUIA URGENTE: Corrigir Erro de Digest no Servidor

## 🚨 SITUAÇÃO ATUAL
O erro persiste porque os arquivos corrigidos ainda não foram enviados ao servidor.

## 📤 PASSO 1: FAZER UPLOAD DOS ARQUIVOS CORRIGIDOS

### Opção A: Via Git (Recomendado)
```bash
# No seu computador local (Windows)
cd C:\Users\user\Documents\trae_projects\avalia-solar\Avalia-Solar-2026

# Commit das mudanças
git add .
git commit -m "fix: Corrigir erro de digest Next.js - remover use client de layouts"
git push origin main

# No servidor
cd ~/Avalia-Solar-2026
git pull origin main
```

### Opção B: Via SCP/SFTP
```bash
# No seu computador local
# Copiar arquivos críticos para o servidor

scp AB0-1-front/app/categories/layout.tsx root@SEU_SERVIDOR:~/Avalia-Solar-2026/AB0-1-front/app/categories/
scp AB0-1-front/app/categories/[slug]/layout.tsx root@SEU_SERVIDOR:~/Avalia-Solar-2026/AB0-1-front/app/categories/[slug]/
scp AB0-1-front/components/CategoryCardMinimal.tsx root@SEU_SERVIDOR:~/Avalia-Solar-2026/AB0-1-front/components/
scp AB0-1-front/components/CompanyCard.tsx root@SEU_SERVIDOR:~/Avalia-Solar-2026/AB0-1-front/components/
scp AB0-1-front/app/companies/page.tsx root@SEU_SERVIDOR:~/Avalia-Solar-2026/AB0-1-front/app/companies/
```

### Opção C: Editar Diretamente no Servidor (Emergência)
```bash
# Conectar ao servidor
ssh root@ubuntu-s-1vcpu-2gb-70gb-intel-nyc3-01

cd ~/Avalia-Solar-2026

# Editar layout de categorias
nano AB0-1-front/app/categories/layout.tsx
```

**Conteúdo que deve estar:**
```typescript
import { ReactNode } from 'react';

export default function CategoryLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

**Editar layout de slug:**
```bash
nano AB0-1-front/app/categories/[slug]/layout.tsx
```

**Conteúdo que deve estar:**
```typescript
export default function CategorySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

---

## 🔧 PASSO 2: EXECUTAR O FIX NO SERVIDOR

### Opção 1: Quick Fix (Rápido - 1 minuto)
```bash
cd ~/Avalia-Solar-2026
chmod +x quick-fix-cache.sh
./quick-fix-cache.sh
```

### Opção 2: Diagnóstico Primeiro (Recomendado)
```bash
cd ~/Avalia-Solar-2026
chmod +x diagnose-nextjs-error.sh
./diagnose-nextjs-error.sh
```

**Leia o output e siga as recomendações.**

### Opção 3: Fix Completo (Se quick fix não funcionar - 5-10 minutos)
```bash
cd ~/Avalia-Solar-2026
chmod +x force-fix-nextjs.sh
./force-fix-nextjs.sh
```

⚠️ **ATENÇÃO:** Opção 3 remove todos os volumes e cache. Tenha certeza!

---

## 🧪 PASSO 3: VERIFICAR SE FUNCIONOU

### Verificar Logs
```bash
docker logs -f avalia_frontend_prod
```

**✅ Sucesso esperado:**
```
✓ Ready in 2.5s
○ Compiling /categories ...
✓ Compiled /categories in 800ms
```

**❌ Se ainda mostrar erro:**
```
TypeError: Cannot read properties of null (reading 'digest')
```

### Testar Endpoints
```bash
# Testar página de categorias
curl -I http://localhost/categories

# Deve retornar: HTTP/1.1 200 OK

# Testar página de empresas
curl -I http://localhost/companies

# Deve retornar: HTTP/1.1 200 OK
```

---

## 🔍 TROUBLESHOOTING

### Problema: Arquivos não foram atualizados no container
```bash
# Verificar conteúdo dentro do container
docker exec avalia_frontend_prod cat /app/app/categories/layout.tsx

# Se ainda mostrar 'use client', os arquivos não foram copiados
# Solução: Rebuild completo
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Problema: Erro persiste após rebuild
```bash
# 1. Limpar cache Next.js manualmente
docker exec avalia_frontend_prod rm -rf /app/.next

# 2. Limpar node_modules cache
docker exec avalia_frontend_prod rm -rf /app/node_modules/.cache

# 3. Restart
docker restart avalia_frontend_prod

# 4. Monitorar
docker logs -f avalia_frontend_prod
```

### Problema: Container não inicia
```bash
# Verificar todos os containers
docker-compose ps

# Verificar logs de erro
docker-compose logs frontend

# Verificar espaço em disco
df -h

# Se necessário, limpar espaço
docker system prune -af
```

---

## 📝 CHECKLIST DE VERIFICAÇÃO

Antes de executar os scripts:

- [ ] Arquivos corrigidos foram enviados ao servidor
- [ ] `use client` foi removido de `app/categories/layout.tsx`
- [ ] `use client` foi removido de `app/categories/[slug]/layout.tsx`
- [ ] `framer-motion` foi removido de `CategoryCardMinimal.tsx`
- [ ] `suppressHydrationWarning` foi removido de `CompanyCard.tsx`
- [ ] Scripts têm permissão de execução (`chmod +x`)

Após executar os scripts:

- [ ] Logs não mostram erro de digest
- [ ] Página `/categories` carrega sem erro
- [ ] Página `/companies` carrega sem erro
- [ ] Imagens aparecem corretamente
- [ ] Filtros funcionam
- [ ] Responsividade funciona

---

## ⚡ COMANDOS RÁPIDOS

```bash
# Verificar se arquivos foram atualizados
grep "use client" AB0-1-front/app/categories/layout.tsx && echo "❌ ERRO: Ainda tem 'use client'" || echo "✅ OK"

# Quick fix (mais rápido)
./quick-fix-cache.sh

# Diagnóstico completo
./diagnose-nextjs-error.sh

# Fix completo (último recurso)
./force-fix-nextjs.sh

# Monitorar logs
docker logs -f avalia_frontend_prod

# Testar endpoint
curl -I http://localhost/categories
```

---

## 🆘 ÚLTIMA OPÇÃO (Se nada funcionar)

```bash
# Parar tudo
docker-compose down -v

# Remover TUDO do Docker
docker system prune -af --volumes

# Rebuild do zero
docker-compose build --no-cache
docker-compose up -d

# Aguardar 2 minutos
sleep 120

# Verificar
docker logs avalia_frontend_prod
```

---

## 📞 SUPORTE

Se após todas as tentativas o erro persistir:

1. Execute `./diagnose-nextjs-error.sh` e salve o output
2. Verifique a versão do Next.js: `docker exec avalia_frontend_prod cat /app/package.json | grep next`
3. Considere downgrade para Next.js 14.1.4 se estiver em 14.2.5
4. Abra issue no GitHub do Next.js: https://github.com/vercel/next.js/issues

---

**Última atualização:** 2025-12-25 05:50  
**Status:** 🔴 Aguardando aplicação no servidor
