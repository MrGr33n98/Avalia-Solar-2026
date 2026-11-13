#!/usr/bin/env python3
"""Unit and contract cases for the advisory CI change-impact policy."""
import io
import json
import os
import subprocess
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
import classify_change_impact as ci

# path, expected area, expected advisory release, risk, RSpec policy
PATH_CASES = [
    ("docs/platform-engineering/ci-cd/README.md", "docs_only", "none", "low", "none"),
    ("README.md", "docs_only", "none", "low", "none"),
    ("CHANGELOG.md", "docs_only", "none", "low", "none"),
    ("docs/architecture/diagram.svg", "docs_only", "none", "low", "none"),
    ("docs/automation/run-deploy.sh", "unknown", "full", "high", "full"),
    ("AB0-1-front/app/globals.css", "frontend_shared", "frontend_only", "high", "none"),
    ("AB0-1-front/styles/mobile.css", "frontend_shared", "frontend_only", "high", "none"),
    ("AB0-1-front/components/cards/Card.module.css", "frontend_style", "frontend_only", "low", "none"),
    ("AB0-1-front/components/cards/Card.tsx", "frontend_component", "frontend_only", "medium", "none"),
    ("AB0-1-front/app/companies/[id]/page.tsx", "frontend_component", "frontend_only", "medium", "none"),
    ("AB0-1-front/app/categories/page.tsx", "frontend_component", "frontend_only", "medium", "none"),
    ("AB0-1-front/public/logo.svg", "frontend_component", "frontend_only", "medium", "none"),
    ("AB0-1-front/__tests__/companies/ClaimPageClient.spec.tsx", "frontend_sensitive", "frontend_only", "high", "none"),
    ("AB0-1-front/app/login/page.tsx", "frontend_sensitive", "frontend_only", "high", "none"),
    ("AB0-1-front/app/companies/[id]/claim/ClaimPageClient.tsx", "frontend_sensitive", "frontend_only", "high", "none"),
    ("AB0-1-front/app/(auth)/components/AuthModal.tsx", "frontend_sensitive", "frontend_only", "high", "none"),
    ("AB0-1-front/components/SignupGateModalHost.tsx", "frontend_sensitive", "frontend_only", "high", "none"),
    ("AB0-1-front/app/checkout/page.tsx", "frontend_sensitive", "frontend_only", "high", "none"),
    ("AB0-1-front/app/billing/plans/page.tsx", "frontend_sensitive", "frontend_only", "high", "none"),
    ("AB0-1-front/app/companies/[id]/claim/page.module.css", "frontend_sensitive", "frontend_only", "high", "none"),
    ("AB0-1-front/components/payments/paywall.css", "frontend_sensitive", "frontend_only", "high", "none"),
    ("AB0-1-front/lib/auth/post-auth-destination.ts", "frontend_shared", "frontend_only", "high", "none"),
    ("AB0-1-front/contexts/AuthContext.tsx", "frontend_shared", "frontend_only", "high", "none"),
    ("AB0-1-front/hooks/useUser.ts", "frontend_shared", "frontend_only", "high", "none"),
    ("AB0-1-front/package-lock.json", "frontend_shared", "frontend_only", "high", "none"),
    ("AB0-1-front/next.config.js", "frontend_shared", "frontend_only", "high", "none"),
    ("AB0-1-front/middleware.ts", "frontend_shared", "frontend_only", "high", "none"),
    ("AB0-1-back/spec/requests/admin_company_access_requests_spec.rb", "backend_spec", "full", "medium", "changed"),
    ("AB0-1-back/app/admin/company_access_requests.rb", "backend_admin", "full", "medium", "full"),
    ("AB0-1-back/app/admin/usuarios_acesso.rb", "backend_admin", "full", "medium", "full"),
    ("AB0-1-back/app/controllers/api/v1/company_access_requests_controller.rb", "backend_api", "full", "medium", "full"),
    ("AB0-1-back/app/services/ranking_service.rb", "backend_api", "full", "medium", "full"),
    ("AB0-1-back/app/models/company.rb", "backend_critical", "full", "high", "full"),
    ("AB0-1-back/app/policies/company_access_request_policy.rb", "backend_critical", "full", "high", "full"),
    ("AB0-1-back/app/services/company_claims/decide_request.rb", "backend_critical", "full", "high", "full"),
    ("AB0-1-back/db/migrate/20261113090000_add_claim_contact_fields.rb", "backend_critical", "full", "high", "full"),
    ("AB0-1-back/config/initializers/active_admin.rb", "backend_critical", "full", "high", "full"),
    ("AB0-1-back/Gemfile.lock", "backend_critical", "full", "high", "full"),
    (".github/workflows/ci-web-backend.yml", "ci_infra", "full", "high", "full"),
    (".github/scripts/verify-release-ci.sh", "ci_infra", "full", "high", "full"),
    ("infra/docker/docker-compose.test.yml", "ci_infra", "full", "high", "full"),
    ("Dockerfile.backend", "ci_infra", "full", "high", "full"),
    (".ruby-version", "ci_infra", "full", "high", "full"),
    ("some/new/future/runtime.ts", "unknown", "full", "high", "full"),
    ("AB0-1-front/random-unknown.top", "unknown", "full", "high", "full"),
    ("AB0-1-back/random-unknown.config", "unknown", "full", "high", "full"),
]


