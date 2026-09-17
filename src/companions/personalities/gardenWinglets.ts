import type { CompanionPersonality } from '../types.ts';

export const GARDEN_WINGLETS_PERSONALITIES = [
  {
    companionId: 'garden-winglets:tuck',
    primaryVoice: 'thoughtful',
    secondaryVoice: 'warm',
    motion: 'buoyant-bob',
    motif: 'seed',
  },
  {
    companionId: 'garden-winglets:marigold',
    primaryVoice: 'playful',
    secondaryVoice: 'warm',
    motion: 'buoyant-bob',
    motif: 'flower',
  },
  {
    companionId: 'garden-winglets:bluebell',
    primaryVoice: 'inventive',
    secondaryVoice: 'adventurous',
    motion: 'curious-tilt',
    motif: 'feather',
  },
  {
    companionId: 'garden-winglets:tumble',
    primaryVoice: 'playful',
    secondaryVoice: 'adventurous',
    motion: 'brave-lean',
    motif: 'trail',
  },
  {
    companionId: 'garden-winglets:zinnia',
    primaryVoice: 'adventurous',
    secondaryVoice: 'playful',
    motion: 'cosmic-drift',
    motif: 'flower',
  },
  {
    companionId: 'garden-winglets:bramble',
    primaryVoice: 'warm',
    secondaryVoice: 'thoughtful',
    motion: 'calm-float',
    motif: 'berry',
  },
  {
    companionId: 'garden-winglets:fern',
    primaryVoice: 'inventive',
    secondaryVoice: 'thoughtful',
    motion: 'curious-tilt',
    motif: 'leaf',
  },
  {
    companionId: 'garden-winglets:tempo',
    primaryVoice: 'dreamy',
    secondaryVoice: 'thoughtful',
    motion: 'calm-float',
    motif: 'music',
  },
  {
    companionId: 'garden-winglets:prism',
    primaryVoice: 'adventurous',
    secondaryVoice: 'inventive',
    motion: 'brave-lean',
    motif: 'water',
  },
  {
    companionId: 'garden-winglets:solstice',
    primaryVoice: 'dreamy',
    secondaryVoice: 'adventurous',
    motion: 'cosmic-drift',
    motif: 'sun',
  },
] as const satisfies readonly CompanionPersonality[];
