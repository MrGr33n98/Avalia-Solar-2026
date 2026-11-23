#!/usr/bin/env python3
"""Non-destructive load test for Avalia Solar MCP Staging.

Measures latency (p50, p95, p99), throughput (RPS), status code distribution
(200, 429, 503), and quota behavior on staging. Never writes or mutates data.
Never targets production hosts.
"""

import argparse
import concurrent.futures
import json
import math
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

APPROVED_HOST = re.compile(r"^[a-z0-9-]*staging[a-z0-9-]*\.avaliasolar\.com\.br$")


def validate_target(target_url: str):
    parsed = urllib.parse.urlparse(target_url)
    if parsed.scheme != "https":
        raise ValueError(f"Target URL must be HTTPS: {target_url}")
    if not parsed.hostname or not APPROVED_HOST.fullmatch(parsed.hostname):
        raise ValueError(
            f"Target host '{parsed.hostname}' is not an approved staging host! Load test is strictly prohibited against production."
        )


def make_request(target_url: str, token: str, method: str, params: dict, timeout: float = 10.0) -> dict:
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps({
        "jsonrpc": "2.0",
        "id": f"load-{time.time_ns()}",
        "method": method,
        "params": params,
    }).encode("utf-8")

    req = urllib.request.Request(target_url, data=body, headers=headers, method="POST")
    start = time.perf_counter()
    status_code = 0
    error_type = None

    try:
        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
            status_code = response.getcode()
            response.read()
    except urllib.error.HTTPError as e:
        status_code = e.code
    except urllib.error.URLError as e:
        status_code = 0
        error_type = type(e.reason).__name__
    except Exception as e:
        status_code = 0
        error_type = type(e).__name__

    duration_ms = (time.perf_counter() - start) * 1000.0
    return {
        "status_code": status_code,
        "duration_ms": duration_ms,
        "error_type": error_type,
    }


def calculate_percentile(sorted_list, percentile):
    if not sorted_list:
        return 0.0
    k = (len(sorted_list) - 1) * percentile
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return sorted_list[int(k)]
    d0 = sorted_list[int(f)] * (c - k)
    d1 = sorted_list[int(c)] * (k - f)
    return d0 + d1


def run_load_test(target_url: str, token: str, total_requests: int, concurrency: int, method: str, params: dict):
    validate_target(target_url)
    print(f"🚀 Starting non-destructive staging load test...")
    print(f"   Target:      {target_url}")
    print(f"   Method:      {method}")
    print(f"   Requests:    {total_requests}")
    print(f"   Concurrency: {concurrency}")
    print()

    results = []
    start_total = time.perf_counter()

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [
            executor.submit(make_request, target_url, token, method, params)
            for _ in range(total_requests)
        ]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())

    total_wall_time = time.perf_counter() - start_total
    rps = total_requests / total_wall_time if total_wall_time > 0 else 0

    durations = sorted([r["duration_ms"] for r in results])
    status_counts = {}
    for r in results:
        code = r["status_code"]
        status_counts[code] = status_counts.get(code, 0) + 1

    p50 = calculate_percentile(durations, 0.50)
    p90 = calculate_percentile(durations, 0.90)
    p95 = calculate_percentile(durations, 0.95)
    p99 = calculate_percentile(durations, 0.99)
    min_lat = durations[0] if durations else 0.0
    max_lat = durations[-1] if durations else 0.0
    mean_lat = sum(durations) / len(durations) if durations else 0.0

    summary = {
        "target": target_url,
        "method": method,
        "total_requests": total_requests,
        "concurrency": concurrency,
        "wall_time_seconds": round(total_wall_time, 2),
        "requests_per_second": round(rps, 2),
        "status_distribution": status_counts,
        "latency_ms": {
            "min": round(min_lat, 2),
            "mean": round(mean_lat, 2),
            "p50": round(p50, 2),
            "p90": round(p90, 2),
            "p95": round(p95, 2),
            "p99": round(p99, 2),
            "max": round(max_lat, 2),
        },
    }

    print("📊 Load Test Results:")
    print(f"   Total Time: {summary['wall_time_seconds']}s")
    print(f"   Throughput: {summary['requests_per_second']} req/s")
    print(f"   Status Codes: {json.dumps(status_counts)}")
    print(f"   Latency (ms): min={summary['latency_ms']['min']}, p50={summary['latency_ms']['p50']}, p95={summary['latency_ms']['p95']}, p99={summary['latency_ms']['p99']}, max={summary['latency_ms']['max']}")
    print()

    return summary


def main():
    parser = argparse.ArgumentParser(description="Avalia Solar MCP Staging Load Test")
    parser.add_argument("--target", default=os.environ.get("MCP_TARGET_URL", "https://mcp-staging.avaliasolar.com.br/mcp"))
    parser.add_argument("--requests", type=int, default=int(os.environ.get("MCP_LOAD_REQUESTS", "50")))
    parser.add_argument("--concurrency", type=int, default=int(os.environ.get("MCP_LOAD_CONCURRENCY", "5")))
    parser.add_argument("--method", default="tools/list")
    parser.add_argument("--token", default=os.environ.get("MCP_STAGING_ACCESS_TOKEN", ""))
    parser.add_argument("--output-json", help="Path to write JSON summary")

    args = parser.parse_args()

    if os.environ.get("MCP_SMOKE_CONFIRMATION") != "STAGING_ONLY":
        print("[ERRO] MCP_SMOKE_CONFIRMATION=STAGING_ONLY é obrigatório para executar testes de carga.")
        sys.exit(1)

    summary = run_load_test(
        target_url=args.target,
        token=args.token,
        total_requests=args.requests,
        concurrency=args.concurrency,
        method=args.method,
        params={},
    )

    if args.output_json:
        with open(args.output_json, "w") as f:
            json.dump(summary, f, indent=2)
        print(f"Saved results to {args.output_json}")


if __name__ == "__main__":
    main()
