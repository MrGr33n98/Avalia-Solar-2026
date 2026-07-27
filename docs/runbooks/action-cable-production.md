# ActionCable em produção

## Sintoma

O navegador repete `WebSocket connection to wss://api.avaliasolar.com.br/cable failed`.

## Diagnóstico e validação

Uma requisição HTTP comum ou HTTP/2 para `/cable` não é um teste válido para
ActionCable: WebSocket usa o upgrade HTTP/1.1. Em 27/07/2026, o handshake
correto para `https://api.avaliasolar.com.br/cable` retornou `101 Switching
Protocols` e uma conexão cliente recebeu `{"type":"welcome"}`. Isto confirma
que a rota pública, o TLS e o proxy aceitam WebSocket neste momento.

Erros antigos no console podem permanecer no histórico do DevTools. Se o erro
persistir após recarregar a página, capture o *close code* e a resposta do
handshake na aba Network antes de alterar o proxy ou o token.

## Correção no Nginx Proxy Manager

No Proxy Host de `api.avaliasolar.com.br`:

1. Aponte o upstream para o mesmo backend Rails que atende `/api/v1` (porta
   `3001`; use `ab0-backend:3001` se o NPM estiver na rede Docker, ou o host
   acessível pelo NPM).
2. Marque **Websockets Support**.
3. Garanta que `/cable` não seja filtrado por uma regra que encaminha apenas
   `/api` ou `/health`. Ele precisa chegar ao mesmo upstream Rails.
4. Preserve `Host`, `X-Forwarded-Proto`, `Upgrade` e `Connection`.

Se a configuração for feita em um vhost Nginx convencional, a localização
equivalente é:

```nginx
location /cable {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
    proxy_buffering off;
}
```

Use o endereço do backend alcançável pelo processo Nginx; `127.0.0.1:3001`
somente é correto quando Nginx e Puma compartilham a mesma rede do host.

## Verificação obrigatória

Depois de salvar/recarregar o proxy, execute:

```bash
curl --http1.1 -i --max-time 10 \
  -H 'Origin: https://www.avaliasolar.com.br' \
  -H 'Connection: Upgrade' \
  -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' \
  -H 'Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==' \
  https://api.avaliasolar.com.br/cable
```

O resultado esperado é `HTTP/1.1 101 Switching Protocols`. O `curl` pode
terminar por timeout depois do `101`, pois uma conexão WebSocket permanece
aberta; nesse caso, o `101` é o critério de sucesso.

Somente após esse teste passar, defina no build do frontend:

```text
NEXT_PUBLIC_ENABLE_REALTIME=true
```

Enquanto a rota estiver indisponível, o frontend mantém realtime desabilitado
em produção, preservando as telas HTTP sem loops de reconexão no console.
