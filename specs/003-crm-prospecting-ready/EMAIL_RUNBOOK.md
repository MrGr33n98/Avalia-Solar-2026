# Runbook — email

## Status

Envio de produção **não comprovado**. Nenhuma credencial foi lida, nenhum request real foi feito ao SES e nenhum endereço prospect foi usado. O teste de provider usa doubles somente em RSpec; não prova entrega.

## Pré-condições de staging

1. Habilitar AWS SES v2 na região configurada, confirmar acesso a `GetAccount`, `GetEmailIdentity` e `SendEmail`.
2. Configurar sender identity verificada, configuration set/event destination SNS e tópico autorizado.
3. Manter `SALES_EMAIL_SENDING_ENABLED=false` até o preflight reportar operacional; testar apenas inbox interna ou SES mailbox simulator permitido.
4. Confirmar assinatura SNS e assinatura do tópico com o ARN exato esperado.
5. Enviar uma mensagem sintética e confirmar `queued → sending → sent`, `provider_message_id`, evento real `delivery`, timeline e analytics.
6. Validar bounce e complaint somente pelo simulador SES; confirmar suppression, recipient state e stop de cadence.
7. Validar webhook duplicado, adulterado, fora de ordem e SNS retry; invalid signature deve ser rejeitada.
8. Testar GET unsubscribe (sem alteração) e POST one-click (suppression e stop) com token válido/expirado/adulterado.

## Estados e limitações

`sent` significa aceito pelo provider; `delivered` exige evento autenticado. Open tracking é indicativo e não comprova leitura humana (MPP/proxy/bloqueio de imagens). Reply não está operacional sem inbound provider; portanto stop-on-reply é bloqueador de cadence completa.

## Segurança

Nunca imprimir chaves, tokens, endereços/corpos desnecessários ou payload SNS integral. Ao falhar, registrar `tenant_id`, campanha/recipient/mensagem/job e classe do erro; pausar envio pelo switch quando houver dúvida de duplicidade ou autenticação.
