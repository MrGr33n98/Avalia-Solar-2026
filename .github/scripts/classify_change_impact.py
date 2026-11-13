#!/usr/bin/env python3
"""Conservative, deterministic change-impact classifier (no network, no credentials).

This module produces ADVISORY output only. Production release scope continues to
be derived independently by verify-release-ci.sh.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import PurePosixPath
from typing import Iterable

SCHEMA_VERSION = "1.0"
POLICY_VERSION = "2026-q4-shadow-1"
MAX_CHANGES = 500
VALID_SHA = re.compile(r"^[a-f0-9]{40}$")
FRONT_ROOT = "AB0-1-front/"
BACK_ROOT = "AB0-1-back/"
SENSITIVE_FRONT = (
    "/auth/", "/login", "/logout", "/register", "/signup", "/claim",
    "/checkout", "/payment", "/billing", "/pricing", "/invite",
    "/password", "/session", "/whatsapp", "/lead", "/onboarding",
    "authcontext", "authmodal", "signupgate", "post-auth", "middleware",
)
FRONT_SHARED = (
    "package.json", "package-lock.json", "next.config.js", "next.config.mjs",
    "next.config.ts", "tsconfig.json", "jest.config.js", "jest.config.ts",
    "playwright.config.ts", "tailwind.config.js", "tailwind.config.ts",
    "postcss.config.js", ".env.example", "middleware.ts",
)
HIGH_RISK_BACK = (
    "db/", "config/", "app/models/", "app/policies/", "app/jobs/",
    "app/middleware/", "app/channels/", "app/services/auth",
    "app/services/billing", "app/services/company_claims/",
    "app/services/security", "app/controllers/concerns/",
)
RISK_ORDER = {"low": 0, "medium": 1, "high": 2}


@dataclass(frozen=True)
class Change:
    status: str
    path: str
    old_path: str | None = None


def clean_path(value: str) -> str:
    """Require a normalized, repo-relative path; fail-closed on suspicious input."""
    if not value or "\x00" in value or "\\" in value:
        raise ValueError("INVALID_PATH")
    if value.startswith("/") or value.startswith("-") or value.startswith("./"):
        raise ValueError("INVALID_PATH")
    if "//" in value or any(part in ("", ".", "..") for part in value.split("/")):
        raise ValueError("INVALID_PATH")
    if len(value) > 4096 or "\n" in value or "\r" in value:
        raise ValueError("INVALID_PATH")
    return value


def parse_name_status(data: bytes, nul: bool = True) -> list[Change]:
    """Parse git diff --name-status -z, including rename and copy source paths."""
    changes: list[Change] = []
    if nul:
        if not data:
            return changes
        if not data.endswith(b"\x00"):
            raise ValueError("TRUNCATED_DIFF")
        tokens = data[:-1].split(b"\x00")
        i = 0
        while i < len(tokens):
            status = tokens[i].decode("ascii", "strict")
            i += 1
            if not re.fullmatch(r"[ACDMRTUXB][0-9]*", status):
                raise ValueError("UNKNOWN_GIT_STATUS")
            is_pair = status.startswith(("R", "C"))
            required = 2 if is_pair else 1
            if i + required > len(tokens):
                raise ValueError("TRUNCATED_DIFF")
            values = [clean_path(tokens[i + n].decode("utf-8", "strict")) for n in range(required)]
            i += required
            changes.append(Change(status=status, path=values[-1], old_path=values[0] if is_pair else None))
    else:
        for line in data.decode("utf-8", "strict").splitlines():
            if not line.strip():
                continue
            fields = line.split("\t")
            if not re.fullmatch(r"[ACDMRTUXB][0-9]*", fields[0]):
                raise ValueError("UNKNOWN_GIT_STATUS")
            if len(fields) != (3 if fields[0].startswith(("R", "C")) else 2):
                raise ValueError("INVALID_DIFF_RECORD")
            changes.append(Change(fields[0], clean_path(fields[-1]), clean_path(fields[1]) if len(fields) == 3 else None))
    if len(changes) > MAX_CHANGES:
        raise ValueError("DIFF_TOO_LARGE")
    return changes


def classify_path(path: str) -> str:
    name = clean_path(path)
    lower = name.lower()
    if lower.startswith(".github/") or lower.startswith("infra/") or lower.startswith("dockerfile"):
        return "ci_infra"
    if lower in (".ruby-version", "gemfile", "gemfile.lock") or lower.startswith("bin/"):
        return "ci_infra"
    # Documentation scripts and configuration are *not* necessarily inert.
    if lower.startswith("docs/"):
        return "docs_only" if lower.endswith((".md", ".mdx", ".txt", ".png", ".svg", ".jpg", ".jpeg", ".webp", ".pdf")) else "unknown"
    if lower in ("readme.md", "contributing.md", "license", "changelog.md") or (lower.endswith(".md") and not lower.startswith((FRONT_ROOT.lower(), BACK_ROOT.lower(), ".github/"))):
        return "docs_only"
    if name.startswith(FRONT_ROOT):
        rel = name[len(FRONT_ROOT):]
        rlow = rel.lower()
        if rlow in FRONT_SHARED or rlow.startswith(("lib/", "contexts/", "hooks/", "providers/", "config/", "types/")):
            return "frontend_shared"
        if any(fragment in "/" + rlow for fragment in SENSITIVE_FRONT):
            return "frontend_sensitive"
        # Global CSS reaches unrelated routes; never treat it as isolated visual work.
        if rlow.startswith("styles/") or rlow in ("app/globals.css", "pages/_app.css") or (rlow.endswith(".css") and not rlow.endswith(".module.css")):
            return "frontend_shared"
        if rlow.startswith(("components/", "app/", "pages/", "public/", "__tests__/", "tests/")):
            if rlow.endswith((".css", ".scss", ".sass", ".less")):
                return "frontend_style"
            return "frontend_component"
        if rlow.startswith(("styles/", "assets/")) or rlow.endswith((".css", ".scss", ".sass", ".less")):
            return "frontend_style"
        return "unknown"
    if name.startswith(BACK_ROOT):
        rel = name[len(BACK_ROOT):]
        rlow = rel.lower()
        if rlow.startswith("spec/"):
            return "backend_spec"
        if rlow.startswith(HIGH_RISK_BACK) or rlow in ("gemfile", "gemfile.lock", "rakefile"):
            return "backend_critical"
        if rlow.startswith(("app/admin/", "app/views/admin/", "app/helpers/admin/")):
            return "backend_admin"
        if rlow.startswith(("app/", "lib/", "script/", "test/")):
            return "backend_api"
        return "unknown"
    return "unknown"


def fallback(reason: str = "DIFF_UNAVAILABLE", *, base_sha: str | None = None, head_sha: str | None = None) -> dict:
    return make_plan([], base_sha=base_sha, head_sha=head_sha, forced_reason=reason)


def make_plan(changes: Iterable[Change], *, base_sha: str | None = None, head_sha: str | None = None, forced_reason: str | None = None) -> dict:
    items = list(changes)
    if (base_sha is not None and not VALID_SHA.fullmatch(base_sha)) or (head_sha is not None and not VALID_SHA.fullmatch(head_sha)):
        forced_reason = "INVALID_COMMIT_SHA"
        base_sha = base_sha if base_sha and VALID_SHA.fullmatch(base_sha) else None
        head_sha = head_sha if head_sha and VALID_SHA.fullmatch(head_sha) else None
    areas: set[str] = set()
    reasons: set[str] = set()
    if forced_reason:
        areas.add("unknown")
        reasons.add(forced_reason)
    elif not items:
        areas.add("unknown")
        reasons.add("EMPTY_DIFF")
    elif len(items) > MAX_CHANGES:
        areas.add("unknown")
        reasons.add("DIFF_TOO_LARGE")
    else:
        for item in items:
            paths = [item.path] + ([item.old_path] if item.old_path else [])
            if item.status.startswith(("R", "C")):
                reasons.add("RENAMED_OR_COPIED_PATH")
                areas.add("unknown")  # Safest until rename dependency coverage is proven.
            if item.status.startswith(("D", "T", "U", "X", "B")):
                reasons.add("DELETED_OR_UNMERGED_FILE")
                areas.add("unknown")  # Deletions can invalidate test ownership mappings.
            for path in paths:
                try:
                    areas.add(classify_path(path))
                except ValueError:
                    areas.add("unknown")
                    reasons.add("INVALID_PATH")
    if "unknown" in areas:
        reasons.add("UNKNOWN_PATH_FAIL_CLOSED")
    if "ci_infra" in areas:
        reasons.add("CI_OR_INFRA_CHANGE")
    if "backend_critical" in areas:
        reasons.add("BACKEND_CRITICAL_CHANGE")
    if "frontend_sensitive" in areas:
        reasons.add("SENSITIVE_USER_JOURNEY")
    if "frontend_style" in areas and len(areas) == 1:
        reasons.add("FRONTEND_STYLES_ONLY")
    if len(areas) > 1:
        reasons.add("MIXED_SCOPE_UNION")
    high = bool(areas & {"unknown", "ci_infra", "backend_critical", "frontend_sensitive", "frontend_shared"})
    medium = bool(areas & {"backend_admin", "backend_api", "backend_spec", "frontend_component"})
    risk = "high" if high else "medium" if medium else "low"
    backend = bool(areas & {"backend_admin", "backend_api", "backend_critical", "backend_spec", "ci_infra", "unknown"})
    frontend = bool(areas & {"frontend_style", "frontend_component", "frontend_shared", "frontend_sensitive", "ci_infra", "unknown"})
    docs_only = areas == {"docs_only"}
    if docs_only:
        release = "none"
    elif backend:
        release = "full"
    elif frontend:
        release = "frontend_only"
    else:
        release = "full"
    rspec = "full" if areas & {"backend_admin", "backend_api", "backend_critical", "ci_infra", "unknown"} else "changed" if "backend_spec" in areas else "none"
    e2e = "critical" if high or backend else "affected" if frontend else "none"
    plan = {
        "schema_version": SCHEMA_VERSION,
        "policy_version": POLICY_VERSION,
        "base_sha": base_sha,
        "head_sha": head_sha,
        "risk": risk,
        "changed_areas": sorted(areas),
        "test_plan": {
            "lint": not docs_only,
            "typecheck": frontend,
            "frontend_unit": "affected" if frontend and not high else "critical" if frontend else "none",
            "backend_rspec": rspec,
            "critical_e2e": e2e,
            "security_baseline": True,
            "required_gate": "build",
        },
        "release_scope": release,
        "reason_codes": sorted(reasons),
        "fallback": "unknown" in areas,
        "advisory_only": True,
        "changed_files_count": len(items),
    }
    return plan


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--nul", action="store_true", help="read git --name-status -z bytes")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--fallback", metavar="REASON")
    parser.add_argument("--summary", metavar="PLAN_JSON", help="render a Markdown Actions job summary")
    args = parser.parse_args()
    if args.summary:
        with open(args.summary, encoding="utf-8") as fh:
            plan = json.load(fh)
        print("### Change Impact — Shadow Mode (advisory only)")
        print("")
        print("| Field | Decision |")
        print("| --- | --- |")
        for key in ("policy_version", "risk", "release_scope", "fallback", "changed_files_count"):
            print(f"| {key} | {plan[key]} |")
        print(f"| changed_areas | {', '.join(plan['changed_areas'])} |")
        print(f"| reason_codes | {', '.join(plan['reason_codes'])} |")
        print("")
        print("**No jobs are skipped or added to the release gate based on this plan.**")
        return
    if args.fallback:
        result = fallback(args.fallback, base_sha=args.base, head_sha=args.head)
    else:
        try:
            changes = parse_name_status(sys.stdin.buffer.read(), nul=args.nul)
            result = make_plan(changes, base_sha=args.base, head_sha=args.head)
        except (ValueError, UnicodeError):
            result = fallback("DIFF_PARSE_ERROR", base_sha=args.base, head_sha=args.head)
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False, sort_keys=True)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
