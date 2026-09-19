# Trail Quest

Trail Quest is a ten-treasure visual game mode built on Number Nook's existing arithmetic generator. The equipped companion follows a themed path while the player answers the same high-quality addition, subtraction, multiplication, and division problems used elsewhere.

Sunny Meadow is the first and currently only registered level. The runtime is already structured to choose randomly among multiple registered levels, but adding a level is a content-production task with art, route, item, offline, and device-testing requirements—not just another entry in an array.

## Game flow

- Every correct answer collects the treasure at the next stop and moves the companion forward.
- At the start of an adventure, the game chooses an available level and draws ten unique treasures in random order from that level's larger item pool.
- A wrong answer records the miss, shows the correction, and serves a fresh problem without moving the companion.
- The trail ends after ten correct answers. Because mistakes create extra problems, the results screen reports trail accuracy and detours using every attempted problem.
- Every completed trail participates in ordinary score, Paw Coin, progress, history, review, backup, and participation-reward systems.
- Trail Quest does not show a timer during play, although response time remains part of the saved question record and existing score calculation.

The ten-stop length is fixed in Game Setup. Operation and difficulty controls remain shared with Quick Game and Practice.

## Content model

Trail content lives in `src/trail/trails.ts`. The content model separates reusable definitions from a single randomized adventure:

- every `TrailItemDefinition` has a stable ID, display name, image, and a `treasure`, `bonus`, or `challenge` category;
- every `TrailLevelDefinition` has a stable ID, display name, destination, board pair, route pair, and an explicit subset of item IDs allowed on that level;
- `createRandomTrailRun` chooses one available level and shuffles its playable treasure pool, taking ten without replacement;
- the resulting `TrailRunDefinition` keeps both the full level pool for preloading and the ten-item order for the current adventure.

Each level contains:

- a stable ID, display name, and destination;
- one landscape board and one portrait board;
- eleven percentage-based route points for each orientation, representing the start and ten stops;
- an item pool containing at least ten ordinary treasures.

The traveler starts at route point zero, and a correct answer moves it to the following route point before revealing the next item. Landscape items are centered directly on that destination. In portrait, where adjacent route points can be closer than the two sprites are wide, a compact item callout sits beside the path and points to a target centered on the exact destination. Portrait routes must trace the visible path above the answer controls rather than relying on arbitrary item coordinates. Correct and incorrect answer marks are overlays inside their buttons so feedback never changes the answer grid's dimensions.

The game component consumes the selected run without board-specific logic. Registered levels currently have equal selection probability, and treasures are shuffled without replacement. Level weighting, unlock requirements, a level picker, Paw Coin bonuses, and monster difficulty changes would be new product behavior rather than level content. `bonus` and `challenge` are reserved item categories only; the current run builder plays ordinary `treasure` items.

## Art and route contract

Keep approved source sheets and unused candidates in `src/dev/assets`; do not overwrite an approved source while exploring revisions. Gameplay imports optimized WebP assets from `src/trail/assets`.

Each level needs two purpose-built compositions:

- **Landscape board:** a wide scene with a continuous readable route and safe space for the four-answer row. Sunny Meadow is 2055×765 and about 319 KiB.
- **Portrait board:** a tall scene composed independently rather than cropped from landscape, with a continuous route above and between the two answer rows. Sunny Meadow is 1122×1402 and about 380 KiB.

Those dimensions are reference targets, not engine requirements. Preserve enough resolution for high-density phones and tablets, then compare optimized WebP candidates at gameplay size before accepting the smallest visually equivalent version. Board art must not bake in a companion, collectible, answer, number, label, pointer, or other interface element.

Both routes contain exactly eleven `[x, y]` percentage coordinates: the starting position followed by ten destinations. Coordinates are relative to the rendered board and are independent for landscape and portrait. Every point must sit on the visible dirt, bridge, stepping stone, or equivalent traversable feature. The route should read as forward progress, avoid the answer controls, and end at the illustrated destination.

Landscape treasures are centered directly on the next destination. In portrait, where adjacent route points can be closer than the sprites are wide, the item appears in a nearby callout whose pointer remains centered on the exact destination. This means route coordinates always describe where the companion will stand, never merely where the item art looks convenient.

