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

## Icon system

`public/icon.svg` is the editable source for ordinary icons and the browser favicon. `public/icon-maskable.svg` is the full-bleed source used where an operating system may crop the icon into a circle, rounded square, or other shape.

The mark uses a large golden cat face, a purple background, and one math sparkle. The silhouette and facial features stay readable at home-screen and browser-tab sizes. A cat remains appropriate for the Number Nook identity even as the collectible catalog expands to other species.

Generated assets are:

| Asset | Use |
| --- | --- |
| `icon-192.png` | Standard manifest icon |
| `icon-512.png` | High-resolution standard manifest icon |
| `icon-maskable-512.png` | Android and other maskable-icon surfaces |
| `apple-touch-icon.png` | iPhone and iPad Add to Home Screen icon |

Regenerate every PNG after editing either SVG source:

```sh
npm run art:pwa-icons
```

The generator uses the repository's Playwright Chromium dependency to render deterministic dimensions without adding an image-processing package.

## Verification

The production PWA test verifies the installed name, colors, icon declarations, PNG dimensions, Apple touch icon, GitHub Pages subpath resolution, service-worker startup, and offline reload. The icon sources and generated PNGs should also be inspected visually at 512px, 192px, and 180px before committing.

Physical-device signoff still requires removing any older installed copy, visiting the newest deployed version online, and adding it to the Home Screen again. iOS may retain an older icon for an existing installation even after the service worker updates the app.
