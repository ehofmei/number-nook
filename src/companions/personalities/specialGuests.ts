import type { CompanionPersonality } from '../types.ts';

export const SPECIAL_GUEST_PERSONALITIES = [
  {
    companionId: 'special-guests:button-bunny',
    primaryVoice: 'plush',
    secondaryVoice: 'warm',
    motion: 'plush-sway',
    motif: 'stitch',
  },
] as const satisfies readonly CompanionPersonality[];
