#!/usr/bin/env python3
"""Validate documentation-only pull requests.

Ensures:
1. All changed files are strictly non-executable documentation assets.
2. Markdown files are valid UTF-8 and have balanced code fences.
3. Internal relative links point to existing files in the repository.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

ALLOWED_DOC_EXTENSIONS = {
    ".md", ".mdx", ".txt", ".png", ".svg", ".jpg", ".jpeg", ".webp", ".pdf"
}

ALLOWED_ROOT_FILES = {
    "readme.md", "contributing.md", "changelog.md", "license", "notice",
    "agents.md", "architecture.md", "security.md"
}

MARKDOWN_LINK_PATTERN = re.compile(
    r'(?<!\!)\[.*?\]\((?!https?://|mailto:|#|conversation://|sidecar://)([^)\s]+)\)'
)


def is_allowed_doc_path(path_str: str) -> bool:
    """Verify that a path is strictly inside allowed documentation zones."""
    norm = path_str.replace("\\", "/").strip().lstrip("./")
    lower = norm.lower()

    # Disallow paths in executable/application/workflow trees
    if lower.startswith((
        "ab0-1-front/", "ab0-1-back/", "ab0-1-mobile/", ".github/",
        "infra/", "scripts/", "hermes-agent/", "videos/"
    )):
        return False

    # Disallow root executable/config files
    if lower in ("dockerfile", "docker-compose.yml", "gemfile", "package.json", ".gitignore"):
        return False

    # docs/ directory
    if lower.startswith("docs/"):
        ext = os.path.splitext(lower)[1]
        return ext in ALLOWED_DOC_EXTENSIONS

    # specs/ directory: product specs are documentation, Markdown only
    if lower.startswith("specs/"):
        return lower.endswith(".md")

    # Root markdown or doc files
    if "/" not in lower:
        if lower in ALLOWED_ROOT_FILES or lower.endswith(".md"):
            return True

    return False


def validate_markdown_file(repo_root: Path, file_path: Path) -> list[str]:
    """Validate a single markdown file for syntax integrity and internal links."""
    errors: list[str] = []

    try:
        content = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        return [f"INVALID_ENCODING: {file_path} is not valid UTF-8: {exc}"]
    except Exception as exc:
        return [f"READ_ERROR: Could not read {file_path}: {exc}"]

    # 1. Balanced code fences check (``` or ~~~)
    lines = content.splitlines()
    fence_stack: list[str] = []
    for line_num, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fence = stripped[:3]
            # If closing matching fence
            if fence_stack and fence_stack[-1] == fence:
                fence_stack.pop()
            else:
                fence_stack.append(fence)

    if fence_stack:
        errors.append(f"UNBALANCED_CODE_FENCE: {file_path} has unclosed code fence {fence_stack[-1]}")

    # 2. Internal relative link verification
    parent_dir = file_path.parent
    for match in MARKDOWN_LINK_PATTERN.finditer(content):
        raw_target = match.group(1).split("#")[0].strip()
        if not raw_target:
            continue
        # Strip query parameters if present
        raw_target = raw_target.split("?")[0].strip()
        if not raw_target:
            continue

        # Handle file:/// absolute paths pointing to repo
        if raw_target.startswith("file://"):
            raw_target = raw_target[len("file://"):]
            target_path = Path(raw_target)
        elif raw_target.startswith("/"):
            target_path = (repo_root / raw_target.lstrip("/")).resolve()
        else:
            target_path = (parent_dir / raw_target).resolve()

        # Check existence on disk
        if not target_path.exists():
            # Tolerate template placeholders or wildcards
            if "<" in raw_target or ">" in raw_target or "*" in raw_target:
                continue
            errors.append(
                f"BROKEN_INTERNAL_LINK in {file_path.relative_to(repo_root)}: '{raw_target}' (target not found)"
            )

    return errors


def validate_docs_pr(repo_root: Path, changed_files: list[str]) -> tuple[bool, list[str]]:
    """Validate a full list of changed files in a PR."""
    errors: list[str] = []

    if not changed_files:
        return False, ["EMPTY_DIFF: No files provided for documentation validation"]

    for file_str in changed_files:
        clean = file_str.strip()
        if not clean:
            continue

        if not is_allowed_doc_path(clean):
            errors.append(f"DISALLOWED_FILE_IN_DOCS_PR: '{clean}' is not an allowed documentation file")
            continue

        full_path = (repo_root / clean).resolve()
        if not full_path.exists():
            errors.append(f"MISSING_FILE: '{clean}' does not exist on disk")
            continue

        if clean.lower().endswith((".md", ".mdx")):
            file_errors = validate_markdown_file(repo_root, full_path)
            errors.extend(file_errors)

    is_valid = len(errors) == 0
    return is_valid, errors


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate documentation PR files")
    parser.add_argument("--repo-root", default=".", help="Repository root path")
    parser.add_argument("files", nargs="*", help="List of changed files to validate")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    files = args.files

    if not files and not sys.stdin.isatty():
        files = [line.strip() for line in sys.stdin if line.strip()]

    is_valid, errors = validate_docs_pr(repo_root, files)

    if is_valid:
        print(f"Documentation validation PASSED: {len(files)} file(s) verified.")
        sys.exit(0)
    else:
        print("Documentation validation FAILED with the following errors:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
