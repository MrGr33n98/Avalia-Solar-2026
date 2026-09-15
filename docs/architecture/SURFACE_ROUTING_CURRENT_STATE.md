# Surface Routing — Estado Atual (Current State Audit)

> **Data do Audit:** 2026-09-03  
> **Escopo:** Mapeamento do roteamento de superfícies no Nginx, Next.js Middleware e rotas de autenticação.

---

## 1. Mapeamento Nginx Atual

No arquivo `infra/nginx/app.avaliasolar.com.br.conf`:
- `server_name crm.avaliasolar.com.br app.avaliasolar.com.br;` (ambos os subdomínios compartilhavam o mesmo bloco virtualhost Nginx).
- Ambos o proxy direcionava chamadas para a porta `:3001` ou `:3000`.

---

## 2. Middleware Next.js Atual (`AB0-1-front/middleware.ts`)

- O middleware verificava `isCrmSubdomain` (`host.includes('crm.avaliasolar.com.br')`).
- Redirecionava apenas `/` e `/dashboard` para `/dashboard/sales`.
- **Falta de roteamento explícito para `app.avaliasolar.com.br`**: não havia um resolvedor formal de superfícies (`public`, `company_app`, `crm`).
- **Conflito de Namespace**: `/dashboard` era utilizado tanto para a empresa quanto para o CRM.

---

## 3. Matriz de Conflitos Detectados

| Rota / Host | Host Solicitado | Comportamento Anterior | Problema Encontrado |
| --- | --- | --- | --- |
| `/` | `app.avaliasolar.com.br` | Exibia Home Pública | Deveria abrir o Portal da Empresa |
| `/dashboard` | `crm.avaliasolar.com.br` | Redirecionava para `/dashboard/sales` | Não verificava se o usuário era da empresa ou interno |
| `/` | `crm.avaliasolar.com.br` | Redirecionava para `/dashboard/sales` | Não exigia login no subdomínio crm |
