#!/usr/bin/env python3
"""Integration regression for manual docs-only GitHub Actions dispatch.

Uses a local bare Git origin, so no GitHub API or credentials are required.
Verifies that the entire branch is classified, never only the final commit.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent


def command(repo: Path, *args: str, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(args), cwd=repo, env=env, text=True, capture_output=True, check=False
    )


def checked(repo: Path, *args: str) -> str:
    result = command(repo, *args)
    if result.returncode != 0:
        raise AssertionError(f"Command failed: {args}\n{result.stdout}\n{result.stderr}")
    return result.stdout.strip()


class DocsDispatchDiffContract(unittest.TestCase):
    def test_manual_docs_only_uses_entire_branch_and_fails_closed_on_code(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ci-docs-manual-") as temporary:
            root = Path(temporary)
            repo = root / "repo"
            origin = root / "origin.git"
            repo.mkdir()
            checked(root, "git", "init", "--bare", str(origin))
            checked(repo, "git", "init", "-b", "main")
            checked(repo, "git", "config", "user.name", "CI Contract")
            checked(repo, "git", "config", "user.email", "ci-contract@example.invalid")
            checked(repo, "git", "remote", "add", "origin", str(origin))

            scripts_dir = repo / ".github" / "scripts"
            scripts_dir.mkdir(parents=True)
            for script in (
                "resolve-change-impact.sh",
                "validate-docs-pr.sh",
                "classify_change_impact.py",
                "validate_docs_pr.py",
            ):
                shutil.copy2(SCRIPTS / script, scripts_dir / script)

            docs = repo / "docs"
            docs.mkdir()
            (docs / "base.md").write_text("# Base\n", encoding="utf-8")
            checked(repo, "git", "add", ".")
            checked(repo, "git", "commit", "-m", "test fixture baseline")
            checked(repo, "git", "push", "-u", "origin", "main")
            checked(repo, "git", "checkout", "-b", "docs-only-fixture")

            def run_impact(suite: str) -> tuple[subprocess.CompletedProcess[str], str]:
                output = root / "github-output"
                output.write_text("", encoding="utf-8")
                env = os.environ.copy()
                env.update(
                    {
                        "GITHUB_EVENT_NAME": "workflow_dispatch",
                        "TEST_SUITE_INPUT": suite,
                        "GITHUB_SHA": checked(repo, "git", "rev-parse", "HEAD"),
                        "GITHUB_OUTPUT": str(output),
                        "RUNNER_TEMP": str(root),
                    }
                )
                env.pop("GITHUB_EVENT_PATH", None)
                env.pop("GITHUB_BASE_REF", None)
                result = command(repo, "bash", ".github/scripts/resolve-change-impact.sh", env=env)
                return result, output.read_text(encoding="utf-8")

            def run_validator() -> subprocess.CompletedProcess[str]:
                env = os.environ.copy()
                env.update(
                    {
                        "GITHUB_EVENT_NAME": "workflow_dispatch",
                        "TEST_SUITE_INPUT": "docs_only",
                        "GITHUB_SHA": checked(repo, "git", "rev-parse", "HEAD"),
                        "RUNNER_TEMP": str(root),
                    }
                )
                env.pop("GITHUB_EVENT_PATH", None)
                env.pop("GITHUB_BASE_REF", None)
                return command(repo, "bash", ".github/scripts/validate-docs-pr.sh", env=env)

            (docs / "new.md").write_text(
                "# Documentation\n\nSee [Base](./base.md).\n", encoding="utf-8"
            )
            checked(repo, "git", "add", ".")
            checked(repo, "git", "commit", "-m", "docs: documentation-only change")

            impact, outputs = run_impact("docs_only")
            self.assertEqual(impact.returncode, 0, impact.stdout + impact.stderr)
            self.assertIn("docs_only=true", outputs)
            validator = run_validator()
            self.assertEqual(validator.returncode, 0, validator.stdout + validator.stderr)

            full, full_outputs = run_impact("full")
            self.assertEqual(full.returncode, 0, full.stdout + full.stderr)
            self.assertIn("docs_only=false", full_outputs)

            sensitive = repo / "AB0-1-back" / "app" / "models"
            sensitive.mkdir(parents=True)
            (sensitive / "company.rb").write_text("# Change in backend\n", encoding="utf-8")
            checked(repo, "git", "add", ".")
            checked(repo, "git", "commit", "-m", "feat: backend change")

            # The LAST commit is docs-only, but the branch remains mixed-risk.
            (docs / "another.md").write_text("# Additional docs\n", encoding="utf-8")
            checked(repo, "git", "add", ".")
            checked(repo, "git", "commit", "-m", "docs: last commit is docs-only")

            impact, outputs = run_impact("docs_only")
            self.assertEqual(impact.returncode, 0, impact.stdout + impact.stderr)
            self.assertIn("docs_only=false", outputs)
            validator = run_validator()
            self.assertNotEqual(validator.returncode, 0)
            self.assertIn("DISALLOWED_FILE_IN_DOCS_PR", validator.stderr)


if __name__ == "__main__":
    unittest.main()
