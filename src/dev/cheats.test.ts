import { describe, expect, it } from 'vitest';
import { createInitialSave } from '../storage/save';
import { DEVELOPMENT_COIN_GRANT, grantDevelopmentCoins } from './cheats';

describe('development cheats', () => {
  it('adds enough coins for five capsules without changing earned-coin progress', () => {
    const save = {
      ...createInitialSave('Ada', 'cozy-cats:sunny'),
      coins: 7,
      dailyCoins: { date: '2026-08-30', earned: 12 },
    };

    expect(grantDevelopmentCoins(save)).toMatchObject({
      coins: 7 + DEVELOPMENT_COIN_GRANT,
      dailyCoins: save.dailyCoins,
      economyEvents: [],
    });
  });
});
