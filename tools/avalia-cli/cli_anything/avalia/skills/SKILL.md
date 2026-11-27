---
name: cli-anything-avalia
description: Agent-Native CLI for Avalia Solar 2026 Founder & Backoffice Operations (briefing, system doctor, Stripe drift audit, company health score, claims approval, review moderation, revenue upgrade candidates, curation, and AEO validation).
---

# cli-anything-avalia

Agent-Native Command Line Interface for the **Avalia Solar 2026** platform, built with the [HKUDS/CLI-Anything](https://github.com/HKUDS/CLI-Anything) 7-Phase methodology. It provides zero-boot, deterministic access to all 11 backoffice domains (`R0..R3` risk tiers) with structured `--json` output and Plan/Apply (`--dry-run`) governance.

## Installation

```bash
pip install -e tools/avalia-cli
```

Both `avalia` and `cli-anything-avalia` are installed into `PATH`.

## Global Flags

- `--env [local|prod]`: Select target environment (`local` Docker `ab0-postgres` or `prod` via SSH). Default: `local`.
- `--json`: Emit deterministic JSON envelope (`{ "ok", "command", "env", "risk_tier", "dry_run", "data", "meta" }`).

## Command Groups

### 1. Founder Ritual (`founder`)
| Command | Risk | Description |
|---|:---:|---|
| `avalia founder briefing` | `R0` | Morning executive briefing: pending queues (`claims`, `reviews`, `pending_changes`, `leads`), company totals, plan distribution, and prioritized action items. |

### 2. System & Infrastructure (`system`)
| Command | Risk | Description |
|---|:---:|---|
| `avalia system doctor` | `R0` | Healthcheck and query latency for PostgreSQL (`ab0-postgres`) and HTTP API reachability. |

### 3. Plans & Stripe Billing (`billing`)
| Command | Risk | Description |
|---|:---:|---|
| `avalia billing drift-audit` | `R0` | Audits Stripe Price IDs (6m/12m uniqueness and presence), public plan catalog, and paid companies without an active Stripe subscription. |
| `avalia billing plans-list [--public-only]` | `R0` | Lists commercial plans, reference prices, Stripe IDs, and linked company counts. |
| `avalia billing grant-plan --company <id> --plan <id> --reason "<txt>" [--dry-run\|--apply]` | `R3` | Assigns or upgrades a company plan with mandatory audit reason and Plan/Apply preview. |

### 4. Company Onboarding & Claims (`company`)
| Command | Risk | Description |
|---|:---:|---|
| `avalia company health <id> [--with-actions]` | `R0` | Computes the 0–100 Profile Health Score across 5 dimensions (`profile`, `reputation`, `content`, `discoverability`, `integration`) plus prioritized `NextBestAction` recommendations. |
| `avalia company claims-list [--status pending]` | `R0` | Lists company profile ownership claims (`CompanyAccessRequest`). |
| `avalia company approve-claim <id> --reason "<txt>" [--verify-badge] [--dry-run\|--apply]` | `R2` | Approves a company claim and optionally activates the verified badge. |

### 5. Reputation & Reviews (`reputation`)
| Command | Risk | Description |
|---|:---:|---|
| `avalia reputation queue [--limit 20]` | `R0` | Lists reviews pending moderation. |
| `avalia reputation moderate <id> --action [approve\|reject] --reason "<txt>" [--dry-run\|--apply]` | `R2` | Approves or rejects a review with mandatory audit note. |

### 6. Revenue Intelligence (`revenue`)
| Command | Risk | Description |
|---|:---:|---|
| `avalia revenue upgrade-candidates [--limit 10] [--state UF]` | `R1` | Ranks active `Free` companies by commercial heat score (views, CTA clicks, reviews, and buyer intent signals) for outbound conversion. |

### 7. Marketplace Leads (`leads`)
| Command | Risk | Description |
|---|:---:|---|
| `avalia leads stuck [--older-than 2]` | `R0` | Lists marketplace leads awaiting follow-up beyond the SLA threshold. |

### 8. Curation & Data Hygiene (`curation`)
| Command | Risk | Description |
|---|:---:|---|
| `avalia curation audit [--state UF] [--detect-duplicates]` | `R1` | Audits missing critical fields (phone/WhatsApp, description, location, CNPJ) and detects duplicate company names. |

### 9. AEO & Agentic Storefront (`aeo`)
| Command | Risk | Description |
|---|:---:|---|
| `avalia aeo validate-storefront [--company <id>]` | `R0` | Validates SEO/AEO metadata completeness and storefront readiness for AI agents. |

## For AI Agents

1. **Always pass `--json`** before the subcommand: `avalia --env prod --json founder briefing`.
2. **Never execute `--apply` on `R2`/`R3` commands without running `--dry-run` first** and confirming with the user.
3. **Check exit codes**: `0` = success, `1` = backend error, `2` = validation error.

