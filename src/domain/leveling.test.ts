import { describe, expect, it } from 'vitest';
import {
  coinsToNextLevel,
  coinsToReachLevel,
  levelForLifetimeCoins,
  levelProgress,
  levelsGained,
  MAX_LEVEL,
} from './leveling';

describe('Nook Levels', () => {
  it('uses the documented gently increasing curve', () => {
    expect(
      [1, 5, 10, 25, 50, 100].map((level) => ({
        level,
        total: coinsToReachLevel(level),
        next: level === MAX_LEVEL ? null : coinsToNextLevel(level),
      })),
    ).toEqual([
      { level: 1, total: 0, next: 50 },
      { level: 5, total: 230, next: 70 },
      { level: 10, total: 630, next: 95 },
      { level: 25, total: 2_580, next: 170 },
      { level: 50, total: 8_330, next: 295 },
      { level: 100, total: 29_205, next: null },
    ]);
  });

  it('handles the coins immediately around level thresholds', () => {
    expect(levelForLifetimeCoins(49)).toBe(1);
    expect(levelForLifetimeCoins(50)).toBe(2);
    expect(levelForLifetimeCoins(104)).toBe(2);
    expect(levelForLifetimeCoins(105)).toBe(3);
    expect(levelProgress(49)).toMatchObject({
      level: 1,
      coinsIntoLevel: 49,
      coinsForLevel: 50,
      percent: 98,
      nextLevelAt: 50,
    });
    expect(levelProgress(50)).toMatchObject({
      level: 2,
      coinsIntoLevel: 0,
      coinsForLevel: 55,
      percent: 0,
      nextLevelAt: 105,
    });
  });

  it('preserves fractional progress for smooth visual animation', () => {
    expect(levelProgress(49.5)).toMatchObject({
      level: 1,
      coinsIntoLevel: 49.5,
      percent: 99,
      fillPercent: 99,
    });
    expect(levelProgress(79.5).fillPercent).toBeCloseTo(53.636, 3);
  });

  it('clamps malformed totals and visible progress at Level 100', () => {
    expect(levelProgress(-10)).toMatchObject({ level: 1, percent: 0 });
    expect(levelProgress(29_205)).toMatchObject({
      level: 100,
      isMaxLevel: true,
      percent: 100,
      nextLevel: null,
      nextLevelAt: null,
    });
    expect(levelProgress(100_000)).toMatchObject({ level: 100, percent: 100 });
  });

  it('counts single and multiple level gains without exceeding the cap', () => {
    expect(levelsGained(20, 49)).toBe(0);
    expect(levelsGained(20, 50)).toBe(1);
    expect(levelsGained(0, 120)).toBe(2);
    expect(levelsGained(29_000, 100_000)).toBe(1);
    expect(levelsGained(29_205, 100_000)).toBe(0);
  });
});
