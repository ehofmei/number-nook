# Economy Tuning

The economy is deliberately small, transparent, local-only, and easy to rebalance after family play-testing. Paw Coins can never be bought with real money.

## Current earning model

| Rule | Value |
| --- | ---: |
| Correct answer | 2 base coins |
| Difficulty multiplier | Easy 1.00x; Medium 1.15x; Hard 1.30x; Advanced 1.50x |
| At least 80% accuracy | 2 bonus coins |
| Perfect round | 3 additional bonus coins |
| Completely incorrect round | 0 coins |
| First qualifying round of the local day | 5 bonus coins |
| Three qualifying days in one Monday-Sunday week | 15 bonus coins |
| Daily milestone | Celebrate 100 coins; earnings continue |
| Surprise Capsule | 60 coins |
| Collection Capsule | 80 coins |
| Welcome Capsule | Free once, after the first completed round |

A player who answers eight of ten Easy questions correctly earns 18 coins before participation bonuses. A perfect ten-question round earns 25 Easy, 28 Medium, 31 Hard, or 35 Advanced coins. The calculation appears in an expandable results-screen breakdown.

There is no earning cap. The game records the local day's total and celebrates the first crossing of 100 coins without reducing later rewards. Capsule purchases never change that earned-today total.

## Rationale

- Accuracy must matter: rapidly submitting wrong answers earns no currency.
- Struggling players still earn coins for every correct answer and never lose coins for mistakes.
- The small accuracy bonuses recognize careful rounds without making one perfect round worth a capsule.
- Small daily and weekly bonuses reward returning without punishing missed days or creating a streak that can break.
- Duplicate protection means every capsule still has substantial value.

These are play-test values, not permanent balance claims. Reward constants live in `src/domain/rewards.ts`; the session formula is in `src/domain/session.ts`; capsule transactions live in `src/storage/economy.ts`.

## Round calculation

1. Award **2 base coins for every correct answer**.
2. Multiply those base coins by difficulty and round to the nearest whole Paw Coin.
3. Add **2 coins for at least 80% accuracy**.
4. Add **3 more coins for a perfect round**.

| Difficulty | Multiplier |
| --- | ---: |
| Easy | 1.00× |
| Medium | 1.15× |
| Hard | 1.30× |
| Advanced | 1.50× |

Only correct answers enter the multiplier, so incorrect answers never earn currency. The larger Hard and Advanced multipliers recognize that those questions usually demand more time and effort. Easy is expected to remain the simplest way to earn consistently; the bonus keeps successful higher-difficulty practice from feeling economically useless.

For a ten-question round, the calculation produces:

| Result | Easy | Medium | Hard | Advanced |
| --- | ---: | ---: | ---: | ---: |
| 7 correct | 14 | 16 | 18 | 21 |
| 8 correct | 18 | 20 | 23 | 26 |
| Perfect | 25 | 28 | 31 | 35 |

The multiplier applies before accuracy and perfect-round bonuses. For example, eight correct Hard answers earn `16 × 1.30 = 20.8`, rounded to 21, plus the 2-coin accuracy bonus for a total of 23.

### Visible reward breakdown

The results screen provides a concise **How you earned it** breakdown:

- correct-answer base coins;
- the named difficulty multiplier and resulting rounded amount;
- accuracy and perfect-round bonuses when earned;
- daily or weekly participation bonuses when earned;

The main results card stays simple and celebratory, while the arithmetic lives in expandable detail. History and analysis exports preserve the components and total awarded.

## Capsule and participation model

The catalog has reached thirty-one companions and supports complete themed collections. The Capsule Shelf offers two duplicate-protected choices:

| Capsule | Eligible pool | Cost |
| --- | --- | ---: |
| Surprise Capsule | Every eligible unowned companion | 60 coins |
| Collection Capsule | Eligible unowned companions in one selected ordinary collection | 80 coins |

The Surprise Capsule is the best-value broad discovery option. A Collection Capsule charges a moderate premium for meaningful control while preserving rarity-weighted surprise. Both selectors use the existing per-companion capsule weights after filtering their eligible pools.

Collection Capsule behavior:

- The shelf shows one capsule card for each ordinary collection.
- Each card displays the collection theme, description, price, and owned count such as `3/10 found`.
- A complete collection is disabled and marked complete.
- Special Guests remain available through the Surprise Capsule rather than becoming a discounted one-member Collection Capsule.
- Cards are generated from collection metadata rather than hard-coded collection IDs.
- The selected collection's colors, motifs, and banner treatment carry into the opening sequence.

