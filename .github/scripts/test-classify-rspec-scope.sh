#!/usr/bin/env bash
set -Eeuo pipefail

script="$(dirname "$0")/classify-rspec-scope.sh"

assert_scope() {
  local expected="$1"
  shift
  local actual
  actual="$(printf '%s\n' "$@" | bash "$script")"
  if [[ "$actual" != "$expected" ]]; then
    printf 'Esperado:\n%s\nObtido:\n%s\n' "$expected" "$actual" >&2
    exit 1
  fi
}

assert_scope $'scope=full\nspecs=' 'AB0-1-back/app/models/company.rb' 'AB0-1-back/spec/models/company_spec.rb'
assert_scope $'scope=changed\nspecs=spec/requests/admin_companies_edit_spec.rb ' 'AB0-1-back/spec/requests/admin_companies_edit_spec.rb'
assert_scope $'scope=changed\nspecs=spec/services/sales/import/contact_import_spec.rb ' 'AB0-1-back/spec/services/sales/import/contact_import_spec.rb'
assert_scope $'scope=changed\nspecs=spec/models/company_spec.rb spec/requests/admin_companies_edit_spec.rb ' 'AB0-1-back/spec/models/company_spec.rb' 'AB0-1-back/spec/requests/admin_companies_edit_spec.rb'
assert_scope $'scope=full\nspecs=' 'AB0-1-back/spec/support/auth_helpers.rb'
assert_scope $'scope=none\nspecs=' '.github/workflows/ci-web-backend.yml' 'AB0-1-front/app/page.tsx'

printf 'Todos os cenários de escopo RSpec passaram.\n'
