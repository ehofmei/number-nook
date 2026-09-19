# Number Nook Next Steps

This is the short, authoritative view of the current development priorities. Detailed product and architectural decisions remain in the topic documents linked below; this file should stay concise and be updated whenever priorities materially change.

## Current milestone: Nook Levels and launch readiness

Nook Levels are implemented as the final planned player-facing feature before the initial release. Level advances automatically with lifetime Paw Coins earned, remains independent of spending and unlocks, and gives completed collectors a lasting progress path. See [Nook Levels](./LEVELING.md) for the curve, interface, animation, persistence, accessibility, and test contract.

1. **Family-test the Level rhythm.** Observe whether early level-ups arrive clearly, whether the coin tally followed by bar movement explains the relationship without XP copy, and whether Level feels motivating without suggesting mathematical rank.
2. **Close only launch-blocking issues.** Keep Level, Trail Quest, rewards, and companion behavior stable unless family testing finds a concrete problem.
3. **Perform the release pass.** Run complete verification plus production PWA, offline, install, update, backup/restore, and GitHub Pages subpath checks before the initial release.

## Active validation: Trail Quest family testing

Trail Quest is implemented as a third playable mode with a responsive meadow board, ten unique treasures, honest attempt tracking, ordinary rewards and history, and a reusable trail definition. See [Trail Quest](./TRAIL_QUEST.md) for the contract. The immediate goal is to validate whether the visual journey adds enough delight without obscuring the mathematics.

1. **Family-test the game loop.** Observe whether ten stops feels satisfying, whether fresh problems after detours feel fair, and whether the treasure animation keeps attention on the equation.
2. **Inspect real devices.** Check phones and tablets in both orientations, especially board loading, item placement, touch targets, rotation during feedback, and the destination celebration.
3. **Authoring follow-up.** If another trail is worthwhile, add a small development-only click-to-place coordinate editor before generating several board pairs.
4. **Keep observing rewards.** Record Trail Quest accuracy and Paw Coin pacing alongside Quick Game and Practice so the visual mode does not become an easier reward path.

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

1. Build Time Rush, then per-skill progress and guided suggestions; consider additional Trail Quest boards, Endless, a daily mixed challenge, and Improvement Duel after enough comparable history exists.
2. Improve progress presentation with per-skill mastery, guided practice suggestions, and clearer long-term improvement views.
3. Return to optional polish such as additional composed music, alternate companion expressions, speech, and collection-completion celebrations after observing family play.

## Deferred decisions

- **Direct companion purchases:** removed from the active roadmap. Collection Capsules provide meaningful choice without eliminating surprise; revisit only if playtesting reveals a clear need.
- **Special Guest structure:** keep the existing collection and acquisition behavior for compatibility. A future content pass may rename or broaden that collection without changing permanent companion IDs.
- **One hundred companions:** a direction rather than an immediate batch. Add complete collections incrementally so art consistency, acquisition pacing, and kid interest can guide each expansion.

## Update rule

When a milestone is completed or priorities change, update this file first, then revise the relevant detailed document. Avoid using this as a session log; it should describe only the current plan.
