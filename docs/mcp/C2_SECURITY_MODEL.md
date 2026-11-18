# C2 — Modelo de segurança

## Controles

- OAuth usa sessão Devise para o consentimento; não reutiliza o JWT web como access token MCP.
- PKCE S256 é obrigatório para clientes públicos.
- Redirect URI é validada pelo Doorkeeper; registro aberto de clientes não é exposto.
- `/mcp` exige bearer Doorkeeper válido no modo OAuth.
- `resource`, scope, expiração, revogação e aplicação são verificados no backend.
- Host/origin e quotas permanecem nas camadas MCP existentes.
- O registro público é uma allowlist de cinco ferramentas; o dispatcher interno não é chamado.
- Falhas não imprimem token, refresh token, cookie ou chave.

## Ameaças cobertas

Replay de token revogado/expirado, audience/resource incorreto, escopo ausente, bearer malformado, cliente desconhecido, redirect não autorizado e tentativa de usar token de login.

## Não coberto ainda

Staging externo, rotação de JWKS, DAST, testes com dois SDKs reais, revisão AppSec/DPO, observabilidade operacional e autorização multiempresa. Esses itens são gates antes de qualquer ativação pública.
