import { describe, expect, it } from 'vitest';
import { MEADOW_TRAIL, TRAIL_COLLECTIBLE_LIBRARY, TRAIL_QUEST_LENGTH } from './trails';

describe('Trail Quest content', () => {
  it('provides one route segment and one unique treasure for every stop', () => {
    expect(MEADOW_TRAIL.collectibles).toHaveLength(TRAIL_QUEST_LENGTH);
    expect(MEADOW_TRAIL.landscapeRoute).toHaveLength(TRAIL_QUEST_LENGTH + 1);
    expect(MEADOW_TRAIL.portraitRoute).toHaveLength(TRAIL_QUEST_LENGTH + 1);
    expect(new Set(MEADOW_TRAIL.collectibles.map(({ name }) => name)).size).toBe(
      TRAIL_QUEST_LENGTH,
    );
    expect(new Set(MEADOW_TRAIL.collectibles.map(({ src }) => src)).size).toBe(TRAIL_QUEST_LENGTH);
  });

  it('keeps extra approved treasures ready for later trails', () => {
    expect(TRAIL_COLLECTIBLE_LIBRARY.length).toBeGreaterThan(TRAIL_QUEST_LENGTH);
  });
});
