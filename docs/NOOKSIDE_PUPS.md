# The Nookside Pups Collection

This document is the production brief for Number Nook's second ordinary collection and first dog collection. It defines the roster, rarity distribution, character identities, personality directions, Classic SVG requirements, and Polished Sticker requirements.

Catalog 2.3 implements all ten permanent entries, themes, personalities, signature dialogue, general-purpose CSS motifs, and Classic SVG portraits. Sticker requests safely fall back to the matching Classic portrait until the ten Polished Sticker assets are approved.

The collection should prove that a complete non-cat pack can use the existing ownership, capsule, gallery, theme, dialogue, and dual-art systems without dog-specific application logic.

## Collection definition

| Field | Value |
| --- | --- |
| Proposed internal ID | `nookside-pups` |
| Player-facing name | Nookside Pups |
| Kind | Ordinary dog collection |
| Size | 10 companions |
| Setting | The porches, sidewalks, park, library cart, and evening paths around Number Nook |
| Mood | Neighborly, lively, cozy, helpful, and gently adventurous |
| Shared visual idea | Every pup has a favorite way to make the neighborhood brighter |

Player-facing collection description:

> Ten good-hearted pups who turn every walk around Number Nook into a small adventure.

All ten members use `species: "dog"`, are not Special Guests, and may appear in Surprise or Nookside Pups Collection Capsules. None changes the existing set of three starters.

## Rarity distribution

| Rarity | Count | Pups |
| --- | ---: | --- |
| Common | 4 | Poppy, Waffles, Scout, Dot |
| Uncommon | 3 | Clover, Mochi, Rollo |
| Rare | 2 | Echo, Velvet |
| Legendary | 1 | Beacon |

The initial economy values should match the equivalent Nook Neighbors rarities: capsule weights of 60, 25, 10, and 4 and future shop prices of 120, 240, 480, and 840 Paw Coins. Those values are starting assumptions, not a reason to skip acquisition simulations with the expanded catalog.

## Shared character rules

Nookside Pups should feel related by place and tone rather than by wearing matching costumes. Every member needs:

- a silhouette readable at 96 pixels, especially through ear shape, muzzle, coat outline, or body proportion;
- one unmistakable coat pattern or color relationship;
- one large motif that works in both art styles and as a restrained CSS decoration;
- an activity or neighborhood role that does not duplicate a Nook Neighbor's identity;
- a friendly expression without making every character equally energetic;
- a palette that can become an accessible application theme;
- the same permanent identity in Classic and Sticker art.

Breed labels guide appearance, but the player-facing descriptions should emphasize character rather than pedigree. The art may use friendly mixed-breed interpretations when that produces a clearer or cuter design.

## Roster at a glance

| Pup | Rarity | Visual type | Personality/activity | Signature read |
| --- | --- | --- | --- | --- |
| Poppy | Common | Corgi-like | Friendly neighborhood messenger | Upright ears, red satchel, envelope motif |
| Waffles | Common | Golden retriever-like | Cozy game-night host | Golden fluff, checked bandana, game tiles |
| Scout | Common | Beagle-like | Patient finder of lost things | Long ears, tricolor face, winding trail |
| Dot | Common | Dalmatian-like | Rhythmic hopscotch champion | Bold spots, jaunty pose, chalk circles |
| Clover | Uncommon | Shaggy sheepdog-like | Lucky celebration planner | Fluffy fringe, green bow, clover garland |
| Mochi | Uncommon | Shiba-like | Quietly confident tea-break friend | Curled tail, russet cheeks, steam swirl |
| Rollo | Uncommon | Dachshund-like | Rolling-library storyteller | Long silhouette, bookmark scarf, open book |
| Echo | Rare | Husky-like | Joyful neighborhood musician | Cool face mask, alert ears, sound ribbons |
| Velvet | Rare | Poodle-like | Graceful parade designer | Tall curls, plum rosette, flowing ribbon |
| Beacon | Legendary | Bernese mountain dog-like | Gentle guide for evening adventures | Large tricolor silhouette, lantern glow |

## Personality and motion contract

The collection reuses the existing voice and motion vocabulary. New motifs may be added as general companion motifs, never as dog-only UI logic.

