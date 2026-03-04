# Task: Create LinkedIn Sequence

**Task ID:** vanguard-create-linkedin-sequence
**Version:** 1.0
**Purpose:** Create LinkedIn outreach flow for connection, follow-up, and breakup messages
**Orchestrator:** @aios-vanguard
**Mode:** Interactive

---

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_persona | string | Yes | Role or persona to approach |
| offer | string | Yes | Offer or problem-space to position |
| context_signal | string | No | Trigger such as hiring, launch, growth move, or pain indicator |
| desired_next_step | string | Yes | CTA for the sequence |

---

## Steps

### 1. Define relational context
- Confirm whether this is cold connection, warm follow-up, or post-engagement messaging.
- Keep social tone lighter than email while preserving specificity.
- Downgrade unsupported proof to neutral language.

### 2. Map the sequence
- Create connection request, first message, follow-up 1, follow-up 2, and breakup.
- Tailor language for decisor and influencer when relevant.
- Use context signals only if provided or clearly framed as observation.

### 3. Draft final messages
- Fill `vanguard-linkedin-sequence-tmpl.md`.
- Keep messages concise and human.
- Ensure each step advances relevance instead of pressure.

### 4. Run validation
- Apply `vanguard-quality-checklist.md`.
- Remove hype words and over-ask CTAs.

---

## Veto Conditions

- Sequence sounds like email pasted into LinkedIn.
- Connection note is too long or sales-heavy.
- Messages imply proof or customer success that was not provided.

---

## Output Format

Use `vanguard-linkedin-sequence-tmpl.md`.

---

## Completion Criteria

- Sequence includes connection, follow-ups, and breakup.
- Versioning by persona is explicit when the ICP requires it.
- Tone remains consultative and channel-appropriate.
