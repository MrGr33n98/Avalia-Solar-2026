# Cookie Isolation Specification

> **Data:** 2026-09-03  
> **Objetivo:** Diretrizes de segurança de cookies para evitar contaminação cruzada de sessões.

---

## 1. Configuração de Cookies por Ambiente

- **`jwt_token`**: Cookie HttpOnly enviado nas requisições da API.
- **`SameSite`**: Lax.
- **`Secure`**: `true` em ambiente de produção (HTTPS).
- **Subdomínios**: Evitar o uso indiscriminado de `Domain=.avaliasolar.com.br` para cookies sensíveis de autenticação CRM.
