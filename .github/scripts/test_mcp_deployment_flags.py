#!/usr/bin/env python3
"""Contract tests verifying MCP public Canary + Interactive UI flags in compose & CD workflows."""

from pathlib import Path
import sys
import yaml

ROOT = Path(__file__).resolve().parents[2]


def load_yaml(rel_path: str) -> dict:
    path = ROOT / rel_path
    assert path.is_file(), f"Missing YAML file: {rel_path}"
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def main() -> None:
    compose = load_yaml("docker-compose.yml")
    backend_env = compose["services"]["backend"]["environment"]

    expected_true_defaults = [
        "MCP_REMOTE_TRANSPORT_ENABLED",
        "MCP_REMOTE_PRODUCTION_ENABLED",
        "MCP_REMOTE_OAUTH_ENABLED",
        "MCP_REMOTE_POLICY_ENABLED",
        "MCP_PUBLIC_TOOLS_EXECUTION_ENABLED",
        "MCP_CANARY_ENABLED",
        "MCP_UI_ENABLED",
        "MCP_UI_SEARCH_ENABLED",
        "MCP_UI_PROFILE_ENABLED",
        "MCP_UI_REPUTATION_ENABLED",
        "MCP_UI_COMPARE_ENABLED",
        "MCP_UI_CATEGORIES_ENABLED",
    ]
    for key in expected_true_defaults:
        value = str(backend_env.get(key, ""))
        assert value == f"${{{key}:-true}}", f"docker-compose.yml {key} expected default true, got {value!r}"

    assert backend_env.get("MCP_BRAND_PROFILE_HERO_ENABLED") == "${MCP_BRAND_PROFILE_HERO_ENABLED:-false}"
    assert backend_env.get("MCP_REMOTE_AUTH_MODE") == "${MCP_REMOTE_AUTH_MODE:-oauth}"
    assert backend_env.get("MCP_CANARY_PHASE") == "${MCP_CANARY_PHASE:-read_only}"
    assert backend_env.get("MCP_OAUTH_ISSUER") == "${MCP_OAUTH_ISSUER:-https://api.avaliasolar.com.br}"
    assert backend_env.get("MCP_OAUTH_RESOURCE") == "${MCP_OAUTH_RESOURCE:-https://api.avaliasolar.com.br/mcp}"
    assert backend_env.get("MCP_REMOTE_ALLOWED_HOSTS") == "${MCP_REMOTE_ALLOWED_HOSTS:-api.avaliasolar.com.br}"
    assert "https://chatgpt.com" in str(backend_env.get("MCP_REMOTE_ALLOWED_ORIGINS", ""))
    assert "https://www.avaliasolar.com.br" in str(backend_env.get("MCP_UI_RESOURCE_DOMAINS", ""))
    assert "digitaloceanspaces.com" in str(backend_env.get("MCP_UI_RESOURCE_DOMAINS", ""))

    # Sensitive allowlists must never hardcode client IDs or subjects in compose
    assert backend_env.get("MCP_CANARY_ALLOWED_CLIENT_IDS") == "${MCP_CANARY_ALLOWED_CLIENT_IDS:-}"
    assert backend_env.get("MCP_CANARY_ALLOWED_SUBJECTS") == "${MCP_CANARY_ALLOWED_SUBJECTS:-}"

    # Private MCP must stay strictly disabled in production compose
    for priv_key in (
        "MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED",
        "MCP_PRIVATE_REMOTE_OAUTH_ENABLED",
        "MCP_PRIVATE_REMOTE_POLICY_ENABLED",
    ):
        assert backend_env.get(priv_key) == f"${{{priv_key}:-false}}", f"{priv_key} must default false"

    staging = load_yaml("infra/mcp-staging/compose.yml")
    staging_env = staging["services"]["rails"]["environment"]
    for key in (
        "MCP_UI_ENABLED",
        "MCP_UI_SEARCH_ENABLED",
        "MCP_UI_PROFILE_ENABLED",
        "MCP_UI_REPUTATION_ENABLED",
        "MCP_UI_COMPARE_ENABLED",
        "MCP_UI_CATEGORIES_ENABLED",
    ):
        assert str(staging_env.get(key)) == "true", f"staging {key} must be true"
    assert staging_env.get("MCP_BRAND_PROFILE_HERO_ENABLED") == "${MCP_BRAND_PROFILE_HERO_ENABLED:-false}"
    assert "https://chatgpt.com" in str(staging_env.get("MCP_REMOTE_ALLOWED_ORIGINS", ""))
    assert "digitaloceanspaces.com" in str(staging_env.get("MCP_UI_RESOURCE_DOMAINS", ""))

    cd_prod = load_yaml(".github/workflows/cd-production.yml")
    deploy_steps = cd_prod["jobs"]["deploy"]["steps"]
    ssh_step = next(s for s in deploy_steps if s.get("name") == "Deploy over SSH")
    ssh_env = ssh_step["env"]
    for key in (
        "MCP_REMOTE_TRANSPORT_ENABLED",
        "MCP_REMOTE_PRODUCTION_ENABLED",
        "MCP_REMOTE_OAUTH_ENABLED",
        "MCP_REMOTE_POLICY_ENABLED",
        "MCP_PUBLIC_TOOLS_EXECUTION_ENABLED",
        "MCP_CANARY_ENABLED",
        "MCP_CANARY_PHASE",
        "MCP_UI_ENABLED",
        "MCP_UI_SEARCH_ENABLED",
        "MCP_UI_PROFILE_ENABLED",
        "MCP_UI_REPUTATION_ENABLED",
        "MCP_UI_COMPARE_ENABLED",
        "MCP_UI_CATEGORIES_ENABLED",
    ):
        assert key in ssh_env, f"cd-production.yml SSH step missing {key}"
        assert key in ssh_step["with"]["envs"], f"cd-production.yml SSH envs missing {key}"
    assert ssh_env.get("MCP_BRAND_PROFILE_HERO_ENABLED") == "${{ vars.MCP_BRAND_PROFILE_HERO_ENABLED || 'false' }}"
    assert "MCP_BRAND_PROFILE_HERO_ENABLED" in ssh_step["with"]["envs"].split(",")
    assert "export MCP_BRAND_PROFILE_HERO_ENABLED" in ssh_step["with"]["script"]
    assert "avalia-solar-mcp-staging" in ssh_step["with"]["script"], (
        "cd-production.yml must sync isolated avalia-solar-mcp-staging when present on droplet"
    )

    cd_staging = load_yaml(".github/workflows/cd-mcp-staging.yml")
    assert "deploy-mcp-staging" in cd_staging["jobs"]

    smoke_rb = (ROOT / ".github/scripts/mcp_staging_smoke.rb").read_text(encoding="utf-8")
    assert "resources/list" in smoke_rb and "resources/read" in smoke_rb, (
        "mcp_staging_smoke.rb must validate MCP UI resources/list and resources/read"
    )

    print("PASS: MCP deployment flags, staging sync, and UI smoke contracts verified")


if __name__ == "__main__":
    main()

