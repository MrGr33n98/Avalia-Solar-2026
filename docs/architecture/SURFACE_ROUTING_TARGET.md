# Surface Routing — Estado Alvo (Target Architecture)

> **Data:** 2026-09-03  
> **Objetivo:** Definir as 3 superfícies de produto explícitas e isoladas.

---

## 1. As 3 Superfícies de Produto

```
+-----------------------------------------------------------------------------------+
| 1. PUBLIC PLATFORM (www.avaliasolar.com.br / avaliasolar.com.br)                   |
| Marketplace, Empresas, Produtos, Avaliações, Categorias, Comparador, SEO           |
+-----------------------------------------------------------------------------------+
| 2. COMPANY APPLICATION (app.avaliasolar.com.br)                                   |
| Portal B2B para Empresas & Integradores solares (Perfil, Leads, Reviews, Billing)  |
+-----------------------------------------------------------------------------------+
| 3. INTERNAL SALES CRM (crm.avaliasolar.com.br)                                    |
| Operação comercial interna Avalia Solar (Today, Leads, Contatos, Quotes, Email)   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Matriz de Roteamento Alvo por Host

| Host | Superfície | `/` Não Autenticado | `/` Autenticado | Login UI | Permissão Exigida |
| --- | --- | --- | --- | --- | --- |
| `avaliasolar.com.br` | `public` | Marketplace Home | Marketplace Home | Login Padrão | Nenhuma |
| `app.avaliasolar.com.br` | `company_app` | Redirect `/login` | Redirect `/dashboard` (Empresa) | Portal da Empresa | `company` ou `review`+membership |
| `crm.avaliasolar.com.br` | `crm` | Redirect `/login` | Redirect `/dashboard/sales/leads` | Avalia Solar CRM | `admin` ou `sales` internal |

---

## 3. Segurança & Isolamento

- Usuários com acesso exclusivo de Empresa (`role = company`) acessando `crm.avaliasolar.com.br` receberão página **403 Forbidden**.
- Vendedores internos sem empresa associada acessando `app.avaliasolar.com.br` não terão empresa fabricada e verão estado de seleção.
