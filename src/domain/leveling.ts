export const MAX_LEVEL = 100;
export const FIRST_LEVEL_COST = 50;
export const LEVEL_COST_STEP = 5;

export interface LevelProgress {
  level: number;
  isMaxLevel: boolean;
  coinsIntoLevel: number;
  coinsForLevel: number;
  percent: number;
  nextLevel: number | null;
  nextLevelAt: number | null;
}

export function coinsToNextLevel(level: number): number {
  const boundedLevel = Math.min(MAX_LEVEL, Math.max(1, Math.trunc(level)));
  return FIRST_LEVEL_COST + LEVEL_COST_STEP * (boundedLevel - 1);
}

export function coinsToReachLevel(level: number): number {
  const boundedLevel = Math.min(MAX_LEVEL, Math.max(1, Math.trunc(level)));
  const completedLevels = boundedLevel - 1;
  return (completedLevels * (2 * FIRST_LEVEL_COST + (completedLevels - 1) * LEVEL_COST_STEP)) / 2;
}

export function levelForLifetimeCoins(lifetimeCoinsEarned: number): number {
  const total = Math.max(0, Math.trunc(lifetimeCoinsEarned));
  for (let level = 2; level <= MAX_LEVEL; level += 1) {
    if (total < coinsToReachLevel(level)) return level - 1;
  }
  return MAX_LEVEL;
}

export function levelProgress(lifetimeCoinsEarned: number): LevelProgress {
  const total = Math.max(0, Math.trunc(lifetimeCoinsEarned));
  const level = levelForLifetimeCoins(total);
  if (level === MAX_LEVEL) {
    return {
      level,
      isMaxLevel: true,
      coinsIntoLevel: coinsToNextLevel(MAX_LEVEL),
      coinsForLevel: coinsToNextLevel(MAX_LEVEL),
      percent: 100,
      nextLevel: null,
      nextLevelAt: null,
    };
  }

  const levelStart = coinsToReachLevel(level);
  const coinsForLevel = coinsToNextLevel(level);
  const coinsIntoLevel = total - levelStart;
  return {
    level,
    isMaxLevel: false,
    coinsIntoLevel,
    coinsForLevel,
    percent: Math.round((coinsIntoLevel / coinsForLevel) * 100),
    nextLevel: level + 1,
    nextLevelAt: levelStart + coinsForLevel,
  };
}

export function levelsGained(before: number, after: number): number {
  return Math.max(0, levelForLifetimeCoins(after) - levelForLifetimeCoins(before));
}
