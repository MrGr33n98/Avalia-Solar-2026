#!/usr/bin/env bash
# CI/CD gate: fail closed for backend releases. A frontend-only release may
# proceed when the pre-existing full RSpec debt is the ONLY failing CI job.
set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${RELEASE_SHA:?RELEASE_SHA is required}"

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
    exit 0
  fi

  if [ "$conclusion" != "failure" ]; then
    echo "::error::CI terminou com $conclusion. Deploy bloqueado."
    exit 1
  fi

  run_id="$(jq -r '.id' <<< "$run")"
  jobs="$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$run_id/jobs?per_page=100")" || {
    echo "::error::Sem evidência dos jobs do CI; deploy bloqueado."
    exit 1
  }

  # Strict allowlist: all other CI jobs MUST pass. E2E is skipped today because
  # its needs includes backend-tests; do not silently accept additional skips.
  if ! jq -e '
    (.jobs | length > 0 and length < 100)
    and ([.jobs[] | select(.name == "Backend Unit Tests (RSpec)" and .conclusion == "failure")] | length == 1)
    and ([.jobs[] | select(.name == "Code Quality & Security Scan" and .conclusion == "success")] | length == 1)
    and ([.jobs[] | select(.name == "Ranking Performance Frontend Contract" and .conclusion == "success")] | length == 1)
    and ([.jobs[] | select(.name == "Ranking Performance Contract" and .conclusion == "success")] | length == 1)
    and ([.jobs[] | select(.name == "Category Discovery & SEO Contract Gate" and .conclusion == "success")] | length == 1)
    and ([.jobs[] | select(.name == "E2E Playwright Tests" and .conclusion == "skipped")] | length == 1)
    and ([.jobs[] | select(.conclusion == "failure" and .name != "Backend Unit Tests (RSpec)")] | length == 0)
    and ([.jobs[] | select(.conclusion == "skipped" and .name != "E2E Playwright Tests")] | length == 0)
    and ([.jobs[] | select(.status != "completed")] | length == 0)
  ' <<< "$jobs" >/dev/null; then
    echo "::error::CI possui falhas adicionais ou gates obrigatórios ausentes. Deploy bloqueado."
    exit 1
  fi

  # Compare against the most recent successful production release, NOT HEAD^.
  # The whole deployment delta must be frontend/workflow-only, including any
  # commits that were previously blocked from production.
  previous_runs="$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/cd-production.yml/runs?branch=main&per_page=100")" || exit 1
  previous_sha="$(jq -r --arg sha "$RELEASE_SHA" '
    [.workflow_runs[]
      | select(.head_sha != $sha and .head_branch == "main"
          and .event == "push" and .conclusion == "success")]
    | sort_by(.created_at) | last | .head_sha // empty
  ' <<< "$previous_runs")"

  if [ -z "$previous_sha" ]; then
    echo "::error::Sem release anterior bem-sucedida. CI integral obrigatório."
    exit 1
  fi

  previous_ci_runs="$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/ci-web-backend.yml/runs?branch=main&per_page=100")" || exit 1
  if ! jq -e --arg sha "$previous_sha" '
    [.workflow_runs[] | select(.head_sha == $sha and .event == "push" and .conclusion == "failure")]
    | length > 0
  ' <<< "$previous_ci_runs" >/dev/null; then
    echo "::error::Falha RSpec não confirmada na release anterior; deploy bloqueado."
    exit 1
  fi

  comparison="$(gh api "repos/$GITHUB_REPOSITORY/compare/$previous_sha...$RELEASE_SHA")" || exit 1
  if ! jq -e '
    (.status == "ahead")
    and (.ahead_by > 0)
    and (.files | length > 0 and length < 300)
    and ([.files[].filename | select(
      (startswith("AB0-1-front/")
       or . == ".github/workflows/ci-web-backend.yml"
       or . == ".github/workflows/cd-production.yml"
       or . == ".github/scripts/verify-release-ci.sh"
       or . == ".github/scripts/test-verify-release-ci.sh") | not
    )] | length == 0)
    and ([.files[].filename | select(startswith("AB0-1-front/"))] | length > 0)
  ' <<< "$comparison" >/dev/null; then
    echo "::error::Delta contém alterações fora do frontend/CI. CI integral obrigatório."
    exit 1
  fi

  echo "::warning::CI mantém falhas RSpec preexistentes. Exceção restrita: diff frontend/CI desde $previous_sha; demais gates verdes."
  echo "Detalhes: CI run $run_id; testes E2E permanecem bloqueados pelo RSpec legado."
  exit 0
done

echo "::error::CI não concluiu no prazo. Deploy bloqueado."
exit 1
