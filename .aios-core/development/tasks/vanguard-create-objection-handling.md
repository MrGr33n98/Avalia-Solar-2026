# Task: Create Objection Handling

**Task ID:** vanguard-create-objection-handling
**Version:** 1.0
**Purpose:** Create an objection matrix with root cause and response logic grounded in facts
**Orchestrator:** @aios-vanguard
**Mode:** Interactive

---

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| objections | list | Yes | Common objections or reasons for no-decision |
| offer | string | Yes | Offer under discussion |
| proof_points | list | No | Confirmed evidence that can support responses |
| target_icp | string | Yes | ICP or buyer persona |

---

## Steps

### 1. Diagnose the objection layer
- Separate spoken objection from likely underlying concern.
- Classify if the issue is priority, trust, risk, authority, or economics.
- Mark where the current response would rely on unsupported proof.

### 2. Build response logic
- For each objection, write acknowledgment, reframing, proof use, and control question.
- Use proof only where confirmed.
- If proof is absent, downgrade to logic or hypothesis.

### 3. Produce the matrix
- Fill `vanguard-objection-matrix-tmpl.md`.
- Include objection, real concern, response, proof status, and next-step question.
- Keep responses short enough for actual use in calls or email replies.

### 4. Validate the matrix
- Apply `vanguard-quality-checklist.md`.
- Remove any manipulative or combative phrasing.

---

## Veto Conditions

- Responses depend on invented ROI or customer references.
- The answer ignores the real underlying concern.
- The response is a script dump instead of a reusable decision pattern.

---

## Output Format

Use `vanguard-objection-matrix-tmpl.md`.

---

## Completion Criteria

- Matrix distinguishes objection from underlying concern.
- Responses state whether they rely on fact, logic, or hypothesis.
- Output is usable by sales in real conversations.
