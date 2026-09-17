# The Pondside Pals Collection

Pondside Pals is Number Nook's fifth ordinary collection. It brings ten visibly different animals together around one lively storybook pond, with familiar wildlife, playful movement, and enough fantasy color to make every rarity desirable.

Catalog 2.9 publishes the approved names, identities, rarities, themes, personalities, signature dialogue, pond-specific motifs, ten production Classic SVG portraits, and ten selected Polished Sticker portraits.

## Collection contract

| Decision | Value |
| --- | --- |
| Permanent namespace | `pondside-pals` |
| Player-facing name | Pondside Pals |
| Size | 10 ordinary companions |
| Rarity distribution | 4 Common, 3 Uncommon, 2 Rare, 1 Legendary |
| Catalog release | Dual-style collection in 2.9.0 |
| Art status | Ten production Classic SVGs and ten optimized Sticker WebPs |

> Ten lively neighbors who make one bright pond ripple, hum, paddle, and shine from morning to moonlight.

## Roster

| Rarity | Companion | Animal | Identity | Signature visual read |
| --- | --- | --- | --- | --- |
| Common | Moss | Green frog | Careful listener and springy leaper | Wide eyes, folded legs, lily pad |
| Common | Pebble | Painted turtle | Patient, steady pond crosser | Patterned shell and sunning stone |
| Common | Skim | Pond skater | Silly surface-speed specialist | Six long legs and water dimples |
| Common | Spiral | Pond snail | Thoughtful scenic-route explorer | Large spiral shell and eye stalks |
| Uncommon | Dabble | Mallard duck | Cheerful underwater discoverer | Green head and dabbling tail-up pose |
| Uncommon | Glint | Dragonfly | Sparkling aerial performer | Four clear wings and iridescent body |
| Uncommon | Willow | Beaver | Inventive pond builder | Paddle tail and small stick bridge |
| Rare | Ripple | River otter | Playful swimmer and game maker | Long curved body and curling wake |
| Rare | Lotus | Axolotl | Gentle keeper of drifting ideas | Feathery gills and floating pose |
| Legendary | Opal | Koi | Radiant painter of the pond | Flowing fins and opalescent reflections |

The rarities reflect presentation rather than real-world importance. Familiar small pond creatures anchor the Commons, active or architecturally interesting animals fill Uncommon, the especially expressive otter and axolotl are Rare, and the koi carries the Legendary light-and-color spectacle.

## Personality map

| Companion | Primary / secondary voice | Motion | Motif |
| --- | --- | --- | --- |
| Moss | Thoughtful / playful | Buoyant bob | Lily pad |
| Pebble | Warm / thoughtful | Plush sway | Shell |
| Skim | Playful / adventurous | Curious tilt | Ripple |
| Spiral | Thoughtful / warm | Calm float | Shell |
| Dabble | Playful / warm | Buoyant bob | Feather |
| Glint | Adventurous / dreamy | Cosmic drift | Aurora |
| Willow | Inventive / warm | Brave lean | Reed |
| Ripple | Playful / adventurous | Buoyant bob | Ripple |
| Lotus | Warm / dreamy | Calm float | Bubbles |
| Opal | Dreamy / inventive | Cosmic drift | Ripple |

Catalog 2.9 adds reusable lily-pad, shell, ripple, reed, and bubble CSS motifs. Dabble retains the feather motif and Glint retains aurora because those already reinforce their silhouettes.

## Classic art direction

The Classic set uses recognizable anatomy with brighter storybook colors. Animals may be more expressive and saturated than real wildlife, but the features that identify each animal remain intact. The portraits deliberately vary composition: Moss crouches, Pebble rests in profile, Skim spans the water surface, Spiral travels sideways, Dabble tips underwater, Glint hovers diagonally, Willow builds, Ripple curls through a swim, Lotus floats, and Opal sweeps around the frame.

