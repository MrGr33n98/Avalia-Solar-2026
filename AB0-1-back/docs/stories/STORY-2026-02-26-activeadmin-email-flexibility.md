# STORY-2026-02-26: Flexibilizar validação de e-mail no cadastro de empresa (ActiveAdmin)

## Contexto
No cadastro/edição de empresas no ActiveAdmin, a validação bloqueava o salvamento quando o domínio do `email` não correspondia ao domínio do `website`, gerando erro desnecessário para casos válidos.

## Requisito
Permitir cadastro de empresa com qualquer e-mail válido, sem exigir correspondência de domínio com o website.

## Acceptance Criteria
- [x] Empresa com `status: active` aceita e-mail válido mesmo com domínio diferente do website.
- [x] Continuidade da validação de formato de e-mail (`email` e `email_public`).
- [x] Testes de modelo atualizados para refletir o novo comportamento.

## Checklist de Implementação
- [x] Remover validação rígida de domínio corporativo em `Company`.
- [x] Atualizar specs afetadas em `spec/models/company_spec.rb`.
- [x] Rodar `npm run lint` (falhou: script `lint` inexistente no `package.json` da raiz).
- [x] Rodar `npm run typecheck` (falhou: script `typecheck` inexistente no `package.json` da raiz).
- [x] Rodar `npm test` (falhou: script `test` inexistente no `package.json` da raiz).
- [x] Rodar validação do backend: `bundle exec ruby <rspec-exe> spec/models/company_spec.rb` (11 exemplos, 0 falhas).

## File List
- [x] `app/models/company.rb`
- [x] `spec/models/company_spec.rb`
- [x] `docs/stories/STORY-2026-02-26-activeadmin-email-flexibility.md`