Number Nook has no hard daily earning cap. A player who wants to answer another hundred questions continues earning the normal reward. There is no paid currency, shared competitive economy, or finite server inventory to protect.

Instead, **100 coins earned in one local day** is a celebratory daily milestone. Reaching it may trigger a small message or visual flourish, then the counter continues normally—for example, `137 earned today`. It does not reduce later rewards or imply that the player should stop. Continue tracking daily earnings for progress presentation and balance analysis.

One free Welcome Capsule becomes available after the first completed round. It:

- award one unowned eligible companion through the normal weighted selector;
- costs no Paw Coins and does not change the earned-today total;
- occur only once per save, including after reload and backup restore;
- use the normal reveal, ownership, history, sound, and accessibility behavior;
- remain separate from daily and weekly bonuses.

Two small participation rewards complement round earnings:

- **Daily:** 5 coins after the first qualifying round of the local day. A qualifying round requires at least five correct answers so rapidly submitting incorrect answers does not earn it.
- **Weekly:** 15 coins after qualifying practice on three different local days in the same week.

These bonuses are separate entries in the reward breakdown. They are bounded by date, persist through reload and backup, and never punish a missed day or announce a broken streak.

### Expected pacing

The following estimates assume ten-question rounds, count the 5-coin daily bonus toward capsule affordability, and do not count the weekly bonus:

| Typical play | Surprise Capsule | Collection Capsule | Reach the 100-coin milestone |
| --- | ---: | ---: | ---: |
| Easy, 7 correct | 40 problems | 60 problems | 80 problems |
| Easy, 8 correct | 40 problems | 50 problems | 60 problems |
| Medium, 8 correct | 30 problems | 40 problems | 50 problems |
| Hard, 8 correct | 30 problems | 40 problems | 50 problems |
| Advanced, 8 correct | 30 problems | 30 problems | 40 problems |
| Perfect rounds | 20–30 problems | 30 problems | 30–40 problems |

The target experience is approximately **50–60 questions to reach the daily milestone for a typical accurate player**. A struggling Easy player takes longer, while successful Hard or Advanced practice earns a meaningful time-and-effort premium. Exceptional perfect play reaches rewards sooner without allowing wrong-answer spam. Every correct answer continues earning its normal reward after the milestone.

Ten Collection Capsules cost 800 coins and complete a ten-member collection because capsules remain duplicate-protected. A player may spread that practice across many short days or earn several capsules during one unusually enthusiastic session. Simulations should test these estimates against real round histories before the values are treated as final.

Run deterministic acquisition simulations before implementing final constants. Cover different starter choices, rarity orderings, Surprise-versus-Collection spending strategies, established saves, and projected catalogs of five, ten, and more collections. Measure time to early variety, first Rare, first Legendary, first completed collection, and complete-catalog ownership. Use those results and family play data before considering pity guarantees, price changes, or other acquisition systems.

## Capsule interface and history

The capsule screen is a scalable **Capsule Shelf**. Each card uses collection colors, existing portraits, progress, and a concise data-driven themed banner. Optional bespoke banner assets may be added later without changing reward logic.

After a reveal, `Equip {name}` is the primary action and `View collection` remains secondary. Equipping applies the companion theme immediately and confirms the new state without leaving the reveal screen.

Capsule history and analysis exports record:

- capsule kind (`surprise`, `collection`, or `welcome`);
- selected collection ID when applicable;
- actual coin cost;
- selected companion and rarity;
- owned count and eligible-pool size before opening.

This preserves the data needed to compare acquisition strategies and migrate old capsule transactions safely.

## Save behavior

Save schema version 6 stores the welcome-capsule state, daily and weekly participation progress, unlimited daily earnings, and richer capsule events. Versions 1-5 migrate automatically and keep their prior balance, settings, collection, and meaningful progress. Established saves do not receive a retroactive Welcome Capsule, and previously accumulated coins are never reduced.

Direct companion purchasing is removed from the active roadmap. Collection Capsules provide targeting without eliminating surprise or adding a separate shop economy. Revisit direct purchase only if family playtesting exposes a problem that collection selection cannot solve. Continue revisiting the daily milestone, both capsule prices, rarity weights, and catalog size together rather than tuning one in isolation.
