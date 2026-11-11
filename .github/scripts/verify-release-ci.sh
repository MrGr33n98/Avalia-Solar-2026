#!/usr/bin/env bash
# CI/CD gate: backend releases fail closed. Frontend-only releases may
# tolerate legacy RSpec failures only when no backend code is published.
set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${RELEASE_SHA:?RELEASE_SHA is required}"

RELEASE_SCOPE="${RELEASE_SCOPE:-full}"
if [[ "$RELEASE_SCOPE" != "full" && "$RELEASE_SCOPE" != "frontend_only" ]]; then
  echo "::error::Escopo de release inválido: $RELEASE_SCOPE"
  exit 1
fi

CI_ENDPOINT="repos/$GITHUB_REPOSITORY/actions/workflows/ci-web-backend.yml/runs?head_sha=$RELEASE_SHA&event=push&per_page=20"
echo "Verificando CI do commit $RELEASE_SHA..."

for attempt in $(seq 1 90); do
  runs="$(gh api "$CI_ENDPOINT")" || {
    echo "::error::Não foi possível consultar o CI. Deploy bloqueado."
    exit 1
  }
  run="$(jq -c --arg sha "$RELEASE_SHA" '
    [.workflow_runs[] | select(.head_sha == $sha and .event == "push" and .head_branch == "main")]
    | sort_by(.run_number) | last // empty
  ' <<< "$runs")"

  if [ -z "$run" ]; then
    echo "CI ainda não iniciou (tentativa $attempt/90)."
    sleep 20
    continue
  fi

  status="$(jq -r '.status' <<< "$run")"
  conclusion="$(jq -r '.conclusion // ""' <<< "$run")"

  if [ "$status" != "completed" ]; then
    echo "CI em andamento: $status (tentativa $attempt/90)."
    sleep 20
    continue
  fi

  if [ "$conclusion" = "success" ]; then
    echo "CI integral aprovado para $RELEASE_SHA."
    if [ "$RELEASE_SCOPE" = "full" ]; then
      exit 0
    fi
  else
    if [ "$conclusion" != "failure" ]; then
      echo "::error::CI terminou com $conclusion. Deploy bloqueado."
      exit 1
    fi

    run_id="$(jq -r '.id' <<< "$run")"
    jobs="$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$run_id/jobs?per_page=100")" || {
      echo "::error::Sem evidência dos jobs do CI; deploy bloqueado."
      exit 1
    }

    # Só tolera RSpec legado; todos os outros jobs devem terminar em success,
    # exceto E2E, que depende do job de backend e deve estar skipped.
    if ! jq -e '
      (.jobs | length > 0 and length < 100)
      and ([.jobs[] | select(.name == "Backend Unit Tests (RSpec)" and .conclusion == "failure")] | length == 1)
      and ([.jobs[] | select(.name == "Code Quality & Security Scan" and .conclusion == "success")] | length == 1)
      and ([.jobs[] | select(.name == "Ranking Performance Frontend Contract" and .conclusion == "success")] | length == 1)
      and ([.jobs[] | select(.name == "Ranking Performance Contract" and .conclusion == "success")] | length == 1)
      and ([.jobs[] | select(.name == "Category Discovery & SEO Contract Gate" and .conclusion == "success")] | length == 1)
      and ([.jobs[] | select(.name == "E2E Playwright Tests" and .conclusion == "skipped")] | length == 1)
      and ([.jobs[] | select(
        .name != "Backend Unit Tests (RSpec)"
        and .name != "E2E Playwright Tests"
        and .conclusion != "success"
      )] | length == 0)
      and ([.jobs[] | select(.status != "completed")] | length == 0)
    ' <<< "$jobs" >/dev/null; then
      echo "::error::CI possui falhas adicionais ou gates obrigatórios ausentes. Deploy bloqueado."
      exit 1
    fi

    # A full release publishes backend artifacts and may run migrations.
    # Never authorize it through the frontend-only legacy RSpec exception.
    if [ "$RELEASE_SCOPE" = "full" ]; then
      echo "::error::CI integral falhou para release full; fallback legado permitido somente em frontend_only. Deploy bloqueado."
      exit 1
    fi
  fi

  # Compare against the most recent successful production release, NOT HEAD^.
  # The whole deployment delta must be frontend/workflow-only, including any
  # commits that were previously blocked from production.
  previous_runs_file="$(mktemp)"
  frontend_runs_file="$(mktemp)"
  trap 'rm -f "$previous_runs_file" "$frontend_runs_file"' EXIT

  gh api "repos/$GITHUB_REPOSITORY/actions/workflows/cd-production.yml/runs?branch=main&per_page=100" > "$previous_runs_file" || exit 1

  if [ "$RELEASE_SCOPE" = "frontend_only" ]; then
    gh api "repos/$GITHUB_REPOSITORY/actions/workflows/cd-frontend-production.yml/runs?branch=main&per_page=100" > "$frontend_runs_file" 2>/dev/null || echo '{"workflow_runs":[]}' > "$frontend_runs_file"
    previous_sha="$(jq -n -r --arg sha "$RELEASE_SHA" '
      [inputs.workflow_runs[]?
        | select(.head_sha != $sha and .head_branch == "main"
            and (.event == "push" or .event == "workflow_dispatch") and .conclusion == "success")]
      | sort_by(.created_at) | last | .head_sha // empty
    ' "$previous_runs_file" "$frontend_runs_file")"
  else
    previous_sha="$(jq -r --arg sha "$RELEASE_SHA" '
      [.workflow_runs[]?
        | select(.head_sha != $sha and .head_branch == "main"
            and .event == "push" and .conclusion == "success")]
      | sort_by(.created_at) | last | .head_sha // empty
    ' "$previous_runs_file")"
  fi

  if [ -z "$previous_sha" ]; then
    echo "::error::Sem release anterior bem-sucedida. CI integral obrigatório."
    exit 1
  fi

  if [ "$conclusion" = "failure" ]; then
    previous_ci_runs="$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/ci-web-backend.yml/runs?branch=main&per_page=100")" || exit 1
    previous_ci_run="$(jq -c --arg sha "$previous_sha" '
      [.workflow_runs[] | select(.head_sha == $sha and .event == "push")]
      | sort_by(.run_number) | last // empty
    ' <<< "$previous_ci_runs")"
    if [ -z "$previous_ci_run" ] || [ "$(jq -r '.conclusion' <<< "$previous_ci_run")" != "failure" ]; then
      echo "::error::Falha da release anterior não confirmada; deploy bloqueado."
      exit 1
    fi

    previous_ci_run_id="$(jq -r '.id' <<< "$previous_ci_run")"
    previous_ci_jobs="$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$previous_ci_run_id/jobs?per_page=100")" || exit 1
    if ! jq -e '
      [.jobs[] | select(.name == "Backend Unit Tests (RSpec)" and .conclusion == "failure")]
      | length == 1
    ' <<< "$previous_ci_jobs" >/dev/null; then
      echo "::error::Falha RSpec não confirmada na release anterior; deploy bloqueado."
      exit 1
    fi
  fi

  comparison="$(gh api "repos/$GITHUB_REPOSITORY/compare/$previous_sha...$RELEASE_SHA")" || exit 1
  if ! jq -e '
    (.status == "ahead")
    and (.ahead_by > 0)
    and (.files | length > 0 and length < 300)
    and ([.files[].filename | select(
      (startswith("AB0-1-front/")
       or . == ".gitignore"
       or . == ".github/workflows/ci-web-backend.yml"
       or . == ".github/workflows/cd-production.yml"
       or . == ".github/workflows/cd-frontend-production.yml"
       or . == ".github/scripts/verify-release-ci.sh"
       or . == ".github/scripts/test-verify-release-ci.sh") | not
    )] | length == 0)
    and ([.files[].filename | select(startswith("AB0-1-front/"))] | length > 0)
  ' <<< "$comparison" >/dev/null; then
    echo "::error::Delta fora do escopo permitido para $RELEASE_SCOPE. Deploy bloqueado."
    exit 1
  fi

  if [ "$conclusion" = "success" ]; then
    echo "Escopo frontend-only validado desde $previous_sha; nenhum serviço backend será publicado."
  else
    echo "::warning::CI mantém falhas RSpec legadas. Somente escopo frontend-only validado desde $previous_sha."
    echo "Detalhes: CI run $run_id; migrations não serão executadas neste fluxo."
  fi
  exit 0
done

echo "::error::CI não concluiu no prazo. Deploy bloqueado."
exit 1
