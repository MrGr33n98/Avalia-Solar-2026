#!/usr/bin/env python3
"""Official MCP Python SDK v2 smoke for the approved Avalia Solar staging host.

Requires an external OAuth token issued for the exact MCP resource. No secrets
or domain payloads are printed. This never creates, mutates, or deletes data.
"""
import asyncio
import os
import re
from urllib.parse import urlparse

import httpx2
from mcp import Client
from mcp.client.streamable_http import streamable_http_client

PUBLIC = [
    "list_integrators",
    "show_integrator_profile",
    "list_solar_categories",
    "get_integrator_reputation",
    "compare_integrators",
]
PRIVATE = ["get_my_company_overview"]
APPROVED_HOST = re.compile(r"^[a-z0-9-]*staging[a-z0-9-]*\.avaliasolar\.com\.br$")


def config():
    if os.environ.get("MCP_SMOKE_CONFIRMATION") != "STAGING_ONLY":
        raise ValueError("STAGING_ONLY confirmation is required")
    target = os.environ.get("MCP_SDK_TARGET", "public")
    if target not in ("public", "private"):
        raise ValueError("Unknown target")
    prefix = "MCP_STAGING_PRIVATE" if target == "private" else "MCP_STAGING"
    resource = os.environ[f"{prefix}_RESOURCE_URL"]
    token = os.environ[f"{prefix}_ACCESS_TOKEN"]
    parsed = urlparse(resource)
    allowed_path = "/mcp/private" if target == "private" else "/mcp"
    if (
        parsed.scheme != "https"
        or parsed.path != allowed_path
        or not parsed.hostname
        or not APPROVED_HOST.fullmatch(parsed.hostname)
        or parsed.username
        or parsed.password
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("Expected exact approved staging HTTPS resource")
    if not token or len(token) > 8192 or "\n" in token or "\r" in token:
        raise ValueError("Missing/invalid staging bearer token")
    company = os.environ.get("MCP_STAGING_PRIVATE_COMPANY_ID")
    if target == "private" and (not company or not company.isdigit()):
        raise ValueError("Private authorized company fixture is required")
    return target, resource, token, company


async def run():
    target, resource, token, company = config()
    async with httpx2.AsyncClient(
        headers={"Authorization": f"Bearer {token}"},
        timeout=httpx2.Timeout(30, read=300),
        follow_redirects=False,
    ) as http_client:
        transport = streamable_http_client(resource, http_client=http_client)
        async with Client(transport) as client:
            if str(client.protocol_version) != "2026-07-28":
                raise AssertionError("Modern MCP 2026-07-28 was not negotiated")
            listed = await client.list_tools()
            actual = [tool.name for tool in listed.tools]
            expected = PRIVATE if target == "private" else PUBLIC
            if actual != expected:
                raise AssertionError("Unexpected MCP tool allowlist")
            if target == "private":
                result = await client.call_tool(
                    "get_my_company_overview", {"company_id": int(company)}
                )
                company_data = (result.structured_content or {}).get("company", {})
                if str(company_data.get("id")) != company:
                    raise AssertionError("Authorized company differs from OAuth owner")
            else:
                result = await client.call_tool("list_solar_categories", {})
                categories = (result.structured_content or {}).get("data", {}).get("categories")
                if not isinstance(categories, list):
                    raise AssertionError("Invalid public categories contract")
            if result.is_error:
                raise AssertionError("MCP tool returned an error")
    print(f"PASS Python MCP SDK v2: {target} (staging-only; no domain data logged)")


if __name__ == "__main__":
    try:
        asyncio.run(run())
    except Exception as exc:
        # Error bodies and exception messages can contain sensitive data.
        print(f"FAIL Python MCP SDK v2 ({type(exc).__name__})", flush=True)
        raise SystemExit(1) from None
