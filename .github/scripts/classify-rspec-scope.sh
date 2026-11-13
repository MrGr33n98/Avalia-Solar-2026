#!/usr/bin/env bash
set -Eeuo pipefail

full_suite=false
spec_files=()

while IFS= read -r path; do
  [[ -z "$path" ]] && continue

  case "$path" in
    AB0-1-back/script/prepare_e2e_user.rb)
      ;;
    AB0-1-back/config/initializers/rack_attack.rb)
      spec_files+=("spec/requests/rack_attack_spec.rb")
      ;;
    AB0-1-back/spec/*)
      case "$path" in
        AB0-1-back/spec/rails_helper.rb|AB0-1-back/spec/spec_helper.rb|AB0-1-back/spec/factories/*|AB0-1-back/spec/support/*)
          full_suite=true
          ;;
        AB0-1-back/spec/*_spec.rb)
          spec_files+=("${path#AB0-1-back/}")
          ;;
        *)
          full_suite=true
          ;;
      esac
      ;;
    AB0-1-back/*|Dockerfile.backend|infra/docker/Dockerfile.backend.test|Gemfile|Gemfile.lock|.ruby-version)
      full_suite=true
      ;;
  esac
done

if [[ "$full_suite" == true ]]; then
  printf 'scope=full\nspecs=\n'
elif ((${#spec_files[@]} > 0)); then
  printf 'scope=changed\nspecs='
  printf '%s ' "${spec_files[@]}"
  printf '\n'
else
  printf 'scope=none\nspecs=\n'
fi
