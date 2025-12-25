# 🔍 ANÁLISE: Por que o Deploy não atualizou os arquivos?

## 📋 O QUE ACONTECEU

O workflow de deploy **FUNCIONOU**, mas os arquivos não foram atualizados no servidor porque:

### 1️⃣ **O Workflow usa CACHE do Docker Build**

Veja a linha 43-49 do `.github/workflows/deploy-v1.yml`:

```yaml
- name: Build and Push Frontend
  uses: docker/build-push-action@v5
  with:
    context: ./AB0-1-front
    file: ./Dockerfile.frontend
    push: true
    tags: ghcr.io/${{ steps.repo_name.outputs.repository }}-frontend:latest
    # ❌ NÃO TEM: no-cache: true
```

**Problema:** O Docker Build Action usa **cache de layers** por padrão. Se você mudou apenas arquivos `.tsx`, o Docker pode ter usado cache da etapa de `COPY` e não copiou os novos arquivos!

### 2️⃣ **O Deploy no Servidor faz `pull` da imagem antiga**

Linha 66 do workflow:

```yaml
docker-compose pull  # ← Puxa imagem do registry
docker-compose down || true
docker-compose up -d --force-recreate --remove-orphans
```

**Problema:** Se a imagem no GitHub Container Registry (ghcr.io) foi buildada com cache antigo, o `pull` vai baixar a versão antiga!

---

## ✅ SOLUÇÃO IMEDIATA

### Opção 1: Forçar Rebuild SEM Cache no Workflow

Edite `.github/workflows/deploy-v1.yml`:

```yaml
- name: Build and Push Frontend
  uses: docker/build-push-action@v5
  with:
    context: ./AB0-1-front
    file: ./Dockerfile.frontend
    push: true
    tags: ghcr.io/${{ steps.repo_name.outputs.repository }}-frontend:latest
    no-cache: true  # ← ADICIONE ESTA LINHA
```

Depois:
```bash
git add .github/workflows/deploy-v1.yml
git commit -m "fix: Force rebuild frontend without cache"
git push origin main
```

### Opção 2: Rebuild Manual no Servidor (Mais Rápido)

Como você já tem acesso SSH:

```bash
ssh root@ubuntu-s-1vcpu-2gb-70gb-intel-nyc3-01

cd ~/Avalia-Solar-2026

# Atualizar código do repositório
git pull origin main

# Rebuild local SEM cache
docker-compose build --no-cache frontend

# Restart
docker-compose up -d --force-recreate frontend

# Verificar
docker logs -f avalia_frontend_prod
```

---

## 🔧 MELHORIAS NO WORKFLOW

### Problema 1: Cache Agressivo

**Antes:**
```yaml
- name: Build and Push Frontend
  uses: docker/build-push-action@v5
  with:
    context: ./AB0-1-front
    file: ./Dockerfile.frontend
    push: true
    tags: ghcr.io/${{ ... }}-frontend:latest
```

**Depois (Melhorado):**
```yaml
- name: Build and Push Frontend
  uses: docker/build-push-action@v5
  with:
    context: ./AB0-1-front
    file: ./Dockerfile.frontend
    push: true
    tags: |
      ghcr.io/${{ ... }}-frontend:latest
      ghcr.io/${{ ... }}-frontend:${{ github.sha }}
    no-cache: true  # ← Força rebuild completo
    # Ou use cache seletivo:
    # cache-from: type=gha
    # cache-to: type=gha,mode=max
```

### Problema 2: Não limpa cache no servidor

**Adicione ao final do script de deploy:**

```yaml
script: |
  set -e
  cd ~/Avalia-Solar-2026
  echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
  
  # Limpar cache local
  docker system prune -f
  
  # Pull novas imagens
  docker-compose pull
  
  # Down com volumes (se necessário)
  docker-compose down
  
  # Up com force recreate
  docker-compose up -d --force-recreate --remove-orphans
  
  # Limpar imagens antigas
  docker image prune -af
  
  # Verificar logs
  docker logs --tail 30 avalia_frontend_prod
  
  echo "✅ Deploy finalizado com sucesso!"
```

---

## 🐛 COMO DETECTAR ESSE PROBLEMA NO FUTURO

### 1. Verificar se imagem foi realmente buildada

No GitHub Actions, veja o log do build:

