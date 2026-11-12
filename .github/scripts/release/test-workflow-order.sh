#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
WORKFLOW="$ROOT/.github/workflows/cd-production.yml"
FRONTEND_WORKFLOW="$ROOT/.github/workflows/cd-frontend-production.yml"
BUILD_JOB="$(awk '/^  build-and-push:/{inside=1;next} inside && /^  [a-z0-9_-]+:/{exit} inside{print}' "$WORKFLOW")"
DEPLOY_JOB="$(sed -n '/^  deploy:/,$p' "$WORKFLOW")"
FRONTEND_BUILD="$(awk '/^  build-frontend:/{inside=1;next} inside && /^  [a-z0-9_-]+:/{exit} inside{print}' "$FRONTEND_WORKFLOW")"
FRONTEND_DEPLOY="$(sed -n '/^  deploy-frontend:/,$p' "$FRONTEND_WORKFLOW")"

grep -q '^  verify-release-ci:' "$WORKFLOW" \
  || { echo 'FAIL: preflight de CI ausente.' >&2; exit 1; }
grep -Eq '^    needs: \[verify-release-ci, zeitwerk-check, ranking-gate, ranking-frontend-gate\]' \
  <<< "$BUILD_JOB" \
  || { echo 'FAIL: publicação de imagens não depende dos gates.' >&2; exit 1; }
grep -q 'bash .github/scripts/verify-release-ci.sh' <<< "$DEPLOY_JOB" \
  || { echo 'FAIL: verificação de CI no deploy foi removida.' >&2; exit 1; }
grep -q '^      dry_run:' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: modo dry_run ausente.' >&2; exit 1; }
grep -q 'default: true' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: dry_run não é seguro por padrão.' >&2; exit 1; }
grep -q 'action: "build_candidate_and_compare_digest"' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: dry_run não explica que precisa comparar digest do candidato.' >&2; exit 1; }
grep -q 'ssh-readonly.sh' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: inspeção SSH read-only ausente.' >&2; exit 1; }
grep -q 'validate-evidence.sh validate-runtime' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: evidência runtime não é reconciliada no workflow.' >&2; exit 1; }
grep -q 'RELEASE_BASE_SHA:' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: escopo não usa SHA observado do frontend.' >&2; exit 1; }
grep -Eq '^    needs: \[verify-release-scope, inspect-runtime, verify-frontend-backend-compatibility\]$' <<< "$FRONTEND_BUILD" \
  || { echo 'FAIL: imagem frontend pode ser publicada antes do CI/scope gate.' >&2; exit 1; }
grep -q '^  verify-frontend-backend-compatibility:' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: gate de compatibilidade frontend/backend ausente.' >&2; exit 1; }
grep -q 'npx playwright test' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: compatibilidade real não executa Playwright.' >&2; exit 1; }
grep -q 'validate-frontend-scope.sh' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: escopo não reconcilia bases independentes dos componentes.' >&2; exit 1; }
grep -q 'steps.publish.outputs.digest' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: digest do build não é propagado.' >&2; exit 1; }
grep -Eq 'docker compose up -d --no-deps --no-build frontend' <<< "$FRONTEND_DEPLOY" \
  || { echo 'FAIL: deploy frontend não está isolado por serviço.' >&2; exit 1; }
grep -Eq '^    needs: \[verify-release-scope, inspect-runtime, verify-frontend-backend-compatibility, build-frontend\]' <<< "$FRONTEND_DEPLOY" \
  || { echo 'FAIL: deploy não depende de CI, runtime, compatibilidade e imagem.' >&2; exit 1; }
grep -q 'frontend-rollback.env' <<< "$FRONTEND_DEPLOY" \
  || { echo 'FAIL: rollback frontend ausente.' >&2; exit 1; }
grep -q 'FRONTEND_IMAGE' <<< "$FRONTEND_DEPLOY" \
  || { echo 'FAIL: deploy não usa a referência OCI imutável.' >&2; exit 1; }
grep -Fq 'CURRENT_FRONTEND_DIGEST" = "$FRONTEND_IMAGE' <<< "$FRONTEND_DEPLOY" \
  || { echo 'FAIL: deploy não é no-op quando o digest ativo já é o desejado.' >&2; exit 1; }
grep -q 'NO_OP: frontend já executa digest solicitado.' <<< "$FRONTEND_DEPLOY" \
  || { echo 'FAIL: deploy idempotente não registra NO_OP após comparar digest.' >&2; exit 1; }
grep -q 'sha256:\[0-9a-f\]{64}' <<< "$FRONTEND_DEPLOY" \
  || { echo 'FAIL: referência OCI não valida um único prefixo sha256.' >&2; exit 1; }
if grep -Fq '@sha256:${FRONTEND_DIGEST}' <<< "$FRONTEND_DEPLOY"; then
  echo 'FAIL: deploy concatena outro sha256 ao digest já prefixado.' >&2
  exit 1
fi
grep -q 'Image ID ativo não corresponde' <<< "$FRONTEND_DEPLOY" \
  || { echo 'FAIL: Image ID ativo não é verificado.' >&2; exit 1; }
grep -q 'org.opencontainers.image.revision' <<< "$FRONTEND_DEPLOY" \
  || { echo 'FAIL: origem OCI da imagem frontend não é verificada.' >&2; exit 1; }
grep -A4 'if ! wait_for_frontend; then' <<< "$FRONTEND_DEPLOY" | grep -q 'rollback_frontend' \
  || { echo 'FAIL: falha de health check não restaura frontend anterior.' >&2; exit 1; }
grep -A15 'rollback_frontend() {' <<< "$FRONTEND_DEPLOY" \
  | grep -q 'PREVIOUS_IMAGE_ID' \
  || { echo 'FAIL: rollback não valida o Image ID frontend anterior.' >&2; exit 1; }
grep -q 'SSH_HOST_FINGERPRINT' "$FRONTEND_WORKFLOW" \
  || { echo 'FAIL: conexão SSH não valida fingerprint.' >&2; exit 1; }
grep -Fq "'.github/workflows/ci-web-backend.yml'" "$WORKFLOW" \
  || { echo 'FAIL: mudança exclusiva de CI pode disparar deploy full.' >&2; exit 1; }
grep -Fq "'.github/scripts/release/**'" "$WORKFLOW" \
  || { echo 'FAIL: mudança exclusiva de script de release pode disparar deploy full.' >&2; exit 1; }
grep -q 'org.opencontainers.image.revision=${{ env.RELEASE_SHA }}' "$WORKFLOW" \
  || { echo 'FAIL: imagens full futuras não recebem OCI revision.' >&2; exit 1; }
if grep -Eq 'db:migrate|docker compose up .* (backend|worker|db|redis|waha)' <<< "$FRONTEND_DEPLOY"; then
  echo 'FAIL: fluxo frontend contém migration ou atualização de outro serviço.' >&2
  exit 1
fi

echo 'PASS: CI/gates precedem publicação; deploy frontend isolado, sem migration, com rollback.'
