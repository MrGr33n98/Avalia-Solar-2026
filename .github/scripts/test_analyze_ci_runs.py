#!/usr/bin/env python3
"""Contract tests for GitHub Actions timing reports."""
import os
import sys
import unittest
sys.path.insert(0, os.path.dirname(__file__))
from analyze_ci_runs import percentile, summarize


class MetricsContract(unittest.TestCase):
    def test_empty_sample_is_explicit(self):
        d = summarize({"workflow_runs": [], "total_count": 0})
        self.assertEqual(d["sample_size"], 0)
        self.assertEqual(d["workflows"], {})

    def test_rank_with_small_samples(self):
        self.assertEqual(percentile([2, 5, 10, 30], .5), 5)
        self.assertEqual(percentile([2, 5, 10, 30], .95), 30)
        self.assertIsNone(percentile([], .95))

    def test_counts_include_noncompleted_but_duration_excludes(self):
        rows = [
            {"name": "CI", "conclusion": "success", "status": "completed", "created_at": "2026-11-13T10:00:00Z",
             "run_started_at": "2026-11-13T10:01:00Z", "updated_at": "2026-11-13T10:06:00Z"},
            {"name": "CI", "conclusion": "failure", "status": "completed", "created_at": "2026-11-13T10:00:00Z",
             "run_started_at": "2026-11-13T10:00:00Z", "updated_at": "2026-11-13T10:20:00Z"},
            {"name": "CI", "status": "queued", "created_at": "2026-11-13T10:00:00Z"},
            {"name": "CD", "conclusion": "success", "status": "completed", "created_at": "2026-11-13T10:00:00Z",
             "run_started_at": "2026-11-13T10:02:00Z", "updated_at": "2026-11-13T10:05:00Z"},
        ]
        r = summarize({"workflow_runs": rows})
        self.assertEqual(r["workflows"]["CI"]["runs"], 3)
        self.assertEqual(r["workflows"]["CI"]["completed"], 2)
        self.assertEqual(r["workflows"]["CI"]["duration_samples"], 2)
        self.assertEqual(r["workflows"]["CI"]["duration_p50_minutes"], 5)
        self.assertEqual(r["workflows"]["CI"]["duration_p95_minutes"], 20)
        self.assertEqual(r["workflows"]["CI"]["conclusions"]["queued"], 1)
        self.assertEqual(r["workflows"]["CD"]["duration_p50_minutes"], 3)

    def test_malformed_timestamps_do_not_crash(self):
        r = summarize({"workflow_runs": [
            {"name": "CI", "status": "completed", "conclusion": "success",
             "run_started_at": "bad", "updated_at": "bad", "created_at": "bad"}
        ]})
        self.assertIsNone(r["workflows"]["CI"]["duration_p95_minutes"])


if __name__ == "__main__":
    unittest.main()
