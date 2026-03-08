# 🚀 Guia Rápido - Seed de Mobilidade Elétrica

## O que foi implementado?

✅ **Arquivo principal**: `AB0-1-back/db/seeds_mobilidade_eletrica.rb`
✅ **Rake task**: `AB0-1-back/lib/tasks/mobilidade_eletrica.rake`
✅ **Documentação**: `AB0-1-back/db/SEED_MOBILIDADE_ELETRICA.md`
✅ **Script Windows**: `executar_seed_mobilidade.bat`

## 📊 Estrutura Criada

```
Ecossistema de Mobilidade Elétrica no Brasil (Categoria Raiz)
├── Operadores de Pontos de Recarga (CPOs) - 25 empresas
├── Provedores de Serviços (EMSPs) - 20 empresas
├── Fabricantes de Hardware EV - 25 empresas
├── Concessionárias de Energia - 15 empresas
├── Instaladores e Consultoria - 20 empresas
└── Montadoras (OEMs) - 10 empresas

Total: 1 categoria raiz + 6 subcategorias + 115 empresas
```

## 🎯 Como Executar

### Windows (Mais Fácil)

1. Clique duplo em `executar_seed_mobilidade.bat`
2. Aguarde a conclusão
3. Verifique os resultados no console Rails

### Linha de Comando

```bash
# Navegar para o diretório backend
cd AB0-1-back

# Executar o seed
bundle exec rake db:seed:mobilidade_eletrica
```

### Alternativa - Rails Console

```bash
cd AB0-1-back
bundle exec rails console

# No console:
load Rails.root.join('db', 'seeds_mobilidade_eletrica.rb')
```

## ✅ Verificação

Após executar, verifique no Rails Console:

```ruby
# Acessar categoria raiz
root = Category.find_by(seo_url: "ecossistema-mobilidade-eletrica-brasil")
puts root.name
# => "Ecossistema de Mobilidade Elétrica no Brasil"

# Ver subcategorias
root.children.each { |c| puts "#{c.name}: #{c.companies_count} empresas" }

# Ver empresas CPO
cpo = Category.find_by(seo_url: "operadores-pontos-recarga-cpos")
puts "CPOs cadastrados: #{cpo.companies.count}"
cpo.companies.first(5).each { |c| puts "- #{c.name}" }

# Ver todas as empresas de mobilidade elétrica
total = root.companies.count
puts "Total de empresas: #{total}"
```

## 🔄 Re-execução

O seed é **idempotente** - pode ser executado múltiplas vezes sem duplicar dados:
- Categorias existentes são reutilizadas
- Empresas com mesmo slug são atualizadas
- Métricas são recalculadas

## 📋 Características Técnicas

### Categorias
- ✅ Hierarquia (pai/filho)
- ✅ SEO otimizado (URLs, títulos, descrições)
- ✅ Status ativo
- ✅ Featured na categoria raiz

### Empresas
- ✅ 115 empresas reais do setor
- ✅ Classificadas por prioridade (P0, P1, P2)
- ✅ Status inicial: `pending` (moderação)
- ✅ Featured para empresas P0
- ✅ Validações de estado/cidade
- ✅ Slugs únicos gerados automaticamente

## 🎨 Categorias SEO

Todas as categorias têm URLs otimizadas:

| Categoria | SEO URL |
|-----------|---------|
| Raiz | `ecossistema-mobilidade-eletrica-brasil` |
| CPOs | `operadores-pontos-recarga-cpos` |
| EMSPs | `provedores-servicos-mobilidade-eletrica-emsps` |
| Fabricantes | `fabricantes-carregadores-hardware-ev` |
| Utilities | `concessionarias-energia-utilities-ev` |
| Consultoria | `instaladores-engenharia-recarga-ev` |
| Montadoras | `montadoras-veiculos-eletricos-oems` |

## 📱 Exemplos de Empresas

### CPOs (Operadores)
- Zletric, EDP Smart Charging, Raízen Power, NeoCharge, etc.

### EMSPs (Plataformas)
- Voltbras, EasyCharge, Eletra, ChargeLab, etc.

### Fabricantes
- WEG, ABB, Delta Electronics, Wallbox, etc.

### Utilities
- EDP, Raízen, Enel, CPFL, Cemig, etc.

### Consultoria
- Tupinambá Energia, EZVolt, GreenV, etc.

### Montadoras
- BYD, Volvo, BMW, Mercedes-Benz, Renault, etc.

## 🐛 Troubleshooting

### Erro de validação de cidade
**Solução**: O seed já define cidades padrão por estado. Se o erro persistir, verifique se o módulo `Locations::BrLocations` está funcionando.

### Erro de categoria duplicada
**Solução**: Normal, o seed reutiliza categorias existentes. Não é um erro.

### Erro de slug duplicado
**Solução**: O sistema atualiza a empresa existente ao invés de criar nova.

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `AB0-1-back/db/SEED_MOBILIDADE_ELETRICA.md`

## 🔐 Segurança

- Empresas iniciam com status `pending` (requer moderação)
- `verified` = false (requer verificação manual)
- Não inclui dados sensíveis (CNPJs, contatos reais)

## 🚀 Próximos Passos

Após executar o seed:

1. **Moderar Empresas**: Aprovar/rejeitar no admin
2. **Verificar Empresas**: Validar dados e marcar como verified
3. **Adicionar Logos**: Upload de logos das empresas
4. **Completar Dados**: Telefones, emails, endereços completos
5. **Criar Produtos**: Se aplicável, cadastrar produtos/serviços

## 📞 Suporte

Problemas? Verifique:
1. Logs do Rails: `AB0-1-back/log/development.log`
2. Console Rails para debug
3. Validações dos models `Category` e `Company`

---

**Versão**: 1.0.0  
**Data**: 2026-02-02  
**Compatível**: Rails 7.0+
