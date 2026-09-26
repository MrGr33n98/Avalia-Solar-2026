# Realtime contract

## Channel

`SalesTimelineChannel` aceita subscription apenas após autenticação ActionCable existente e autorização server-side do usuário para tenant + opportunity. ID enviado pelo browser é seletor, nunca prova de acesso.

## Broadcast

Depois do commit de EmailEvent/lifecycle, publicar payload compacto:

```json
{"schema_version":1,"type":"sales.timeline.changed","event_id":983,"opportunity_id":3,"resource_type":"email_message","resource_id":321,"change":"open_signal","occurred_at":"...","cursor":"..."}
```

Não transmitir destinatário, assunto ou corpo. Falha do broadcast não desfaz evento persistido; endpoint delta recupera o estado.

## Recovery/UI

GET inicial devolve cursor. Socket entrega invalidation/event hint. Cliente busca delta idempotente; no reconnect busca após último cursor. A API ainda não detecta cursor expirado; falhas de delta preservam o estado e o polling continua. Polling 20 s somente quando painel visível e socket desconectado; ao mudar `visibilityState` para visible, buscar delta imediatamente.

`Ao vivo` somente depois do callback connected; desconectado = `Reconectando…`; polling = `Atualização automática`.
