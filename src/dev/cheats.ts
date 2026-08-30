import { CAPSULE_COST } from '../domain/rewards';
import type { SaveData } from '../storage/save';

export const DEVELOPMENT_COIN_GRANT = CAPSULE_COST * 5;

export function grantDevelopmentCoins(save: SaveData): SaveData {
  return {
    ...save,
    coins: save.coins + DEVELOPMENT_COIN_GRANT,
  };
}
