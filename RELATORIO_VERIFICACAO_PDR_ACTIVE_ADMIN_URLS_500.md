# Verificação pós-correção — Active Admin e rotas Rails

**Data:** 03/11/2026

**Escopo:** `PDR_REMEDIACAO_ACTIVE_ADMIN_URLS_500.md`

## Correções verificadas

- Os recursos `Pricing`, `BannerAddon`, `BannerAddonSubscription`, `AdminUser` e `Downloadable` usam os atributos persistidos no schema. Os aliases preservam as chamadas legadas descritas no PDR.
- Os filtros de `LeadWizardField`, `LeadWizardFieldOption` e `SectorRating` usam associações diretas permitidas pelo Ransack.
- `ReviewerPublicationPolicy` autoriza `AdminUser` nas ações de gestão e no escopo, mantendo o escopo do autor para usuários comuns.
- A API de páginas solares locais qualifica as colunas de `companies` usadas nos filtros e nas métricas.
- O hub `/admin/usuarios_acesso` e a lista `/admin/admin_users` leem a coluna existente `two_factor_enabled` para exibir o estado de 2FA.

## Evidências de execução

| Verificação | Resultado |
| --- | --- |
| RSpec focado em rotas admin, aliases, policy e API local | 20 exemplos, 0 falhas |
| RuboCop no recurso `Downloadable` e nos três specs criados | 4 arquivos, 0 ocorrências |
| Brakeman `-q -w2` | Código de saída 0 |
| `git diff --check` nos arquivos alterados | Código de saída 0 |
| Diff de `AB0-1-back/db/schema.rb` | Nenhuma alteração de conteúdo |

As 33 migrations pendentes foram aplicadas apenas ao banco configurado para `RAILS_ENV=test` antes da execução dos specs. O arquivo `db/schema.rb` gerado pela tarefa de migration foi restaurado ao conteúdo anterior.

## Quality gate global

- A suíte RSpec completa apresentou diversas falhas e foi interrompida após a confirmação de que não estava verde. A execução com `--fail-fast` parou em `spec/features/authentication_spec.rb:32`: o teste espera uma mensagem em inglês, enquanto a validação retorna `deve ser corporativo para contas de empresa` (22 exemplos, 1 falha). Essa expectativa não foi alterada.
- O RuboCop global encontrou ocorrências preexistentes e avançou para diretórios `rubocop_backup` aninhados; a execução foi interrompida. O recurso `Downloadable` e os três specs criados passaram na verificação direcionada.
- O wrapper `bin/quality` depende de executáveis `bundle exec` indisponíveis neste shell WSL. RSpec, RuboCop e Brakeman foram chamados pelas bibliotecas Ruby instaladas no Windows.

As respostas HTTP verificadas são do ambiente de teste. Não houve validação em produção.
