# Spec 016 — SEO Recovery W0.1

## Objetivo

Corrigir os P0 observados após a publicação da W0 sem alterar a experiência visual ou a arquitetura do Avalia Solar.

## Requisitos

- R1: `/robots.txt` deve ter uma única fonte de verdade e anunciar somente `/sitemap-index.xml`.
- R2: Empresa inexistente confirmada deve produzir HTTP 404, `noindex` e não deve apontar canonical para a home.
- R3: HTTP 5xx, timeout, payload inválido e erro de rede não podem ser convertidos em ausência de empresa.
- R4: Empresa existente deve preservar HTTP 200, canonical própria, SSR/ISR, JSON-LD e funcionalidades da Brand Page.
- R5: O CI deve executar explicitamente os contratos W0 de frontend e backend em job obrigatório.
- R6: TLS, DNS e proxy do apex devem ser documentados para aplicação manual autorizada, sem mutação nesta entrega.

## Fora de escopo

- DNS, certificados, Nginx Proxy Manager, deploy, merge e banco de produção.
- Alterações visuais, pricing, CRM, MCP, gamificação e migrations.

## Cenários de aceite

1. GET `/robots.txt` retorna 200 e contém o índice principal, sem o sitemap legado.
2. GET de slug inexistente retorna 404 e não contém canonical da home.
3. API 404 resulta em ausência; API 503 e timeout resultam em erro controlado.
4. Brand Page válida continua com 200 e canonical própria.
5. O job `SEO W0 Regression Gate` reprova em falhas Jest/RSpec.
