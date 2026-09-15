# Login Redirect Specification

> **Data:** 2026-09-03  
> **Objetivo:** Especificação determinística do fluxo pós-autenticação por superfície.

---

## 1. Regras de Redirecionamento Pós-Login

1. **Superfície CRM (`crm.avaliasolar.com.br`)**:
   - `resolvePostAuthDestination({ surface: 'crm', user })`:
     - Se `user.role === 'admin'` ou equipe interna -> `/dashboard/sales/leads`.
     - Caso contrário -> `/forbidden` (403 Forbidden).

2. **Superfície Company App (`app.avaliasolar.com.br`)**:
   - `resolvePostAuthDestination({ surface: 'company_app', user, activeCompanyId })`:
     - Se `hasCompanyWorkspaceAccess({ user })`:
       - Com `activeCompanyId` -> `/dashboard?company_id=${activeCompanyId}`
       - Sem `activeCompanyId` -> `/select-company`
     - Caso contrário -> `/select-company` ou aviso de permissão.

3. **Superfície Public Platform (`www.avaliasolar.com.br`)**:
   - Se possuir `returnTo` seguro -> `returnTo`
   - Caso contrário -> `/` (Home pública) ou `/review-dashboard`.