| Pup | Primary voice | Secondary voice | Motion | Proposed motif |
| --- | --- | --- | --- | --- |
| Poppy | Warm | Playful | Buoyant bob | Letter |
| Waffles | Playful | Warm | Buoyant bob | Checker |
| Scout | Thoughtful | Adventurous | Curious tilt | Trail |
| Dot | Playful | Adventurous | Brave lean | Chalk |
| Clover | Warm | Inventive | Plush sway | Clover |
| Mochi | Thoughtful | Warm | Calm float | Steam |
| Rollo | Inventive | Thoughtful | Curious tilt | Book |
| Echo | Adventurous | Dreamy | Brave lean | Music |
| Velvet | Playful | Inventive | Plush sway | Ribbon |
| Beacon | Warm | Adventurous | Calm float | Lantern |

Phrases below are identity anchors, not the complete dialogue pool. The shared voice engine should still supply most lines so each companion remains varied across all six contexts.

## Character briefs

### Poppy

- **Proposed ID:** `nookside-pups:poppy`
- **Rarity:** Common
- **Description:** A friendly messenger who always has a little good news to deliver.
- **Identity:** The neighborhood connector: bright, attentive, and delighted to see familiar faces.
- **Coat and silhouette:** Warm red-orange and cream corgi-like coat, large upright ears, short rounded muzzle, and a compact chest.
- **Signature motif:** A coral-red cross-body satchel and one simple cream envelope shape without text or stamps.
- **Palette:** Poppy red, warm cream, golden tan, robin's-egg blue, and deep berry.
- **Classic SVG:** Emphasize the ear-to-body size contrast, broad cream blaze, red satchel strap, and one large envelope motif. Avoid tiny mail pieces or readable addresses.
- **Approved Sticker direction:** A lively three-quarter “special delivery” pose at a robin's-egg-blue garden gate, with one plain envelope held carefully in Poppy's mouth and a simple coral satchel. The selected portrait uses the garden path and warm late-morning light to establish the collection's neighborly storybook setting.
- **Signature line ideas:** “I saved a little hello for you.” “Good news: you made it back to the Nook!” “Let's carry this practice one step at a time.”
- **Alt text target:** A cheerful red-and-cream pup with upright ears and a little messenger satchel.

### Waffles

- **Proposed ID:** `nookside-pups:waffles`
- **Rarity:** Common
- **Description:** A cozy host who believes every practice round deserves a good seat.
- **Identity:** Cheerful, welcoming, and always ready to make room for one more player at game night.
- **Coat and silhouette:** Honey-gold retriever-like coat, floppy ears, broad fluffy cheeks, and warm brown eyes.
- **Signature motif:** A purple-and-cream checked bandana with two large rounded game tiles; no numbers or letters.
- **Palette:** Honey gold, toasted amber, cream, Number Nook purple, and soft mint.
- **Classic SVG:** Use a wide fluffy face, asymmetric floppy ears, a clearly checked bandana, and two simple rounded tiles near the lower edge.
- **Approved Sticker direction:** A lively three-quarter game-night pose in an amber-lit living room, with Waffles turning toward the viewer beside a low table. The broad purple-and-cream checked bandana, asymmetric floppy ears, and exactly two blank rounded tiles keep the cozy-host identity clear without food imagery.
- **Signature line ideas:** “I kept the coziest spot open for you.” “Practice night is officially on!” “We can take this round at your pace.”
- **Alt text target:** A fluffy golden pup wearing a purple checked game-night bandana.

### Scout

- **Proposed ID:** `nookside-pups:scout`
- **Rarity:** Common
- **Description:** A careful finder who notices the clues everyone else walks past.
- **Identity:** Curious and patient rather than fast or daring; Scout enjoys looking twice and finding a sensible path.
- **Coat and silhouette:** Tricolor beagle-like face, long low ears, white muzzle, chestnut eye patches, and a dark crown.
- **Signature motif:** A winding path and one oversized leaf-shaped trail marker on a blue collar.
- **Palette:** Chestnut, charcoal, cream, path blue, and leafy green.
- **Classic SVG:** Let the long ears and tricolor face carry the identity. Use one broad winding line and leaf marker instead of a magnifying glass or detailed detective props.
- **Approved Sticker direction:** A curious low three-quarter pose on a sun-dappled park path, with Scout inspecting one fallen leaf while looking warmly back toward the viewer. The long ears, asymmetric tricolor mask, blue collar, and separate green leaf charm remain readable while the stepping stones quietly reinforce the careful-finder story.
- **Signature line ideas:** “I noticed a good path from here.” “A careful look can find all sorts of things.” “Let's follow this question wherever it goes.”
- **Alt text target:** A thoughtful tricolor pup with long ears and a leafy trail-marker collar.

### Dot

