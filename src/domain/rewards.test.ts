import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { catalog } from '../content/catalog';
import { SeededRandom } from './random';
import { calculateRoundCoins, chooseCapsuleReward, eligibleCapsuleRewards } from './rewards';

describe('round coins', () => {
  it.each([
    ['easy', 7, 14],
    ['medium', 7, 16],
    ['hard', 7, 18],
    ['advanced', 7, 21],
    ['easy', 8, 18],
    ['medium', 8, 20],
    ['hard', 8, 23],
    ['advanced', 8, 26],
    ['easy', 10, 25],
    ['medium', 10, 28],
    ['hard', 10, 31],
    ['advanced', 10, 35],
  ] as const)('%s with %i correct earns %i coins', (difficulty, correct, total) => {
    expect(calculateRoundCoins(correct, 10, difficulty).total).toBe(total);
  });

  it('exposes each part of the rounded difficulty calculation', () => {
    expect(calculateRoundCoins(8, 10, 'hard')).toEqual({
      correctAnswerCoins: 16,
      difficultyMultiplier: 1.3,
      difficultyAdjustedCoins: 21,
      difficultyBonusCoins: 5,
      accuracyBonusCoins: 2,
      perfectBonusCoins: 0,
      total: 23,
    });
  });
});

describe('capsule rewards', () => {
  it('never returns an owned collectible while another remains', () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.subarray(catalog.collectibles.map(({ id }) => id)),
        (seed, owned) => {
          const reward = chooseCapsuleReward(catalog.collectibles, owned, new SeededRandom(seed));
          const unowned = catalog.collectibles.filter(
            (item) => item.capsuleEligible && !owned.includes(item.id),
          );
          if (unowned.length === 0) {
            expect(reward).toBeNull();
          } else {
            expect(reward).not.toBeNull();
            expect(owned).not.toContain(reward?.id);
            expect(unowned.map(({ id }) => id)).toContain(reward?.id);
          }
        },
      ),
      { numRuns: 1_000 },
    );
  });

  it('guarantees the only remaining Special Guest', () => {
    const guest = catalog.collectibles.find(({ specialGuest }) => specialGuest);
    expect(guest).toBeDefined();
    const owned = catalog.collectibles.filter(({ id }) => id !== guest?.id).map(({ id }) => id);
    expect(chooseCapsuleReward(catalog.collectibles, owned, new SeededRandom(1))).toEqual(guest);
  });

  it('restricts a collection capsule to that collection without duplicates', () => {
    const collectionId = 'nookside-pups';
    const firstPup = catalog.collectibles.find(
      (collectible) => collectible.collectionId === collectionId,
    );
    expect(firstPup).toBeDefined();
    const eligible = eligibleCapsuleRewards(
      catalog.collectibles,
      firstPup ? [firstPup.id] : [],
      collectionId,
    );
    expect(eligible).not.toContainEqual(firstPup);
    expect(eligible).not.toHaveLength(0);
    expect(eligible.every((collectible) => collectible.collectionId === collectionId)).toBe(true);
    expect(
      chooseCapsuleReward(
        catalog.collectibles,
        firstPup ? [firstPup.id] : [],
        new SeededRandom(8),
        collectionId,
      )?.collectionId,
    ).toBe(collectionId);
  });
});
