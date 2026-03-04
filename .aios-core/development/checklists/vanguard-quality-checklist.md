# Vanguard Quality Checklist

```yaml
checklist:
  id: vanguard-quality-checklist
  version: 1.0.0
  created: 2026-03-04
  purpose: "Validate outbound and sales collateral for factual integrity, narrative consistency, and conversion readiness"
  mode: blocking
```

---

## Blocking Checks

- **[VETO] Claims defensible**
  - Check: No metrics, logos, case studies, benchmarks, or promises were invented.
  - Veto if fail: Stop delivery and mark the unsupported statement as missing evidence.
  - Fix: Remove the claim or relabel it as hypothesis/recommendation.

- **[VETO] Fact vs hypothesis visible**
  - Check: Unsupported assumptions are labeled as `[HIPOTESE]`, `[SUGESTAO]`, or `[GAP]`.
  - Veto if fail: Do not ship the asset as final.
  - Fix: Add explicit labels or request the missing inputs.

- **[VETO] CTA is proportional**
  - Check: CTA matches channel, context, and relationship stage.
  - Veto if fail: The asset risks unnecessary friction or false urgency.
  - Fix: Reduce the ask to a smaller next step.

- **[VETO] Narrative is consistent**
  - Check: Problem, mechanism, proof, and CTA do not contradict each other across the asset.
  - Veto if fail: The asset creates confusion instead of trust.
  - Fix: Rewrite around one central narrative spine.

- **[VETO] Output is actionable**
  - Check: The deliverable is ready to send, present, or review.
  - Veto if fail: Do not return outline-only content as final.
  - Fix: Convert bullets into usable copy, slide text, or table structure.

---

## Recommended Checks

- The tone is consultative, senior, and low-hype.
- The language reflects the ICP's role, maturity, and context.
- Each touch or slide adds new value instead of repeating the same point.
- Proof is placed where it reduces skepticism most effectively.
- Breakup or fallback messages remain respectful and commercially useful.

---

## Handoff Rules

- If ICP, market framing, or competitor context is weak, recommend `@analyst`.
- If positioning, scope, or offer logic is unclear, recommend `@pm`.
- If the user needs polished visual design beyond messaging, recommend `@ux-design-expert`.

---

## Approval Rule

Pass only when all blocking checks pass and at least 4 of 5 recommended checks pass.
