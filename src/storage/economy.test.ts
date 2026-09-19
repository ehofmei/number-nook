import { describe, expect, it } from 'vitest';
import { catalog } from '../content/catalog';
import { SeededRandom } from '../domain/random';
import { createInitialSave } from './save';
import { capsuleCost, openCapsule, type CapsuleChoice } from './economy';

describe('capsule transactions', () => {
  it('opens the one-time welcome capsule for free and records its full context', () => {
    const initial = {
      ...createInitialSave('Ada', 'cozy-cats:sunny'),
      coins: 7,
      rewardProgress: {
        ...createInitialSave('Ada', 'cozy-cats:sunny').rewardProgress,
        welcomeCapsuleStatus: 'available' as const,
      },
    };
    const result = openCapsule(
      initial,
      catalog.collectibles,
      { kind: 'welcome', collectionId: null },
      new SeededRandom(1),
      Date.UTC(2026, 7, 31),
    );
    expect(result.status).toBe('opened');
    if (result.status !== 'opened') return;
    expect(result.save.coins).toBe(7);
    expect(result.save.rewardProgress.welcomeCapsuleStatus).toBe('opened');
    expect(result.save.ownedCollectibleIds).toContain(result.reward.id);
    expect(result.save.economyEvents.at(-1)).toMatchObject({
      capsuleKind: 'welcome',
      collectionId: null,
      coinsSpent: 0,
      ownedCountBefore: 1,
      eligiblePoolSize: 50,
    });
    expect(
      openCapsule(
        result.save,
        catalog.collectibles,
        { kind: 'welcome', collectionId: null },
        new SeededRandom(2),
        Date.UTC(2026, 7, 31, 1),
      ).status,
    ).toBe('unavailable');
  });

  it('charges the correct prices and rejects insufficient balances', () => {
    const choices: CapsuleChoice[] = [
      { kind: 'surprise', collectionId: null },
      { kind: 'collection', collectionId: 'nookside-pups' },
    ];
    expect(choices.map(capsuleCost)).toEqual([60, 80]);
    for (const choice of choices) {
      const save = {
        ...createInitialSave('Ada', 'cozy-cats:sunny'),
        coins: capsuleCost(choice) - 1,
      };
      expect(openCapsule(save, catalog.collectibles, choice, new SeededRandom(3), 1).status).toBe(
        'insufficient-coins',
      );
    }
  });

  it('keeps Collection Capsules in the selected ordinary collection', () => {
    const initial = {
      ...createInitialSave('Ada', 'cozy-cats:sunny'),
      coins: 80,
      lifetimeCoinsEarned: 80,
    };
    const result = openCapsule(
      initial,
      catalog.collectibles,
      { kind: 'collection', collectionId: 'nookside-pups' },
      new SeededRandom(4),
      1,
    );
    expect(result.status).toBe('opened');
    if (result.status !== 'opened') return;
    expect(result.reward.collectionId).toBe('nookside-pups');
    expect(result.save.coins).toBe(0);
    expect(result.save.lifetimeCoinsEarned).toBe(80);
    expect(result.save.economyEvents.at(-1)).toMatchObject({
      capsuleKind: 'collection',
      collectionId: 'nookside-pups',
      coinsSpent: 80,
      eligiblePoolSize: 10,
    });
  });

  it('does not allow a Collection Capsule to target Special Guests', () => {
    const initial = { ...createInitialSave('Ada', 'cozy-cats:sunny'), coins: 80 };
    expect(
      openCapsule(
        initial,
        catalog.collectibles,
        { kind: 'collection', collectionId: 'special-guests' },
        new SeededRandom(5),
        1,
      ).status,
    ).toBe('complete');
  });
});
