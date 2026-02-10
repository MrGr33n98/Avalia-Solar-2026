# 🚨 DIAGNÓSTICO: Erro em Produção - www.avaliasolar.com.br/companies

## ❌ Erro Identificado

```
Unchecked runtime.lastError: The message port closed before a response was received.
```

**URL:** `https://www.avaliasolar.com.br/companies`  
**Ambiente:** PRODUÇÃO (não localhost)  
**Status:** Empresas não estão sendo visualizadas

---

## 🔍 Análise do Erro

### 1. Erro "runtime.lastError: message port closed"

**Causa Provável:** 
- ⚠️ Erro de **extensão do navegador** (Chrome/Edge)
- ⚠️ NÃO é um erro do seu código
- ⚠️ Muito comum com extensões de bloqueadores de anúncios, tradutores, etc.

**Este erro É COSMÉTICO** - mas pode estar mascarando o problema real!

### 2. Problema Real: Empresas não aparecem

**Possíveis Causas em PRODUÇÃO:**

1. ❌ **Backend/API não está acessível**
   - URL da API incorreta
   - Servidor backend offline
   - Firewall bloqueando

2. ❌ **Variáveis de ambiente de produção incorretas**
   - `NEXT_PUBLIC_API_BASE_URL` apontando para lugar errado
   - Diferente do desenvolvimento local

3. ❌ **Problema de CORS em produção**
   - Backend não permite origem `www.avaliasolar.com.br`

4. ❌ **Build de produção com problemas**
   - Código não foi deployado corretamente
   - Cache desatualizado

5. ❌ **Erro de API/Backend**
   - Endpoint retornando erro 500
   - Autenticação necessária

---

## 🔧 Diagnóstico Passo a Passo

### PASSO 1: Abrir Console do Navegador
```
F12 ou Ctrl+Shift+I
```

### PASSO 2: Ir para aba "Console"
Procure por erros em VERMELHO, especialmente:
- ❌ Failed to fetch
- ❌ 404 Not Found
- ❌ 500 Internal Server Error
- ❌ CORS error
- ❌ Network error

### PASSO 3: Ir para aba "Network"
1. Recarregue a página (F5)
2. Procure requisições para:
   - `/api/v1/companies`
   - Qualquer requisição em vermelho
3. Clique na requisição e veja:
   - **Status:** 200? 404? 500?
   - **Response:** O que está retornando?

### PASSO 4: Verificar URL da API
No console, digite:
```javascript
console.log(process.env.NEXT_PUBLIC_API_BASE_URL);
```

**Deve retornar:** URL da API de produção (ex: `https://api.avaliasolar.com.br`)

---

## 🌐 Configuração de Produção vs Desenvolvimento

### DESENVOLVIMENTO (localhost)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
API_PROXY_TARGET=http://localhost:3001
```

### PRODUÇÃO (www.avaliasolar.com.br)
```env
NEXT_PUBLIC_API_BASE_URL=https://api.avaliasolar.com.br
# OU
NEXT_PUBLIC_API_BASE_URL=https://www.avaliasolar.com.br
# OU o domínio/IP correto do backend
```

---

## ✅ Checklist de Verificação - PRODUÇÃO

### 1. Backend está Online?
Teste diretamente a API:
```
https://api.avaliasolar.com.br/api/v1/companies
# OU
https://www.avaliasolar.com.br/api/v1/companies
```

**Deve retornar:** JSON com lista de empresas

### 2. Variáveis de Ambiente de Produção
Onde estão configuradas?
- [ ] Vercel → Settings → Environment Variables
- [ ] AWS → Elastic Beanstalk → Configuration
- [ ] Docker → docker-compose.yml ou .env.production
- [ ] Servidor → arquivo .env.production

**Variáveis necessárias:**
```env
NEXT_PUBLIC_API_BASE_URL=https://seu-backend-producao.com
NODE_ENV=production
```

### 3. CORS no Backend
O backend Rails deve permitir a origem:
```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'https://www.avaliasolar.com.br', 'www.avaliasolar.com.br'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

### 4. Deploy Recente?
- [ ] Código foi deployado corretamente?
- [ ] Build foi executado com sucesso?
- [ ] Cache foi limpo após deploy?

---

## 🚀 Ações Imediatas

### 1. Ignorar erro de "runtime.lastError"
É cosmético - causado por extensão do navegador.

### 2. Testar API Diretamente
Abra no navegador:
```
https://www.avaliasolar.com.br/api/v1/companies
```

**O que você vê?**

#### ✅ Se retorna JSON com empresas:
Backend OK! Problema é no frontend.

**Solução:**
- Verificar variáveis de ambiente de produção
- Verificar se build incluiu as mudanças
- Limpar cache do CDN/servidor

#### ❌ Se retorna 404:
Backend não está acessível ou rota não existe.

**Solução:**
- Verificar se backend está rodando
- Verificar URL correta da API
- Verificar rotas do Rails

#### ❌ Se retorna 500:
Erro no backend.

**Solução:**
- Ver logs do backend
- Verificar banco de dados
- Verificar credenciais

#### ❌ Se não carrega (timeout):
Backend offline ou bloqueado.

