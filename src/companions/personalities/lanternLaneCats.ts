import type { CompanionPersonality } from '../types.ts';

export const LANTERN_LANE_CATS_PERSONALITIES = [
  {
    companionId: 'lantern-lane-cats:crumpet',
    primaryVoice: 'warm',
    secondaryVoice: 'playful',
    motion: 'plush-sway',
    motif: 'steam',
  },
  {
    companionId: 'lantern-lane-cats:tansy',
    primaryVoice: 'playful',
    secondaryVoice: 'warm',
    motion: 'buoyant-bob',
    motif: 'leaf',
  },
  {
    companionId: 'lantern-lane-cats:puddle',
    primaryVoice: 'adventurous',
    secondaryVoice: 'dreamy',
    motion: 'curious-tilt',
    motif: 'cloud',
  },
  {
    companionId: 'lantern-lane-cats:wick',
    primaryVoice: 'inventive',
    secondaryVoice: 'warm',
    motion: 'brave-lean',
    motif: 'lantern',
  },
  {
    companionId: 'lantern-lane-cats:inkwell',
    primaryVoice: 'thoughtful',
    secondaryVoice: 'inventive',
    motion: 'calm-float',
    motif: 'book',
  },
  {
    companionId: 'lantern-lane-cats:chime',
    primaryVoice: 'dreamy',
    secondaryVoice: 'thoughtful',
    motion: 'calm-float',
    motif: 'music',
  },
  {
    companionId: 'lantern-lane-cats:maribel',
    primaryVoice: 'warm',
    secondaryVoice: 'playful',
    motion: 'plush-sway',
    motif: 'ribbon',
  },
  {
    companionId: 'lantern-lane-cats:gable',
    primaryVoice: 'adventurous',
    secondaryVoice: 'thoughtful',
    motion: 'brave-lean',
    motif: 'trail',
  },
  {
    companionId: 'lantern-lane-cats:mosaic',
    primaryVoice: 'inventive',
    secondaryVoice: 'dreamy',
    motion: 'cosmic-drift',
    motif: 'paint',
  },
  {
    companionId: 'lantern-lane-cats:lumina',
    primaryVoice: 'warm',
    secondaryVoice: 'dreamy',
    motion: 'cosmic-drift',
    motif: 'lantern',
  },
] as const satisfies readonly CompanionPersonality[];
