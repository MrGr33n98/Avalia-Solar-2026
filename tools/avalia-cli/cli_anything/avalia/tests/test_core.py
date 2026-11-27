"""Unit and CLI contract tests for cli-anything-avalia (Phase 5)."""

from __future__ import annotations

import json
from typing import Any
from click.testing import CliRunner
import pytest

from cli_anything.avalia.avalia_cli import cli
from cli_anything.avalia.utils.avalia_backend import (
    AvaliaBackend,
    AvaliaValidationError,
    build_envelope,
    sql_literal,
    validate_reason,
)


def test_validate_reason_enforces_minimum_length() -> None:
    with pytest.raises(AvaliaValidationError):
        validate_reason("")
    with pytest.raises(AvaliaValidationError):
        validate_reason("abc")
    assert validate_reason("  Auditoria F0 validada  ") == "Auditoria F0 validada"


def test_sql_literal_escapes_strings_and_handles_types() -> None:
    assert sql_literal(None) == "NULL"
    assert sql_literal(True) == "TRUE"
    assert sql_literal(False) == "FALSE"
    assert sql_literal(42) == "42"
    assert sql_literal("O'Reilly") == "'O''Reilly'"


def test_build_envelope_structure() -> None:
    env = build_envelope("founder.briefing", "local", "R0", {"queues": {}}, dry_run=False, duration_ms=12)
    assert env["ok"] is True
    assert env["command"] == "founder.briefing"
    assert env["env"] == "local"
    assert env["risk_tier"] == "R0"
    assert env["dry_run"] is False
    assert env["meta"]["duration_ms"] == 12
    assert "timestamp" in env["meta"]


def test_founder_briefing_generates_recommendations() -> None:
    mock_payload = {
        "queues": {"pending_claims": 2, "pending_reviews": 5, "pending_changes": 0, "leads_last_24h": 3, "leads_total": 100},
        "companies": {"total": 585, "active": 580, "verified": 12, "with_paid_plan": 3},
        "plans_distribution": [],
    }
    backend = AvaliaBackend(env="local", runner=lambda _e, _s: json.dumps(mock_payload))
    res = backend.founder_briefing()
    assert res["queues"]["pending_claims"] == 2
    assert len(res["recommended_founder_actions"]) == 2


def test_billing_drift_audit_healthy_when_prices_distinct() -> None:
    mock_payload = {
        "plans": [
            {"id": 1, "name": "Free", "price": 0.0, "is_public": True, "stripe_price_id_monthly": None, "stripe_price_id_yearly": None},
            {"id": 2, "name": "Essential", "price": 590.0, "is_public": True, "stripe_price_id_monthly": "price_ess_6m", "stripe_price_id_yearly": "price_ess_12m"},
            {"id": 3, "name": "Pro", "price": 1500.0, "is_public": True, "stripe_price_id_monthly": "price_pro_6m", "stripe_price_id_yearly": "price_pro_12m"},
            {"id": 4, "name": "Legacy 6m", "price": 330.0, "is_public": False, "stripe_price_id_monthly": None, "stripe_price_id_yearly": None},
        ],
        "paid_companies_without_stripe_sub": [{"id": 372, "name": "WEG", "plan_id": 3, "plan_name": "Pro"}],
    }
    backend = AvaliaBackend(env="local", runner=lambda _e, _s: json.dumps(mock_payload))
    audit = backend.billing_drift_audit()
    assert audit["status"] == "healthy"
    assert audit["issues_count"] == 0
    assert audit["public_plans_count"] == 3


def test_billing_drift_audit_detects_identical_and_duplicate_prices() -> None:
    mock_payload = {
        "plans": [
            {"id": 2, "name": "Essential", "price": 590.0, "is_public": True, "stripe_price_id_monthly": "price_dup", "stripe_price_id_yearly": "price_dup"},
            {"id": 3, "name": "Pro", "price": 1500.0, "is_public": True, "stripe_price_id_monthly": "price_dup", "stripe_price_id_yearly": "price_pro_12m"},
        ],
        "paid_companies_without_stripe_sub": [],
    }
    backend = AvaliaBackend(env="local", runner=lambda _e, _s: json.dumps(mock_payload))
    audit = backend.billing_drift_audit()
    assert audit["status"] == "drift_detected"
    codes = {i["code"] for i in audit["issues"]}
    assert "IDENTICAL_6M_12M_PRICE_ID" in codes
    assert "DUPLICATE_STRIPE_PRICE_ACROSS_PLANS" in codes