**Solução:**
- Verificar se servidor está online
- Verificar firewall/segurança
- Verificar DNS

---

## 🔍 Comandos de Diagnóstico - Produção

### No Console do Navegador (F12):

```javascript
// 1. Verificar variáveis de ambiente
console.log('API URL:', process.env.NEXT_PUBLIC_API_BASE_URL);

// 2. Testar fetch manualmente
fetch('https://www.avaliasolar.com.br/api/v1/companies')
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.error('API Error:', err));

// 3. Ver todas as requisições
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('companies'))
  .forEach(r => console.log(r.name, r.duration));
```

---

## 📊 Cenários Comuns e Soluções

### Cenário 1: API retorna 404
**Problema:** URL da API incorreta ou rota não existe  
**Solução:**
```bash
# Verificar variáveis de ambiente no servidor de produção
# Exemplo Vercel:
vercel env ls

# Adicionar variável correta:
vercel env add NEXT_PUBLIC_API_BASE_URL production
# Valor: https://api.avaliasolar.com.br (ou URL correta)

# Redeploy:
vercel --prod
```

### Cenário 2: CORS Error
**Problema:** Backend não permite origem do frontend  
**Solução:**
```ruby
# No backend Rails: config/initializers/cors.rb
origins 'https://www.avaliasolar.com.br'
```

### Cenário 3: Build Antigo
**Problema:** Deploy não incluiu as correções  
**Solução:**
```bash
# Rebuild e redeploy
npm run build
# Deploy novamente para produção
```

### Cenário 4: Cache
**Problema:** CDN/Browser servindo versão antiga  
**Solução:**
```bash
# Limpar cache do navegador: Ctrl+Shift+Delete
# Limpar CDN (se usar Cloudflare/Vercel)
# Forçar reload: Ctrl+F5
```

---

## 🎯 Próximos Passos AGORA

### 1. Abra o Console (F12)
```
https://www.avaliasolar.com.br/companies
```

### 2. Veja aba Network
- Filtre por "companies"
- Qual o status da requisição?
- O que está na resposta?

### 3. Teste a API
```
https://www.avaliasolar.com.br/api/v1/companies
```
OU
```
https://api.avaliasolar.com.br/api/v1/companies
```

### 4. Me envie:
- [ ] Status da requisição (200? 404? 500?)
- [ ] O que aparece ao acessar a API diretamente
- [ ] Screenshots do console (erros em vermelho)
- [ ] Onde o site está hospedado (Vercel? AWS? DigitalOcean?)

---

## 📞 Informações Necessárias para Ajudar

Para diagnóstico preciso, preciso saber:

1. **Hospedagem:**
   - [ ] Vercel
   - [ ] AWS
   - [ ] DigitalOcean
   - [ ] Heroku
   - [ ] VPS próprio
   - [ ] Outro: _____

2. **Backend:**
   - [ ] Mesma URL (www.avaliasolar.com.br)
   - [ ] Subdomínio (api.avaliasolar.com.br)
   - [ ] Servidor separado
   - [ ] URL: _____

3. **Console do Navegador:**
   - [ ] Screenshot dos erros em vermelho
   - [ ] Screenshot da aba Network
   - [ ] Resposta da requisição /api/v1/companies

4. **Quando deployou:**
   - [ ] Hoje
   - [ ] Ontem
   - [ ] Semana passada
   - [ ] Nunca funcionou em produção

---

## 💡 Dica Importante

**O erro "runtime.lastError"** que você viu **NÃO é o problema principal**!

Esse erro é da **extensão do navegador** (como AdBlock, tradutor, etc).

**O problema real é:** Por que as empresas não aparecem?

**Para descobrir:**
1. Abra F12
2. Aba Network
3. Recarregue
4. Veja o que acontece com `/api/v1/companies`

Me envie essas informações que posso te ajudar melhor! 🚀

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. Melhorado Tratamento de Rate Limit
- ✅ Reduzido tempo de bloqueio de 15s para 3s
- ✅ Adicionado fallback para usar cache durante bloqueio
- ✅ Adicionado retry automático com espera inteligente
- ✅ Criadas funções para limpar bloqueios manualmente

### 2. Funções Utilitárias Adicionadas

**Limpar bloqueio de rate limit:**
```javascript
// No console do navegador (F12):
import { clearRateLimitBlock } from '@/lib/api-client';

// Limpar bloqueio de um endpoint específico
clearRateLimitBlock('companies');

// Limpar todos os bloqueios
clearRateLimitBlock();
```

**Ver status dos bloqueios:**
```javascript
import { getRateLimitStatus } from '@/lib/api-client';
console.log(getRateLimitStatus());
```

### 3. Deploy das Correções

**Para aplicar as correções em produção:**
```bash
# 1. Fazer commit
git add lib/api-client.ts
git commit -m "fix: improve rate limit handling and reduce block time"

# 2. Deploy
git push origin main

# 3. Se usar Vercel/Netlify, deploy automático
# Se não, fazer build e deploy manual:
npm run build
# Upload da pasta .next ou out para servidor
```

---

**Criado em:** 2026-02-10  
**Atualizado em:** 2026-02-10  
**Para:** Produção (www.avaliasolar.com.br)  
**Status:** ✅ Correções Implementadas
