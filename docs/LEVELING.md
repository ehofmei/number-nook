# Nook Levels

Nook Levels provide a simple, permanent measure of how much rewarded practice a player has completed. They complement companion collection and skill-specific progress: collection shows what the player has found, future mastery views show what the player is learning, and Level shows the player's overall journey through Number Nook.

This is the final planned player-facing progression feature before the initial release. It must remain small, understandable, local-first, and independent of the companion economy.

## Player-facing contract

- Every player begins at **Level 1**.
- Earning Paw Coins advances the player's level by the same amount. The interface does not name or display a separate experience currency.
- Spending Paw Coins never reduces level progress.
- Levels do not unlock arithmetic, modes, companions, rewards, or gameplay advantages.
- Level is a record of rewarded practice and participation, not a claim about mathematical ability.
- The initial level range is **1 through 100**.
- Reaching a new level receives a clear celebration on the results screen.
- The Home screen always shows the current level and progress toward the next one.

The interface should say **Level**, **Level progress**, and **progress to Level {n}**. It should not introduce `XP`, experience points, another balance, or explanations such as “one coin equals one XP.” The connection should be understandable from the results animation without adding another economy concept.

## Progression curve

The Paw Coins needed to advance from the current level are:

```text
coinsToNextLevel(level) = 50 + 5 × (level - 1)
```

The lifetime Paw Coins needed to reach a level are:

```text
coinsToReachLevel(level) = (level - 1) × (100 + 5 × (level - 2)) / 2
```

Representative milestones:

| Level reached | Lifetime Paw Coins earned | Cost of the next level |
| ---: | ---: | ---: |
| 1 | 0 | 50 |
| 5 | 230 | 70 |
| 10 | 630 | 95 |
| 25 | 2,580 | 170 |
| 50 | 8,330 | 295 |
| 100 | 29,205 | Maximum level |

The linear increase makes the first levels arrive quickly while the total curve grows enough to remain useful after the companion catalog is complete. The curve must live in pure domain helpers with boundary tests rather than being repeated in components.

## What advances a level

All Paw Coins actually awarded at round completion count toward lifetime level progress:

- correct-answer coins;
- the difficulty adjustment;
- accuracy and perfect-round bonuses;
- daily and weekly participation bonuses;
- any future award that is intentionally included in the round's final `coinsEarned` total.

The following do not advance a level:

- score;
- retries, hints, or recap answers that do not award Paw Coins;
- opening a free Welcome Capsule;
- spending Paw Coins;
- receiving or equipping a companion;
- developer or import corrections that change the spendable coin balance without representing earned round rewards.

Round completion must update the spendable balance and the lifetime earned total in the same save transaction. The final `coinsEarned` value is the single source for both increments, so the two systems cannot disagree about what the round awarded.

## Saved model and lifecycle

Persist a nonnegative integer lifetime total, preferably named `lifetimeCoinsEarned`. Derive the current level, current-level progress, next threshold, and percentage from that total; do not persist those derived values.

- Capsule purchases modify `coins` but never `lifetimeCoinsEarned`.
- Clearing play statistics preserves `lifetimeCoinsEarned`, just as it preserves currency and companions.
- A complete backup exports and restores it.
- Starting over with a new player resets it to zero.
- The analysis export includes the lifetime total and derived current level so progression pacing can be evaluated without the player's name.
- Continue increasing the lifetime total after Level 100. The visible level remains 100, but retaining the uncapped total allows a later cap extension without losing progress.

This feature is being added before the game is shipped, so existing development saves do not need retroactive progress. When the save schema advances, saves from earlier schemas may initialize `lifetimeCoinsEarned` to zero. Existing schema migrations and import validation should otherwise remain supported.

## Home presentation

Place the level treatment directly below `{player}'s Number Nook` in the left side of the Home header. This connects the level to the player rather than to the equipped companion and avoids crowding the audio and Paw Coin controls.

The treatment contains:

- `Level {current}` as the primary label;
- a horizontal progress bar;
- `{percent}% to Level {next}` as the supporting label.

