# Task: Create Commercial Presentation

**Task ID:** vanguard-create-commercial-presentation
**Version:** 1.0
**Purpose:** Create a broader commercial presentation for consultative selling moments
**Orchestrator:** @aios-vanguard
**Mode:** Interactive

---

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| audience | string | Yes | Audience, committee, or role mix |
| offer | string | Yes | Product or service offer |
| proof_points | list | No | Confirmed evidence |
| meeting_goal | string | Yes | Desired next step or decision |

---

## Steps

### 1. Frame the commercial situation
- Clarify whether the presentation is first-call, second-call, or proposal-stage.
- Identify what the audience must believe by the end.
- List proof limitations before drafting.

### 2. Build the presentation narrative
- Start with current-state pain and stakes.
- Explain the mechanism, not just features.
- Introduce proof, implementation confidence, and next-step CTA.

### 3. Produce the slide outline
- Fill `vanguard-commercial-presentation-tmpl.md`.
- Provide 8-12 slides with title, message, and support bullets.
- Flag missing proof or assumptions inline.

### 4. Validate credibility and flow
- Apply `vanguard-quality-checklist.md`.
- Remove over-claims, generic slogans, and redundant slides.

---

## Veto Conditions

- Presentation cannot explain why change is needed now.
- Proof or implementation confidence is overstated.
- The closing ask is disconnected from the meeting stage.

---

## Output Format

Use `vanguard-commercial-presentation-tmpl.md`.

---

## Completion Criteria

- Presentation has a coherent consultative storyline.
- Evidence posture is transparent.
- Audience can understand pain, mechanism, proof, and next step quickly.