def test_company_health_calculates_5_dimensions_and_actions() -> None:
    mock_company = {
        "id": 944,
        "name": "GoodWe Brasil",
        "city": "Florianópolis",
        "state": "SC",
        "verified": True,
        "description": "Fabricante global de inversores solares e armazenamento de energia fotovoltaica.",
        "website": "https://goodwe.com.br",
        "phone": "+5511999999999",
        "whatsapp": "+5511999999999",
        "email_public": "contato@goodwe.com.br",
        "cnpj": "12345678000199",
        "latitude": -27.59,
        "longitude": -48.54,
        "working_hours": "08h-18h",
        "cta_whatsapp_enabled": True,
        "ga4_property_id": None,
        "plan_id": 3,
        "plan_name": "Plano Pro",
        "reviews_count": 2,
        "rating_avg": 4.8,
        "categories_count": 3,
        "unreplied_reviews_count": 1,
        "has_logo": 1,
        "has_banner": 0,
    }
    backend = AvaliaBackend(env="local", runner=lambda _e, _s: json.dumps(mock_company))
    health = backend.company_health(944, with_actions=True)
    assert health["company_id"] == 944
    assert 60 <= health["score"] <= 95
    assert set(health["dimensions"].keys()) == {"profile", "reputation", "content", "discoverability", "integration"}
    action_ids = [a["id"] for a in health["next_best_actions"]]
    assert "reply_to_reviews" in action_ids
    assert "invite_reviews" in action_ids


def test_billing_grant_plan_dry_run_does_not_mutate() -> None:
    calls = []

    def fake_runner(_env: str, sql: str) -> str:
        calls.append(sql)
        return json.dumps({
            "company": {"id": 1137, "name": "Kaju Solar", "plan_id": 1, "plan_status": "active"},
            "target_plan": {"id": 3, "name": "Plano Pro", "price": 1500.0},
        })

    backend = AvaliaBackend(env="local", runner=fake_runner)
    res = backend.billing_grant_plan(1137, 3, reason="Piloto comercial Founder", dry_run=True)
    assert res["applied"] is False
    assert res["before"]["plan_id"] == 1
    assert res["after"]["plan_id"] == 3
    assert len(calls) == 1
    assert "UPDATE" not in calls[0]


def test_reputation_moderate_validates_action_and_reason() -> None:
    backend = AvaliaBackend(env="local", runner=lambda _e, _s: "{}")
    with pytest.raises(AvaliaValidationError):
        backend.reputation_moderate(10, "invalid_action", "Motivo válido", dry_run=True)
    with pytest.raises(AvaliaValidationError):
        backend.reputation_moderate(10, "approve", "curt", dry_run=True)


def test_cli_help_and_version() -> None:
    runner = CliRunner()
    res_help = runner.invoke(cli, ["--help"])
    assert res_help.exit_code == 0
    assert "founder" in res_help.output
    assert "billing" in res_help.output
    assert "company" in res_help.output

    res_ver = runner.invoke(cli, ["--version"])
    assert res_ver.exit_code == 0
    assert "0.1.0" in res_ver.output


def test_cli_json_validation_error_returns_exit_code_2() -> None:
    runner = CliRunner()
    res = runner.invoke(
        cli,
        ["--json", "billing", "grant-plan", "--company", "372", "--plan", "3", "--reason", "no"],
    )
    assert res.exit_code == 2
    payload: Any = json.loads(res.output)
    assert payload["ok"] is False
    assert payload["risk_tier"] == "R3"
    assert payload["data"]["error"] == "validation_error"


def test_category_list_detects_counter_cache_drift() -> None:
    mock_cats = [
        {"id": 70, "name": "Instaladores Solares", "seo_url": "instaladores-solares", "parent_id": None, "kind": "service", "status": "active", "featured": True, "cached_companies_count": 10, "actual_companies_count": 15, "primary_companies_count": 12, "has_seo_title": True},
        {"id": 71, "name": "Categoria Vazia", "seo_url": "vazia", "parent_id": 70, "kind": "service", "status": "active", "featured": False, "cached_companies_count": 0, "actual_companies_count": 0, "primary_companies_count": 0, "has_seo_title": False},
    ]
    backend = AvaliaBackend(env="local", runner=lambda _e, _s: json.dumps(mock_cats))
    res = backend.category_list(empty_only=False)
    assert res["count"] == 2
    assert res["counter_cache_drift_count"] == 1

    res_empty = backend.category_list(empty_only=True)
    assert res_empty["count"] == 1
    assert res_empty["categories"][0]["id"] == 71


def test_category_assign_dry_run_preview() -> None:
    mock_info = {
        "company": {"id": 372, "name": "WEG", "city": "Jaraguá do Sul", "state": "SC", "primary_category_id": None},
        "category": {"id": 70, "name": "Instaladores Solares", "seo_url": "instaladores-solares", "status": "active"},
        "already_linked": False,
    }
    backend = AvaliaBackend(env="local", runner=lambda _e, _s: json.dumps(mock_info))
    res = backend.category_assign(372, 70, reason="Categorização oficial de integrador", set_primary=True, dry_run=True)
    assert res["applied"] is False
    assert res["before"]["already_linked"] is False
    assert res["after"]["primary_category_id"] == 70


def test_curation_deactivate_duplicate_rejects_same_id() -> None:
    backend = AvaliaBackend(env="local", runner=lambda _e, _s: "{}")
    with pytest.raises(AvaliaValidationError):
        backend.curation_deactivate_duplicate(485, 485, reason="Duplicata Mococa", dry_run=True)


