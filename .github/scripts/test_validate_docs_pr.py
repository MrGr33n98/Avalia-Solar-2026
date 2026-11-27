#!/usr/bin/env python3
"""Unit tests for validate_docs_pr.py."""
import os
import shutil
import tempfile
import unittest
from pathlib import Path

import validate_docs_pr as vdp


class TestValidateDocsPr(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.root = Path(self.temp_dir)

    def tearDown(self):
        shutil.rmtree(self.temp_dir)

    def test_is_allowed_doc_path(self):
        # Allowed
        self.assertTrue(vdp.is_allowed_doc_path("docs/guides/setup.md"))
        self.assertTrue(vdp.is_allowed_doc_path("docs/images/arch.png"))
        self.assertTrue(vdp.is_allowed_doc_path("docs/architecture/flow.svg"))
        self.assertTrue(vdp.is_allowed_doc_path("README.md"))
        self.assertTrue(vdp.is_allowed_doc_path("CHANGELOG.md"))
        self.assertTrue(vdp.is_allowed_doc_path("CONTRIBUTING.md"))
        self.assertTrue(vdp.is_allowed_doc_path("AGENTS.md"))

        # Disallowed
        self.assertFalse(vdp.is_allowed_doc_path("docs/run.sh"))
        self.assertFalse(vdp.is_allowed_doc_path("docs/binary.exe"))
        self.assertFalse(vdp.is_allowed_doc_path("AB0-1-back/app/models/company.rb"))
        self.assertFalse(vdp.is_allowed_doc_path("AB0-1-front/components/Card.tsx"))
        self.assertFalse(vdp.is_allowed_doc_path(".github/workflows/ci.yml"))
        self.assertFalse(vdp.is_allowed_doc_path("infra/nginx/nginx.conf"))
        self.assertFalse(vdp.is_allowed_doc_path("docker-compose.yml"))
        self.assertFalse(vdp.is_allowed_doc_path(".gitignore"))

    def test_specs_markdown_is_allowed_but_not_other_spec_files(self):
        # Specs de produto são documentação: somente Markdown é aceito.
        self.assertTrue(vdp.is_allowed_doc_path("specs/027-feature/README.md"))
        self.assertTrue(vdp.is_allowed_doc_path("specs/027-feature/evidence/report.md"))
        self.assertFalse(vdp.is_allowed_doc_path("specs/022-feature/scripts/lab.mjs"))
        self.assertFalse(vdp.is_allowed_doc_path("specs/022-feature/tasks.csv"))
        self.assertFalse(vdp.is_allowed_doc_path("specs/022-feature/evidence/trace.json"))

    def test_valid_markdown_file(self):
        target_doc = self.root / "docs" / "target.md"
        target_doc.parent.mkdir(parents=True)
        target_doc.write_text("# Target\nContent", encoding="utf-8")

        test_doc = self.root / "docs" / "test.md"
        test_doc.write_text(
            "# Title\n\nSee [Target](./target.md) and [External](https://avaliasolar.com.br)\n\n"
            "```ruby\nputs 'hello'\n```\n",
            encoding="utf-8"
        )

        errors = vdp.validate_markdown_file(self.root, test_doc)
        self.assertEqual(errors, [])

    def test_unbalanced_code_fence(self):
        test_doc = self.root / "docs" / "broken_fence.md"
        test_doc.parent.mkdir(parents=True, exist_ok=True)
        test_doc.write_text("# Title\n\n```ruby\nputs 'unclosed'\n", encoding="utf-8")

        errors = vdp.validate_markdown_file(self.root, test_doc)
        self.assertTrue(any("UNBALANCED_CODE_FENCE" in err for err in errors))

    def test_broken_internal_link(self):
        test_doc = self.root / "docs" / "broken_link.md"
        test_doc.parent.mkdir(parents=True, exist_ok=True)
        test_doc.write_text("# Title\n\nSee [Missing](./nonexistent_file.md)\n", encoding="utf-8")

        errors = vdp.validate_markdown_file(self.root, test_doc)
        self.assertTrue(any("BROKEN_INTERNAL_LINK" in err for err in errors))

    def test_validate_docs_pr_all_valid(self):
        (self.root / "docs").mkdir(parents=True)
        for i in range(1, 5):
            f = self.root / "docs" / f"doc_{i}.md"
            f.write_text(f"# Doc {i}\nContent {i}\n", encoding="utf-8")

        files = [f"docs/doc_{i}.md" for i in range(1, 5)]
        is_valid, errors = vdp.validate_docs_pr(self.root, files)
        self.assertTrue(is_valid)
        self.assertEqual(errors, [])

    def test_validate_docs_pr_mixed_with_code_fails(self):
        (self.root / "docs").mkdir(parents=True)
        doc = self.root / "docs" / "doc.md"
        doc.write_text("# Doc\n", encoding="utf-8")

        files = ["docs/doc.md", "AB0-1-back/app/models/company.rb"]
        is_valid, errors = vdp.validate_docs_pr(self.root, files)
        self.assertFalse(is_valid)
        self.assertTrue(any("DISALLOWED_FILE_IN_DOCS_PR" in err for err in errors))


if __name__ == "__main__":
    unittest.main()
