# Task: Create Media Kit

**Task ID:** vanguard-create-media-kit
**Version:** 1.0
**Purpose:** Create an institutional and commercial media kit aligned to the same outbound narrative
**Orchestrator:** @aios-vanguard
**Mode:** Interactive

---

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| company_or_offer | string | Yes | Company, product, or offer name |
| target_icp | string | Yes | Primary ICP or buying role |
| factual_inputs | list | Yes | Confirmed proof points, capabilities, and constraints |
| channel_context | string | No | Where the media kit will be used |

---

## Steps

### 1. Diagnose the factual base
- Confirm what is verified about the offer, ICP, and proof.
- Mark missing proof as `[GAP]`.
- Stop strong claims if proof is absent.

### 2. Build the narrative spine
- Write the problem, mechanism, proof, and CTA in one consistent thread.
- Separate institutional positioning from commercial positioning.
- Keep wording reusable for downstream email, deck, and presentation assets.

### 3. Produce the asset
- Fill `vanguard-media-kit-tmpl.md`.
- Include short company description, value proposition, differentiation, and proof posture.
- Include institutional version and commercial version.

### 4. Validate before delivery
- Apply `vanguard-quality-checklist.md`.
- If any blocking item fails, return the gap and required input instead of pretending completion.

---

## Veto Conditions

- Missing proof is converted into performance claims.
- Institutional and commercial versions contradict each other.
- The CTA is vague or not matched to the intended use.

---

## Output Format

Use `vanguard-media-kit-tmpl.md`.

---

## Completion Criteria

- Media kit contains institutional and commercial sections.
- Claims are explicitly marked as confirmed, hypothesis, or gap when needed.
- The narrative can be reused by other Vanguard commands without rework.
