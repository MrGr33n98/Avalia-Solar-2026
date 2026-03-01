# STORY-2026-03-01-admin-company-blank-cnpj-normalization

## Context
- Editar empresas no ActiveAdmin estava falhando quando o formulario enviava `cnpj` vazio (`""`).
- O banco possui a constraint `ck_companies_valid_cnpj`, que aceita apenas `NULL` ou um CNPJ com 14 digitos.
- O payload completo do form de edicao estava chegando com `cnpj: ""`, causando `PG::CheckViolation`.

## Objective
- Normalizar `cnpj` vazio para `NULL` antes de persistir `Company`.
- Cobrir o fluxo real do formulario do ActiveAdmin com teste de request.

## Acceptance Checklist
- [x] `Company` converte `cnpj` vazio em `nil` no `before_validation`.
- [x] Atualizar empresa via ActiveAdmin com `cnpj` vazio nao quebra a constraint do banco.
- [x] Request spec cobre payload semelhante ao formulario real do ActiveAdmin.

## Files Changed
- [x] `app/models/company.rb`
- [x] `spec/requests/admin_companies_edit_spec.rb`

## Validation
- [x] `bundle exec ruby -c app/models/company.rb`
- [x] `bundle exec ruby -c spec/requests/admin_companies_edit_spec.rb`
- [x] `RAILS_ENV=test .\\bin\\rspec spec\\requests\\admin_companies_edit_spec.rb:100 spec\\requests\\admin_companies_edit_spec.rb:114 spec\\requests\\admin_companies_edit_spec.rb:129 --format progress --no-color`
