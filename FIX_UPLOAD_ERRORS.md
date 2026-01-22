# 🔧 CORREÇÃO COMPLETA DOS ERROS DE UPLOAD

## ❌ PROBLEMAS IDENTIFICADOS

### 1. Credenciais AWS S3 Inválidas
```
Aws::S3::Errors::InvalidAccessKeyId (The access key ID you provided does not exist)
```

### 2. Bucket S3 Não Existe
```
Aws::S3::Errors::NoSuchBucket (The specified bucket does not exist)
```

### 3. Erro no Upload de Categories (Banner)
```
Status: 500
S3 Storage (140.3ms) Uploaded file to key: kj09185plnrlwlgm2xmi8lkex9dk
Aws::S3::Errors::NoSuchBucket
```

### 4. Erro no Upload de Companies (Logo)
```
Status: 500
S3 Storage (909.5ms) Uploaded file to key: 078nxm8w248wyhdasia5m3jay79j
Aws::S3::Errors::InvalidAccessKeyId
```

### 5. Erro CSV Import Companies
```
NoMethodError (undefined method `ready_for_activation?' for #<Company>)
app/admin/companies.rb:619
```

---

## ✅ SOLUÇÃO - OPÇÃO 1: Usar Armazenamento Local (RECOMENDADO PARA TESTE)

### 1️⃣ Modificar Active Storage para usar disco local

Edite: `AB0-1-back/config/environments/production.rb`

```ruby
# Linha ~50
# Trocar de:
config.active_storage.service = :spaces

# Para:
config.active_storage.service = :local
```

### 2️⃣ Garantir que o diretório de storage existe

```bash
cd AB0-1-back
mkdir -p storage
chmod -R 755 storage
```

### 3️⃣ Reiniciar o backend

```bash
docker-compose restart backend
```

---

## ✅ SOLUÇÃO - OPÇÃO 2: Configurar DigitalOcean Spaces Corretamente

### 1️⃣ Criar o Bucket no DigitalOcean Spaces

1. Acesse: https://cloud.digitalocean.com/spaces
2. Clique em **"Create a Space"**
3. Configurações:
   - **Region**: NYC3 (ou sua preferência)
   - **Name**: `avalia-solar-assets`
   - **Enable CDN**: Yes
   - **Public Access**: Allow (para imagens públicas)
4. Clique em **"Create Space"**

### 2️⃣ Criar API Keys

1. Acesse: https://cloud.digitalocean.com/account/api/tokens
2. Clique na aba **"Spaces access keys"**
3. Clique em **"Generate New Key"**
4. Anote:
   - **Access Key ID** (exemplo: `DO00ABC123...`)
   - **Secret Key** (exemplo: `xyz789...`) - **só aparece uma vez!**

### 3️⃣ Atualizar arquivo .env

Edite o arquivo `.env` na raiz do projeto:

```env
# DigitalOcean Spaces
ACTIVE_STORAGE_SERVICE=spaces
SPACES_ACCESS_KEY_ID=sua_access_key_aqui
SPACES_SECRET_ACCESS_KEY=sua_secret_key_aqui
SPACES_REGION=nyc3
SPACES_BUCKET=avalia-solar-assets
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

### 4️⃣ Recriar e reiniciar os containers

```bash
docker-compose down
docker-compose up -d --build backend
```

---

## 🔧 CORREÇÃO DO ERRO DE CSV IMPORT

### Adicionar método faltante no Model Company

Edite: `AB0-1-back/app/models/company.rb`

Adicione o método:

```ruby
def ready_for_activation?
  # Verifica se tem os campos mínimos necessários
  name.present? && 
  email.present? && 
  (cnpj.present? || website.present?)
end
```

---

## 🔍 VERIFICAÇÃO

### 1. Testar Upload Manual (Admin)

1. Acesse: https://api.avaliasolar.com.br/admin
2. Login: `felipe@avaliasolar.com.br`
3. Vá em **Categories** → Editar categoria
4. Faça upload de uma imagem no campo **Banner**
5. Clique em **Update Category**

**Resultado Esperado**: ✅ Success (sem erro 500)

### 2. Verificar Storage Service Ativo

```bash
docker-compose exec backend rails runner "puts ActiveStorage::Blob.service.class"
```

**Resultado esperado**:
- Local: `ActiveStorage::Service::DiskService`
- Spaces: `ActiveStorage::Service::S3Service`

### 3. Testar CSV Import

1. Vá em **Companies** → **Import CSV**
2. Faça upload de um arquivo CSV válido
3. Clique em **Import**

**Resultado Esperado**: ✅ Success (sem NoMethodError)

---

## 📝 LOGS PARA MONITORAR

```bash
# Ver logs do backend
docker-compose logs -f backend | grep -E "(ERROR|FATAL|S3|Upload)"

# Ver último erro específico
docker-compose logs backend | grep "Aws::S3::Errors" -A 5

# Verificar permissões do diretório storage
docker-compose exec backend ls -la /app/storage
```

---

## 🎯 CHECKLIST FINAL

- [ ] Escolher entre Local Storage (Opção 1) ou Spaces (Opção 2)
- [ ] Se Opção 1: Modificar `production.rb` para `service = :local`
- [ ] Se Opção 2: Criar bucket e configurar credenciais no `.env`
- [ ] Adicionar método `ready_for_activation?` no model Company
- [ ] Reiniciar containers: `docker-compose restart backend`
- [ ] Testar upload de categoria (banner)
- [ ] Testar upload de company (logo)
- [ ] Testar import CSV
- [ ] Verificar que não há mais erros 500 nos logs

---

## 💡 RECOMENDAÇÃO FINAL

**Para DESENVOLVIMENTO/TESTE**: Use **Opção 1** (Local Storage)
- ✅ Mais rápido
- ✅ Sem custos
- ✅ Sem configuração externa

**Para PRODUÇÃO**: Use **Opção 2** (DigitalOcean Spaces)
- ✅ CDN integrado
- ✅ Backup automático
- ✅ Escalável
- ⚠️ Requer configuração de API keys

---

## 📞 SUPORTE

Se persistir o erro, envie:

1. Output do comando:
```bash
docker-compose logs backend | tail -100
```

2. Confirmação de qual opção escolheu (1 ou 2)

3. Screenshot do erro no Admin Panel
