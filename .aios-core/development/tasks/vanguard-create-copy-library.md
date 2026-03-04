# Task: Create Copy Library

**Task ID:** vanguard-create-copy-library
**Version:** 1.0
**Purpose:** Create a reusable copy library for outbound and sales enablement
**Orchestrator:** @aios-vanguard
**Mode:** Interactive

---

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_icp | string | Yes | ICP or persona |
| offer | string | Yes | Offer or category |
| proof_points | list | No | Evidence available for copy |
| use_cases | list | No | Expected use cases such as email, LinkedIn, deck, or landing support |

---

## Steps

### 1. Define copy buckets
- Decide the reusable categories: headlines, hooks, CTAs, personalization, objection snippets.
- Keep snippets modular enough for reuse but specific enough to feel credible.
- Exclude any unsupported proof-heavy statement.

### 2. Draft the library
- Fill `vanguard-copy-library-tmpl.md`.
- Provide variations by ICP where useful.
- Keep labels practical so teams can reuse quickly.

### 3. Annotate proof posture
- Mark which snippets require proof to stay intact.
- Offer safe fallback versions where evidence is thin.
- Flag where ICP-specific adaptation is still needed.

### 4. Validate for reuse
- Apply `vanguard-quality-checklist.md`.
- Remove fluff and duplication.

---

## Veto Conditions

- Copy library is generic enough to fit any company.
- Strong claims are not tied to evidence posture.
- Snippets are not reusable in real workflows.

---

## Output Format

Use `vanguard-copy-library-tmpl.md`.

---

## Completion Criteria

- Library covers hooks, headlines, CTAs, objections, and personalization.
- Proof-sensitive lines are labeled clearly.
- Output can be reused across channels with minimal editing.
