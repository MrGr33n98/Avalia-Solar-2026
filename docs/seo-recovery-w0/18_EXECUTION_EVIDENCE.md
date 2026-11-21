# SEO Recovery W0 — Evidências de execução

Data da coleta: 2026-11-20/21 (America/Sao_Paulo).

## Release entregue

- PR: [#210](https://github.com/MrGr33n98/Avalia-Solar-2026/pull/210), mesclada.
- Commit final em produção: `bc79842d45ddfb71dd4e777de6a7dc6dc95c4213`.
- CI pós-merge: [run 44829252776](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44829252776), concluído com sucesso.
- CD backend: [run 44831814482](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44831814482), concluído com sucesso.
- CD frontend: [run 44831814580](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44831814580), concluído com sucesso.
- Smoke público confirmou `x-release: bc79842d45ddfb71dd4e777de6a7dc6dc95c4213`.

## Baseline de produção

- SHA servido antes da mudança: `cbbb7597a892e60d3e746f8b3185faeabf1135b7`.
- Apex HTTPS: certificado apresentado com SAN de `api.avaliasolar.com.br`, incompatível com `avaliasolar.com.br`; com TLS ignorado, entregava JSON Rails 200.
- Sitemap local antes da mudança: primeira resposta acima de 20 s; repetição observada em aproximadamente 5,7 s.

## Verificações pós-deploy

Auditorias: [44833335108](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44833335108) e [44833290619](https://github.com/MrGr33n98/Avalia-Solar-2026/actions/runs/44833290619). Os artifacts JSON/Markdown foram publicados pelo workflow.

| Verificação         | Resultado observado |
| ------------------- | ------------------- |
| `www` homepage      | HTTP 200; canonical `https://www.avaliasolar.com.br`; release final confirmada. |
| `robots.txt`        | HTTP 200; referência ao sitemap index presente. |
| Sitemap index       | HTTP 200; 10 seções XML. |
| Integridade de URLs | 672 URLs, nenhuma duplicata e nenhum host inválido. |
| Empresa inexistente | HTTP 404 e `noindex`. |
| Sitemap local       | 45 URLs; cold observado 42,38 ms; warm p95 157,22 ms; meta cumprida. |
| Apex TLS/308        | Falhou antes do HTTP por hostname mismatch; não foi possível comprovar redirect 308 com TLS válido. |

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
2. Emitir/renovar um certificado cujo SAN inclua `avaliasolar.com.br` (e, se desejado, `www.avaliasolar.com.br`). Não reutilizar o certificado exclusivo de `api.avaliasolar.com.br`.
3. Instalar o certificado em `/etc/letsencrypt/live/avaliasolar.com.br/fullchain.pem` e `privkey.pem`, ou ajustar o vhost para os paths reais.
4. Garantir `infra/nginx/avaliasolar.com.br.redirect.conf` em `/etc/nginx/conf.d/`, com as diretivas SSL ativas.
5. Validar e recarregar:

```bash
sudo openssl x509 -in /etc/letsencrypt/live/avaliasolar.com.br/fullchain.pem -noout -subject -issuer -dates -ext subjectAltName
sudo nginx -t
sudo systemctl reload nginx
curl --fail --silent --show-error -D - -o /dev/null 'https://avaliasolar.com.br/caminho?x=1'
```

O último comando deve retornar HTTP 308 e `Location: https://www.avaliasolar.com.br/caminho?x=1`. Depois disso, reexecutar manualmente o workflow de auditoria e confirmar que o artifact fica verde. O CD versionado aplica o vhost automaticamente apenas quando os arquivos do certificado existem; ele não emite certificado nem corrige um SAN incorreto.
