# Segurança e governança
Threat model: injeção via dados de empresa/avaliações, XSS/HTML, URL de mídia maliciosa, SSRF, fuga do sandbox, ação de host não autorizada, cross-tenant, dados de cliente em screenshots, dependências/registry comprometidos, exposição de source maps e secrets.

| Controle | Critério |
|---|---|
| XSS | render texto React, sem dangerouslySetInnerHTML arbitrário, sanitização de URLs |
| CSP | preservar connectDomains/resourceDomains/frameDomains allowlist; sem wildcard |
| Actions | apenas ferramentas e URLs permitidas; autorização backend, entitlement e HITL quando aplicável |
| Tenant | escopo empresa no servidor, deny by default; testes negativos |
| Quote | opt-in explícito, destino identificado, confirmação, idempotência; sem coleta no MVP |
| Map | sem geocodificar residência/lead, coordenadas públicas verificadas, tiles sob política e licença |
| Registry | hash/commit, revisar deps e scripts, lockfiles, copyright MIT, sem imports remotos em runtime |
| REA | loopback, sem credenciais, CPU/RAM/deadlines, sem análise de terceiros não autorizada |
| Logs | redigir tokens, PII, caminhos locais; preservar originais autenticados em local protegido; redigido = derivado |
| Deploy | flags OFF, sem secrets em commits, não ampliar escopo OAuth |

A auditoria 020 relatou exposição de credenciais; responsável deve revogar/rotacionar e validar impacto antes de distribuição. Não reproduzir os valores. Nunca tratar verificação cadastral como certificação de produto ou garantia de qualidade.
