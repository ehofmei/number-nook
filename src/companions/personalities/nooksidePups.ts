import type { CompanionPersonality } from '../types.ts';

export const NOOKSIDE_PUPS_PERSONALITIES = [
  {
    companionId: 'nookside-pups:poppy',
    primaryVoice: 'warm',
    secondaryVoice: 'playful',
    motion: 'buoyant-bob',
    motif: 'letter',
  },
  {
    companionId: 'nookside-pups:waffles',
    primaryVoice: 'playful',
    secondaryVoice: 'warm',
    motion: 'buoyant-bob',
    motif: 'checker',
  },
  {
    companionId: 'nookside-pups:scout',
    primaryVoice: 'thoughtful',
    secondaryVoice: 'adventurous',
    motion: 'curious-tilt',
    motif: 'trail',
  },
  {
    companionId: 'nookside-pups:dot',
    primaryVoice: 'playful',
    secondaryVoice: 'adventurous',
    motion: 'brave-lean',
    motif: 'chalk',
  },
  {
    companionId: 'nookside-pups:clover',
    primaryVoice: 'warm',
    secondaryVoice: 'inventive',
    motion: 'plush-sway',
    motif: 'clover',
  },
  {
    companionId: 'nookside-pups:mochi',
    primaryVoice: 'thoughtful',
    secondaryVoice: 'warm',
    motion: 'calm-float',
    motif: 'steam',
  },
  {
    companionId: 'nookside-pups:rollo',
    primaryVoice: 'inventive',
    secondaryVoice: 'thoughtful',
    motion: 'curious-tilt',
    motif: 'book',
  },
  {
    companionId: 'nookside-pups:echo',
    primaryVoice: 'adventurous',
    secondaryVoice: 'dreamy',
    motion: 'brave-lean',
    motif: 'music',
  },
  {
    companionId: 'nookside-pups:velvet',
    primaryVoice: 'playful',
    secondaryVoice: 'inventive',
    motion: 'plush-sway',
    motif: 'ribbon',
  },
  {
    companionId: 'nookside-pups:beacon',
    primaryVoice: 'warm',
    secondaryVoice: 'adventurous',
    motion: 'calm-float',
    motif: 'lantern',
  },
] as const satisfies readonly CompanionPersonality[];
