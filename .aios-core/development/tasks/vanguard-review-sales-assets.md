# Task: Review Sales Assets

**Task ID:** vanguard-review-sales-assets
**Version:** 1.0
**Purpose:** Review existing collateral against Vanguard's quality bar and identify commercial risk
**Orchestrator:** @aios-vanguard
**Mode:** Interactive

---

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| assets | list | Yes | Assets to review |
| target_icp | string | No | Intended audience |
| offer | string | No | Offer being sold |
| review_goal | string | No | What the user wants validated |

---

## Steps

### 1. Inventory the asset set
- Identify type, channel, and intended use of each asset.
- Note whether the user wants strategic review, copy review, or proof review.
- Determine where missing context blocks judgment.

### 2. Review against Vanguard quality gate
- Apply `vanguard-quality-checklist.md`.
- Prioritize issues by credibility risk, conversion friction, and narrative inconsistency.
- Distinguish blocking issues from improvement suggestions.

### 3. Write the review report
- Fill `vanguard-sales-assets-review-tmpl.md`.
- Include findings, impact, evidence, and suggested fix.
- Call out where handoff to `@analyst` or `@pm` is needed.

### 4. Finalize with action order
- Order fixes from most important to least.
- Provide a concise recommended next step list.

---

## Veto Conditions

- Review ignores unsupported claims.
- Findings are vague and not tied to a specific artifact or message pattern.
- Recommendations require evidence not acknowledged as missing.

---

## Output Format

Use `vanguard-sales-assets-review-tmpl.md`.

---

## Completion Criteria

- Findings are prioritized and actionable.
- Blocking issues are explicit.
- The report makes next steps obvious.
