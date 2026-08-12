# Segurança de Chat

Tokens de sessão não devem aparecer em URL, analytics, Sentry ou logs. Token é assinado, expira em 24 horas e vincula `session_id` ao `visitor_nonce`. Rotação de `access_token_version` deve invalidar versões anteriores quando endpoint de rotação for adicionado.

Endpoints protegidos: leitura de sessão, mensagens, feedback e captura de lead. Falha de ownership retorna `403` com código estável.
