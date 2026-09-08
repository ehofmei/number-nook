# Number Nook Next Steps

This is the short, authoritative view of the current development priorities. Detailed product and architectural decisions remain in the topic documents linked below; this file should stay concise and be updated whenever priorities materially change.

## Current milestone: validate collection-directed rewards

The collection-directed economy is implemented. The immediate goal is to validate its pacing and presentation before treating the values as settled.

1. **Family-test pacing.** Record how many questions it takes to open early capsules, whether the 60/80-coin choice feels meaningful, and whether difficulty bonuses feel fair rather than exploitable.
2. **Validate calendar edges and backup behavior.** Exercise a new local day, a Monday-Sunday boundary, reloads, and export/import after daily, weekly, welcome, and milestone rewards.
3. **Run acquisition simulations.** Compare Surprise and Collection spending across starter choices, rarity orders, established saves, and projected catalogs of five, ten, and more collections.
4. **Polish only where testing finds friction.** Tune prices, multipliers, reward copy, shelf density, or reveal timing from observed play rather than adding another economy system preemptively.

The detailed acquisition and pricing contract is in [Economy Tuning](./ECONOMY.md). Companion presentation requirements are in [Companion Identity, Themes, and Presence](./COMPANION_SYSTEM.md).

## After the reward milestone

1. Add another complete themed companion collection, probably non-cat, using the established dual-art workflow.
2. Resume math-mode development in this order: untimed Practice with retries and optional hints, Time Rush, Endless, a daily mixed challenge, and Improvement Duel after enough comparable history exists.
3. Improve progress presentation with per-skill mastery, guided practice suggestions, and clearer long-term improvement views.
4. Return to optional polish such as additional composed music, alternate companion expressions, speech, and collection-completion celebrations after observing family play.

## Deferred decisions

- **Direct companion purchases:** removed from the active roadmap. Collection Capsules provide meaningful choice without eliminating surprise; revisit only if playtesting reveals a clear need.
- **Special Guest structure:** keep the existing collection and acquisition behavior for compatibility. A future content pass may rename or broaden that collection without changing permanent companion IDs.
- **One hundred companions:** a direction rather than an immediate batch. Add complete collections incrementally so art consistency, acquisition pacing, and kid interest can guide each expansion.

## Update rule

When a milestone is completed or priorities change, update this file first, then revise the relevant detailed document. Avoid using this as a session log; it should describe only the current plan.
