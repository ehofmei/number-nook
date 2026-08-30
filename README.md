# Number Nook

An offline-first, multiple-choice arithmetic PWA designed for short, engaging practice sessions on phones and tablets.

The first playable vertical slice is implemented. It includes onboarding, a starter companion, configurable mixed-operation rounds, four difficulty levels, scoring and Paw Coins, a duplicate-protected capsule, a collection gallery, equipping companions, local persistence, and offline PWA support.

## Project documents

- [Current next steps](./docs/NEXT_STEPS.md) — the short, authoritative list of active priorities, later work, and explicitly deferred decisions.
- [Research and product design](./DESIGN_RESEARCH.md) — learning research, product principles, game modes, difficulty, scoring, progress, collectible economy, technical options, and confirmed design decisions.
- [Implementation plan](./docs/IMPLEMENTATION_PLAN.md) — delivery sequence, first vertical slice, acceptance criteria, architecture boundaries, and milestone definitions.
- [Testing strategy](./docs/TEST_STRATEGY.md) — testability requirements, automated test layers, visual inspection, accessibility, PWA/device verification, coverage policy, and CI design.
- [PWA identity and installation](./docs/PWA.md) — installed-app naming, icon sources, generated sizes, platform metadata, regeneration, and device checks.
- [Adding collectible content](./docs/ADDING_CONTENT.md) — the catalog, asset, rarity, and validation workflow for new companions.
- [Companion identity, themes, and presence](./docs/COMPANION_SYSTEM.md) — the species-neutral content model, per-companion themes, interface placements, and rollout sequence.
- [Companion personality, dialogue, and motion](./docs/COMPANION_PERSONALITY.md) — phrase contexts, voice profiles, repetition rules, CSS motion and motifs, Companion Lab, safety principles, and the implementation sequence.
- [Collectible art direction](./docs/COLLECTIBLE_ART.md) — the SVG/raster strategy, Art Lab bake-off, style bible, generation workflow, and final-art acceptance criteria.
- [The Nook Neighbors collection](./docs/NOOK_NEIGHBORS.md) — the first ten-cat roster, dual-style character recipes, existing-SVG review, and production sequence.
- [Nook Neighbors Sticker anchors](./docs/NOOK_NEIGHBORS_STICKER_ANCHORS.md) — the first Biscuit and Aurora raster candidates, exact prompts, and approval notes.
- [Nook Neighbors Sticker batch](./docs/NOOK_NEIGHBORS_STICKER_BATCH.md) — the remaining seven first-pass portraits, exact prompts, and collection review notes.
- [Button Bunny Sticker](./docs/BUTTON_BUNNY_STICKER.md) — the first Special Guest raster portrait, exact prompt, reference lineage, and production decision.
- [Economy tuning](./docs/ECONOMY.md) — current Paw Coin earnings, daily limits, capsule pricing, rationale, and safe tuning points.
- [Balance analysis](./docs/BALANCE_ANALYSIS.md) — play-history export fields, comparison workflow, simulation strategy, and controls for stable tuning.
- [Round review and history retention](./docs/PLAY_HISTORY.md) — question review, bounded detailed history, lifetime aggregates, migration, exports, and clearing test data.
- [Save backup and restore](./docs/SAVE_BACKUP.md) — complete local backup contents, safe import confirmation, schema migration, and analysis-export separation.
- [Sound effects, music, and audio labs](./docs/AUDIO.md) — synthesized cue/music architecture, gameplay wiring, device settings, listening workflow, and future options.
- [Problem generation](./docs/PROBLEM_GENERATION.md) — constrained-random session composition, difficulty bands, variety limits, versioning, and acceptance criteria.
- [Addition and subtraction generation](./docs/ADDITION_SUBTRACTION_GENERATION.md) — carrying, borrowing, identity, negative-answer, and variety rules introduced in ruleset version 4.

## Current direction

- React, TypeScript, and Vite.
- Static deployment to GitHub Pages.
- Installable PWA with offline play.
- Addition, subtraction, multiplication, division, and mixed-operation sessions.
- Local player name, progress, mastery, scores, and JSON backup/restore.
- Cat-centered but species-flexible companions, rarity, collection-directed capsules, per-companion themes, and a unified gallery.
- No backend, account, advertising, analytics, or real-money purchases.

## Current status

The complete arithmetic slice supports addition, subtraction, multiplication, division, mixed-operation sessions, Easy through Advanced difficulty, 10–50 question rounds, constrained-random session composition, keyboard and touch input, scoring, Paw Coins, and detailed post-round review. The newest 30 rounds retain question-level history while older play rolls into lifetime aggregates; analysis exports and complete backup/restore support balance testing and device changes.

Catalog version 2.6 contains thirty-one companions: the ten Nook Neighbors, ten Nookside Pups, ten Lantern Lane Cats, and Button Bunny. Every companion has Classic SVG and optimized Sticker art, a theme, personality, signature dialogue, rarity and economy data, gallery presentation, capsule eligibility, and save-stable identity. The dialogue engine contains 188 validated phrases across Home, Game Setup, Round Results, idle Capsule, equip confirmation, and Play History. Development Art, Theme, Companion, Sound, Music, and State labs support focused inspection and experimentation.

The PWA includes install metadata, offline startup, GitHub Pages-safe paths, local persistence, companion-themed presentation, synthesized sound effects, composed menu music, and independent audio settings. Automated coverage includes math composition, rewards, content validation, save migration, history retention, audio scheduling, real-browser components, the complete player journey, accessibility, responsive layouts, install metadata, and production offline reloads. Active development priorities are maintained in [Number Nook Next Steps](./docs/NEXT_STEPS.md).

## Run locally

Node.js 24 is used in CI. Install dependencies and start the development server:

```sh
npm ci
npm run dev
```

Run all required checks before committing:

```sh
npx playwright install chromium
npm run verify
```

Useful focused commands are documented in the [testing strategy](./docs/TEST_STRATEGY.md#standard-commands). Development-only inspection routes include the state gallery at `/?dev=states`, Sound Lab at `/?dev=sounds`, Music Lab at `/?dev=music`, Art Lab at `/?dev=art`, Theme Lab at `/?dev=themes`, and Companion Lab at `/?dev=companions`.

## Deploy

Before the first deployment, open the repository's **Settings → Pages** page and select **GitHub Actions** under **Build and deployment → Source**. This one-time step creates the Pages site used by the deployment action; without it, `actions/configure-pages` returns a `404 Not Found` error.

GitHub Pages is available for public repositories on GitHub Free. A private repository requires a plan that includes Pages for private repositories, such as GitHub Pro; the published site itself is still public for a personal-account project. If the Pages source control is unavailable for a private repository, make the repository public or use an eligible plan.

After Pages is enabled, pushing to `main` runs verification and deploys the app. The deployment workflow can also be run manually from the Actions tab.
