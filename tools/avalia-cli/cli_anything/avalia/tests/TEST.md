# TEST.md — `cli-anything-avalia` Test Plan & Evidence Report

## Part 1: Test Inventory Plan (Phase 4)

| Test Suite | Planned Tests | Scope |
|---|:---:|---|
| `test_core.py` | 15 | Unit tests for JSON envelope contract, `--reason` safety gate, `billing drift-audit` anomaly detection, `company health` 5-dimension scoring, `Plan/Apply` (`--dry-run`) immutability, and Click CLI commands with mocked SQL runner. |
| `test_full_e2e.py` | 5 | Subprocess E2E tests invoking `python -m cli_anything.avalia --help`, `--version`, and real local PostgreSQL `R0` queries (`founder briefing`, `billing drift-audit`, `billing plans-list`). |

---

## Part 2: Execution Results (Phase 6)

*Executed via `pytest -v` in `tools/avalia-cli/`.*
- **Total Planned:** 20 tests
- **Status:** Verified during Phase 5/6 build.

