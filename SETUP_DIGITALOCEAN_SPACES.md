# 🗄️ Configuração DigitalOcean Spaces - Guia Completo

Este guia mostra como configurar o DigitalOcean Spaces para **NUNCA MAIS PERDER** imagens de logos, banners e uploads.

## 🎯 O Problema

**ANTES (Armazenamento Local):**
- ❌ Imagens salvas dentro do container Docker
- ❌ Deploy recria container → **PERDE TODAS AS IMAGENS**
- ❌ Banners e logos desaparecem

**AGORA (DigitalOcean Spaces):**
- ✅ Imagens salvas no Spaces (S3)
- ✅ Deploy não afeta imagens
- ✅ Imagens **PERSISTENTES** para sempre

## 📋 Passo 1: Criar Space no DigitalOcean

1. Acesse: https://cloud.digitalocean.com/spaces
2. Clique em **"Create Space"**
3. Configure:
   - **Datacenter Region**: New York 3 (nyc3) ou mais próximo
   - **Space name**: `avalia-solar-assets`
   - **Enable CDN**: ✅ Sim (para performance)
   - **File Listing**: Restrict (privado)
4. Clique em **"Create Space"**

## 🔑 Passo 2: Criar API Keys

1. No menu lateral, clique em **"API"**
2. Vá para **"Spaces Keys"**
3. Clique em **"Generate New Key"**
4. Nome: `avalia-solar-production`
5. **GUARDE EM LOCAL SEGURO:**
   - `Access Key ID` (exemplo: `DO00XXXXXXXXXXXXX`)
   - `Secret Key` (exemplo: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

⚠️ **IMPORTANTE**: O Secret Key só aparece UMA VEZ! Guarde em um gerenciador de senhas.

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### Na VM (Servidor de Produção)

Conecte na VM e edite o arquivo `.env`:

```bash
ssh user@sua-vm
cd ~/Avalia-Solar-2026
nano .env
```

Adicione estas linhas:

```bash
# DigitalOcean Spaces (S3)
ACTIVE_STORAGE_SERVICE=spaces
SPACES_ACCESS_KEY_ID=DO00XXXXXXXXXXXXX
SPACES_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPACES_REGION=nyc3
SPACES_BUCKET=avalia-solar-assets
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

Salve (Ctrl+O, Enter, Ctrl+X).

### No GitHub Secrets

1. Vá para: https://github.com/MrGr33n98/Avalia-Solar-2026/settings/secrets/actions
2. Adicione os secrets:

```
SPACES_ACCESS_KEY_ID = DO00XXXXXXXXXXXXX
SPACES_SECRET_ACCESS_KEY = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🚀 Passo 4: Deploy com Spaces

```bash
# Na VM
cd ~/Avalia-Solar-2026

# Reconstruir backend com nova gem aws-sdk-s3
docker compose build backend

# Reiniciar serviços
docker compose down
docker compose up -d

# Verificar logs
docker compose logs -f backend
```

Procure por: `"Active Storage service: spaces"` nos logs.

## ✅ Passo 5: Testar Upload

1. Acesse: https://api.avaliasolar.com.br/admin
2. Faça login
3. Vá em **Companies** ou **Banners**
4. Faça upload de uma imagem
5. Verifique no Spaces:
   - Acesse: https://cloud.digitalocean.com/spaces/avalia-solar-assets
   - Deve ver a imagem em `/uploads/...`

## 🔄 Passo 6: Migrar Imagens Existentes (Opcional)

Se você já tem imagens salvas localmente, migre para o Spaces:

```bash
# Na VM
docker compose exec backend rails runner "

# Encontrar todas as empresas com logo
companies_with_logo = Company.where.not(logo: nil)

companies_with_logo.each do |company|
  if company.logo.attached?
    puts \"Migrando logo de: #{company.name}\"
    
    # Baixar blob atual
    blob = company.logo.blob
    
    # Re-anexar (força upload para Spaces)
    company.logo.attach(
      io: StringIO.new(blob.download),
      filename: blob.filename.to_s,
      content_type: blob.content_type
    )
  end
end

puts \"✅ Migração concluída!\"
"
```

## 📊 Passo 7: Verificar Configuração

```bash
# Na VM
docker compose exec backend rails runner "
puts '🔍 Verificando Active Storage...'
puts \"Service: #{ActiveStorage::Blob.service.class.name}\"
puts \"Bucket: #{ActiveStorage::Blob.service.bucket.name rescue 'N/A'}\"
puts \"Endpoint: #{ActiveStorage::Blob.service.client.config.endpoint rescue 'N/A'}\"

# Testar upload
test_file = StringIO.new('Test content')
blob = ActiveStorage::Blob.create_and_upload!(
  io: test_file,
  filename: 'test.txt',
  content_type: 'text/plain'
)

puts \"✅ Upload test successful!\"
puts \"URL: #{blob.url}\"
blob.purge
"
```

Deve mostrar:
```
Service: ActiveStorage::Service::S3Service
Bucket: avalia-solar-assets
Endpoint: https://nyc3.digitaloceanspaces.com
✅ Upload test successful!
```

## 🛡️ Configuração de CORS (Importante!)

Para permitir uploads diretos do browser:

1. No Spaces, clique em **"Settings"**
2. Em **"CORS Configurations"**, adicione:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
    <AllowedOrigin>https://avaliasolar.com.br</AllowedOrigin>
    <AllowedOrigin>https://api.avaliasolar.com.br</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

## 💰 Custos Estimados

**DigitalOcean Spaces Pricing:**
- **Armazenamento**: $5/mês para 250GB
- **Transferência**: 1TB incluído
- **Cada GB extra**: $0.01/GB

**Estimativa para Avalia Solar:**
- ~1-5GB de imagens = **$5/mês**
- ~10-50GB de imagens = **$5/mês**
- Só paga mais se ultrapassar 250GB

## 🐛 Troubleshooting

### Erro: "Access Denied"

**Causa**: Credenciais incorretas ou bucket privado

**Solução**:
```bash
# Verificar .env
cat ~/Avalia-Solar-2026/.env | grep SPACES

# Recriar backend
docker compose build backend --no-cache
docker compose up -d backend
```

### Imagens retornam 404

**Causa**: URL antiga do armazenamento local

**Solução**:
```bash
# Limpar cache do Active Storage
docker compose exec backend rails runner "
ActiveStorage::Attachment.find_each do |attachment|
  attachment.blob.analyzed!
end
"

# Restart backend
docker compose restart backend
```

### Deploy continua usando armazenamento local

**Causa**: Variável `ACTIVE_STORAGE_SERVICE` não configurada

**Solução**:
```bash
# Adicionar ao .env
echo "ACTIVE_STORAGE_SERVICE=spaces" >> ~/Avalia-Solar-2026/.env

# Rebuild
docker compose up -d --force-recreate backend
```

## 📚 Referências

- [DigitalOcean Spaces Docs](https://docs.digitalocean.com/products/spaces/)
- [Rails Active Storage Guide](https://guides.rubyonrails.org/active_storage_overview.html)
- [AWS SDK Ruby](https://docs.aws.amazon.com/sdk-for-ruby/v3/api/)

## ✅ Checklist Final

- [ ] Space criado no DigitalOcean
- [ ] API Keys geradas e guardadas
- [ ] Variáveis adicionadas ao `.env` da VM
- [ ] Secrets configurados no GitHub
- [ ] Gem `aws-sdk-s3` adicionada
- [ ] Backend reconstruído
- [ ] Teste de upload bem-sucedido
- [ ] CORS configurado
- [ ] Imagens existentes migradas (opcional)

**Após completar: SUAS IMAGENS NUNCA MAIS SERÃO PERDIDAS! 🎉**
