# Number Nook repository guidance

Before making changes, read `README.md` and `docs/NEXT_STEPS.md`, then consult only the subsystem documents relevant to the requested work. Treat `docs/NEXT_STEPS.md` as the authoritative development priority list.

Preserve the local-first, static GitHub Pages architecture and the existing domain boundaries. Use the repository's documented commands and run `npm run verify` before handing off substantial changes when practical.

## Browser and PWA QA

- For ordinary UI iteration and visual inspection, use the Vite development server so an older service worker cannot serve stale CSS or JavaScript.
- Use a production build and preview in a fresh or isolated browser context for manifest, install, update, cache, GitHub Pages subpath, and offline checks.
- If the live page disagrees with the current source or built assets, inspect the loaded/computed state and suspect an older service worker before changing correct code. A normal reload may not replace a service-worker-controlled page.
- If Chromium or a local test server is blocked by the Codex sandbox, retry through the normal approval/escalation path rather than reporting browser testing as unavailable.