| Companion | Production Classic anchor | Anatomy guardrail |
| --- | --- | --- |
| Moss | Springy green frog on a notched lily pad | Retain folded rear legs and separated frog eyes; avoid a generic round green face |
| Pebble | Low painted turtle on a sunning stone | Shell must remain the dominant silhouette; use small red painted-turtle markings |
| Skim | Long-legged pond skater standing on visible water dimples | Show all six legs clearly and keep the body slender rather than spider-like |
| Spiral | Side-view pond snail with a large mulberry shell | Retain two eye stalks, a low foot, and one clear shell spiral |
| Dabble | Mallard in a tail-up dabbling pose | Preserve duck body, tail, bill, and waterline even though the head is underwater |
| Glint | Iridescent dragonfly in a diagonal hover | Show exactly four transparent wings and a long segmented body |
| Willow | Beaver building a small stick crossing | Broad paddle tail and front teeth must read without turning the scene into a prop pile |
| Ripple | River otter curling through a playful swimming roll | Use a long flexible torso, small ears, whiskers, and tapering tail |
| Lotus | Pink axolotl floating among bubbles | Show three feathery external gill branches on each side and no fish fins or lizard frill |
| Opal | Koi curving through opalescent ripples | Keep the fish silhouette, paired fins, flowing tail, and restrained Legendary reflections |

## Implementation

- Collection metadata, permanent IDs, descriptions, economy values, themes, art paths, and direction anchors live in `src/content/collections/pondsidePals.ts`.
- Personalities live in `src/companions/personalities/pondsidePals.ts`.
- Three signature lines per companion live in `src/companions/signatures/pondsidePals.ts`.
- Ten SVG portraits and ten optimized Sticker WebPs live under `public/collectibles/` and appear in the playable gallery and Art Lab.
- Pondside-specific motifs are part of the shared personality vocabulary and Companion Lab.
- Automated validation enforces roster size, rarity distribution, unique identities, theme contrast, complete dual-style assets, personality completeness, and dialogue validity.

## Production review workflow

1. Inspect the full-color contact sheet for immediate animal recognition and appealing collection balance.
2. Toggle the locked preview and confirm all ten silhouettes remain distinguishable.
3. Inspect the 96-pixel strip for readable eyes, pose, shell, gills, fins, wings, legs, and tail shapes.
4. Review each theme and motif in Companion Lab for contrast, movement, and visual restraint.
5. Refine any weak Classic portrait before using it as the identity reference for Sticker generation.

Sticker candidates were generated and reviewed one companion at a time. Beginning with a Common that tested wet texture and then moving through unusual anatomy allowed later prompts to preserve species identity, eye variety, full-bleed scenery, and connected limbs more reliably.

## Sticker production

Sticker portraits use full-bleed pond scenery with no dark vignette, black edge, or transparent corner. Eye design should support species identity rather than become a universal mascot template: vary color, size, shape, placement, and surface treatment across the collection while keeping every expression friendly and readable. In particular, insect compound eyes, amphibian eyes, mammal eyes, and fish eyes should not all reuse the same oversized amber iris.

| Companion | Status | Selected source |
| --- | --- | --- |
| Moss | Approved | `src/dev/assets/moss-sticker-v1.png` |
| Pebble | Approved | `src/dev/assets/pebble-sticker-v2.png` |
| Skim | Approved | `src/dev/assets/skim-sticker-v3.png` |
| Spiral | Approved | `src/dev/assets/spiral-sticker-v3.png` |
| Dabble | Approved | `src/dev/assets/dabble-sticker-v2.png` |
| Glint | Approved | `src/dev/assets/glint-sticker-v1.png` |
| Willow | Approved | `src/dev/assets/willow-sticker-v2.png` |
| Ripple | Approved | `src/dev/assets/ripple-sticker-v3.png` |
| Lotus | Approved | `src/dev/assets/lotus-sticker-v3.png` |
| Opal | Approved | `src/dev/assets/opal-sticker-v2.png` |

The approved sources are optimized to 580–768-pixel WebP assets for the playable catalog, preserving 768 pixels wherever the 150 KiB delivery budget allows. The original candidates remain versioned in `src/dev/assets/` so future refinements can compare against the full production history.
