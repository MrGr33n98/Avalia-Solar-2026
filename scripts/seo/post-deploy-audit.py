#!/usr/bin/env python3
"""Auditoria pública pós-deploy dos contratos SEO do Avalia Solar."""

from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):  # noqa: N802
        return None


OPENER = urllib.request.build_opener(NoRedirectHandler)
USER_AGENT = "AvaliaSolar-SEO-W0-Audit/1.0"
LOCAL_SITEMAP_PATH = "/sitemaps/local-solar/sitemap.xml"
MISSING_COMPANY_PATH = "/companies/this-company-does-not-exist-acceptance-gate"


def request(url: str, timeout: int = 30) -> dict[str, Any]:
    started = time.perf_counter()
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with OPENER.open(req, timeout=timeout) as response:
            body = response.read()
            return {
                "url": url,
                "status": response.status,
                "headers": dict(response.headers.items()),
                "body": body.decode("utf-8", errors="replace"),
                "duration_ms": round((time.perf_counter() - started) * 1000, 2),
            }
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        return {
            "url": url,
            "status": error.code,
            "headers": dict(error.headers.items()),
            "body": body,
            "duration_ms": round((time.perf_counter() - started) * 1000, 2),
        }
    except (urllib.error.URLError, TimeoutError, ssl.SSLError, OSError) as error:
        return {
            "url": url,
            "status": None,
            "headers": {},
            "body": "",
            "duration_ms": round((time.perf_counter() - started) * 1000, 2),
            "error": f"{type(error).__name__}: {error}",
        }


def xml_locs(body: str) -> list[str]:
    root = ET.fromstring(body)
    return [element.text.strip() for element in root.iter() if element.tag.endswith("loc") and element.text]


def canonical_href(body: str) -> str | None:
    for tag in re.findall(r"<link\b[^>]*>", body, flags=re.IGNORECASE):
        if re.search(r'\brel=["\']canonical["\']', tag, flags=re.IGNORECASE):
            match = re.search(r'\bhref=["\']([^"\']+)', tag, flags=re.IGNORECASE)
            if match:
                return match.group(1)
    return None