class PolicyContract(unittest.TestCase):
    def test_path_matrix(self):
        self.assertGreaterEqual(len(PATH_CASES), 35)
        for path, area, release, risk, rspec in PATH_CASES:
            with self.subTest(path=path):
                plan = ci.make_plan([ci.Change("M", path)])
                self.assertEqual(plan["changed_areas"], [area])
                self.assertEqual(plan["release_scope"], release)
                self.assertEqual(plan["risk"], risk)
                self.assertEqual(plan["test_plan"]["backend_rspec"], rspec)
                self.assertEqual(plan["fallback"], area == "unknown")
                self.assertTrue(plan["advisory_only"])
                self.assertEqual(plan["test_plan"]["required_gate"], "build")

    def test_mixed_frontend_backend_uses_union_and_full_release(self):
        plan = ci.make_plan([
            ci.Change("M", "AB0-1-front/app/globals.css"),
            ci.Change("M", "AB0-1-back/app/admin/usuarios_acesso.rb"),
        ])
        self.assertEqual(plan["changed_areas"], ["backend_admin", "frontend_style"])
        self.assertEqual(plan["release_scope"], "full")
        self.assertEqual(plan["test_plan"]["backend_rspec"], "full")
        self.assertTrue(plan["test_plan"]["typecheck"])
        self.assertIn("MIXED_SCOPE_UNION", plan["reason_codes"])

    def test_unknown_combined_with_safe_frontend_is_full(self):
        plan = ci.make_plan([ci.Change("M", "README.md"), ci.Change("A", "a/new/binary")])
        self.assertEqual(plan["release_scope"], "full")
        self.assertTrue(plan["fallback"])

    def test_empty_diff_falls_back(self):
        result = ci.make_plan([])
        self.assertTrue(result["fallback"])
        self.assertEqual(result["test_plan"]["backend_rspec"], "full")
        self.assertIn("EMPTY_DIFF", result["reason_codes"])

    def test_failed_external_diff_falls_back(self):
        result = ci.fallback("BASE_FETCH_FAILED")
        self.assertTrue(result["fallback"])
        self.assertEqual(result["release_scope"], "full")

    def test_sha_mismatch_forces_full(self):
        result = ci.make_plan([ci.Change("M", "AB0-1-front/app/globals.css")], head_sha="badsha")
        self.assertEqual(result["release_scope"], "full")
        self.assertIn("INVALID_COMMIT_SHA", result["reason_codes"])

    def test_valid_sha_roundtrip(self):
        result = ci.make_plan([ci.Change("M", "AB0-1-front/app/globals.css")], base_sha="a" * 40, head_sha="b" * 40)
        self.assertEqual(result["base_sha"], "a" * 40)
        self.assertEqual(result["head_sha"], "b" * 40)

    def test_rename_reads_both_ends(self):
        data = b"R099\x00AB0-1-front/components/Thing.tsx\x00AB0-1-back/app/models/company.rb\x00"
        plan = ci.make_plan(ci.parse_name_status(data))
        self.assertEqual(plan["release_scope"], "full")
        self.assertIn("RENAMED_OR_COPIED_PATH", plan["reason_codes"])

    def test_modified_nul_diff(self):
        changes = ci.parse_name_status(b"M\x00AB0-1-front/app/globals.css\x00")
        self.assertEqual(len(changes), 1)
        self.assertEqual(changes[0].path, "AB0-1-front/app/globals.css")

    def test_deleted_status(self):
        changes = ci.parse_name_status(b"D\x00AB0-1-back/db/schema.rb\x00")
        self.assertEqual(changes[0].status, "D")
        self.assertEqual(ci.make_plan(changes)["release_scope"], "full")

    def test_copy_status(self):
        changes = ci.parse_name_status(b"C100\x00docs/old.md\x00AB0-1-back/app/models/new.rb\x00")
        self.assertEqual(changes[0].old_path, "docs/old.md")
        self.assertEqual(ci.make_plan(changes)["release_scope"], "full")

    def test_tab_separated_diff(self):
        changes = ci.parse_name_status(b"M\tAB0-1-front/app/globals.css\n", nul=False)
        self.assertEqual(ci.make_plan(changes)["release_scope"], "frontend_only")

    def test_untrusted_absolute_path_rejected(self):
        with self.assertRaises(ValueError):
            ci.parse_name_status(b"M\x00/etc/passwd\x00")

    def test_path_traversal_rejected(self):
        with self.assertRaises(ValueError):
            ci.parse_name_status(b"M\x00docs/../config.yml\x00")

    def test_nul_missing_terminator_rejected(self):
        with self.assertRaises(ValueError):
            ci.parse_name_status(b"M\x00AB0-1-front/app/globals.css")

    def test_unrecognized_git_status_rejected(self):
        with self.assertRaises(ValueError):
            ci.parse_name_status(b"Z\x00AB0-1-front/app/globals.css\x00")

    def test_damaged_rename_is_rejected(self):
        with self.assertRaises(ValueError):
            ci.parse_name_status(b"R100\x00docs/old.md\x00")

    def test_diff_size_limit_fails_closed(self):
        data = b"".join(b"M\x00docs/m%d.md\x00" % i for i in range(ci.MAX_CHANGES + 1))
        with self.assertRaises(ValueError):
            ci.parse_name_status(data)

    def test_json_is_serializable_without_credentials(self):
        payload = json.dumps(ci.make_plan([ci.Change("M", "AB0-1-front/components/Card.tsx")]))
        self.assertNotIn("token", payload.lower())
        self.assertIn('"advisory_only": true', payload)


if __name__ == "__main__":
    unittest.main()
