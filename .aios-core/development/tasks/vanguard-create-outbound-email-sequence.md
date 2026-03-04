# Task: Create Outbound Email Sequence

**Task ID:** vanguard-create-outbound-email-sequence
**Version:** 1.0
**Purpose:** Create a 5-7 touch outbound email sequence for consultative B2B outreach
**Orchestrator:** @aios-vanguard
**Mode:** Interactive

---

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_icp | string | Yes | ICP, role, or segment |
| offer | string | Yes | Product or service being positioned |
| proof_points | list | No | Case studies, metrics, references, or confirmed capabilities |
| call_to_action | string | Yes | Desired next step |

---

## Steps

### 1. Establish constraints
- Validate ICP, pain, offer mechanism, and CTA.
- Mark absent proof as `[GAP]` and downgrade claims accordingly.
- Confirm sequence objective: reply, meeting, referral, or qualification.

### 2. Design sequence progression
- Assign each touch a specific role: opening, value, proof, objection removal, close, breakup.
- Avoid repeating the same message angle.
- Keep CTAs proportional to touch number and buyer context.

### 3. Draft the emails
- Fill `vanguard-email-sequence-tmpl.md`.
- Include subject line, body, CTA, and optional personalization cue for each touch.
- Keep language concise and commercially specific.

### 4. Validate sequence quality
- Apply `vanguard-quality-checklist.md`.
- Remove any invented ROI or outcome statement.

---

## Veto Conditions

- Fewer than 5 touches without explicit user request.
- Same argument repeated across the sequence.
- Unsupported proof presented as fact.

---

## Output Format

Use `vanguard-email-sequence-tmpl.md`.

---

## Completion Criteria

- Sequence includes 5-7 touches with unique purpose.
- Each email includes subject, body, and CTA.
- Sequence is safe to send without unsupported claims.
