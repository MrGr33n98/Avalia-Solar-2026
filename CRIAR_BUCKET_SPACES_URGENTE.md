# 🚨 URGENTE: Criar Bucket no DigitalOcean Spaces

## ❌ Problema Atual:

```
Aws::S3::Errors::NoSuchBucket (The specified bucket does not exist)
```

O código está tentando enviar imagens para `avalia-solar-assets`, mas esse bucket **NÃO EXISTE** ainda!

## ✅ SOLUÇÃO - Criar o Bucket AGORA:

### Passo 1: Acessar DigitalOcean Spaces

1. Vá para: https://cloud.digitalocean.com/spaces
2. Faça login

### Passo 2: Criar Novo Space

1. Clique em **"Create Space"** (botão azul no canto superior direito)

2. **Configurações do Space:**

   ```
   ┌─────────────────────────────────────┐
   │ Choose a datacenter region          │
   ├─────────────────────────────────────┤
   │ ○ New York 3 (nyc3)     ← ESCOLHER │
   │ ○ San Francisco 3                   │
   │ ○ Amsterdam 3                       │
   │ ○ Singapore 1                       │
   │ ○ Frankfurt 1                       │
   └─────────────────────────────────────┘
   ```

3. **Nome do Space:**
   ```
   ┌─────────────────────────────────────┐
   │ Space name                          │
   ├─────────────────────────────────────┤
   │ avalia-solar-assets    ← EXATAMENTE│
   └─────────────────────────────────────┘
   ```
   
   ⚠️ **IMPORTANTE**: O nome deve ser EXATAMENTE `avalia-solar-assets`

4. **Habilitar CDN:**
   ```
   ┌─────────────────────────────────────┐
   │ ☑ Enable CDN                        │
   │   Speed up content delivery         │
   └─────────────────────────────────────┘
   ```
   ✅ **Marcar essa opção!**

5. **Permissões de Acesso:**
   ```
   ┌─────────────────────────────────────┐
   │ File Listing                        │
   ├─────────────────────────────────────┤
   │ ● Restricted  ← RECOMENDADO        │
   │ ○ Public                            │
   └─────────────────────────────────────┘
   ```
   Escolha **"Restricted"** (mais seguro)

6. Clique em **"Create a Space"**

### Passo 3: Configurar CORS (Importante!)

Depois que o Space for criado:

1. Clique no Space `avalia-solar-assets`
2. Vá na aba **"Settings"**
3. Role até **"CORS Configurations"**
4. Clique em **"Add"**

5. **Configuração CORS:**

   ```json
   {
     "AllowedOrigins": [
       "https://api.avaliasolar.com.br",
       "https://avaliasolar.com.br",
       "https://www.avaliasolar.com.br"
     ],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3000
   }
   ```

6. Clique em **"Save"**

### Passo 4: Verificar Keys (Já feito)

As keys já estão configuradas:
- ✅ `SPACES_ACCESS_KEY_ID` = DO8013VUNPMR8VM9KVK8
- ✅ `SPACES_SECRET_ACCESS_KEY` = (configurada)

### Passo 5: Testar Upload

Depois de criar o Space:

1. Acesse: https://api.avaliasolar.com.br/admin/categories/1/edit
2. Faça upload de uma imagem
3. ✅ **Deve funcionar!**

## 📊 Resultado Esperado:

### ANTES (Erro):
```
S3 Storage (140.3ms) Uploaded file...
❌ Aws::S3::Errors::NoSuchBucket
```

### DEPOIS (Sucesso):
```
S3 Storage (140.3ms) Uploaded file...
✅ 302 Redirect to https://avalia-solar-assets.nyc3.digitaloceanspaces.com/...
```

## 🎯 Resumo Rápido:

1. **Acessar**: https://cloud.digitalocean.com/spaces
2. **Criar Space**: Nome = `avalia-solar-assets`, Região = `nyc3`
3. **Habilitar CDN**: ☑
4. **Configurar CORS**: Adicionar origens permitidas
5. **Testar**: Upload de imagem no admin

## ⏱️ Tempo Estimado: 5 minutos

## 💰 Custo: $5/mês

✅ **Depois disso, NUNCA mais vai perder imagens!**