def percentile(values: list[float], percent: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, int((len(ordered) * percent + 99) // 100) - 1))
    return round(ordered[index], 2)


def check(name: str, passed: bool, **details: Any) -> dict[str, Any]:
    return {"name": name, "status": "pass" if passed else "fail", **details}


def run(base_url: str, output_dir: Path) -> dict[str, Any]:
    base_url = base_url.rstrip("/")
    apex_url = base_url.replace("https://www.", "https://", 1)
    report: dict[str, Any] = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "base_url": base_url,
        "checks": [],
        "sitemaps": [],
        "performance": {},
        "gsc": {
            "status": "not_collected",
            "reason": "Nenhuma sessão autenticada do Google Search Console está disponível no runner.",
            "required_access": [
                "Usuário Owner ou Full User na propriedade sc-domain:avaliasolar.com.br",
                "Acesso de leitura a Performance, Indexação/Páginas e Sitemaps",
                "Permissão para consultar os períodos de 7 e 28 dias e exportar métricas",
            ],
        },
    }

    apex_probe = "/seo-w0-redirect-probe?source=github-actions"
    apex = request(f"{apex_url}{apex_probe}")
    apex_location = apex.get("headers", {}).get("Location") or apex.get("headers", {}).get("location")
    expected_location = f"{base_url}{apex_probe}"
    report["checks"].append(
        check(
            "apex_tls_redirect",
            apex.get("status") == 308 and apex_location == expected_location,
            status_code=apex.get("status"),
            location=apex_location,
            expected_location=expected_location,
            duration_ms=apex.get("duration_ms"),
            error=apex.get("error"),
        )
    )

    homepage = request(f"{base_url}/")
    homepage_canonical = canonical_href(homepage.get("body", ""))
    report["checks"].append(
        check(
            "www_homepage",
            homepage.get("status") == 200,
            status_code=homepage.get("status"),
            duration_ms=homepage.get("duration_ms"),
            canonical=homepage_canonical,
        )
    )
    report["checks"].append(
        check(
            "homepage_canonical",
            homepage_canonical is not None and homepage_canonical.startswith(base_url),
            canonical=homepage_canonical,
        )
    )

    robots = request(f"{base_url}/robots.txt")
    report["checks"].append(
        check(
            "robots",
            robots.get("status") == 200 and f"Sitemap: {base_url}/sitemap-index.xml" in robots.get("body", ""),
            status_code=robots.get("status"),
            sitemap_reference=f"Sitemap: {base_url}/sitemap-index.xml" in robots.get("body", ""),
        )
    )

    index = request(f"{base_url}/sitemap-index.xml")
    sitemap_urls: list[str] = []
    try:
        sitemap_urls = xml_locs(index.get("body", "")) if index.get("status") == 200 else []
        index_valid = bool(sitemap_urls)
    except ET.ParseError as error:
        index_valid = False
        report["checks"].append(check("sitemap_index_xml", False, error=str(error)))
    else:
        report["checks"].append(
            check(
                "sitemap_index_xml",
                index.get("status") == 200 and index_valid,
                status_code=index.get("status"),
                sitemap_count=len(sitemap_urls),
                duration_ms=index.get("duration_ms"),
            )
        )

    all_urls: list[str] = []
    for sitemap_url in sitemap_urls:
        result = request(sitemap_url)
        try:
            locs = xml_locs(result.get("body", "")) if result.get("status") == 200 else []
            xml_valid = result.get("status") == 200
        except ET.ParseError as error:
            locs = []
            xml_valid = False
            error_text = str(error)
        else:
            error_text = None
        all_urls.extend(locs)
        report["sitemaps"].append(
            {
                "url": sitemap_url,
                "status_code": result.get("status"),
                "xml_valid": xml_valid,
                "url_count": len(locs),
                "duration_ms": result.get("duration_ms"),
                "error": error_text or result.get("error"),
            }
        )

    report["checks"].append(
        check(
            "sitemap_sections",
            bool(sitemap_urls)
            and all(item["status_code"] == 200 and item["xml_valid"] for item in report["sitemaps"]),
            section_count=len(report["sitemaps"]),
            failed_sections=[item["url"] for item in report["sitemaps"] if item["status_code"] != 200 or not item["xml_valid"]],
        )
    )

    duplicate_urls = sorted({url for url in all_urls if all_urls.count(url) > 1})
    invalid_hosts = sorted({url for url in all_urls if not url.startswith(f"{base_url}/")})
    report["checks"].append(
        check(
            "sitemap_url_integrity",
            not duplicate_urls and not invalid_hosts,
            total_urls=len(all_urls),
            duplicate_count=len(duplicate_urls),
            invalid_host_count=len(invalid_hosts),
            duplicate_examples=duplicate_urls[:10],
            invalid_examples=invalid_hosts[:10],
        )
    )

    local_url = f"{base_url}{LOCAL_SITEMAP_PATH}"
    samples = [request(local_url, timeout=60) for _ in range(10)]
    durations = [sample["duration_ms"] for sample in samples if sample.get("status") == 200]
    cold = durations[:1]
    warm = durations[1:]
    performance = {
        "url": local_url,
        "sample_count": len(durations),
        "samples_ms": durations,
        "cold_observed_ms": cold[0] if cold else None,
        "warm_p95_ms": percentile(warm, 95),
        "cold_target_ms": 5000,
        "warm_target_ms": 2000,
        "methodology": "10 requisições sequenciais públicas; a primeira é cold observado e as nove seguintes são warm observado.",
    }
    report["performance"] = performance
    report["checks"].append(
        check(
            "sitemap_local_solar_performance",
            bool(cold)
            and cold[0] < performance["cold_target_ms"]
            and bool(warm)
            and performance["warm_p95_ms"] < performance["warm_target_ms"],
            **performance,
        )
    )

    missing = request(f"{base_url}{MISSING_COMPANY_PATH}")
    noindex = bool(re.search(r"noindex", missing.get("body", ""), flags=re.IGNORECASE))
    report["checks"].append(
        check(
            "missing_company_404",
            missing.get("status") == 404 and noindex,
            status_code=missing.get("status"),
            noindex=noindex,
            canonical=canonical_href(missing.get("body", "")),
        )
    )

    report["status"] = "pass" if all(item["status"] == "pass" for item in report["checks"]) else "fail"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "seo-post-deploy-audit.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    write_markdown(report, output_dir / "seo-post-deploy-audit.md")
    return report


def write_markdown(report: dict[str, Any], path: Path) -> None:
    lines = [
        "# Auditoria SEO pós-deploy",
        "",
        f"- Base: {report['base_url']}",
        f"- Gerado em: {report['generated_at']}",
        f"- Resultado: **{report['status'].upper()}**",
        "",
        "## Checks",
        "",
        "| Check | Status | Evidência |",
        "|---|---|---|",
    ]
    for item in report["checks"]:
        evidence = ", ".join(
            f"{key}={value}" for key, value in item.items() if key not in {"name", "status"}
        )
        lines.append(f"| {item['name']} | {item['status']} | {evidence} |")

    lines.extend(
        [
            "",
            "## Sitemaps",
            "",
            "| URL | HTTP | XML | URLs | Duração (ms) |",
            "|---|---:|---|---:|---:|",
        ]
    )
    for sitemap in report["sitemaps"]:
        lines.append(
            f"| {sitemap['url']} | {sitemap['status_code']} | {sitemap['xml_valid']} | "
            f"{sitemap['url_count']} | {sitemap['duration_ms']} |"
        )

    lines.extend(
        [
            "",
            "## GSC",
            "",
            report["gsc"]["reason"],
            "",
            "Permissões necessárias: " + "; ".join(report["gsc"]["required_access"]),
            "",
            "Os dados JSON completos permanecem no artifact seo-post-deploy-audit.",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="https://www.avaliasolar.com.br")
    parser.add_argument("--output-dir", default="artifacts/seo-post-deploy-audit")
    args = parser.parse_args()
    report = run(args.base_url, Path(args.output_dir))
    print(json.dumps({"status": report["status"], "output_dir": args.output_dir}, ensure_ascii=False))
    return 0 if report["status"] == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
