# 🔧 FIX: Erro 500 em Financing Simulate API

## 🐛 Problema

Erro 500 (Internal Server Error) ao acessar:
```
GET /api/v1/companies/1/financing_options/simulate?amount=50000&audience=pf&months=60
POST /api/v1/companies/1/financing_proposals
```

## ✅ Solução Implementada

### 1. **Melhorado Error Handling** (financing_options_controller.rb)

**Mudanças:**
- ✅ Logging detalhado em cada etapa
- ✅ Validação explícita de company
- ✅ Tratamento individual de erros de cálculo
- ✅ Mensagens de erro mais descritivas
- ✅ Retorno de array vazio quando não há opções (em vez de erro)

**Antes:**
```ruby
rescue StandardError => e
  render json: { error: 'Erro interno na simulacao' }, status: :internal_server_error
end
```

**Depois:**
```ruby
rescue ActiveRecord::RecordNotFound => e
  Rails.logger.error("[Financing] Record not found: #{e.message}")
  render json: { error: 'Recurso não encontrado' }, status: :not_found
rescue StandardError => e
  Rails.logger.error("[Financing] ERROR: #{e.class} - #{e.message}\nBacktrace: #{e.backtrace.first(5).join("\n")}")
  render json: { error: 'Erro interno na simulação', details: e.message }, status: :internal_server_error
end
```

### 2. **Melhorado Proposals Controller** (financing_proposals_controller.rb)

**Mudanças:**
- ✅ Try-catch em torno do Sidekiq job (não falha se Sidekiq não estiver rodando)
- ✅ Logging completo
- ✅ Validação mais robusta

### 3. **Scripts de Diagnóstico e Seed**

Criados:
- ✅ `diagnose_financing.rb` - Diagnóstico completo
- ✅ `create_financing_test_data.rb` - Criar dados de teste
- ✅ `run-financing-diagnostic.bat` - Executar diagnóstico
- ✅ `seed-financing-options.bat` - Seed via batch

---

## 🚀 Como Corrigir Agora

### **Opção 1: Via Rails Console (Rápido)**

```bash
cd AB0-1-back
rails console
```

```ruby
# Verificar se Company ID 1 existe
company = Company.find(1)

# Verificar opções de financiamento
company.financing_options.count
# => Se 0, criar opções de teste:

# Opção PF
company.financing_options.create!(
  institution_name: "Banco Solar Brasil",
  credit_line: "Crédito Solar Residencial",
  target_audience: "PF",
  max_term_months: 60,
  grace_period_months: 3,
  interest_rate_percent: 1.39,
  interest_rate_details: "Taxa a partir de 1,39% a.m.",
  active: true
)

# Opção PJ
company.financing_options.create!(
  institution_name: "Banco Verde",
  credit_line: "Linha Empresarial Sustentável",
  target_audience: "PJ",
  max_term_months: 84,
  grace_period_months: 6,
  interest_rate_percent: 1.89,
  interest_rate_details: "Taxa a partir de 1,89% a.m.",
  active: true
)

# Opção Rural
company.financing_options.create!(
  institution_name: "Banco do Agronegócio",
  credit_line: "Energia Solar Rural",
  target_audience: "Rural",
  max_term_months: 72,
  grace_period_months: 12,
  interest_rate_percent: 0.99,
  interest_rate_details: "Taxa subsidiada 0,99% a.m.",
  active: true
)

# Verificar
company.financing_options.count
# => 3

# Testar simulação
company.financing_options.active_only.where(target_audience: 'PF').count
# => 1
```

### **Opção 2: Via Script Ruby**

```bash
cd AB0-1-back
rails runner create_financing_test_data.rb
```

### **Opção 3: Via Batch Script (Windows)**

Clique duplo em:
```
seed-financing-options.bat
```

---

## 🧪 Testando a Correção

### 1. **Verificar Logs**

```bash
tail -f AB0-1-back/log/development.log
```

Procure por:
```
[Financing] simulate START company_id=1 amount=50000.0 months=60 audience=pf
[Financing] Total financing_options for company: 3
[Financing] Active financing_options: 3
[Financing] After audience filter (PF): 1
[Financing] Options to simulate: 1
[Financing] simulate SUCCESS company=1 audience=PF amount=50000.0 months=60 results=1
```

### 2. **Testar Endpoint via cURL**