- **Proposed ID:** `nookside-pups:dot`
- **Rarity:** Common
- **Description:** A bouncy rhythm lover who turns the sidewalk into a game.
- **Identity:** Upbeat and physical, with a love of hopping, tapping, and finding patterns in motion.
- **Coat and silhouette:** White Dalmatian-like coat, a few large charcoal spots, one dark ear, one white ear, and a lean jaunty pose.
- **Signature motif:** Three broad coral, aqua, and yellow chalk circles resembling a playful sidewalk course without numbers.
- **Palette:** Chalk white, charcoal, coral, aqua, sunny yellow, and muted purple.
- **Classic SVG:** Use fewer, larger spots rather than confetti-like texture. Tilt one ear and place three large colored chalk loops along the lower background.
- **Approved Sticker direction:** An energetic three-quarter hop in a sunny courtyard, with Dot landing inside the aqua circle while coral and yellow circles complete the curved course. One bouncing dark ear, one mostly white ear, a purple collar, and a limited set of large charcoal spots keep the character readable without dense Dalmatian texture.
- **Signature line ideas:** “I found a fun rhythm for today.” “Hop in whenever you're ready!” “One, two—look at you go!”
- **Alt text target:** A lively white-and-charcoal spotted pup beside colorful sidewalk chalk circles.

### Clover

- **Proposed ID:** `nookside-pups:clover`
- **Rarity:** Uncommon
- **Description:** A shaggy party planner who finds a reason to celebrate small wins.
- **Identity:** Warm, inventive, and delightfully prepared, with lucky details that feel festive rather than magical.
- **Coat and silhouette:** Soft gray-and-cream sheepdog-like coat, rounded fluffy head, one eye peeking through a swept fringe, and a stocky chest.
- **Signature motif:** A leafy-green bow and a simple three-clover garland.
- **Palette:** Soft gray, warm cream, clover green, peach, and berry purple.
- **Classic SVG:** Build the face from a broad shaggy fringe, one clearly visible eye, a green bow, and three large clover shapes. Do not hide both eyes.
- **Approved Sticker direction:** A buoyant three-quarter pose on a peach-lit porch step, with Clover lifting one paw beside the completed three-clover railing garland. The swept fringe keeps one amber eye visible, while the leafy-green bow and large plush gray-and-cream fur shapes preserve the celebration-planner identity without photorealistic texture.
- **Signature line ideas:** “That sounds like something worth celebrating.” “I brought an extra bit of good luck.” “Little wins make lovely decorations.”
- **Alt text target:** A shaggy gray-and-cream pup with a green bow and clover garland.

### Mochi

- **Proposed ID:** `nookside-pups:mochi`
- **Rarity:** Uncommon
- **Description:** A calm companion who knows when a quiet break helps ideas settle.
- **Identity:** Quietly confident, observant, and never hurried; Mochi brings cozy steadiness without feeling sleepy.
- **Coat and silhouette:** Russet-and-cream Shiba-like coat, triangular ears, rounded cheeks, dark almond eyes, and a visible curled tail edge.
- **Signature motif:** A teal collar charm with one broad curling steam shape.
- **Palette:** Russet, rice cream, deep brown, calming teal, and pale peach.
- **Classic SVG:** Use the cream cheek mask and curled tail edge as primary reads. Keep the steam curl large and singular rather than drawing a cup or detailed tea set.
- **Approved Sticker direction:** A softly painted three-quarter pose curled on a woven window-seat cushion, with Mochi tilting toward the player and resting one cream-tipped paw over the prominent curled tail. The clean russet forehead, rounded cream cheek mask, affectionate almond eyes, teal spiral charm, and single warm steam curl preserve a calm but especially lovable silhouette at small size.
- **Signature line ideas:** “We have plenty of room to think.” “A quiet moment can make an idea click.” “Let's settle in and see what you discover.”
- **Alt text target:** A calm russet-and-cream pup with a curled tail and a teal steam-swirled charm.

### Rollo

