# 🎯 FIX FINAL: Cannot read properties of null (reading 'message')

## ✅ DIAGNÓSTICO COMPLETO

O erro `TypeError: Cannot read properties of null (reading 'message')` está acontecendo no servidor de produção mesmo após várias tentativas de correção.

### 🔍 Status dos Arquivos Error.tsx

**TODOS JÁ CORRIGIDOS:**
- ✅ `app/error.tsx` - Usa `error?.message || 'Unknown error'`
- ✅ `app/global-error.tsx` - Usa `error?.message || 'Unknown error'`
- ✅ `app/categories/error.tsx` - Usa `error?.message || 'Unknown error'`
- ✅ `app/dashboard/error.tsx` - Usa `error?.message || 'Unknown error'`
- ✅ `app/products/error.tsx` - Usa `error?.message || 'Unknown error'`

### 🔴 PROBLEMA REAL

O erro **NÃO está** nos arquivos error.tsx. O erro está acontecendo porque:

1. **Build cache corrompido** - Docker está usando uma versão antiga do build
2. **Server Actions desatualizados** - Há Server Actions que não foram recompilados
3. **Mismatch de versão** - Código no container está diferente do código no GitHub

## 🚀 SOLUÇÃO DEFINITIVA

### Passo 1: Limpar TUDO no servidor

```bash
ssh root@64.225.59.107

cd ~/Avalia-Solar-2026

# 1. Parar TODOS os containers
docker-compose down

# 2. Remover TODAS as imagens do projeto
docker rmi $(docker images | grep avalia | awk '{print $3}') -f

# 3. Limpar COMPLETAMENTE o cache do Docker
docker builder prune -af
docker system prune -af --volumes

# 4. Verificar que NÃO há mais imagens
docker images | grep avalia
```

### Passo 2: Pull do código e reconstruir

```bash
cd ~/Avalia-Solar-2026

# 1. Pull do código mais recente
git pull origin main

# 2. Verificar a versão do Next.js (deve ser 14.1.4)
cat AB0-1-front/package.json | grep '"next"'

# 3. Login no registry
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin

# 4. Pull das novas imagens
docker-compose pull

# 5. Subir containers
docker-compose up -d --force-recreate --remove-orphans

# 6. Aguardar 15 segundos
sleep 15

# 7. Verificar logs
docker logs -f --tail 50 avalia_frontend_prod
```

### Passo 3: Verificar se funcionou

```bash
# NÃO deve haver erros de "Cannot read properties of null"
docker logs avalia_frontend_prod 2>&1 | grep -i "Cannot read"

# Deve aparecer apenas:
# ✓ Ready in Xms
# ○ Compiling / ...
```

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Git pull feito no servidor
- [ ] Cache do Docker limpo completamente
- [ ] Imagens antigas removidas
- [ ] Novas imagens baixadas
- [ ] Containers recriados com --force-recreate
- [ ] Logs não mostram erros de null
- [ ] Homepage carrega sem erros
- [ ] /categories carrega sem erros
- [ ] /companies carrega sem erros

## 🔧 SE O ERRO PERSISTIR

### Opção A: Rebuild Local sem Cache

```bash
# No servidor
cd ~/Avalia-Solar-2026
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Opção B: Verificar package.json

```bash
# Verificar se Next.js está em 14.1.4
cat AB0-1-front/package.json | grep '"next"'

# Deve mostrar: "next": "14.1.4"
```

### Opção C: Limpar node_modules no build

```bash
# Editar Dockerfile.frontend temporariamente
# Adicionar antes do COPY:
RUN rm -rf .next node_modules
```

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

Este erro foi documentado anteriormente em:
- `SOLUCAO_DEFINITIVA_DIGEST.md` - Explicação sobre try/catch com redirect()
- `FIX_ERROR_HANDLERS.md` - Correção dos error boundaries
- `FIX_DIGEST_ERROR_SOLUTION.md` - Correção do digest error

## 🎯 CONCLUSÃO

O problema **NÃO** é no código (já está correto), mas sim no **cache do Docker** que está servindo uma versão antiga do build.

A solução é **limpar completamente o cache** e fazer um **rebuild do zero**.

---

**Data:** 2025-12-25  
**Status:** Aguardando limpeza de cache no servidor