New item art follows the existing `trail-collectible-<id>-v<revision>.webp` convention. The current sprites are transparent 256×256 WebPs, roughly 12–21 KiB each. Add every item to `TRAIL_ITEM_LIBRARY` with a permanent ID and category, then reference those IDs from levels. A level's `itemIds` must be unique and must resolve to at least ten items currently categorized as `treasure`.

## Adding another level

Use this sequence so a new board remains a small content addition instead of introducing level-specific rendering code.

1. **Define the level before generating art.** Choose its stable ID, display name, destination, visual theme, path landmarks, and intended item subset. Decide whether existing treasures are sufficient; new mechanics such as coins or monsters are separate work.
2. **Generate and approve both boards.** Produce independent landscape and portrait candidates with the same destination and visual identity. Confirm a continuous route is visible in each orientation and that interface-safe areas exist. Preserve approved full-resolution sources in `src/dev/assets`.
3. **Optimize and name gameplay assets.** Export versioned WebPs to `src/trail/assets` using names beginning with `trail-`, such as `trail-quest-<level>-v1.webp` and `trail-quest-<level>-portrait-v1.webp`. The `trail-` prefix currently makes the production service worker recognize the files as trail art.
4. **Author both routes visually.** Create eleven points per orientation. The preferred next authoring tool is a development-only click-to-place coordinate editor; until it exists, use a numbered overlay and inspect all points together. Then play through all ten stops and inspect the companion plus the item pointer at each stop. Do not infer portrait points from landscape coordinates.
5. **Register the content.** Import the two board assets in `src/trail/trails.ts`, add one `TrailLevelDefinition`, and append it to `TRAIL_LEVELS`. Add new item definitions to `TRAIL_ITEM_LIBRARY` first, then give the level an explicit `itemIds` subset. Do not add board-specific conditions to `TrailQuestPlay`.
6. **Extend deterministic coverage.** Keep route length, unique IDs, and minimum playable-pool checks in `src/trail/trails.test.ts`. Lock art-specific route coordinates in a focused regression test after visual approval, and add asset-dimension validation if the new exports depart from the established board or 256-pixel item conventions. Make the Trail Quest Lab able to select or explicitly receive the new level so visual tests do not depend on which level the random source happened to choose.
7. **Revisit offline capacity.** Trail art is cached on demand by the `number-nook-trail-art-v1` runtime cache in `vite.config.ts`, currently capped at 20 entries. Count the unique board and item files that must remain available and raise `maxEntries` before the new library can exceed that limit. Entering a level preloads that level's two boards and full item pool, but it does not currently warm every registered level. Therefore the existing guarantee is only that a level previously entered online remains available offline. If every random level must work after one online visit, implement and test preloading for all registered levels before shipping multiple levels.
8. **Update the PWA test.** The current end-to-end offline check expects Sunny Meadow's two boards plus twelve items, or 14 cached assets. Replace that single-level assumption with deterministic coverage for the new level and the chosen multi-level preload policy. Verify GitHub Pages subpath URLs as well as local preview URLs.
9. **Run the device matrix.** Inspect representative desktop, phone portrait, phone landscape, and tablet sizes. Test the initial point, all ten destinations, correct and incorrect feedback, rotation during feedback, destination presentation, keyboard focus, touch targets, clipping, overflow, image loading, and reduced motion. Check screenshots in addition to numeric bounds.

A level is complete only when both approved boards, both audited routes, its playable item subset, randomized selection, production asset routing, offline behavior, automated coverage, and the full device visual pass are all in place.

## Verification inventory

- Select, remember, reload, reset, replay, and review Trail Quest.
- Verify a miss changes the problem but not the stop or current treasure.
- Start repeated adventures and confirm the ten treasures are unique within each run and vary in order and membership across runs.
- Complete all ten stops and confirm the destination celebration, accurate results, Paw Coins, and saved history.
- For every registered level, audit the start and all ten route destinations against both board images; in portrait, inspect both the companion and the pointer target.
- Inspect desktop, phone portrait, and phone landscape; rotate during feedback; check overflow, touch targets, focus, keyboard input, reduced motion, and image-loading fallbacks.
- Visit each supported offline level online, reload it offline, and verify both board orientations and its full item pool remain available under the documented preload policy.