- **Proposed ID:** `nookside-pups:rollo`
- **Rarity:** Uncommon
- **Description:** A traveling storyteller who brings the little library wherever it is needed.
- **Identity:** Curious, clever, and fond of connecting today's question to yesterday's tale.
- **Coat and silhouette:** Chocolate-and-tan dachshund-like coat, extra-long body suggestion, long drooping ears, slim muzzle, and lively brows.
- **Signature motif:** A golden bookmark scarf and one open-book shape with blank pages.
- **Palette:** Chocolate brown, caramel tan, parchment cream, bookmark gold, and library teal.
- **Classic SVG:** Use a wider horizontal composition than the other portraits, long ears, a gold scarf end shaped like a bookmark, and one broad open book.
- **Approved Sticker direction:** A close, softly painted portrait of Rollo stretched across the cushioned top of a low library-teal cart, with the long dachshund silhouette, two simple wheels, and a softly curved handle making the rolling-library role clear. Rollo looks up with a gentle head tilt while actively reading the single blank open book between the front paws; the golden bookmark scarf rests naturally beside the pages instead of becoming unrelated cargo.
- **Signature line ideas:** “This feels like the start of a good chapter.” “I brought a story—and plenty of bookmarks.” “Let's see what happens on the next page.”
- **Alt text target:** A long chocolate-and-tan pup with a golden bookmark scarf and an open book.

### Echo

- **Proposed ID:** `nookside-pups:echo`
- **Rarity:** Rare
- **Description:** A joyful musician who can turn a happy howl into a neighborhood song.
- **Identity:** Bold and expressive but still gentle; Echo listens as carefully as they perform.
- **Coat and silhouette:** Silver, white, and deep-blue husky-like coat, pointed ears, clear cool face mask, and bright ice-blue eyes.
- **Signature motif:** Two broad blue-violet sound ribbons that echo the curve of the cheeks and ears.
- **Palette:** Silver, snow white, midnight blue, ice blue, and electric violet.
- **Classic SVG:** Preserve strong mask symmetry while using one small asymmetry in the ear or brow for warmth. Make the sound ribbons broad and sparse, not a field of music notes.
- **Approved Sticker direction:** A joyful three-quarter singing pose in a lantern-lit garden at blue hour. One ice-blue ribbon leads around Echo's chest while a thinner violet ribbon follows the same spacious curve like a fading echo; the restrained two-ribbon treatment keeps Echo as the focal point without relying on music notes or notation.
- **Signature line ideas:** “I like the sound of another try.” “Every good song has room to breathe.” “Let's find today's rhythm together.”
- **Alt text target:** A silver-and-blue husky-like pup with bright eyes and glowing sound ribbons.

### Velvet

- **Proposed ID:** `nookside-pups:velvet`
- **Rarity:** Rare
- **Description:** A graceful parade designer who gives every celebration one perfect flourish.
- **Identity:** Stylish, imaginative, and warmly theatrical without becoming fussy or distant.
- **Coat and silhouette:** Deep cocoa poodle-like coat, tall rounded crown, sculpted ear curls, long neck, and warm amber eyes.
- **Signature motif:** A plum rosette and one sweeping coral-to-violet ribbon.
- **Palette:** Deep cocoa, plum, coral rose, warm cream, amber, and violet.
- **Classic SVG:** Create the tallest silhouette in the pack with several large cloudlike curl groups. Use one rosette and one broad ribbon sweep instead of detailed clothing.
- **Approved Sticker direction:** A lively full-body parade-step pose in a warm peach courtyard, with Velvet turning back toward the player while one front paw lifts in a graceful, playful stride. Large cloudlike cocoa curl groups, the tall crown and neck, warm amber eyes, and rounded ankle puffs preserve the poodle silhouette; the single coral-to-violet ribbon is visibly fastened beneath the plum rosette and trails in one clean physical sweep rather than floating independently.
- **Signature line ideas:** “Every good effort deserves a little flourish.” “I saved the grand ribbon for just the right moment.” “Let's make this round feel special.”
- **Alt text target:** A graceful cocoa poodle-like pup with a plum rosette and a sweeping colorful ribbon.

### Beacon

- **Proposed ID:** `nookside-pups:beacon`
- **Rarity:** Legendary
- **Description:** A gentle night guide whose little lantern makes every path feel welcoming.
- **Identity:** The collection's reassuring guardian: large, calm, brave, and more interested in helping than being impressive.
- **Coat and silhouette:** Broad Bernese mountain dog-like silhouette, black coat, rust brows and cheeks, strong white blaze, fluffy chest, and warm brown eyes.
- **Signature motif:** A large brass lantern charm casting one curved pool of golden light.
- **Palette:** Midnight navy, soft black, rust, snowy cream, lantern gold, and evergreen.
- **Classic SVG:** Use the broadest silhouette in the collection, a crisp tricolor face, large lantern charm, and one translucent golden arc. Keep the face brighter than the dark background.
- **Approved Sticker direction:** A dignified three-quarter pose on a deep-blue evening path, with Beacon looking warmly back toward the viewer. A single brass lantern charm casts one curved golden trail into the distance, making the “gentle guide” role immediately readable while preserving the broad tricolor silhouette.
- **Signature line ideas:** “I'll keep a warm light on for you.” “We can find our way one question at a time.” “No path feels quite so long with company.”
- **Alt text target:** A large tricolor pup wearing a glowing brass lantern charm on an evening path.

