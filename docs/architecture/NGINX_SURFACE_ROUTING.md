# Nginx Surface Routing Architecture

> **Data:** 2026-09-03  
> **Objetivo:** Separação dos blocos de servidor Nginx para `app` e `crm`.

---

## 1. Configurações Nginx Separadas

- `infra/nginx/app.avaliasolar.com.br.conf`: Virtualhost dedicado para `app.avaliasolar.com.br`.
- `infra/nginx/crm.avaliasolar.com.br.conf`: Virtualhost dedicado para `crm.avaliasolar.com.br`.

Ambos realizam proxy transparente passando os cabeçalhos HTTP necessários:
- `Host: $host`
- `X-Real-IP: $remote_addr`
- `X-Forwarded-For: $proxy_add_x_forwarded_for`
- `X-Forwarded-Proto: $scheme`
