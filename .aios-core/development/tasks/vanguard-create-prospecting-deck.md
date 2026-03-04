# Task: Create Prospecting Deck

**Task ID:** vanguard-create-prospecting-deck
**Version:** 1.0
**Purpose:** Create a concise prospecting deck for early commercial conversations
**Orchestrator:** @aios-vanguard
**Mode:** Interactive

---

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| target_icp | string | Yes | ICP or audience for the meeting |
| offer | string | Yes | Offer being presented |
| proof_points | list | No | Confirmed proof available |
| objective | string | Yes | What the deck should achieve |

---

## Steps

### 1. Define meeting purpose
- Clarify whether the deck supports first meeting, qualification, or follow-up.
- Choose the minimum number of slides needed to move the conversation forward.
- Avoid company vanity content unless it reduces risk.

### 2. Structure the narrative
- Sequence slides from pain to mechanism to proof to CTA.
- Place proof where skepticism peaks.
- Keep each slide to one message.

### 3. Draft slide guidance
- Fill `vanguard-prospecting-deck-tmpl.md`.
- Include slide title, main message, supporting bullets, and suggested proof.
- Call out any slide content that depends on missing evidence.

### 4. Validate deck quality
- Apply `vanguard-quality-checklist.md`.
- Remove unsupported market leadership or ROI claims.

---

## Veto Conditions

- Slide sequence is company-centric instead of buyer-centric.
- Proof slide contains invented numbers or logos.
- CTA asks for a bigger step than the meeting context justifies.

---

## Output Format

Use `vanguard-prospecting-deck-tmpl.md`.

---

## Completion Criteria

- Deck is structured slide by slide.
- Each slide has one clear commercial job.
- Proof and CTA are positioned intentionally.
