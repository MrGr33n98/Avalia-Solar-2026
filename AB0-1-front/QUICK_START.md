# 🚀 Quick Start - Página de Empresas

## ⚡ Inicialização Rápida (5 minutos)

### 1️⃣ Iniciar Backend
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back
rails server -p 3001
```

### 2️⃣ Verificar API
Abra no navegador: `http://localhost:3001/api/v1/companies`
✅ Deve retornar JSON com empresas

### 3️⃣ Iniciar Frontend
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front
start-dev.bat
```
*Ou manualmente:* `npm run dev`

### 4️⃣ Acessar Página
Abra: `http://localhost:3000/companies`
✅ Deve exibir lista de empresas

---

## 🔍 Diagnóstico Rápido

### Problema: Página não carrega empresas

**1. Verificar Backend**
```bash
curl http://localhost:3001/api/v1/companies
```

**2. Executar Diagnóstico**
```bash
node diagnose-companies-issue.js
```

**3. Ver Logs do Console (F12)**
- Procurar erros em vermelho
- Verificar requisições na aba Network

**4. Limpar Cache**
```bash
npm run dev:clean
```

---

## 📋 Checklist Essencial

- [ ] Backend rodando (porta 3001)
- [ ] API responde: `http://localhost:3001/api/v1/companies`
- [ ] `.env.local` configurado
- [ ] Frontend rodando (porta 3000)
- [ ] Página carrega: `http://localhost:3000/companies`

---

## 🆘 Solução de Problemas

| Erro | Solução |
|------|---------|
| "Failed to fetch" | Backend não está rodando → `rails server -p 3001` |
| "404 Not Found" | Verificar rota da API → `rails routes \| grep companies` |
| Resposta vazia `[]` | Banco sem dados → `rails db:seed` |
| "CORS error" | Verificar `cors.rb` no backend |

---

## 📚 Documentação Completa

- **Guia Detalhado:** `COMPANIES_PAGE_FIX.md`
- **Relatório Técnico:** `COMPANIES_FIX_REPORT.md`
- **Template de Config:** `.env.local.example`

---

## 🧪 Testes Automatizados

```bash
# Teste completo
node test-companies-page.js

# Apenas diagnóstico
node diagnose-companies-issue.js
```

✅ **Todos os testes devem passar antes de considerar resolvido!**

---

**Dúvidas?** Consulte `COMPANIES_PAGE_FIX.md` para guia detalhado.
