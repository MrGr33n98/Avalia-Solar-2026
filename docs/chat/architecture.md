# Arquitetura de Chat

## Limites de domínio

`MobiVolt AI` atende consumidores. `MobiVolt Success` atende empresas no dashboard. `Live Inbox` representa handoff humano. `P2P Chat` representa comunicação usuário-empresa. `Lead Delivery` entrega oportunidades a sistemas externos. CRM não é responsabilidade do core.

## Ownership de sessão

Sessões anônimas usam `X-Chat-Session-Token`, assinado por `SessionAccessToken`, com `session_id`, nonce, versão e expiração. Sessões autenticadas exigem `user_id` correspondente. ID numérico isolado nunca autoriza acesso.
