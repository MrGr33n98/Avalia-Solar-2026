# Task: Create Multichannel Cadence

**Task ID:** vanguard-create-multichannel-cadence
**Version:** 1.0
**Purpose:** Create a day-by-day multichannel cadence for outbound execution
**Orchestrator:** @aios-vanguard
**Mode:** Interactive

---

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| channels | list | Yes | Confirmed channels to use |
| sequence_goal | string | Yes | Meeting, reply, qualification, or referral |
| target_icp | string | Yes | ICP or persona |
| message_assets | list | No | Existing email, LinkedIn, deck, or call materials |

---

## Steps

### 1. Confirm channel reality
- Use only channels the user explicitly confirmed.
- If recommending extra channels, separate them from the main cadence.
- Align cadence length to realistic outbound rhythm.

### 2. Assign touch purpose
- Define the objective for each day and touch.
- Map channel, angle, and CTA per step.
- Ensure the sequence escalates intelligently rather than randomly.

### 3. Produce the cadence
- Fill `vanguard-multichannel-cadence-tmpl.md`.
- Include day, channel, objective, message angle, asset, and CTA.
- Note where proof and objection handling should appear.

### 4. Validate cadence integrity
- Apply `vanguard-quality-checklist.md`.
- Check that asks are proportional and no channel is overloaded without reason.

---

## Veto Conditions

- Cadence includes unconfirmed channels as if approved.
- Multiple touches repeat the same objective.
- CTA intensity jumps without context.

---

## Output Format

Use `vanguard-multichannel-cadence-tmpl.md`.

---

## Completion Criteria

- Cadence is laid out day by day.
- Each touch has channel, objective, and CTA.
- Recommendations beyond confirmed scope are clearly separated.
