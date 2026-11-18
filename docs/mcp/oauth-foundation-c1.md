# Fase C1 — Fundação OAuth com Doorkeeper

## Escopo

Esta fase adiciona um Authorization Server OAuth 2.0 ao Rails sem substituir o
Devise, o JWT legado da API ou os fluxos de login existentes.

O titular da autorização continua sendo o registro existente em `users`. As
tabelas `oauth_applications`, `oauth_access_grants` e `oauth_access_tokens`
armazenam apenas o estado OAuth e referenciam `users.id` por chave estrangeira.

## Política inicial

- Grant permitido: Authorization Code.
- PKCE obrigatório para clientes públicos; somente `S256` é aceito.
- Refresh token habilitado com rotação pelo campo `previous_refresh_token`.
- Access tokens e secrets persistidos com hash SHA-256.
- Scope inicial: `mcp:public:read`.
- Painel de cadastro de aplicações e rotas administrativas não são expostos.
- Contas Devise precisam estar ativas e confirmadas para autorizar um cliente.
- A execução das ferramentas MCP continua sob as flags existentes e não é
  habilitada por esta fase.

## Limites desta fase

Esta entrega ainda não emite JWT RFC 9068, não implementa JWKS/rotação de chaves,
audience/resource indicators, descoberta MCP completa nem autorização privada
multiempresa. Esses itens pertencem às fases C2/C3 e permanecem bloqueados até
testes de interoperabilidade e revisão de segurança.

## Operação e rollback

As migrations devem ser executadas somente em banco local/teste durante C1. O
rollback local deve remover as três tabelas OAuth e a extensão PKCE. Em produção,
as rotas e a dependência permanecem fora da `main` até PR aprovada, CI verde e
aprovação explícita de release.
