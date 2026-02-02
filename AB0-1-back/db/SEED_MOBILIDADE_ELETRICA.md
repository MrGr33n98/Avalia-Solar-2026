# Seed de Mobilidade Elétrica

Este seed implementa o ecossistema completo de mobilidade elétrica no Brasil com categorias hierárquicas otimizadas para SEO.

## 📋 O que é criado

### Estrutura de Categorias

1. **Categoria Raiz**: Ecossistema de Mobilidade Elétrica no Brasil
   - SEO otimizado para "mobilidade elétrica", "pontos de recarga", "eletropostos"
   - Featured e status ativo

2. **6 Subcategorias**:
   - **CPO** (Operadores de Pontos de Recarga) - 25 empresas
   - **EMSP** (Provedores de Serviços de Mobilidade Elétrica) - 20 empresas
   - **Fabricantes** (Hardware e Carregadores EV) - 25 empresas
   - **Utilities** (Concessionárias de Energia) - 15 empresas
   - **Consultoria** (Instaladores e Engenharia) - 20 empresas
   - **Montadoras** (OEMs com soluções de recarga) - 10 empresas

### Total: **115 empresas** do setor de mobilidade elétrica

## 🚀 Como Executar

### Opção 1: Via Rake Task (Recomendado)

```bash
# No diretório AB0-1-back
bundle exec rake db:seed:mobilidade_eletrica
```

### Opção 2: Via Rails Console

```bash
rails console
> load Rails.root.join('db', 'seeds_mobilidade_eletrica.rb')
```

### Opção 3: Incluir no seed principal

Adicione ao final do arquivo `db/seeds.rb`:

```ruby
# Seed de Mobilidade Elétrica
load Rails.root.join('db', 'seeds_mobilidade_eletrica.rb')
```

E execute:

```bash
bundle exec rake db:seed
```

## 📊 Características

### Campos SEO Otimizados
- ✅ `seo_url` - URLs amigáveis
- ✅ `seo_title` - Títulos otimizados com ano 2026
- ✅ `short_description` - Descrições curtas para cards
- ✅ `description` - Descrições completas para páginas

### Categorização de Prioridade
As empresas são classificadas por prioridade de onboarding:
- **Alta (P0)** - Empresas featured, líderes de mercado
- **Media (P1)** - Empresas relevantes
- **Baixa (P2)** - Empresas complementares

### Status e Moderação
- Status inicial: `pending` (aguardando moderação)
- Moderation status: `pending`
- Featured: apenas empresas P0
- Verified: false (a ser verificado posteriormente)

## 🔄 Atualização

O seed é **idempotente** - pode ser executado múltiplas vezes:
- Usa `find_or_create_by!` para categorias
- Verifica existência de empresas pelo slug
- Atualiza métricas das categorias após inserção

## 📝 Estrutura de Dados

### Categoria
- `name` - Nome completo
- `seo_url` - Slug SEO-friendly
- `seo_title` - Título para meta tags
- `short_description` - Resumo curto
- `description` - Descrição detalhada
- `parent_id` - ID da categoria pai (subcategorias)
- `kind` - "main"
- `status` - "active"
- `featured` - true/false

### Empresa
- `name` - Nome da empresa
- `slug` - URL-friendly gerado automaticamente
- `website` - Site oficial
- `state` - Estado (UF)
- `city` - Cidade principal
- `description` - Descrição com notas e prioridade
- `status` - "pending" (inicial)
- `moderation_status` - "pending"
- `featured` - true para P0
- `verified` - false (inicial)

## 🎯 Validações

O seed respeita todas as validações do modelo:
- ✅ Estado válido (BR Locations)
- ✅ Cidade válida para o estado
- ✅ Formato de slug único
- ✅ Associação com categorias
- ✅ Descrição obrigatória

## 🔍 Verificação Pós-Seed

```ruby
# No Rails Console
root = Category.find_by(seo_url: "ecossistema-mobilidade-eletrica-brasil")
puts "Categoria raiz: #{root.name}"
puts "Subcategorias: #{root.children.count}"
puts "Total de empresas: #{root.companies.count}"

# Por subcategoria
Category.where(parent_id: root.id).each do |cat|
  puts "#{cat.name}: #{cat.companies_count} empresas"
end
```

## 📈 Métricas

Após o seed, as métricas são calculadas automaticamente:
- `companies_count` - Total de empresas ativas
- `products_count` - Total de produtos (se houver)
- `average_rating` - Rating médio (0.0 inicial)
- `average_price` - Preço médio (0.0 inicial)

## 🛠️ Manutenção

### Adicionar Nova Empresa

Adicione ao array `companies_data` no formato:

```ruby
["Nome Empresa", "https://site.com", "Categoria", "UF", "Descrição", "Prioridade"]
```

### Adicionar Nova Categoria

Adicione ao hash `subcategory_definitions`:

```ruby
"ChaveCategoria" => {
  name: "Nome Completo",
  seo_url: "url-seo-friendly",
  seo_title: "Título SEO | Ano",
  short_description: "Resumo curto",
  description: "Descrição completa"
}
```

## ⚠️ Atenção

- Execute em ambiente de desenvolvimento primeiro
- Verifique logs de erro durante execução
- Empresas duplicadas (mesmo slug) serão atualizadas, não recriadas
- Categorias duplicadas (mesmo seo_url) serão reutilizadas

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do Rails
2. Execute `rake db:seed:mobilidade_eletrica VERBOSE=true` para logs detalhados
3. Consulte o modelo `Category` e `Company` para validações

---

**Última atualização**: 2026-02-02
**Versão**: 1.0.0
