# 🔧 SOLUÇÃO: Erro de Upload S3/Spaces

## 📋 DIAGNÓSTICO

**Erro identificado nos logs:**
```
Aws::S3::Errors::InvalidAccessKeyId
The access key ID you provided does not exist in our records
```

**Causa raiz:** Credenciais AWS S3/DigitalOcean Spaces inválidas ou inexistentes

---

## 🚀 SOLUÇÃO RÁPIDA (NA VM)

### **Opção 1: Script Automático**

```bash
cd ~/Avalia-Solar-2026
chmod +x fix-s3-credentials.sh
./fix-s3-credentials.sh
```

### **Opção 2: Manual**

1. **Obter credenciais no DigitalOcean:**
   - Acesse: https://cloud.digitalocean.com/spaces
   - Clique em "Manage Keys" → "Spaces access keys"
   - Crie uma nova chave ou use existente

2. **Editar .env na VM:**
   ```bash
   cd ~/Avalia-Solar-2026
   nano .env
   ```

3. **Adicionar/atualizar variáveis:**
   ```bash
   SPACES_ACCESS_KEY_ID=sua_access_key_aqui
   SPACES_SECRET_ACCESS_KEY=sua_secret_key_aqui
   SPACES_BUCKET=avalia-solar-assets
   SPACES_REGION=nyc3
   SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
   ACTIVE_STORAGE_SERVICE=spaces
   ```

4. **Salvar e reiniciar:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## 🔍 VERIFICAÇÃO

### **1. Verificar variáveis carregadas:**
```bash
docker-compose exec ab0-backend env | grep SPACES
```

### **2. Verificar logs:**
```bash
docker-compose logs -f ab0-backend | grep -i "storage\|s3\|spaces"
```

### **3. Testar upload:**
- Acesse: https://api.avaliasolar.com.br/admin
- Login: felipe@avaliasolar.com.br
- Vá em Categories → Editar categoria
- Tente fazer upload de um banner

---

## ⚙️ CONFIGURAÇÃO DO BUCKET (DigitalOcean Spaces)

### **Permissões necessárias:**

1. **Acessar Spaces:**
   https://cloud.digitalocean.com/spaces

2. **Selecionar bucket:** `avalia-solar-assets`

3. **Configurar CORS:**
   - Settings → CORS Configurations
   - Adicionar:
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

4. **Configurar ACL:**
   - Files → Permissions
   - Garantir que arquivos sejam públicos (read-only)

---

## 🔐 SEGURANÇA

### **Nunca commite credenciais!**

✅ **Correto:**
```bash
# .env (não commitado)
SPACES_ACCESS_KEY_ID=DO00XXX...
SPACES_SECRET_ACCESS_KEY=secret123...
```

❌ **ERRADO:**
```bash
# docker-compose.yml (commitado)
SPACES_ACCESS_KEY_ID: DO00XXX...  # NUNCA FAÇA ISSO!
```

---

## 🐛 TROUBLESHOOTING

### **Erro: "NoSuchBucket"**
```bash
# Verificar se bucket existe
curl -I https://avalia-solar-assets.nyc3.digitaloceanspaces.com

# Criar bucket se necessário (via CLI ou dashboard)
```

### **Erro: "InvalidAccessKeyId"**
```bash
# Validar credenciais
docker-compose exec ab0-backend rails runner "
  begin
    service = ActiveStorage::Blob.service
    service.buckets.first
    puts '✅ Credenciais válidas'
  rescue => e
    puts '❌ Erro: ' + e.message
  end
"
```

### **Upload funciona mas imagem 404**
```bash
# Verificar URL gerada
docker-compose logs ab0-backend | grep "https://avalia-solar-assets"

# Verificar se arquivo existe no Spaces
# Dashboard → Files
```

---

## 📊 RESUMO DOS ERROS IDENTIFICADOS

| Erro | Causa | Solução |
|------|-------|---------|
| InvalidAccessKeyId | Credenciais inválidas | Atualizar .env com keys válidas |
| NoSuchBucket | Bucket não existe | Criar bucket ou corrigir nome |
| 403 Forbidden | Sem permissão | Configurar ACL/CORS no bucket |
| 404 na imagem | URL incorreta | Verificar SPACES_ENDPOINT |

---

## 📞 SUPORTE

**Se o erro persistir:**

1. Verificar logs completos:
   ```bash
   docker-compose logs --tail=100 ab0-backend > upload_error.log
   ```

2. Verificar conectividade:
   ```bash
   curl -v https://nyc3.digitaloceanspaces.com
   ```

3. Testar credenciais manualmente:
   ```bash
   s3cmd --access_key=KEY --secret_key=SECRET ls s3://avalia-solar-assets/
   ```

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Credenciais corretas no .env
- [ ] Bucket existe no Spaces
- [ ] CORS configurado
- [ ] Containers reiniciados
- [ ] Logs sem erros S3
- [ ] Upload funciona no admin
- [ ] Imagem carrega no frontend
- [ ] URL pública acessível

---

**Última atualização:** 2026-01-22  
**Versão:** 1.0
