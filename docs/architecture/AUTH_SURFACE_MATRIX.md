# Auth & Surface Authorization Matrix

> **Data:** 2026-09-03  
> **Objetivo:** Matriz de permissões por perfil de usuário e superfície do sistema.

---

## 1. Permissões de Acesso por Perfil e Host

| Perfil de Usuário (`User.role` / E-mail) | Public Host (`www`) | Company App Host (`app`) | Internal CRM Host (`crm`) |
| --- | --- | --- | --- |
| **Admin (`role=admin` / `@avaliasolar.com.br`)** | Permitido | Permitido | **Permitido (Total)** |
| **Company (`role=company` / Integrador)** | Permitido | **Permitido (Com CompanyMember)** | **BLOQUEADO (403 Forbidden)** |
| **Reviewer (`role=review` / Cliente Final)** | Permitido | Permitido se possuir CompanyMember | **BLOQUEADO (403 Forbidden)** |
| **Anônimo / Visitante** | Permitido | Redirect `/login` | Redirect `/login` |

---

## 2. Garantias no Backend (Rails Pundit)

Toda requisição para `/api/v1/sales/*` valida a política de autorização via Pundit (`Sales::Policy`):
- Exige `user.admin?` ou permissão de vendas interna.
- Impede acesso direto por API de usuários da role `company`.
