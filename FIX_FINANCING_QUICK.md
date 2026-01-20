# ⚡ FIX RÁPIDO - Financing 500 Error

## 🎯 Problema
Erro 500 ao acessar simulador de financiamento.

## ✅ Solução em 3 Passos

### **1️⃣ Execute o Script de Fix**

**Windows:**
```bash
fix-financing-now.bat
```

**Linux/Mac:**
```bash
cd AB0-1-back
rails runner create_financing_test_data.rb
```

### **2️⃣ Reinicie o Rails Server**

```bash
# Pressione Ctrl+C no terminal do Rails
# Depois execute:
cd AB0-1-back
rails s -p 3001
```

### **3️⃣ Teste no Browser**

Acesse: http://localhost:3000/companies/1/financing

---

## 🔍 O Que Foi Corrigido?

1. ✅ **Melhor error handling** - Logs detalhados
2. ✅ **Dados de teste criados** - 3 opções por empresa (PF, PJ, Rural)
3. ✅ **Validações robustas** - Não quebra mais
4. ✅ **Fallback para Sidekiq** - Funciona sem background jobs

---

## 📊 Verificar Se Funcionou

### **Via cURL:**
```bash
curl "http://localhost:3001/api/v1/companies/1/financing_options/simulate?amount=50000&audience=pf&months=60"
```

### **Via Rails Console:**
```ruby
rails console
Company.find(1).financing_options.active_only.count
# Deve retornar 3
```

### **Via Logs:**
```bash
tail -f AB0-1-back/log/development.log | grep Financing
```

Procure por:
```
[Financing] simulate SUCCESS company=1 results=1
```

---

## 🆘 Ainda com erro?

Leia: **[FIX_FINANCING_500_ERROR.md](FIX_FINANCING_500_ERROR.md)** (guia completo)

Ou execute diagnóstico:
```bash
cd AB0-1-back
ruby diagnose_financing.rb
```

---

**Fix criado:** 2026-01-19  
**Tempo estimado:** 2 minutos
