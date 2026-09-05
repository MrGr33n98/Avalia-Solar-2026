# Campaign Workstation Certification

NOT CERTIFIED

Blockers:

- Browser E2E autenticado ainda não executado.
- Rails request/service suite e Sidekiq/provider E2E ainda não comprovados nesta execução.
- Campaign 360, saved audience UI, template preflight, sequence engine, deliverability e suppression workspace incompletos.
- Lint global permanece falhando em arquivos existentes; novos arquivos precisam passar gate isolado.
- Não há evidência de produção real, latência p95 ou entrega externa.
- Runtime local frontend antigo retorna HTTP 500 sem `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`; stack campaign-cert agora injeta chave exclusiva de teste, mas não subiu nesta execução.
