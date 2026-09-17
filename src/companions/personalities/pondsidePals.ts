import type { CompanionPersonality } from '../types.ts';

export const PONDSIDE_PALS_PERSONALITIES = [
  {
    companionId: 'pondside-pals:moss',
    primaryVoice: 'thoughtful',
    secondaryVoice: 'playful',
    motion: 'buoyant-bob',
    motif: 'lily-pad',
  },
  {
    companionId: 'pondside-pals:pebble',
    primaryVoice: 'warm',
    secondaryVoice: 'thoughtful',
    motion: 'plush-sway',
    motif: 'shell',
  },
  {
    companionId: 'pondside-pals:skim',
    primaryVoice: 'playful',
    secondaryVoice: 'adventurous',
    motion: 'curious-tilt',
    motif: 'ripple',
  },
  {
    companionId: 'pondside-pals:spiral',
    primaryVoice: 'thoughtful',
    secondaryVoice: 'warm',
    motion: 'calm-float',
    motif: 'shell',
  },
  {
    companionId: 'pondside-pals:dabble',
    primaryVoice: 'playful',
    secondaryVoice: 'warm',
    motion: 'buoyant-bob',
    motif: 'feather',
  },
  {
    companionId: 'pondside-pals:glint',
    primaryVoice: 'adventurous',
    secondaryVoice: 'dreamy',
    motion: 'cosmic-drift',
    motif: 'aurora',
  },
  {
    companionId: 'pondside-pals:willow',
    primaryVoice: 'inventive',
    secondaryVoice: 'warm',
    motion: 'brave-lean',
    motif: 'reed',
  },
  {
    companionId: 'pondside-pals:ripple',
    primaryVoice: 'playful',
    secondaryVoice: 'adventurous',
    motion: 'buoyant-bob',
    motif: 'ripple',
  },
  {
    companionId: 'pondside-pals:lotus',
    primaryVoice: 'warm',
    secondaryVoice: 'dreamy',
    motion: 'calm-float',
    motif: 'bubbles',
  },
  {
    companionId: 'pondside-pals:opal',
    primaryVoice: 'dreamy',
    secondaryVoice: 'inventive',
    motion: 'cosmic-drift',
    motif: 'ripple',
  },
] as const satisfies readonly CompanionPersonality[];
