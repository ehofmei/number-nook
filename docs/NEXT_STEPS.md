# Number Nook Next Steps

This is the short, authoritative view of the current development priorities. Detailed product and architectural decisions remain in the topic documents linked below; this file should stay concise and be updated whenever priorities materially change.

## Current milestone: collection-directed rewards

The immediate goal is to turn the thirty-one-companion catalog into a rewarding, understandable system that can scale to ten or more collections.

1. **Model and simulate the new capsule economy.** Compare the approved 60-coin Surprise Capsule, 80-coin Collection Capsule, and 100-coin daily practice cap against different play patterns, starter choices, rarity orders, established saves, and future catalog sizes.
2. **Strengthen equipped-companion feedback.** Replace the subtle “By your side” treatment with a prominent themed border or glow, an overlapping paw/check badge, and a direct `Equipped` pill. Communicate the state through text and shape as well as color.
3. **Equip from the reveal screen.** After discovering a companion, offer `Equip {name}` as the primary action and keep `View collection` as a secondary action. Confirm the change in place and apply the companion theme immediately.
4. **Build the Capsule Shelf.** Offer a 60-coin Surprise Capsule covering every eligible unowned companion and an 80-coin duplicate-protected capsule for each incomplete ordinary collection. Show collection progress, theme, price, and a scalable banner treatment.
5. **Carry collection identity through the reveal.** Reuse collection colors, motifs, and portraits on the shelf and during opening. Begin with data-driven CSS and existing art; allow optional custom banner art later.
6. **Add participation rewards.** Grant one free welcome Surprise Capsule after the first completed round, a 5-coin first-qualifying-round daily bonus, and a 15-coin reward for practicing on three different days in a week. Bonuses do not consume the 100-coin practice allowance.
7. **Family-test and retune.** Measure time to early variety, first Rare and Legendary companions, first completed collection, and full-catalog completion before treating prices or rarity weights as settled.

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
