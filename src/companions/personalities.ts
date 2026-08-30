import { COZY_CATS_PERSONALITIES } from './personalities/cozyCats.ts';
import { LANTERN_LANE_CATS_PERSONALITIES } from './personalities/lanternLaneCats.ts';
import { NOOKSIDE_PUPS_PERSONALITIES } from './personalities/nooksidePups.ts';
import { SPECIAL_GUEST_PERSONALITIES } from './personalities/specialGuests.ts';
import type { CompanionPersonality } from './types.ts';

export const COMPANION_PERSONALITIES = [
  ...COZY_CATS_PERSONALITIES,
  ...NOOKSIDE_PUPS_PERSONALITIES,
  ...LANTERN_LANE_CATS_PERSONALITIES,
  ...SPECIAL_GUEST_PERSONALITIES,
] as const satisfies readonly CompanionPersonality[];

const personalityById = new Map<string, CompanionPersonality>(
  COMPANION_PERSONALITIES.map((personality) => [personality.companionId, personality]),
);

export function getCompanionPersonality(companionId: string): CompanionPersonality | undefined {
  return personalityById.get(companionId);
}
