# Análise de segurança — MCP Production Canary

## Escopo

Análise focada no transporte MCP público, Doorkeeper, PKCE, quotas Redis,
telemetria e separação do MCP privado. Não houve alteração, login ou auditoria
da VM de produção nesta execução.

## Controles implementados

- `Mcp::Canary::Configuration` falha fechado com flag desligada, fase inválida,
  allowlist vazia, recurso/issuer incorretos, modo JWT ou políticas MCP
  ausentes.
- `Mcp::Canary::Guard` verifica client ID e subject derivados do token opaco
  verificado, scope `mcp:public:read` e recurso canônico.
- Authorization Code + PKCE S256 é exigido no issuance quando o canary está
  ativo.
- Discovery e read-only são fases distintas.
- Somente cinco ferramentas públicas têm autorização de execução.
- O protocolo legado não oferece caminho alternativo para execução.
- MCP privado permanece sob flags próprias e desligadas.
- Quotas e telemetria existentes permanecem no caminho da requisição.
- Contextos de token agora carregam apenas metadados de controle necessários
  (`resource` e `token_format`), nunca o bearer bruto.

## Ameaças tratadas

| Ameaça | Mitigação |
| --- | --- |
| token válido de outro client | allowlist de client ID |
| token válido de usuário externo | allowlist de subject interno |
| token para outro resource | resource exato no Doorkeeper e no guard |
| JWT ou token de formato inesperado | canary aceita somente opaque |
| bypass por protocolo legado | execução legada continua indisponível |
| ferramenta interna via argumento | allowlist estática antes do executor |
| canary mal configurado | fail-closed e endpoint oculto/negado |
| Redis indisponível | política existente retorna 503 |
| quota excedida | política existente retorna 429 |
| vazamento por logs | labels finitos e request ID limitado |

## Limitações remanescentes

- O cadastro do cliente e a definição de callback real são tarefas operacionais
  posteriores.
- O teste com ChatGPT/Claude não foi executado e não pode ser declarado
  interoperabilidade aprovada.
- A VM não foi inspecionada por SSH nesta execução; os comandos read-only estão
  no runbook.
- DNS, certificado, reverse proxy e valores do ambiente de produção precisam
  de validação operacional independente.
- A política de quota deve ser calibrada com carga aprovada antes de rollout.

## Veredito

Código preparado para homologação controlada, com MCP desativado por padrão.
GO para revisão de código/CI; NO-GO para ativação pública até completar o
cliente real, auditoria operacional, observabilidade e teste externo.