## Shared Classic SVG direction

The pack uses the established 400-by-400 hand-editable Classic vocabulary, but the dog silhouettes must not become cat heads with rounded ears. Across the contact sheet, visibly vary:

- tall, floppy, asymmetrical, and fringe-covered ears;
- short, broad, long, and masked muzzles;
- round, horizontal, lean, tall, and broad body shapes;
- flat, shaggy, curled, and fluffy coat edges;
- markings that remain part of the character when motifs are hidden.

Use the collection palette to relate the cards: warm sidewalk cream, porch purple, park green, evening blue, and small coral or gold accents. Each portrait can emphasize its own colors without forcing a uniform background gradient.

## Shared Sticker generation layer

Use this layer between the global Sticker instructions and an individual pup's brief:

```text
Collection: Nookside Pups, ten good-hearted neighborhood dogs who turn everyday walks around Number Nook into small adventures.
Shared world: welcoming porches, sidewalks, a small park, a rolling library cart, cozy window seats, and lantern-lit evening paths.
Shared mood: neighborly, lively, cozy, helpful, gently adventurous, family-friendly, cute and stylish rather than babyish.
Shared visual language: polished 2D mobile-game collectible portrait with a clean sticker-like silhouette, controlled storybook warmth, expressive readable eyes, soft dimensional lighting, restrained fur texture, and clear breed-inspired shape language.
Background rule: suggest one neighborhood location with a few large shapes and one character motif; do not create a busy narrative scene.
Consistency rule: match the approved Nook Neighbors portraits for crop, eye treatment, edge treatment, lighting strength, background depth, and 96-pixel readability while giving the pups their own neighborhood palette.
```

Do not use text, logos, bones, paw-print wallpaper, doghouse clichés, duplicate accessories, human hands, clothing-heavy costumes, or photorealistic breed rendering. The collection should feel like ten characters who live in the same illustrated world, not a breed chart.

## Proposed production sequence

1. ~~Review the ten identities together and change any name, role, palette, rarity, or visual overlap before implementation.~~ Completed.
2. ~~Split the current catalog and personality registries into collection-pack modules without changing public exports or save behavior.~~ Completed.
3. ~~Add the Nookside Pups collection metadata, themes, personalities, signature dialogue, and general-purpose motifs.~~ Completed in catalog 2.3.
4. ~~Draw all ten Classic SVGs and review one contact sheet at card size, 96 pixels, locked grayscale, and phone width.~~ Completed for the first draft.
5. ~~Choose three Sticker anchors that stress different shapes and lighting.~~ Completed with Poppy, Echo, and Beacon.
6. Use the approved anchor set to generate the remaining Sticker portraits in small batches.
7. Optimize approved masters, record prompt lineage, and add production assets only after the collection reads coherently.
8. Add personality entries, signature phrases, general-purpose motifs, themes, and catalog economy fields.
9. Verify gallery grouping, art-style switching, theme contrast, dialogue variation, capsule reveal, ownership, backup/restore, offline caching, and phone/tablet layouts.
10. Run deterministic acquisition simulations before changing capsule cost, weights, or guarantee behavior.

## Acceptance criteria

The collection is ready to ship when:

- the roster contains exactly four Common, three Uncommon, two Rare, and one Legendary ordinary dog;
- all ten permanent IDs, names, descriptions, themes, personalities, and alt text pass content validation;
- every pup is identifiable at 96 pixels in both Classic and Sticker art;
- the ten silhouettes remain distinct even in locked grayscale;
- no role or design feels like a dog-shaped copy of an existing Nook Neighbor;
- the collection works through generic collection, species, capsule, shop, gallery, dialogue, theme, and save paths;
- all new motifs remain general-purpose and respect reduced motion;
- production image budgets and offline behavior remain within the existing contract;
- automated tests and interactive desktop, phone, and tablet QA pass.

## Decisions to confirm before art

- Whether all ten proposed names and character roles feel worth collecting.
- Whether the collection should lean more toward recognizable breeds or friendly mixed-breed designs.
- Whether Poppy, Echo, and Beacon are the right Sticker anchors.
- Whether the proposed `nookside-pups` permanent namespace should be locked.
