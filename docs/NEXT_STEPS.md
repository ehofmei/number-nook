# Number Nook Next Steps

This is the short, authoritative view of the current development priorities. Detailed product and architectural decisions remain in the topic documents linked below; this file should stay concise and be updated whenever priorities materially change.

## Current milestone: Practice and collection-directed rewards

Practice Mode and the collection-directed economy are implemented. Practice includes retries, manual/automatic hints, a recap of missed questions, and first-attempt rewards. See [Practice Mode](./PRACTICE_MODE.md) for the contract. The immediate goal is to observe learning and reward pacing before treating the values as settled.

1. **Family-test pacing.** Record how many questions it takes to open early capsules, whether the 60/80-coin choice feels meaningful, and whether difficulty bonuses feel fair rather than exploitable.
2. **Validate calendar edges and backup behavior.** Exercise a new local day, a Monday-Sunday boundary, reloads, and export/import after daily, weekly, welcome, and milestone rewards.
3. **Run acquisition simulations.** Compare Surprise and Collection spending across starter choices, rarity orders, established saves, and projected catalogs of five, ten, and more collections.
4. **Polish only where testing finds friction.** Tune prices, multipliers, reward copy, shelf density, or reveal timing from observed play rather than adding another economy system preemptively.

The detailed acquisition and pricing contract is in [Economy Tuning](./ECONOMY.md). Companion presentation requirements are in [Companion Identity, Themes, and Presence](./COMPANION_SYSTEM.md).

## Completed content build: Garden Winglets

Garden Winglets is complete in catalog 2.8 with ten real backyard and garden bird species, production Classic and Sticker art, themes, personality data, dialogue, and tested per-style fallback. Tuck is a white-breasted nuthatch and Tempo is a red-bellied woodpecker. The roster and production record are in [The Garden Winglets Collection](./GARDEN_WINGLETS.md).

1. Family-test whether the real-species bird collection changes capsule preferences or companion attachment.
2. Note any weak species read or portrait issue found at actual phone and tablet sizes; preserve the approved source files for focused revisions.

## Completed content build: Pondside Pals

Pondside Pals is complete in catalog 2.9 with ten mixed-species companions, production Classic and Sticker art, themes, personality data, dialogue, pond-specific CSS motifs, and tested per-style selection. The production record and anatomy guardrails are in [The Pondside Pals Collection](./PONDSIDE_PALS.md).

1. Family-test whether the mixed-species collection changes capsule preferences or companion attachment.
2. Inspect the Sticker contact sheet and actual phone/tablet gallery sizes for any weak species read or crop before beginning another collection.

## After the current milestones

1. Build on Practice with per-skill progress and guided suggestions, then Time Rush, Endless, a daily mixed challenge, and Improvement Duel after enough comparable history exists.
2. Improve progress presentation with per-skill mastery, guided practice suggestions, and clearer long-term improvement views.
3. Return to optional polish such as additional composed music, alternate companion expressions, speech, and collection-completion celebrations after observing family play.

## Deferred decisions

- **Direct companion purchases:** removed from the active roadmap. Collection Capsules provide meaningful choice without eliminating surprise; revisit only if playtesting reveals a clear need.
- **Special Guest structure:** keep the existing collection and acquisition behavior for compatibility. A future content pass may rename or broaden that collection without changing permanent companion IDs.
- **One hundred companions:** a direction rather than an immediate batch. Add complete collections incrementally so art consistency, acquisition pacing, and kid interest can guide each expansion.

## Update rule

When a milestone is completed or priorities change, update this file first, then revise the relevant detailed document. Avoid using this as a session log; it should describe only the current plan.
