import type { CollectibleDefinition } from '../content/schema';
import type { DifficultyId } from './math';
import type { RandomSource } from './random';

export const SURPRISE_CAPSULE_COST = 60;
export const COLLECTION_CAPSULE_COST = 80;
export const DAILY_COIN_MILESTONE = 100;
export const DAILY_PARTICIPATION_BONUS = 5;
export const WEEKLY_PARTICIPATION_BONUS = 15;
export const QUALIFYING_ROUND_CORRECT_ANSWERS = 5;

// Compatibility values for version 2–5 saves while the version 6 migration is applied.
export const LEGACY_DAILY_COIN_CAP = 30;

export const DIFFICULTY_COIN_MULTIPLIERS: Record<DifficultyId, number> = {
  easy: 1,
  medium: 1.15,
  hard: 1.3,
  advanced: 1.5,
};

export interface RoundCoinBreakdown {
  correctAnswerCoins: number;
  difficultyMultiplier: number;
  difficultyAdjustedCoins: number;
  difficultyBonusCoins: number;
  accuracyBonusCoins: number;
  perfectBonusCoins: number;
  total: number;
}

export function calculateRoundCoins(
  correctCount: number,
  questionCount: number,
  difficulty: DifficultyId,
): RoundCoinBreakdown {
  const correctAnswerCoins = Math.max(0, correctCount) * 2;
  const difficultyMultiplier = DIFFICULTY_COIN_MULTIPLIERS[difficulty];
  const difficultyAdjustedCoins = Math.round(correctAnswerCoins * difficultyMultiplier);
  const accuracy = questionCount > 0 ? correctCount / questionCount : 0;
  const accuracyBonusCoins = accuracy >= 0.8 ? 2 : 0;
  const perfectBonusCoins = questionCount > 0 && correctCount === questionCount ? 3 : 0;
  return {
    correctAnswerCoins,
    difficultyMultiplier,
    difficultyAdjustedCoins,
    difficultyBonusCoins: difficultyAdjustedCoins - correctAnswerCoins,
    accuracyBonusCoins,
    perfectBonusCoins,
    total: difficultyAdjustedCoins + accuracyBonusCoins + perfectBonusCoins,
  };
}

export function eligibleCapsuleRewards(
  catalog: readonly CollectibleDefinition[],
  ownedIds: readonly string[],
  collectionId?: string,
): CollectibleDefinition[] {
  const owned = new Set(ownedIds);
  return catalog.filter(
    (collectible) =>
      collectible.capsuleEligible &&
      !owned.has(collectible.id) &&
      (!collectionId || collectible.collectionId === collectionId),
  );
}

export function chooseCapsuleReward(
  catalog: readonly CollectibleDefinition[],
  ownedIds: readonly string[],
  random: RandomSource,
  collectionId?: string,
): CollectibleDefinition | null {
  const eligible = eligibleCapsuleRewards(catalog, ownedIds, collectionId);
  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce((sum, collectible) => sum + collectible.capsuleWeight, 0);
  let selection = random.next() * totalWeight;

  for (const collectible of eligible) {
    selection -= collectible.capsuleWeight;
    if (selection < 0) return collectible;
  }

  return eligible.at(-1) ?? null;
}
