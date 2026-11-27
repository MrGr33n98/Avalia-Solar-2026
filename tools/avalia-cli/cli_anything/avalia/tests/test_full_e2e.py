"""End-to-end subprocess and live local DB tests for cli-anything-avalia (Phase 5)."""

from __future__ import annotations

import json
import subprocess
import sys

import pytest


def test_subprocess_module_help() -> None:
    proc = subprocess.run(
        [sys.executable, "-m", "cli_anything.avalia", "--help"],
        capture_output=True,
        text=True,
        timeout=10,
        check=False,
    )
    assert proc.returncode == 0
    assert "Avalia Solar 2026" in proc.stdout


@pytest.mark.e2e
def test_e2e_local_founder_briefing_json() -> None:
    proc = subprocess.run(
        [sys.executable, "-m", "cli_anything.avalia", "--env", "local", "--json", "founder", "briefing"],
        capture_output=True,
        text=True,
        timeout=15,
        check=False,
    )
    assert proc.returncode == 0, proc.stderr
    payload = json.loads(proc.stdout)
    assert payload["ok"] is True
    assert payload["command"] == "founder.briefing"
    assert "queues" in payload["data"]
    assert "companies" in payload["data"]


@pytest.mark.e2e
def test_e2e_local_billing_plans_list_json() -> None:
    proc = subprocess.run(
        [sys.executable, "-m", "cli_anything.avalia", "--env", "local", "--json", "billing", "plans-list"],
        capture_output=True,
        text=True,
        timeout=15,
        check=False,
    )
    assert proc.returncode == 0, proc.stderr
    payload = json.loads(proc.stdout)
    assert payload["ok"] is True
    assert isinstance(payload["data"]["plans"], list)

