# Economy Tuning

The economy is deliberately small, transparent, local-only, and easy to rebalance after family play-testing. Paw Coins can never be bought with real money.

## Current values

| Rule | Value |
| --- | ---: |
| Correct answer | 1 coin |
| At least 80% accuracy | 2 bonus coins |
| Perfect round | 3 additional bonus coins |
| Completely incorrect round | 0 coins |
| Maximum session earnings for 10 correct answers | 15 coins |
| Daily earning cap | 30 coins |
| Duplicate-protected capsule | 60 coins |

A player therefore needs four perfect ten-question rounds to afford one capsule, spread across at least two local calendar days. The cap limits newly earned coins; it never removes an existing balance. Opening a capsule and any future purchases do not reduce the day's earning allowance.

When the daily cap is reached, practice, scores, accuracy, and saved progress continue normally. The results screen awards only the remaining allowance and uses neutral language when today's Paw Coin pouch is full.

## Rationale

- Accuracy must matter: rapidly submitting wrong answers earns no currency.
- Struggling players still earn one coin for every correct answer and never lose coins for mistakes.
- The small accuracy bonuses recognize careful rounds without making one perfect round worth a capsule.
- A daily maximum keeps repeated short sessions from immediately exhausting the collection.
- Duplicate protection means every capsule still has substantial value.

These are initial play-test values, not permanent balance claims. The relevant constants are `CAPSULE_COST` and `DAILY_COIN_CAP` in `src/domain/rewards.ts`; the session formula is in `src/domain/session.ts`.

## Kid-ready expansion checkpoint

The catalog has reached thirty-one companions and supports complete themed collections. The next economy milestone replaces the single global capsule presentation with two duplicate-protected choices:

| Capsule | Eligible pool | Planned cost |
| --- | --- | ---: |
| Surprise Capsule | Every eligible unowned companion | 60 coins |
| Collection Capsule | Eligible unowned companions in one selected ordinary collection | 80 coins |

The Surprise Capsule is the best-value broad discovery option. A Collection Capsule charges a moderate premium for meaningful control while preserving rarity-weighted surprise. Both selectors use the existing per-companion capsule weights after filtering their eligible pools.

Collection Capsule behavior:

- show one selectable capsule card for each incomplete ordinary collection;
- display the collection theme, description, price, and owned count such as `3/10 found`;
- disable a collection when all capsule-eligible members are owned and celebrate it as complete;
- keep Special Guests available through the Surprise Capsule for now rather than turning a one-member collection into a discounted direct purchase;
- scale from current collection metadata rather than hard-coded collection IDs;
- carry the selected collection's colors, motifs, and banner treatment into the opening sequence.

The planned daily practice cap is **100 coins**. At the unchanged current round payout, approximately four perfect ten-question rounds buy a Surprise Capsule and six buy a Collection Capsule. Reaching the daily cap guarantees enough currency for either choice and leaves a useful remainder. The cap still applies only to coin earnings: players may continue practicing, improving scores, and recording progress afterward.

Before regular family play, add one free welcome Surprise Capsule after the first completed round. It should:

- award one unowned eligible companion through the normal weighted selector;
- cost no Paw Coins and leave the daily earning allowance unchanged;
- occur only once per save, including after reload and backup restore;
- use the normal reveal, ownership, history, sound, and accessibility behavior;
- remain separate from daily and weekly bonuses.

Add two small participation rewards:

- **Daily:** 5 coins after the first qualifying round of the local day. A qualifying round requires at least five correct answers so rapidly submitting incorrect answers does not earn it.
- **Weekly:** 15 coins after qualifying practice on three different local days in the same week.

These bonuses do not consume the 100-coin practice allowance. They are bounded by date, persist through reload and backup, and never punish a missed day or announce a broken streak.

Run deterministic acquisition simulations before implementing final constants. Cover different starter choices, rarity orderings, Surprise-versus-Collection spending strategies, established saves, and projected catalogs of five, ten, and more collections. Measure time to early variety, first Rare, first Legendary, first completed collection, and complete-catalog ownership. Use those results and family play data before considering pity guarantees, price changes, or other acquisition systems.

## Capsule interface and history

The capsule screen becomes a scalable **Capsule Shelf** rather than a single machine. Each card uses collection colors, existing portraits, progress, and a concise themed banner. The first implementation should generate banners from catalog data, CSS, and existing art; optional bespoke banner assets may be added later without changing reward logic.

After a reveal, `Equip {name}` is the primary action and `View collection` remains secondary. Equipping applies the companion theme immediately and confirms the new state without leaving the reveal screen.

Capsule history and analysis exports should record:

- capsule kind (`surprise`, `collection`, or `welcome`);
- selected collection ID when applicable;
- actual coin cost;
- selected companion and rarity;
- owned count and eligible-pool size before opening.

This preserves the data needed to compare acquisition strategies and migrate old capsule transactions safely.

## Save behavior

Save schema version 2 added the local date and number of coins earned on that date. Version 3 added reproducible question snapshots and capsule transaction history for balance analysis. Version 4 keeps the newest 30 rounds in detail and rolls older rounds into compact lifetime statistics. Version-1, version-2, and version-3 saves migrate automatically and keep their prior balance, settings, collection, and meaningful progress. Previously accumulated coins are intentionally not reduced retroactively.

Direct companion purchasing is removed from the active roadmap. Collection Capsules provide targeting without eliminating surprise or adding a separate shop economy. Revisit direct purchase only if family playtesting exposes a problem that collection selection cannot solve. Continue revisiting the daily cap, both capsule prices, rarity weights, and catalog size together rather than tuning one in isolation.
