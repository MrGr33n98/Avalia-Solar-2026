#!/usr/bin/env bash
set -euo pipefail
# Read-only local preflight. No env dumps, no credentials, no network or branch writes.
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
printf 'HEAD: '; git rev-parse HEAD
printf 'Branch: '; git branch --show-current
printf 'Worktree changes (inspect locally):
'; git status --short
printf 'Worktrees:
'; git worktree list
printf 'Runtime:
'; node -v; npm -v
for f in packages/mcp-ui/package.json packages/mcp-ui/scripts/build.mjs packages/mcp-ui/src/design/tokens.css AB0-1-front/components.json; do
  if [[ ! -f "$f" ]]; then printf 'MISSING: %s
' "$f" >&2; exit 1; fi
done
if [[ -d specs/021-agent-native-ui-registry ]]; then printf 'Spec dir exists: review before copying.
'; fi
if [[ -d specs/020-agent-intelligence-evidence-infra ]]; then printf 'Spec 020 exists: preserve and reconcile.
'; fi
node -e 'const p=require("./packages/mcp-ui/package.json"); console.log(JSON.stringify({name:p.name,dependencies:p.dependencies,scripts:p.scripts},null,2))'
printf 'Preflight only; follow SETUP.md. No build or deploy performed.
'
