#!/usr/bin/env bash
set -euo pipefail
root=$(git rev-parse --show-toplevel)
printf 'HEAD: '; git -C "$root" rev-parse HEAD
printf '\nWorktrees:\n'; git -C "$root" worktree list
printf '\nStatus:\n'; git -C "$root" status --short
printf '\nExisting specs:\n'; find "$root/specs" -maxdepth 1 -type d | sort
printf '\nToolchain:\n'; node --version; npm --version
printf '\nFrontend dependencies (declared):\n'; node -e 'const p=require(process.argv[1]); console.log(JSON.stringify({next:p.dependencies.next,react:p.dependencies.react,tailwind:p.dependencies.tailwindcss,recharts:p.dependencies.recharts,scripts:Object.keys(p.scripts)},null,2))' "$root/AB0-1-front/package.json"
printf '\nRead-only preflight done. No install or deploy.\n'
