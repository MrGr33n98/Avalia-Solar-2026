# 🔧 FIX: Problema de Renderização de Banners

## 📊 Diagnóstico

Analisando os logs do frontend:
```
[API] Response data: Array(0)  ← API retornando array vazio
[API] Request -> GET https://api.avaliasolar.com.br/api/v1/banners?position=categories_top
```

**Causa Raiz:** Não há banners cadastrados no banco de dados ou os banners existentes não atendem aos critérios:
- `active: true`
- `moderation_status: 'approved'`
- `position: 'categories_top'`
- Imagem anexada via Active Storage

## 🚀 Soluções Rápidas

### Opção 1: Verificar Banners Existentes (RECOMENDADO)

```bash
cd AB0-1-back
bundle exec ruby check_and_create_banners.rb
```

Este script irá:
1. ✅ Verificar quantos banners existem
2. ✅ Listar banners por posição
3. ✅ Identificar problemas
4. ✅ Tentar criar banners de teste (se possível)

### Opção 2: Criar Banners via Rails Console

```bash
cd AB0-1-back
bundle exec rails console

# No console Rails:
```

```ruby
# 1. Verificar banners existentes
Banner.currently_active.where(position: 'categories_top').count

# 2. Listar todos os banners
Banner.all.each do |b|
  puts "ID: #{b.id}, Título: #{b.title}, Posição: #{b.position}, Ativo: #{b.active}, Status: #{b.moderation_status rescue 'N/A'}"
end

# 3. Se houver banners inativos, ativar e aprovar:
Banner.where(position: 'categories_top').each do |banner|
  banner.update!(active: true)
  banner.update!(moderation_status: 'approved') if Banner.column_names.include?('moderation_status')
  puts "✅ Banner #{banner.id} ativado"
end

# 4. Criar banner de teste (se necessário):
category = Category.first
banner = Banner.create!(
  title: "Promoção de Energia Solar",
  banner_type: "rectangular_large",
  position: "categories_top",
  link: "https://avaliasolar.com.br",
  active: true,
  moderation_status: 'approved',
  category_id: category&.id,
  sponsored: false
)

# IMPORTANTE: Anexar uma imagem
# Você precisa ter uma imagem. Exemplo:
# banner.image.attach(io: File.open('path/to/image.jpg'), filename: 'banner.jpg')
```

### Opção 3: Criar Banners via Admin Panel

1. **Acesse o admin panel:**
   ```
   https://api.avaliasolar.com.br/admin
   ou
   http://localhost:3000/admin (se local)
   ```

2. **Navegue até:** Admin > Banners > New Banner

3. **Preencha os campos:**
   - ✅ **Title:** "Banner Categorias - Energia Solar"
   - ✅ **Banner Type:** rectangular_large
   - ✅ **Position:** categories_top
   - ✅ **Link:** https://avaliasolar.com.br
   - ✅ **Active:** true
   - ✅ **Moderation Status:** approved
   - ✅ **Image:** Faça upload de uma imagem (1200x400px recomendado)
   - ✅ **Category:** Selecione uma categoria (opcional)
   - ✅ **Sponsored:** false

4. **Salve o banner**

## 🎨 Imagens Recomendadas para Banners

### Dimensões por Tipo:
- **rectangular_large (categories_top):** 1200x400px (ratio 3:1)
- **rectangular_small (sidebar):** 300x250px
- **navbar:** 1920x200px

### Onde Encontrar Imagens:
- Unsplash (gratuitas): https://unsplash.com/s/photos/solar-energy
- Pexels (gratuitas): https://www.pexels.com/search/solar-panels/
- Criar no Canva: https://www.canva.com

## 🧪 Testar Após Criar Banners

1. **Via API direta:**
```bash
curl "https://api.avaliasolar.com.br/api/v1/banners?position=categories_top"
```

Deve retornar algo como:
```json
[
  {
    "id": 1,
    "title": "Banner Teste",
    "position": "categories_top",
    "image_url": "https://...",
    "link": "https://...",
    "active": true,
    "sponsored": false
  }
]
```

2. **No Frontend:**
   - Acesse: https://avaliasolar.com.br/categories
   - Os banners devem aparecer no topo da página
   - Verifique o console do browser (F12) para logs de debug

## 🐛 Problemas Comuns

### Erro 404 nas Imagens (Active Storage)

Se você ver erros como:
```
Failed to load resource: the server responded with a status of 404 (Not Found)
api.avaliasolar.com.br/rails/active_storage/disk/...
```

**Causas possíveis:**
1. ❌ Imagem não foi anexada ao banner
2. ❌ Active Storage não está configurado corretamente
3. ❌ Arquivo foi deletado do storage

**Solução:**
```ruby
# Verificar se imagem está anexada
banner = Banner.find(1)
banner.image.attached?  # deve retornar true

# Se false, anexar imagem:
banner.image.attach(
  io: File.open('caminho/para/imagem.jpg'),
  filename: 'banner.jpg',
  content_type: 'image/jpeg'
)
```

### Banners Não Aparecem Mesmo Existindo

**Checklist:**
- [ ] Banner está `active: true`?
- [ ] Banner está `moderation_status: 'approved'`?
- [ ] Banner tem `position: 'categories_top'`?
- [ ] Banner tem imagem anexada?
- [ ] Banner está dentro do período (start_date/end_date)?
- [ ] Frontend está fazendo a requisição correta?

**Debug no Rails:**
```ruby
# Verificar scope
Banner.currently_active.where(position: 'categories_top').to_sql

# Verificar o que o controller retorna
@banners = Banner.currently_active.where(position: 'categories_top')
puts @banners.as_json(
  only: %i[id title link active position sponsored banner_type],
  methods: %i[image_url link_url]
)
```

## 📝 Próximos Passos

1. ✅ Execute o script de verificação
2. ✅ Crie banners via admin panel ou console
3. ✅ Teste a API diretamente
4. ✅ Verifique o frontend
5. ✅ Se persistir, verifique logs do Rails: `tail -f AB0-1-back/log/development.log`

## 🆘 Suporte

Se o problema persistir:
1. Verifique os logs do Rails backend
2. Verifique o console do browser (F12)
3. Confirme que o Active Storage está configurado
4. Confirme que há espaço em disco para armazenar imagens

---

**Data:** 2026-01-07
**Status:** Diagnóstico completo ✅
**Ação Necessária:** Criar banners no banco de dados
