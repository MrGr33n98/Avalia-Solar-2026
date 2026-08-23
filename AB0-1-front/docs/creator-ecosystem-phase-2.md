# Creator Ecosystem — Fase 2

## Escopo

Integração inicial do perfil público com contato, WhatsApp e Tree. O perfil continua público e não transforma ações de visitante em ações de owner.

## Alterações

- `CreatorHero` recebeu CTAs públicos para contato, WhatsApp, Tree e compartilhamento.
- `CreatorContactForm` mostra `Meu Tree` somente quando API retorna Tree ativo.
- WhatsApp aparece somente com `whatsapp_url` preenchido.
- Cliques WhatsApp usam evento analytics existente `whatsapp_click` com `cta_location=creator_profile`.
- `CreatorStickyContact` recebeu CTA WhatsApp condicional no mobile.
- CTA `Criar publicação` foi removido do perfil público, evitando ação de owner para visitantes.
- Bloco grande de três métricas foi substituído por linha editorial discreta.
- Public profile service retorna:
  - `tree_enabled`
  - `tree_url`
- URL canônica de Tree foi centralizada em `creatorTreeUrl`.

## Contratos

`GET /api/v1/creators/:slug` agora inclui `creator.tree_enabled` e `creator.tree_url`.

Tree continua usando rota pública existente `GET /api/v1/creator_tree/:slug` e URL `/creators/:slug/tree` conforme rota implementada no frontend.

## Decisões

- Não foi criado novo endpoint de tracking; evento analytics existente foi reutilizado.
- Não foi duplicado formulário de lead.
- Owner actions não são inferidas por slug nem exibidas no perfil público.
- `Meu Tree` não aparece quando não há bloco ativo.
- Share Center universal permanece planejado para Fase 3.

## Validação

- `npm run typecheck`: passou após correções de nulabilidade e props.
- Teste Tree público: 2 testes passaram.
- `get_errors`: nenhum erro nos arquivos alterados.

## Pendências

- Adicionar teste do contrato `tree_enabled/tree_url` na suíte CI backend.
- Validar visualmente perfil desktop e mobile.
- Fase 3: Share Center universal com plataformas, attribution e tracking estruturado.
