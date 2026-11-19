# Plano de testes

## Frontend

Jest: 0/1/99/100/101/500 empresas, HTTP 503, robots, local page 2 empresas autorizadas.

## Backend

RSpec: local rankings e group posts respondem 503 com `Cache-Control: no-store`; Company normaliza `project_types` com quebra interna.

## Pós-deploy

Validar status HTTP, XML, canonical, robots, redirects, Brand Pages e GSC por seção.
