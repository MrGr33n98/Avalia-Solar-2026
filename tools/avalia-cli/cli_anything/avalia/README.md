
# `cli-anything-avalia` — Avalia Solar Founder & Backoffice CLI

Agent-Native CLI harness built following the [HKUDS/CLI-Anything](https://github.com/HKUDS/CLI-Anything) 7-phase methodology.

## Quick Start

```bash
pip install -e tools/avalia-cli

# Interactive REPL
avalia

# Founder Morning Briefing (JSON)
avalia --json founder briefing

# Stripe & Plan Entitlement Drift Audit
avalia --json billing drift-audit

# Company Profile Completion & Next Best Action
avalia --json company health 372 --with-actions
```
