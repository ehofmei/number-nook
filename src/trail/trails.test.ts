import { describe, expect, it } from 'vitest';
import { SeededRandom, type RandomSource } from '../domain/random';
import {
  createRandomTrailRun,
  MEADOW_LEVEL,
  TRAIL_ITEM_LIBRARY,
  TRAIL_LEVELS,
  TRAIL_QUEST_LENGTH,
  type TrailLevelDefinition,
} from './trails';

describe('Trail Quest content', () => {
  it('provides valid routes and a larger unique item pool for every level', () => {
    const knownItemIds = new Set(TRAIL_ITEM_LIBRARY.map(({ id }) => id));

    for (const level of TRAIL_LEVELS) {
      expect(level.landscapeRoute).toHaveLength(TRAIL_QUEST_LENGTH + 1);
      expect(level.portraitRoute).toHaveLength(TRAIL_QUEST_LENGTH + 1);
      expect(
        Math.max(...level.portraitRoute.map(([, y]) => y)) -
          Math.min(...level.portraitRoute.map(([, y]) => y)),
      ).toBeGreaterThanOrEqual(35);
      expect(level.itemIds.length).toBeGreaterThan(TRAIL_QUEST_LENGTH);
      expect(new Set(level.itemIds).size).toBe(level.itemIds.length);
      expect(level.itemIds.every((id) => knownItemIds.has(id))).toBe(true);
    }
  });

  it('gives every item a stable unique identity and asset', () => {
    expect(new Set(TRAIL_ITEM_LIBRARY.map(({ id }) => id)).size).toBe(TRAIL_ITEM_LIBRARY.length);
    expect(new Set(TRAIL_ITEM_LIBRARY.map(({ name }) => name)).size).toBe(
      TRAIL_ITEM_LIBRARY.length,
    );
    expect(new Set(TRAIL_ITEM_LIBRARY.map(({ src }) => src)).size).toBe(TRAIL_ITEM_LIBRARY.length);
  });

  it('keeps every Sunny Meadow portrait stop on its audited dirt-and-bridge route', () => {
    expect(MEADOW_LEVEL.portraitRoute).toEqual([
      [43, 54],
      [42, 51],
      [40, 48],
      [40, 45],
      [45, 42],
      [54, 39],
      [63, 37],
      [68, 33],
      [73, 29],
      [80, 24],
      [85, 18],
    ]);
  });

  it('selects ten unique level items deterministically from a larger pool', () => {
    const first = createRandomTrailRun(new SeededRandom(42));
    const replay = createRandomTrailRun(new SeededRandom(42));
    const differentRun = createRandomTrailRun(new SeededRandom(43));

    expect(first.id).toBe(MEADOW_LEVEL.id);
    expect(first.items).toHaveLength(TRAIL_QUEST_LENGTH);
    expect(new Set(first.items.map(({ id }) => id)).size).toBe(TRAIL_QUEST_LENGTH);
    expect(first.items.map(({ id }) => id)).toEqual(replay.items.map(({ id }) => id));
    expect(first.items.map(({ id }) => id)).not.toEqual(differentRun.items.map(({ id }) => id));
    const meadowItemIds = new Set<string>(MEADOW_LEVEL.itemIds);
    expect(first.items.every((item) => meadowItemIds.has(item.id))).toBe(true);
  });

  it('uses the random source to choose among registered levels', () => {
    const secondLevel: TrailLevelDefinition = {
      ...MEADOW_LEVEL,
      id: 'second-test-level',
      name: 'Second Test Level',
    };
    const chooseSecond: RandomSource = {
      next: () => 0,
      integer: () => 0,
      pick: <T>(values: readonly T[]) => values.at(-1)!,
      shuffle: <T>(values: readonly T[]) => [...values],
    };

    expect(createRandomTrailRun(chooseSecond, [MEADOW_LEVEL, secondLevel]).id).toBe(secondLevel.id);
  });

  it('rejects a level without enough playable treasure items', () => {
    const undersizedLevel: TrailLevelDefinition = {
      ...MEADOW_LEVEL,
      id: 'undersized-test-level',
      itemIds: MEADOW_LEVEL.itemIds.slice(0, TRAIL_QUEST_LENGTH - 1),
    };

    expect(() => createRandomTrailRun(new SeededRandom(1), [undersizedLevel])).toThrow(
      'needs at least 10 playable treasures',
    );
  });
});