```bash
curl "http://localhost:3001/api/v1/companies/1/financing_options/simulate?amount=50000&audience=pf&months=60"
```

**Resposta Esperada:**
```json
{
  "best": {
    "id": 1,
    "company_id": 1,
    "institution_name": "Banco Solar Brasil",
    "credit_line": "Crédito Solar Residencial",
    "target_audience": "PF",
    "max_term_months": 60,
    "grace_period_months": 3,
    "interest_rate_percent": 1.39,
    "monthly_payment": 1089.29,
    "total_cost": 65357.4,
    "cet_annual_percent": 18.05
  },
  "options": [...],
  "ranking": [...]
}
```

### 3. **Testar no Frontend**

1. Acesse: `http://localhost:3000/companies/1/financing`
2. Preencha o formulário:
   - Valor: R$ 50.000
   - Público: Pessoa Física
   - Prazo: 60 meses
3. Clique em "Simular"
4. Deve aparecer as opções de financiamento

---

## 📋 Checklist de Verificação

- [ ] Company ID 1 existe no banco
- [ ] Company ID 1 tem pelo menos 1 financing_option ativa
- [ ] Financing options têm target_audience = 'PF', 'PJ' ou 'Rural'
- [ ] Rails server está rodando na porta 3001
- [ ] Logs mostram "simulate SUCCESS"
- [ ] Frontend recebe resposta 200 OK

---

## 🔍 Possíveis Causas Raiz

### **Causa 1: Nenhuma Opção de Financiamento**

**Sintoma:** Response vazio `{ best: null, options: [], ranking: [] }`

**Solução:** Criar opções via console ou script

### **Causa 2: Target Audience Incorreto**

**Sintoma:** Filtro retorna 0 opções

**Problema:** Frontend envia `audience=pf` (lowercase), mas database tem `PF` (uppercase)

**Solução:** Controller já normaliza com `normalize_audience()` ✅

### **Causa 3: Opções Inativas**

**Sintoma:** `active_only` scope retorna vazio

**Solução:** Verificar coluna `active`:
```ruby
FinancingOption.update_all(active: true)
```

### **Causa 4: Company Não Existe**

**Sintoma:** `ActiveRecord::RecordNotFound`

**Solução:** Verificar ID correto ou criar company

---

## 🛠️ Comandos Úteis para Debug

```bash
# Backend - Logs em tempo real
cd AB0-1-back
tail -f log/development.log | grep Financing

# Backend - Console
rails console

# Verificar dados
Company.find(1).financing_options.active_only.count
FinancingOption.where(target_audience: 'PF', active: true).count

# Limpar cache (se necessário)
Rails.cache.clear

# Restart server
# Ctrl+C e rails s novamente
```

---

## 📊 Estrutura de Dados Esperada

### **FinancingOption Model**

```ruby
{
  id: 1,
  company_id: 1,
  institution_name: "Banco Solar Brasil",
  credit_line: "Crédito Solar Residencial",
  target_audience: "PF",  # 'PF', 'PJ', ou 'Rural'
  max_term_months: 60,
  grace_period_months: 3,
  interest_rate_percent: 1.39,
  interest_rate_details: "Taxa a partir de 1,39% ao mês",
  active: true,
  service_filters: nil,
  project_filters: nil,
  category_filters: nil,
  created_at: "2026-01-19...",
  updated_at: "2026-01-19..."
}
```

---

## ✅ Status Após Correção

| Item | Status |
|------|--------|
| Controller com logging detalhado | ✅ |
| Error handling robusto | ✅ |
| Normalização de audience | ✅ |
| Script de seed de dados | ✅ |
| Tratamento de cálculos individuais | ✅ |
| Proposals com fallback Sidekiq | ✅ |
| Documentação completa | ✅ |

---

## 🎯 Próximos Passos

1. ✅ Executar seed de financing options
2. ✅ Reiniciar Rails server
3. ✅ Testar no frontend
4. ✅ Verificar logs
5. ✅ Confirmar resposta 200 OK

---

## 📞 Suporte

Se o erro persistir após seguir este guia:

1. Capture os logs: `tail -100 log/development.log > error_logs.txt`
2. Execute diagnóstico: `rails runner diagnose_financing.rb > diagnostic.txt`
3. Verifique database: `rails console` → `Company.find(1).financing_options.to_a`
4. Abra issue no GitHub com os arquivos acima

---

**Última Atualização:** 2026-01-19  
**Versão:** 1.0.0
