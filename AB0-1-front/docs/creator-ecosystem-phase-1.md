# Creator Ecosystem — Fase 1

## Escopo

Fase 1 normaliza tipos de publicação e melhora fluxo de gestão, criação e publicação no frontend. Fase 0 permanece responsável pela projeção persistente `ReviewerPublication` para `FeedItem`.

## Alterações

- Registry único em `lib/publications/publicationTypes.ts`.
- Labels públicos:
  - `tip`: Insight
  - `case_study`: Estudo de caso
  - `article`: Artigo
  - `project`: Projeto
- Creator Studio usa labels públicos no editor e no card.
- Creator Studio substitui KPI vazio de visualizações por contagem real de comentários disponíveis no payload.
- `PublicationCard` ganhou ações textuais para editar, compartilhar, ver publicação e copiar link.
- Composer rápido permite selecionar tipo de publicação.
- Feed ganhou ação de compartilhamento com Web Share API e fallback de cópia.
- Publicações públicas e post page deixam de exibir valores internos de `publication_type`.
- Pós-publicação no feed exibe confirmação, link público e compartilhamento.

## Contratos

Valores persistidos continuam usando os tipos Rails existentes: `article`, `case_study`, `tip` e `project`.

Labels de interface passam pelo resolver `getPublicationTypeLabel`. Tipo desconhecido usa `Artigo` como fallback neutro.

## Decisões

- Share Center universal ainda não faz parte desta fase; o fluxo atual usa Web Share API para evitar duplicação antes da Fase 3.
- Ações sem implementação real não foram expostas.
- URL pública usa `reviewerProfile.public_slug`; não há slug de usuário hardcoded.
- Métricas exibidas são somente dados já entregues pela API.

## Validação

- `npm run typecheck`: passou.
- `npm test -- --runInBand lib/publications/publicationTypes.test.ts`: 2 testes passaram.
- `get_errors` nos arquivos alterados: nenhum erro.
- `git diff --check`: passou.

## Pendências

- Fase 2: Creator Profile, WhatsApp e Tree.
- Fase 3: Share Center universal e tracking de compartilhamentos.
- E2E completo de publicação, reload, perfil e compartilhamento.
