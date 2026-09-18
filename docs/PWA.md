# PWA Identity and Installation

Number Nook is a static, offline-first PWA intended to feel like a small installed app on family phones and tablets. The install identity is deliberately independent of the repository name.

## Installed identity

- Full and short name: **Number Nook**.
- Theme color: Number Nook purple (`#5433ed`).
- Launch background: warm cream (`#fff8ee`).
- Display mode: standalone, with portrait and landscape both allowed.
- Categories: education and games.
- Description: friendly arithmetic practice with Paw Coins and collectible companions.

The HTML title, application metadata, manifest, and Apple home-screen title all use the same product name. Asset links use Vite's base-path placeholder so icons resolve both locally and under the `/number-nook/` GitHub Pages path.

The existing `first-math-game:*` local-storage keys are intentionally retained as stable legacy identifiers. Renaming them would strand saves and audio preferences already stored on devices; their internal names are not visible in the interface.

The Settings screen displays the deployed GitHub Actions build number and the first seven characters of its commit SHA. The Pages workflow injects both values at build time so a family tester can distinguish a newly activated service worker from an older installed copy. Local development and production builds identify themselves as local instead of imitating a deployed build.

## Icon system

`src/assets/app-icon-source.png` is the approved high-resolution source for every installed-app icon and the browser favicon. The source uses the polished Sticker-art direction: a cheerful golden kitten peeking over large `+`, `×`, and `=` tiles on a full-bleed purple background.

The whole kitten-and-tiles group stays inside a conservative maskable safe area so circles and rounded-square crops retain both ears, paws, and all three math symbols. A cat remains appropriate for the Number Nook identity even as the collectible catalog expands to other species.

Generated assets are:

| Asset | Use |
| --- | --- |
| `icon-192.png` | Standard manifest icon |
| `icon-512.png` | High-resolution standard manifest icon |
| `icon-maskable-512.png` | Android and other maskable-icon surfaces |
| `apple-touch-icon.png` | iPhone and iPad Add to Home Screen icon |

Regenerate every PNG after replacing the approved PNG source:

```sh
npm run art:pwa-icons
```

The generator uses the repository's Playwright Chromium dependency to render deterministic dimensions without adding an image-processing package. Keep exploratory candidates in `src/dev/assets`; only copy an approved design to `src/assets/app-icon-source.png`.

## Verification

The production PWA test verifies the installed name, colors, icon declarations, PNG dimensions, Apple touch icon, GitHub Pages subpath resolution, service-worker startup, and offline reload. The icon sources and generated PNGs should also be inspected visually at 512px, 192px, and 180px before committing.

Physical-device signoff still requires removing any older installed copy, visiting the newest deployed version online, and adding it to the Home Screen again. iOS may retain an older icon for an existing installation even after the service worker updates the app.
