# Trail Quest

Trail Quest is a ten-treasure visual game mode built on Number Nook's existing arithmetic generator. The equipped companion follows a themed path while the player answers the same high-quality addition, subtraction, multiplication, and division problems used elsewhere.

## Game flow

- Every correct answer collects the treasure at the next stop and moves the companion forward.
- A wrong answer records the miss, shows the correction, and serves a fresh problem without moving the companion.
- The trail ends after ten correct answers. Because mistakes create extra problems, the results screen reports trail accuracy and detours using every attempted problem.
- Every completed trail participates in ordinary score, Paw Coin, progress, history, review, backup, and participation-reward systems.
- Trail Quest does not show a timer during play, although response time remains part of the saved question record and existing score calculation.

The ten-stop length is fixed in Game Setup. Operation and difficulty controls remain shared with Quick Game and Practice.

## Content model

Trail content lives in `src/trail/trails.ts`. A `TrailDefinition` contains:

- a stable ID, display name, and destination;
- one landscape board and one portrait board;
- eleven percentage-based route points for each orientation, representing the start and ten stops;
- ten ordered collectible images.

The game component consumes this definition without board-specific logic. Additional trails should use the same interface. A small development-only click-to-place coordinate editor is the preferred next authoring improvement before producing several boards.

Approved source sheets and unused candidates remain in `src/dev/assets`. Full-resolution PNG sources remain available for future revisions, while gameplay imports optimized WebP boards and 256-pixel WebP collectibles from `src/trail/assets`. The optimized pair of boards and twelve-item library stay below 1 MB together and are cached on first use so a previously visited trail remains playable offline.

## Verification inventory

- Select, remember, reload, reset, replay, and review Trail Quest.
- Verify a miss changes the problem but not the stop or current treasure.
- Complete all ten stops and confirm ten distinct treasures, the destination celebration, accurate results, Paw Coins, and saved history.
- Inspect desktop, phone portrait, and phone landscape; rotate during feedback; check overflow, touch targets, focus, keyboard input, reduced motion, and image-loading fallbacks.
- Visit Trail Quest online, reload it offline, and verify both board orientations and collectible assets remain available.
