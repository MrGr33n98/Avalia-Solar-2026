# 🔄 Guia de Backup e Restauração de Dados

Este guia explica como fazer backup e restaurar os dados do sistema Avalia Solar.

## 📦 Arquivos de Backup Existentes

### 1. Empresas
- **Arquivo**: `AB0-1-back/companies.json`
- **Conteúdo**: Dados de 5 empresas cadastradas
- **Formato**: JSON com todos os campos das empresas

### 2. Lista de Empresas (TSV)
- **Arquivo**: `AB0-1-back/db/seed_data/companies_dump.tsv`
- **Conteúdo**: Lista de 331+ empresas em formato TSV
- **Uso**: Para popular o banco com dados de exemplo

## 🛠️ Scripts Disponíveis

### 1. Restaurar Dados do Backup (Windows)
```bash
restaurar-dados-backup.bat
```

**O que faz:**
- Importa empresas do arquivo `companies.json`
- Recria banners de teste
- Mostra resumo dos dados restaurados

### 2. Commit e Deploy Automático (Windows)
```bash
commit-e-deploy-restauracao.bat
```

**O que faz:**
1. Restaura dados localmente
2. Faz commit das alterações
3. Push para GitHub
4. Inicia deploy automático via GitHub Actions

## 🚀 Deploy Automático Protegido

O workflow de deploy (`deploy-v1.yml`) foi atualizado para:

### ✅ Proteção de Dados
- **NÃO** recria o banco de dados se já existir
- **NÃO** apaga dados durante o deploy
- Verifica se há dados antes de importar backup
- Só restaura backup se o banco estiver vazio

### 📋 Processo de Deploy

1. **Build das imagens** Docker (backend + frontend)
2. **Pull das novas imagens** na VM
3. **Migração do banco** preservando dados existentes
4. **Verificação de dados**:
   - Se banco vazio → restaura do backup `companies.json`
   - Se banco tem dados → mantém dados existentes
5. **Rebuild do frontend** com cache limpo

## 📝 Como Fazer Backup Manual

### Backup de Empresas
```bash
cd AB0-1-back

# Via Rails console
rails console
companies = Company.all.as_json(
  except: [:created_at, :updated_at]
)
File.write('companies.json', JSON.pretty_generate(companies))
exit

# Ou via script
rails runner "
  companies = Company.all.as_json(except: [:created_at, :updated_at])
  File.write('companies_backup_$(date +%Y%m%d).json', JSON.pretty_generate(companies))
"
```

### Backup de Banners
```bash
cd AB0-1-back

rails runner "
  banners = Banner.all.as_json(
    except: [:created_at, :updated_at],
    methods: [:image_url]
  )
  File.write('banners_backup.json', JSON.pretty_generate(banners))
"
```

## 🔧 Como Restaurar Manualmente

### Restaurar Empresas
```bash
cd AB0-1-back

rails runner "
  require 'json'
  companies_data = JSON.parse(File.read('companies.json'))
  
  companies_data.each do |data|
    company = Company.find_or_initialize_by(id: data['id'])
    company.assign_attributes(data.except('id'))
    company.save!
  end
  
  puts \"#{Company.count} empresas restauradas\"
"
```

### Restaurar Banners
```bash
cd AB0-1-back

ruby create_test_banners.rb
```

## ⚠️ Importante

### Durante o Deploy
1. **Os dados são preservados** - o workflow não apaga dados existentes
2. **Backup automático** - se banco vazio, restaura de `companies.json`
3. **Sem downtime** - serviços continuam rodando durante update

### Antes de Deploy
1. **Sempre tenha backup** - mantenha `companies.json` atualizado
2. **Teste localmente** - use `restaurar-dados-backup.bat` antes de fazer push
3. **Verifique dados** - confirme que empresas e banners estão OK

## 🐛 Troubleshooting

### Empresas Sumiram Após Deploy?

**Causa**: Banco foi recriado (versão antiga do workflow)

**Solução**:
```bash
# 1. Restaurar dados localmente
restaurar-dados-backup.bat

# 2. Fazer deploy com dados restaurados
commit-e-deploy-restauracao.bat
```

### Banners Não Aparecem?

**Verificar**:
1. Banners estão ativos? `active: true`
2. Banners aprovados? `moderation_status: 'approved'`
3. Imagens anexadas? Verificar Active Storage

**Solução**:
```bash
cd AB0-1-back
ruby create_test_banners.rb
```

### Dados Não Carregam no Frontend?

**Verificar**:
1. Backend está rodando? `docker compose ps backend`
2. Migrações aplicadas? `docker compose logs backend | grep migration`
3. Dados no banco? `docker compose exec backend rails runner "puts Company.count"`

## 📚 Referências

- Workflow de Deploy: `.github/workflows/deploy-v1.yml`
- Seeds de Empresas: `AB0-1-back/companies.json`
- Seeds de Banners: `AB0-1-back/create_test_banners.rb`
- Verificação de Banners: `AB0-1-back/check_and_create_banners.rb`
