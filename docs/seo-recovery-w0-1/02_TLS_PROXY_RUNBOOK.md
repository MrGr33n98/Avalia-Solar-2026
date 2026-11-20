# Runbook — Apex TLS e Redirect para `www`

**Aplicação:** somente por operador autorizado na camada de entrada.
**Esta PR não aplica nenhuma alteração de DNS, certificado ou Nginx Proxy Manager.**

## Estado observado

- `https://www.avaliasolar.com.br` responde pelo frontend publicado.
- `https://avaliasolar.com.br` apresentou certificado incompatível com o hostname.
- Com a verificação TLS ignorada apenas para diagnóstico, o apex respondeu JSON Rails em vez de redirecionar para `www`.
- `infra/nginx/avaliasolar.com.br.redirect.conf:21-32` descreve o redirect HTTPS, mas os caminhos de certificado estão comentados; isso não prova que o arquivo esteja aplicado no proxy ativo.
- `AB0-1-front/middleware.ts` e `AB0-1-front/next.config.js` possuem redirect de aplicação, mas não substituem um certificado/SNI válido na borda.

## Causa operacional a confirmar

O vhost/proxy ativo do apex está associado ao certificado errado e/ou encaminha o hostname raiz diretamente ao Rails. A configuração versionada não é evidência de aplicação no Nginx Proxy Manager.

## Pré-condições e aprovação

- Aprovação explícita do responsável pela infraestrutura.
- Acesso administrativo ao provedor DNS, ao terminador TLS e ao Nginx Proxy Manager.
- Janela de mudança e canal de rollback definidos.
- Backup/export da configuração atual do proxy e registro dos IDs dos Proxy Hosts.

## Procedimento controlado

1. Registrar A/AAAA/CNAME atuais do apex e de `www`; não alterar registros nesta etapa.
2. Confirmar no terminador TLS que o certificado selecionado contém `avaliasolar.com.br` e `www.avaliasolar.com.br` nos SANs, ou instalar certificado equivalente aprovado.
3. Criar/ajustar o Proxy Host HTTPS do apex para terminar TLS com esse certificado e responder:

   ```nginx
   return 308 https://www.avaliasolar.com.br$request_uri;
   ```

4. Garantir que o apex não seja encaminhado ao upstream Rails. O upstream do redirect não deve expor `/api` nem JSON de aplicação.
5. Manter o host `www` apontando para o frontend e validar que o host `app` permanece separado.
6. Aplicar a mudança somente após revisão da configuração renderizada pelo proxy.

## Backup e rollback

- Exportar a configuração do Nginx Proxy Manager e salvar o certificado/ID anterior conforme o procedimento interno de infraestrutura.
- Registrar os valores anteriores de Proxy Host, Forward Host/Port, SSL Certificate e Force SSL.
- Rollback: restaurar o Proxy Host e o certificado anterior, recarregar/reiniciar apenas o proxy autorizado e repetir as validações abaixo.
- Não remover certificados antigos antes de confirmar a propagação e o período de observação.

## Validação não destrutiva

```bash
curl -sS -I https://avaliasolar.com.br/
curl -sS -I 'https://avaliasolar.com.br/companies?sort=rating'
curl -sS -I https://www.avaliasolar.com.br/
openssl s_client -connect avaliasolar.com.br:443 -servername avaliasolar.com.br </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

Aceite:

- Certificado válido para o apex.
- `308` em um salto para `https://www.avaliasolar.com.br/`.
- Path e query preservados.
- Nenhum corpo JSON Rails no apex.
- `www`, `app`, `api` e `crm` sem regressão.
- Sem loop de redirect.

## Riscos

- Certificado sem SAN do apex continuará causando falha antes do HTTP.
- IPv6/AAAA apontando para outro terminador pode produzir comportamento divergente.
- Proxy Host duplicado pode capturar SNI antes do vhost correto.
- Cache/CDN pode atrasar a observação; validar múltiplos pontos sem relaxar TLS.