At Level 100, show a full bar and **Level 100 · Nook Legend** instead of another target. Do not expose the hidden overflow total in the ordinary interface.

The Home bar reflects saved progress immediately and does not animate on initial page load. Its fill may use the equipped companion theme, but text and track contrast must remain stable across every theme.

## Results presentation and animation

Every completed round shows a compact Level progress section beneath the main result metrics. Its normal state identifies the current level and shows the updated bar.

The sequence should make the relationship to Paw Coins apparent without explaining an experience conversion:

1. Present and tally the Paw Coins earned by the round.
2. Begin the Level bar at its pre-round position.
3. Animate the earned progress into the bar.
4. When a threshold is crossed, fill the current bar, advance the level number, reset the bar, and continue toward the final position.
5. Finish with the saved post-round level and percentage.

Use a short, readable animation rather than matching one animation step to every coin. Aim for roughly 700–1,200 ms for an ordinary increase and cap the complete sequence around 1,800 ms when several early levels are crossed. Exact timing may be tuned during browser QA.

When at least one level is crossed, show a system-owned announcement:

- one level: **Level up! You reached Level {n}.**
- several levels: **You climbed {count} levels! You're now Level {n}.**

The final announcement is the live-region event; intermediate bar frames and level numbers must not produce repeated screen-reader announcements. Play one restrained level-up sound even when several levels are crossed. Existing sound preferences apply.

The equipped companion's results dialogue may react to a level-up, but it must not be the only indication. Level-up eligibility should be represented as a result fact, with the system announcement remaining exact and dependable.

If a daily Paw Coin milestone and a level-up occur after the same round, present both within one progress-celebration area instead of stacking equally prominent banners. Neither achievement should hide the other.

With reduced motion enabled, skip the staged fill/reset animation and render the final bar immediately before showing the announcement. The information and celebration remain available without movement.

## Play History presentation

Add a full-width level summary near the top of Play History, above the existing rounds, accuracy, score, and questions overview. It uses the same current level, progress bar, and next-level wording as Home. This is the detailed home for long-term level progress; individual history rows do not need to repeat the player's level.

## Places that do not show Level

Do not add level status to:

- active arithmetic play;
- game setup;
- the Capsule Shelf, where current Paw Coins matter;
- the collection gallery, where collection completion matters;
- Settings or backup controls.

Keeping Level out of these views prevents it from becoming a persistent status overlay or competing with the purpose of each screen.

## Accessibility and interaction requirements

- Use a semantic progress bar with current, minimum, and maximum values representing progress within the current level.
- Give it an accessible name such as `Level 12, 68 percent progress to Level 13`.
- At Level 100, announce `Level 100, maximum level` and expose a full bar.
- Do not rely on color, motion, or sound to communicate a level-up.
- Keep text readable at realistic phone and tablet widths without clipping the player name or Home controls.
- Honor reduced motion and the existing effects-volume and mute settings.
- Moving progress must not steal focus or delay access to the results actions.

## Verification

Pure domain tests should cover:

- Level 1 at zero lifetime coins;
- the coin immediately before, at, and after several thresholds;
- representative milestone totals through Level 100;
- clamping the visible level at 100 while the lifetime total continues increasing;
- progress percentages and next-level values without floating-point drift.

Save and reward tests should cover:

- every component of `coinsEarned` advancing the lifetime total exactly once;
- capsule spending leaving the lifetime total unchanged;
- clearing play statistics preserving it;
- backup/import round trips and legacy-schema initialization;
- analysis export of the lifetime total and derived level.

Browser and end-to-end tests should cover:

- the Home and Play History level presentations;
- an ordinary results increase without a level-up;
- one and multiple level crossings;
- a combined daily milestone and level-up;
- Level 100 presentation;
- screen-reader labels and live announcements;
- reduced-motion behavior;
- deterministic screenshots at realistic phone and desktop sizes.

Interactive QA should review the animation cadence, themed contrast, long player names, mobile wrapping, focus behavior, muted audio, and whether the Paw Coin tally followed by the bar movement makes the progression relationship understandable without an XP explanation.
