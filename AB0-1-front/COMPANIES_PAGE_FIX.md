# 🔧 Guia de Configuração - Página de Empresas

## Problema Identificado
A página `/companies` não está exibindo as empresas cadastradas na plataforma Investiva/Avalia Solar.

## Correções Implementadas

### 1. **Melhor Tratamento de Erros** ✅
- Mensagens de erro mais descritivas
- Diagnóstico integrado na interface
- Console logs para depuração

### 2. **Otimização de Fontes** ✅
- Configuração adequada do Google Fonts (Inter)
- Propriedades `preload` e `adjustFontFallback` adicionadas
- Isso resolve o warning: "pré-carregado com carga antecipada de link não foi usado"

### 3. **Script de Diagnóstico** ✅
- Arquivo `diagnose-companies-issue.js` criado
- Testa conectividade com backend
- Verifica estrutura de dados da API

## Como Testar a Correção

### Passo 1: Verificar Backend
```bash
# Navegue até o diretório do backend
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-back

# Inicie o servidor Rails
rails server -p 3001

# OU se estiver usando Docker
docker-compose up backend
```

### Passo 2: Verificar Variáveis de Ambiente
Crie ou edite o arquivo `.env.local` na raiz do projeto frontend:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
API_PROXY_TARGET=http://localhost:3001
NEXT_PUBLIC_BROWSER_API_BASE_URL=http://localhost:3001

# Analytics (opcional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Passo 3: Testar a API Diretamente
```bash
# Windows PowerShell
curl http://localhost:3001/api/v1/companies

# OU no navegador
# Abra: http://localhost:3001/api/v1/companies
```

**Resposta esperada:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Empresa Solar XYZ",
      "slug": "empresa-solar-xyz",
      "city": "São Paulo",
      "state": "SP",
      "rating_avg": 4.5,
      "rating_count": 10,
      ...
    }
  ],
  "meta": {
    "pagination": {
      "total": 50,
      "page": 1,
      "per_page": 12
    }
  }
}
```

### Passo 4: Executar Script de Diagnóstico
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front
node diagnose-companies-issue.js
```

### Passo 5: Limpar Cache e Reiniciar Frontend
```bash
cd C:\Users\Bobi\Desktop\AB0-1-main\AB0-1-front

# Limpar cache do Next.js
npm run dev:clean

# OU manualmente
rmdir /s /q .next
npm run dev
```

### Passo 6: Acessar a Página
```
http://localhost:3000/companies
```

## Verificação da Correção

### ✅ Checklist de Sucesso

1. **Backend está rodando**
   - [ ] `http://localhost:3001/api/v1/companies` retorna JSON válido
   - [ ] Resposta contém array `data` com empresas
   - [ ] Campo `meta.pagination` está presente

2. **Frontend está configurado**
   - [ ] Arquivo `.env.local` existe e está configurado
   - [ ] Variável `NEXT_PUBLIC_API_BASE_URL` aponta para backend
   - [ ] Sem erros no console do terminal

3. **Página funciona**
   - [ ] `/companies` carrega sem erros
   - [ ] Lista de empresas é exibida
   - [ ] Paginação funciona
   - [ ] Filtros funcionam
   - [ ] Sem warnings de fonte no console

4. **Console do navegador (F12)**
   - [ ] Logs `[Companies] Fetching with filters:` aparecem
   - [ ] Logs `[Companies] API Response:` mostram dados
   - [ ] Requisição para `/api/v1/companies` retorna 200 OK
   - [ ] Sem erros de CORS

## Possíveis Problemas e Soluções

### Problema 1: "Failed to fetch"
**Causa:** Backend não está rodando
**Solução:**
```bash
cd AB0-1-back
rails server -p 3001
```

### Problema 2: "CORS error"
**Causa:** Backend não permite origem do frontend
**Solução:** Verificar configuração CORS no Rails (`config/initializers/cors.rb`)

### Problema 3: "404 Not Found"
**Causa:** Rota da API não existe ou URL incorreta
**Solução:** 
- Verificar que a URL é `http://localhost:3001/api/v1/companies`
- Verificar rotas do Rails: `rails routes | grep companies`

### Problema 4: Resposta vazia `{ data: [] }`
**Causa:** Banco de dados não tem empresas cadastradas
**Solução:**
```bash
cd AB0-1-back
rails db:seed
# OU
rails console
> Company.create(name: "Teste Solar", city: "São Paulo", state: "SP", ...)
```

### Problema 5: Warning de fonte
**Causa:** Next.js Font Optimization (já corrigido)
**Status:** ✅ Resolvido com as configurações de `preload` e `adjustFontFallback`

## Testes de Validação

### Teste 1: Listar Todas as Empresas
```
GET http://localhost:3000/companies
```
**Esperado:** Grid com cards de empresas

### Teste 2: Buscar por Nome
```
GET http://localhost:3000/companies?q=solar
```
**Esperado:** Empresas filtradas que contêm "solar" no nome

### Teste 3: Filtrar por Estado
```
GET http://localhost:3000/companies?state[]=SP
```
**Esperado:** Apenas empresas de São Paulo

### Teste 4: Paginação
```
GET http://localhost:3000/companies?page=2
```
**Esperado:** Segunda página de resultados

### Teste 5: Ordenação
```
GET http://localhost:3000/companies?sort=rating_desc
```
**Esperado:** Empresas ordenadas por avaliação (maior primeiro)

## Monitoramento Contínuo

### Logs para Acompanhar

**Console do Navegador (F12 → Console):**
```
[Companies] Fetching with filters: {...}
[API] Request -> GET http://localhost:3000/api/v1/companies?...
[API] Response data: {...}
[Companies] API Response: {...}
```

**Network Tab (F12 → Network):**
- Requisição para `/api/v1/companies` deve retornar Status 200
- Response deve conter JSON com `data` e `meta`

## Próximos Passos

1. ✅ Testar em diferentes navegadores (Chrome, Firefox, Edge)
2. ✅ Testar com diferentes filtros e parâmetros
3. ✅ Verificar performance com muitas empresas (100+)
4. ✅ Testar responsividade em mobile
5. ✅ Validar SEO e metadados

## Contato para Suporte

Se o problema persistir após seguir todos os passos:

1. Execute o diagnóstico: `node diagnose-companies-issue.js`
2. Capture screenshots dos erros no console
3. Verifique logs do backend Rails
4. Compartilhe os logs para análise

---

**Última Atualização:** 2026-02-10
**Versão:** 1.0.0
**Status:** ✅ Correções Implementadas
