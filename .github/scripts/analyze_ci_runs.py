#!/usr/bin/env python3
"""Summarize Actions REST workflow_runs JSON; no network access, PII or secrets.

Usage:
  gh api "repos/OWNER/REPO/actions/runs?per_page=100" > /tmp/runs.json
  python3 .github/scripts/analyze_ci_runs.py /tmp/runs.json
"""
import argparse
import collections
import datetime as dt
import json
import math
import sys


def ts(s):
    try:
        return dt.datetime.fromisoformat(s.replace("Z", "+00:00")) if s else None
    except (ValueError, AttributeError):
        return None


def percentile(items, rank):
    if not items:
        return None
    arr = sorted(items)
    return round(arr[max(0, math.ceil(len(arr) * rank) - 1)], 2)


def summarize(payload):
    runs = payload.get("workflow_runs", [])
    out = {"schema_version": "1.0", "source": "GitHub Actions workflow_runs metadata",
           "sample_size": len(runs), "total_count_reported": payload.get("total_count"),
           "workflows": {}, "notes": [
               "Historical sample may mix branches, events, failures and cancelled runs.",
               "Durations use run_started_at to updated_at; exact job timings require job metadata.",
               "Only runs with complete timestamps are included in duration percentiles.",
               "Improvements must compare equivalent risk/event cohorts."
           ]}
    groups = collections.defaultdict(list)
    for run in runs:
        groups[str(run.get("name") or "unknown")].append(run)
    for name, entries in sorted(groups.items()):
        completed = [x for x in entries if x.get("status") == "completed"]
        durations, queues = [], []
        for x in completed:
            start, end = ts(x.get("run_started_at")), ts(x.get("updated_at"))
            if start and end and 0 <= (end - start).total_seconds() <= 86400:
                durations.append((end - start).total_seconds() / 60)
        for x in entries:
            created, start = ts(x.get("created_at")), ts(x.get("run_started_at"))
            if created and start and 0 <= (start - created).total_seconds() <= 86400:
                queues.append((start - created).total_seconds() / 60)
        counts = collections.Counter(x.get("conclusion") or x.get("status") or "unknown" for x in entries)
        out["workflows"][name] = {
            "runs": len(entries), "completed": len(completed),
            "conclusions": dict(sorted(counts.items())),
            "duration_samples": len(durations),
            "duration_p50_minutes": percentile(durations, .5),
            "duration_p95_minutes": percentile(durations, .95),
            "queue_samples": len(queues),
            "queue_p50_minutes": percentile(queues, .5),
            "queue_p95_minutes": percentile(queues, .95),
        }
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("json_file", help="JSON containing workflow_runs as exported by gh api")
    args = parser.parse_args()
    with open(args.json_file, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict) or not isinstance(data.get("workflow_runs"), list):
        raise SystemExit("Expected GitHub Actions response with workflow_runs array")
    json.dump(summarize(data), sys.stdout, indent=2, ensure_ascii=False, sort_keys=True)
    print()


if __name__ == "__main__":
    main()
