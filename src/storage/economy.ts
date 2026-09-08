import type { CollectibleDefinition } from '../content/schema';
import {
  chooseCapsuleReward,
  COLLECTION_CAPSULE_COST,
  eligibleCapsuleRewards,
  SURPRISE_CAPSULE_COST,
} from '../domain/rewards';
import type { RandomSource } from '../domain/random';
import type { SaveData } from './save';

export type CapsuleKind = 'welcome' | 'surprise' | 'collection';

export interface CapsuleChoice {
  kind: CapsuleKind;
  collectionId: string | null;
}

export type CapsuleOpenResult =
  | { status: 'opened'; save: SaveData; reward: CollectibleDefinition }
  | { status: 'insufficient-coins' | 'unavailable' | 'complete'; save: SaveData };

export function capsuleCost(choice: CapsuleChoice): number {
  if (choice.kind === 'welcome') return 0;
  return choice.kind === 'collection' ? COLLECTION_CAPSULE_COST : SURPRISE_CAPSULE_COST;
}

export function openCapsule(
  save: SaveData,
  collectibles: readonly CollectibleDefinition[],
  choice: CapsuleChoice,
  random: RandomSource,
  now: number,
): CapsuleOpenResult {
  if (choice.kind === 'welcome' && save.rewardProgress.welcomeCapsuleStatus !== 'available') {
    return { status: 'unavailable', save };
  }
  if (choice.kind === 'collection' && !choice.collectionId) {
    return { status: 'unavailable', save };
  }
  if (choice.kind !== 'collection' && choice.collectionId) {
    return { status: 'unavailable', save };
  }

  const cost = capsuleCost(choice);
  if (save.coins < cost) return { status: 'insufficient-coins', save };

  const source =
    choice.kind === 'collection'
      ? collectibles.filter((collectible) => !collectible.specialGuest)
      : collectibles;
  const eligible = eligibleCapsuleRewards(
    source,
    save.ownedCollectibleIds,
    choice.collectionId ?? undefined,
  );
  const reward = chooseCapsuleReward(
    source,
    save.ownedCollectibleIds,
    random,
    choice.collectionId ?? undefined,
  );
  if (!reward) return { status: 'complete', save };

  return {
    status: 'opened',
    reward,
    save: {
      ...save,
      coins: save.coins - cost,
      ownedCollectibleIds: [...save.ownedCollectibleIds, reward.id],
      rewardProgress: {
        ...save.rewardProgress,
        welcomeCapsuleStatus:
          choice.kind === 'welcome' ? 'opened' : save.rewardProgress.welcomeCapsuleStatus,
      },
      economyEvents: [
        ...save.economyEvents,
        {
          id: `capsule:${now}:${reward.id}`,
          occurredAt: new Date(now).toISOString(),
          type: 'capsule_opened' as const,
          capsuleKind: choice.kind,
          collectionId: choice.collectionId,
          coinsSpent: cost,
          collectibleId: reward.id,
          ownedCountBefore: save.ownedCollectibleIds.length,
          eligiblePoolSize: eligible.length,
        },
      ].slice(-500),
    },
  };
}
