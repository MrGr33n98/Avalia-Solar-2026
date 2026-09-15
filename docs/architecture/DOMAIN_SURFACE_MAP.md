# Domain Surface Map

> **Data:** 2026-09-03  
> **Objetivo:** Mapear domínios e portas de cada serviço na arquitetura do Avalia Solar.

---

## 1. Mapeamento de Domínio para Serviços

| Domínio | Superfície de Produto | Proxy Nginx | Destino Upstream |
| --- | --- | --- | --- |
| `avaliasolar.com.br` | Public Platform | Nginx | Next.js Frontend (`:3000`) |
| `www.avaliasolar.com.br` | Public Platform | Nginx | Next.js Frontend (`:3000`) |
| `app.avaliasolar.com.br` | Company Application | `app.avaliasolar.com.br.conf` | Next.js Frontend (`:3000`) |
| `crm.avaliasolar.com.br` | Internal Sales CRM | `crm.avaliasolar.com.br.conf` | Next.js Frontend (`:3000`) |
| `api.avaliasolar.com.br` | Backend API | Nginx | Rails Puma Backend (`:3001`) |
