# FIX: Upload de Banner e Logo - Companies Admin

## Problema Identificado
O upload de banner e logo na página de edição de empresas (`https://api.avaliasolar.com.br/admin/companies/voltbras/edit`) não estava funcionando.

## Causa Raiz
O método `update` no controller do ActiveAdmin (`app/admin/companies.rb`) estava vazio, apenas chamando `super` sem processar os arquivos anexados.

## Solução Implementada

### 1. Atualização do Controller (app/admin/companies.rb)
```ruby
def update
  # Handle banner upload
  if params[:company][:banner].present?
    resource.banner.attach(params[:company][:banner])
  end
  
  # Handle logo upload
  if params[:company][:logo].present?
    resource.logo.attach(params[:company][:logo])
  end
  
  # Handle media_assets (multiple files)
  if params[:company][:media_assets].present?
    params[:company][:media_assets].each do |file|
      resource.media_assets.attach(file)
    end
  end

  super
end
```

### 2. Verificações Necessárias

#### Active Storage está configurado corretamente?
- ✅ Model Company tem `has_one_attached :banner` e `has_one_attached :logo`
- ✅ Permitted params incluem `:banner` e `:logo` (linha 47)
- ✅ Form tem inputs de file (linhas 196-198)

#### Storage Service Configurado?
Verificar em `config/storage.yml`:
- Produção deve usar `spaces` (DigitalOcean Spaces)
- Development pode usar `local`

#### Variáveis de Ambiente
Verificar `.env.development` ou `.env.production`:
```bash
SPACES_ACCESS_KEY_ID=your_key
SPACES_SECRET_ACCESS_KEY=your_secret
SPACES_BUCKET=avalia-solar-assets
SPACES_REGION=nyc3
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
ACTIVE_STORAGE_SERVICE=spaces
```

### 3. Testes

Execute o script de teste:
```bash
test-company-upload.bat
```

Ou teste manualmente:
1. Acesse https://api.avaliasolar.com.br/admin/companies/voltbras/edit
2. Faça upload de um banner (PNG/JPG/WebP, max 5MB)
3. Faça upload de um logo (PNG/JPG, max 2MB)
4. Clique em "Update Company"
5. Verifique se as imagens aparecem na página show

### 4. Validações do Modelo

O modelo Company tem validações automáticas:

**Banner:**
- Formatos aceitos: PNG, JPG, WebP
- Tamanho máximo: 5MB
- Dimensões recomendadas: 1920x600px

**Logo:**
- Formatos aceitos: PNG, JPG
- Tamanho máximo: 2MB

### 5. Troubleshooting

#### Erro: "Forbidden" ou "Access Denied"
- Verifique as credenciais SPACES_ACCESS_KEY_ID e SPACES_SECRET_ACCESS_KEY
- Confirme que o bucket existe e tem permissões de escrita

#### Upload não processa
- Verifique os logs: `tail -f AB0-1-back/log/development.log`
- Confirme que o formulário está enviando `multipart/form-data`

#### Imagem não aparece após upload
- Verifique se `ACTIVE_STORAGE_SERVICE=spaces` está definido
- Teste a URL gerada: `Company.first.banner_url`

### 6. Próximos Passos

Se o problema persistir:
1. Verificar logs do servidor Rails
2. Testar conexão com Spaces via `rails console`
3. Validar permissões do bucket no DigitalOcean

## Comandos Úteis

```bash
# Testar conexão com Spaces
cd AB0-1-back
rails console
> ActiveStorage::Blob.service.upload("test", StringIO.new("test content"))

# Verificar attachments de uma empresa
> c = Company.find_by(slug: 'voltbras')
> c.banner.attached?
> c.logo.attached?
> c.banner_url if c.banner.attached?
```

## Data de Aplicação
2026-01-28