```
Step 5/12 : COPY . .
 ---> Using cache  ← ❌ PROBLEMA! Está usando cache
```

**Deveria ser:**
```
Step 5/12 : COPY . .
 ---> Running in abc123...  ← ✅ OK! Está copiando
```

### 2. Adicionar verificação no workflow

Adicione step de validação:

```yaml
- name: Verify Frontend Files
  run: |
    echo "Checking if layout files are correct..."
    if grep -q "use client" ./AB0-1-front/app/categories/layout.tsx; then
      echo "❌ ERROR: 'use client' found in layout!"
      exit 1
    fi
    echo "✅ Layout files are correct"
```

### 3. Usar tags de versão ao invés de `:latest`

```yaml
tags: |
  ghcr.io/${{ ... }}-frontend:latest
  ghcr.io/${{ ... }}-frontend:v${{ github.run_number }}
  ghcr.io/${{ ... }}-frontend:sha-${{ github.sha }}
```

Depois no servidor:

```yaml
# docker-compose.yml
services:
  frontend:
    image: ghcr.io/seu-repo-frontend:sha-abc123  # ← Tag específica
```

---

## 📊 WORKFLOW MELHORADO COMPLETO

```yaml
name: Enterprise Deploy - Avalia Solar

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate Critical Files
        run: |
          echo "🔍 Validating layout files..."
          
          if grep -q "use client" ./AB0-1-front/app/categories/layout.tsx; then
            echo "❌ ERROR: 'use client' found in categories/layout.tsx!"
            exit 1
          fi
          
          if grep -q "use client" ./AB0-1-front/app/categories/[slug]/layout.tsx; then
            echo "❌ ERROR: 'use client' found in [slug]/layout.tsx!"
            exit 1
          fi
          
          echo "✅ All layout files are valid"

  build-and-push:
    needs: validate
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Lowercase Repository Name
        id: repo_name
        run: |
          echo "repository=${GITHUB_REPOSITORY,,}" >> $GITHUB_OUTPUT

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Backend
        uses: docker/build-push-action@v5
        with:
          context: ./AB0-1-back
          file: ./Dockerfile.backend
          push: true
          tags: |
            ghcr.io/${{ steps.repo_name.outputs.repository }}-backend:latest
            ghcr.io/${{ steps.repo_name.outputs.repository }}-backend:${{ github.sha }}
          build-args: |
            RAILS_MASTER_KEY=${{ secrets.RAILS_MASTER_KEY }}
          no-cache: true

      - name: Build and Push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./AB0-1-front
          file: ./Dockerfile.frontend
          push: true
          tags: |
            ghcr.io/${{ steps.repo_name.outputs.repository }}-frontend:latest
            ghcr.io/${{ steps.repo_name.outputs.repository }}-frontend:${{ github.sha }}
          no-cache: true

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            set -e
            cd ~/Avalia-Solar-2026
            
            echo "🔐 Login no registry..."
            echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            
            echo "🗑️ Limpando cache local..."
            docker system prune -f
            
            echo "📥 Pulling novas imagens..."
            docker-compose pull
            
            echo "🛑 Stopping containers..."
            docker-compose down
            
            echo "🚀 Starting containers..."
            docker-compose up -d --force-recreate --remove-orphans
            
            echo "🗑️ Limpando imagens antigas..."
            docker image prune -af
            
            echo "⏳ Aguardando 10 segundos..."
            sleep 10
            
            echo "📋 Verificando logs..."
            docker logs --tail 30 avalia_frontend_prod
            
            echo "✅ Deploy finalizado com sucesso!"
```

---

## 🎯 AÇÃO IMEDIATA RECOMENDADA

Execute no servidor **AGORA**:

```bash
ssh root@ubuntu-s-1vcpu-2gb-70gb-intel-nyc3-01

cd ~/Avalia-Solar-2026

# 1. Atualizar código
git pull origin main

# 2. Verificar se arquivos foram atualizados
grep "use client" AB0-1-front/app/categories/layout.tsx && echo "❌ AINDA TEM" || echo "✅ OK"

# 3. Se OK, rebuild local
docker-compose build --no-cache frontend
docker-compose up -d --force-recreate frontend

# 4. Verificar
docker logs -f avalia_frontend_prod
```

**Depois de verificar que funciona, atualize o workflow conforme acima e faça commit!**
