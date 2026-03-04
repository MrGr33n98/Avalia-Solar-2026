# Task: Refine Message by ICP

**Task ID:** vanguard-refine-message-by-icp
**Version:** 1.0
**Purpose:** Adapt existing messaging to a specific ICP, role, or segment without breaking the core narrative
**Orchestrator:** @aios-vanguard
**Mode:** Interactive

---

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| source_message | string | Yes | Existing message, pitch, or narrative |
| target_icp | string | Yes | New ICP, segment, or buying role |
| offer | string | Yes | Offer being positioned |
| known_pains | list | No | Specific pains or triggers for the ICP |

---

## Steps

### 1. Parse the current message
- Identify current pain, mechanism, proof, and CTA.
- Note what is reusable and what is too generic for the target ICP.
- Mark any implicit assumption that needs validation.

### 2. Adapt emphasis
- Change vocabulary, stakes, and examples to fit the target ICP.
- Keep the central offer logic stable.
- Adjust CTA and specificity to the buyer's maturity and authority.

### 3. Produce the refinement matrix
- Fill `vanguard-icp-refinement-tmpl.md`.
- Show before, after, rationale, and confidence level.
- Include any remaining gaps.

### 4. Validate fit
- Apply `vanguard-quality-checklist.md`.
- Remove lines that still sound like they belong to another audience.

---

## Veto Conditions

- Adaptation changes the offer itself instead of the emphasis.
- ICP-specific pains are guessed but presented as confirmed.
- Result is not traceable from before to after.

---

## Output Format

Use `vanguard-icp-refinement-tmpl.md`.

---

## Completion Criteria

- The adaptation is explicit and traceable.
- The message sounds native to the target ICP.
- Gaps and assumptions remain visible.
