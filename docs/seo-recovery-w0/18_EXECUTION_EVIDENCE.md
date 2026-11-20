# SEO Recovery W0 — Evidências de execução

Data da coleta: 2026-11-20 (America/Sao_Paulo).

## Baseline de produção

- SHA servido pelo frontend: `cbbb7597a892e60d3e746f8b3185faeabf1135b7`.
- CI: [run 44811135815](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44811135815), concluído com sucesso.
- CD backend/frontend no fluxo principal: [run 44813179345](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44813179345). O escopo foi `frontend_only`; o backend não foi republicado nesse run.
- Release frontend complementar: [run 44813179200](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44813179200), concluído com sucesso.

## Verificações públicas reproduzidas

| Verificação         | Resultado observado                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `www` homepage      | HTTP 200; canonical `https://www.avaliasolar.com.br`.                                                                                                                   |
| `robots.txt`        | HTTP 200; anuncia apenas `sitemap-index.xml`.                                                                                                                           |
| Sitemap index       | HTTP 200; 10 seções XML.                                                                                                                                                |
| Integridade de URLs | 202 URLs das seções que responderam; nenhuma duplicata ou host fora de `www`. A seção `companies` excedeu o timeout de 30 s nessa coleta e não foi considerada íntegra. |
| Empresa inexistente | HTTP 404 e `noindex, nofollow`; nenhuma tag canonical foi encontrada no corpo.                                                                                          |
| Apex TLS            | Falha de hostname antes do HTTP; certificado apresentado tem SAN apenas `api.avaliasolar.com.br`. Com TLS ignorado, o apex entregou JSON Rails 200.                     |
| `local-solar`       | 10 amostras: cold observado 10,93 s; p95 warm observado 5,55 s.                                                                                                         |

Os números acima são baseline verificável, não declaração de recuperação de indexação.

## GSC

Não foi coletado dado do Search Console. É necessário conceder ao usuário do agente `Owner` ou `Full User` na propriedade de domínio `sc-domain:avaliasolar.com.br` (ou acesso equivalente à propriedade URL-prefix `https://www.avaliasolar.com.br/`), incluindo leitura de Performance, Indexação/Páginas e Sitemaps para os períodos de 7 e 28 dias.

## Auditoria automatizada

O workflow `SEO — Post-deploy Production Audit` roda após os CDs de produção ou manualmente. O artifact contém:

- `seo-post-deploy-audit.json` — dados estruturados e tempos;
- `seo-post-deploy-audit.md` — resumo legível;
- status de falha quando qualquer contrato público não passar.

## Procedimento externo obrigatório para o apex

No host que termina TLS:

1. Confirmar DNS A/AAAA do apex e `www` apontando para o proxy correto, sem CNAME/AAAA residual direcionando ao backend.
2. Emitir/renovar um certificado que inclua `avaliasolar.com.br` e `www.avaliasolar.com.br` (ou certificado separado válido para o apex). Não reutilizar o certificado exclusivo de `api.avaliasolar.com.br`.
3. Instalar `infra/nginx/avaliasolar.com.br.redirect.conf` em `/etc/nginx/conf.d/` com as diretivas `ssl_certificate` e `ssl_certificate_key` apontando para o certificado emitido.
4. Validar `nginx -t`, recarregar Nginx e testar sem `-k`:

```bash
curl --fail --silent --show-error -D - -o /dev/null https://avaliasolar.com.br/caminho?x=1
curl --fail --silent --show-error -D - -o /dev/null https://www.avaliasolar.com.br/
```

O primeiro comando deve retornar HTTP 308 e `Location: https://www.avaliasolar.com.br/caminho?x=1`; o segundo deve continuar servindo o frontend. O CD versionado agora aplica esse vhost automaticamente somente se os arquivos do certificado já existirem.
