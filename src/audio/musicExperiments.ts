import {
  COZY_ELECTRIC_PIANO_THEME,
  MUSIC_TRACKS,
  type MusicAmbience,
  type MusicInstrumentId,
  type MusicNoteSpec,
  type MusicTrackDefinition,
} from './music';

export const MUSIC_LAB_FAMILIES = ['piano', 'plucked', 'smooth', 'playful', 'reference'] as const;

export type MusicLabFamily = (typeof MUSIC_LAB_FAMILIES)[number];

export interface MusicLabTrackDefinition extends MusicTrackDefinition {
  family: MusicLabFamily;
}

type Arrangement =
  'broken' | 'rolling' | 'waltz' | 'blocks' | 'strum' | 'sparse' | 'melody' | 'bounce';

interface ExperimentRecipe {
  id: string;
  label: string;
  family: Exclude<MusicLabFamily, 'reference'>;
  styleLabel: string;
  description: string;
  listeningPrompt: string;
  bpm: number;
  arrangement: Arrangement;
  instrument: MusicInstrumentId;
  progression: readonly (readonly [number, number, number])[];
  filterFrequency: number;
  lowCutFrequency?: number;
  ambience?: MusicAmbience;
}

const C_WARM = [
  [60, 64, 67],
  [57, 60, 64],
  [53, 57, 60],
  [55, 59, 62],
] as const;
const F_GARDEN = [
  [53, 57, 60],
  [60, 64, 67],
  [55, 59, 62],
  [58, 62, 65],
] as const;
const D_DREAM = [
  [62, 65, 69],
  [57, 62, 65],
  [60, 64, 69],
  [55, 59, 62],
] as const;
const G_SUNNY = [
  [55, 59, 62],
  [60, 64, 67],
  [57, 60, 64],
  [62, 66, 69],
] as const;
const A_CLOUD = [
  [57, 60, 64],
  [53, 57, 60],
  [60, 64, 67],
  [55, 59, 62],
] as const;
const E_LANTERN = [
  [57, 61, 64],
  [54, 57, 61],
  [59, 62, 66],
  [52, 56, 59],
] as const;

function frequency(midiNote: number): number {
  return Number((440 * 2 ** ((midiNote - 69) / 12)).toFixed(2));
}

function note(
  midiNote: number,
  startBeat: number,
  durationBeats: number,
  gain: number,
  role: MusicNoteSpec['role'],
  instrument: MusicInstrumentId,
): MusicNoteSpec {
  return {
    frequency: frequency(midiNote),
    startBeat,
    durationBeats,
    gain,
    wave: instrument === 'strings' ? 'triangle' : 'sine',
    role,
    instrument,
  };
}

function arrange(recipe: ExperimentRecipe): MusicNoteSpec[] {
  const notes: MusicNoteSpec[] = [];
  const beatsPerChord = recipe.arrangement === 'waltz' ? 3 : 4;

  recipe.progression.forEach((chord, chordIndex) => {
    const start = chordIndex * beatsPerChord;
    const root = chord[0];
    const middle = chord[1];
    const top = chord[2];

    switch (recipe.arrangement) {
      case 'broken':
        [root, middle, top, middle].forEach((pitch, index) => {
          notes.push(note(pitch, start + index, 1.35, 0.033, 'flow', recipe.instrument));
        });
        notes.push(note(top + 12, start + 2.55, 1.1, 0.017, 'melody', recipe.instrument));
        break;
      case 'rolling':
        [root, middle, top, middle, root, middle, top, middle].forEach((pitch, index) => {
          notes.push(note(pitch, start + index * 0.5, 0.82, 0.025, 'flow', recipe.instrument));
        });
        break;
      case 'waltz':
        notes.push(note(root, start, 2.7, 0.028, 'bed', recipe.instrument));
        for (const offset of [1, 2]) {
          notes.push(note(middle, start + offset, 0.78, 0.022, 'flow', recipe.instrument));
          notes.push(note(top, start + offset, 0.78, 0.019, 'flow', recipe.instrument));
        }
        break;
      case 'blocks':
        chord.forEach((pitch, index) => {
          notes.push(note(pitch, start, 3.45, 0.024 - index * 0.002, 'bed', recipe.instrument));
        });
        notes.push(note(top + 12, start + 2.25, 1.25, 0.012, 'melody', recipe.instrument));
        break;
      case 'strum':
        chord.forEach((pitch, index) => {
          notes.push(note(pitch, start + index * 0.11, 2.45, 0.025, 'flow', recipe.instrument));
          notes.push(note(pitch, start + 2 + index * 0.09, 1.55, 0.018, 'flow', recipe.instrument));
        });
        break;
      case 'sparse':
        notes.push(note(root, start, 1.65, 0.028, 'bed', recipe.instrument));
        notes.push(note(middle, start + 0.12, 1.45, 0.021, 'bed', recipe.instrument));
        notes.push(note(top + 12, start + 2.1, 1.15, 0.019, 'sparkle', recipe.instrument));
        break;
      case 'melody':
        notes.push(note(root, start, 3.2, 0.018, 'bed', recipe.instrument));
        [top + 12, middle + 12, top + 12, root + 12].forEach((pitch, index) => {
          notes.push(note(pitch, start + index, 0.82, 0.027, 'melody', recipe.instrument));
        });
        break;
      case 'bounce':
        [root, top, middle, top, root, top, middle, top].forEach((pitch, index) => {
          notes.push(
            note(
              pitch + (index % 2 === 1 ? 12 : 0),
              start + index * 0.5,
              0.38,
              0.023,
              'flow',
              recipe.instrument,
            ),
          );
        });
        break;
    }
  });

  return notes;
}

interface ExtendedPianoSection {
  startBeat: number;
  progression: readonly (readonly [number, number, number])[];
  pattern: readonly (0 | 1 | 2)[];
  stepBeats: number;
  durationBeats: number;
  gain: number;
}

const COZY_ELECTRIC_PIANO_SECTIONS: readonly ExtendedPianoSection[] = [
  {
    startBeat: 0,
    progression: A_CLOUD,
    pattern: [0, 1, 2, 1, 0, 1, 2, 1],
    stepBeats: 0.5,
    durationBeats: 1.35,
    gain: 0.019,
  },
  {
    startBeat: 16,
    progression: [
      [62, 65, 69],
      [55, 59, 62],
      [60, 64, 67],
      [57, 60, 64],
    ],
    pattern: [0, 2, 1, 2, 0, 2, 1, 2],
    stepBeats: 0.5,
    durationBeats: 1.3,
    gain: 0.018,
  },
  {
    startBeat: 32,
    progression: C_WARM,
    pattern: [1, 2, 1, 0, 1, 2, 1, 2],
    stepBeats: 0.5,
    durationBeats: 1.4,
    gain: 0.0195,
  },
  {
    startBeat: 48,
    progression: [
      [53, 57, 60],
      [57, 60, 64],
      [62, 65, 69],
      [55, 59, 62],
    ],
    pattern: [0, 1, 2, 1],
    stepBeats: 1,
    durationBeats: 1.75,
    gain: 0.015,
  },
  {
    startBeat: 64,
    progression: [
      [53, 57, 60],
      [60, 64, 67],
      [57, 60, 64],
      [55, 59, 62],
    ],
    pattern: [0, 1, 2, 1, 0, 2, 1, 2],
    stepBeats: 0.5,
    durationBeats: 1.35,
    gain: 0.0205,
  },
];

function extendedCozyElectricPianoNotes(): MusicNoteSpec[] {
  const notes: MusicNoteSpec[] = [];
  for (const section of COZY_ELECTRIC_PIANO_SECTIONS) {
    section.progression.forEach((chord, chordIndex) => {
      const chordStart = section.startBeat + chordIndex * 4;
      section.pattern.forEach((chordTone, patternIndex) => {
        const phraseAccent = patternIndex === 0 || patternIndex === section.pattern.length / 2;
        const noteStart = chordStart + patternIndex * section.stepBeats;
        const durationBeats = Math.min(section.durationBeats, 80.4 - noteStart);
        notes.push({
          ...note(
            chord[chordTone],
            noteStart,
            durationBeats,
            section.gain * (phraseAccent ? 1.08 : 1),
            'flow',
            'electric-piano',
          ),
          attackSeconds: 0.018,
          releaseSeconds: 0.5,
        });
      });
    });
  }
  return notes;
}

export const COZY_ELECTRIC_PIANO_EXTENDED: MusicLabTrackDefinition = {
  id: 'cozy-electric-piano-extended',
  label: 'Cozy Electric Piano — Extended',
  family: 'piano',
  styleLabel: 'Featured · 75-second arrangement',
  description:
    'Five connected electric-piano sections develop the favorite rolling pattern without a separate ornamental note.',
  listeningPrompt:
    'Do the slower pace, longer fades, contrasting bridge, and evolving harmony stay pleasant for the full loop?',
  bpm: 64,
  beatsPerLoop: 80,
  filterFrequency: 4_200,
  lowCutFrequency: 155,
  notes: extendedCozyElectricPianoNotes(),
};

const EXPERIMENT_RECIPES: readonly ExperimentRecipe[] = [
  {
    id: 'solo-nook-piano',
    label: 'Solo Nook Piano',
    family: 'piano',
    styleLabel: 'Soft piano · spacious',
    description: 'An unhurried piano line with silence between its small phrases.',
    listeningPrompt: 'Does the space make it calmer and less tiring on the phone?',
    bpm: 62,
    arrangement: 'sparse',
    instrument: 'soft-piano',
    progression: C_WARM,
    filterFrequency: 4_800,
  },
  {
    id: 'piano-storybook',
    label: 'Piano Storybook',
    family: 'piano',
    styleLabel: 'Soft piano · broken chords',
    description: 'Rounded piano notes move gently through familiar storybook chords.',
    listeningPrompt: 'Does this feel connected without becoming repetitive?',
    bpm: 68,
    arrangement: 'broken',
    instrument: 'soft-piano',
    progression: F_GARDEN,
    filterFrequency: 4_600,
  },
  {
    id: 'cozy-electric-piano',
    label: 'Cozy Electric Piano',
    family: 'piano',
    styleLabel: 'Electric piano · warm',
    description: 'A mellow electric-piano ribbon with soft harmonic color and no bass pad.',
    listeningPrompt: 'Is this warmer character pleasant or too synthetic?',
    bpm: 70,
    arrangement: 'rolling',
    instrument: 'electric-piano',
    progression: A_CLOUD,
    filterFrequency: 4_200,
    ambience: { delaySeconds: 0.16, feedback: 0.04, mix: 0.025 },
  },
  {
    id: 'quiet-waltz',
    label: 'Quiet Waltz',
    family: 'piano',
    styleLabel: 'Soft piano · 3/4',
    description: 'A slow three-beat piano sway that feels different from the existing loops.',
    listeningPrompt: 'Does the waltz motion feel soothing or too noticeable?',
    bpm: 58,
    arrangement: 'waltz',
    instrument: 'soft-piano',
    progression: D_DREAM,
    filterFrequency: 4_500,
  },
  {
    id: 'sunny-keys',
    label: 'Sunny Keys',
    family: 'piano',
    styleLabel: 'Bright piano · flowing',
    description: 'A brighter, optimistic piano pattern with quick but connected movement.',
    listeningPrompt: 'Is it cheerful without competing with the game?',
    bpm: 78,
    arrangement: 'rolling',
    instrument: 'soft-piano',
    progression: G_SUNNY,
    filterFrequency: 5_400,
  },
  {
    id: 'rainy-window-piano',
    label: 'Rainy Window Piano',
    family: 'piano',
    styleLabel: 'Electric piano · sparse',
    description: 'Soft electric-piano drops answer one another over a nearly silent background.',
    listeningPrompt: 'Do the isolated notes feel intentional rather than disjointed?',
    bpm: 56,
    arrangement: 'sparse',
    instrument: 'electric-piano',
    progression: E_LANTERN,
    filterFrequency: 3_900,
    ambience: { delaySeconds: 0.21, feedback: 0.04, mix: 0.03 },
  },
  {
    id: 'morning-practice',
    label: 'Morning Practice',
    family: 'piano',
    styleLabel: 'Piano · simple melody',
    description: 'A clear little right-hand melody supported by occasional middle-register roots.',
    listeningPrompt: 'Is the melody memorable in a good way, or too foregrounded?',
    bpm: 72,
    arrangement: 'melody',
    instrument: 'soft-piano',
    progression: C_WARM,
    filterFrequency: 5_000,
  },
  {
    id: 'moonbeam-nocturne',
    label: 'Moonbeam Nocturne',
    family: 'piano',
    styleLabel: 'Piano · nighttime',
    description: 'A darker but bass-light piano progression with measured broken chords.',
    listeningPrompt: 'Does this feel cozy at night without sounding gloomy?',
    bpm: 60,
    arrangement: 'broken',
    instrument: 'soft-piano',
    progression: D_DREAM,
    filterFrequency: 3_800,
    ambience: { delaySeconds: 0.18, feedback: 0.03, mix: 0.02 },
  },
  {
    id: 'music-box-evening',
    label: 'Music Box Evening',
    family: 'plucked',
    styleLabel: 'Music box · sparse',
    description: 'Tiny music-box tones appear in short, tidy phrases with plenty of air.',
    listeningPrompt: 'Is the delicate tone charming or too bright for long sessions?',
    bpm: 64,
    arrangement: 'sparse',
    instrument: 'music-box',
    progression: C_WARM,
    filterFrequency: 6_200,
    lowCutFrequency: 170,
  },
  {
    id: 'guitar-garden',
    label: 'Gentle Guitar Garden',
    family: 'plucked',
    styleLabel: 'Soft guitar · strummed',
    description: 'Synthetic nylon-like strings are lightly strummed without a low guitar body.',
    listeningPrompt: 'Does the strum feel organic enough to keep exploring?',
    bpm: 66,
    arrangement: 'strum',
    instrument: 'soft-guitar',
    progression: F_GARDEN,
    filterFrequency: 4_300,
  },
  {
    id: 'button-bunny-lullaby',
    label: 'Button Bunny Lullaby',
    family: 'plucked',
    styleLabel: 'Harp · lullaby',
    description: 'A gentle harp pattern inspired by a companion settling into the Nook.',
    listeningPrompt: 'Would this be pleasant during slower untimed practice?',
    bpm: 58,
    arrangement: 'broken',
    instrument: 'harp',
    progression: A_CLOUD,
    filterFrequency: 5_600,
  },
  {
    id: 'harp-steps',
    label: 'Harp Steps',
    family: 'plucked',
    styleLabel: 'Harp · rolling',
    description: 'Light harp tones climb and return in a continuous, bass-free pattern.',
    listeningPrompt: 'Does the rolling motion blend better than the original foreground notes?',
    bpm: 74,
    arrangement: 'rolling',
    instrument: 'harp',
    progression: D_DREAM,
    filterFrequency: 5_900,
  },
  {
    id: 'kalimba-path',
    label: 'Kalimba Path',
    family: 'plucked',
    styleLabel: 'Kalimba · gentle pulse',
    description: 'Rounded thumb-piano notes make a compact pattern with almost no ambience.',
    listeningPrompt: 'Does this sound playful without buzzing against the phone case?',
    bpm: 76,
    arrangement: 'bounce',
    instrument: 'kalimba',
    progression: G_SUNNY,
    filterFrequency: 4_800,
    lowCutFrequency: 165,
  },
  {
    id: 'cloud-organ',
    label: 'Cloud Organ',
    family: 'smooth',
    styleLabel: 'Organ · sustained',
    description:
      'Middle-register organ chords float smoothly without a separate melody or sub-bass.',
    listeningPrompt: 'Does a sustained texture work once the troublesome bass is removed?',
    bpm: 56,
    arrangement: 'blocks',
    instrument: 'organ',
    progression: A_CLOUD,
    filterFrequency: 3_600,
  },
  {
    id: 'featherlight-strings',
    label: 'Featherlight Strings',
    family: 'smooth',
    styleLabel: 'Strings · light',
    description: 'Soft synthesized strings hold airy chords in a deliberately higher register.',
    listeningPrompt: 'Are these chords smooth, or do they still feel too reverberant?',
    bpm: 58,
    arrangement: 'blocks',
    instrument: 'strings',
    progression: F_GARDEN,
    filterFrequency: 3_300,
    ambience: { delaySeconds: 0.2, feedback: 0.025, mix: 0.018 },
  },
  {
    id: 'lantern-glow',
    label: 'Lantern Glow',
    family: 'smooth',
    styleLabel: 'Electric piano · held',
    description: 'Quiet electric-piano chords fade naturally instead of forming a continuous pad.',
    listeningPrompt: 'Does the natural decay eliminate the heavy background sensation?',
    bpm: 60,
    arrangement: 'blocks',
    instrument: 'electric-piano',
    progression: E_LANTERN,
    filterFrequency: 3_800,
  },
  {
    id: 'lavender-drift',
    label: 'Lavender Drift',
    family: 'smooth',
    styleLabel: 'Pad · bass-light',
    description: 'A restrained version of a soft pad, shifted upward and almost completely dry.',
    listeningPrompt: 'Is a pad acceptable with the low resonance and echo removed?',
    bpm: 54,
    arrangement: 'blocks',
    instrument: 'pad',
    progression: D_DREAM,
    filterFrequency: 2_900,
    lowCutFrequency: 165,
  },
  {
    id: 'starlight-air',
    label: 'Starlight Air',
    family: 'smooth',
    styleLabel: 'Sine flow · minimal',
    description: 'A lighter cousin of Starlight Stream with only a flowing middle-register ribbon.',
    listeningPrompt: 'Does this keep what you liked about Starlight Stream without the rumble?',
    bpm: 72,
    arrangement: 'rolling',
    instrument: 'pad',
    progression: C_WARM,
    filterFrequency: 3_900,
    lowCutFrequency: 160,
  },
  {
    id: 'window-light',
    label: 'Window Light',
    family: 'smooth',
    styleLabel: 'Organ · sparse',
    description: 'Brief, softly blooming organ shapes leave silence between each harmony.',
    listeningPrompt: 'Does the extra breathing room make sustained tones more comfortable?',
    bpm: 52,
    arrangement: 'sparse',
    instrument: 'organ',
    progression: F_GARDEN,
    filterFrequency: 3_500,
  },
  {
    id: 'toy-piano-parade',
    label: 'Toy Piano Parade',
    family: 'playful',
    styleLabel: 'Toy piano · bouncy',
    description: 'A small bright piano hops through a cheerful pattern without percussion.',
    listeningPrompt: 'Is this fun enough for kids without becoming tiring for adults?',
    bpm: 82,
    arrangement: 'bounce',
    instrument: 'music-box',
    progression: G_SUNNY,
    filterFrequency: 6_000,
    lowCutFrequency: 180,
  },
  {
    id: 'sunny-skip',
    label: 'Sunny Skip',
    family: 'playful',
    styleLabel: 'Mallet · skipping',
    description: 'Soft mallet notes alternate high and low in a compact skipping rhythm.',
    listeningPrompt: 'Does the rhythm add energy without pushing the player to rush?',
    bpm: 80,
    arrangement: 'bounce',
    instrument: 'mallet',
    progression: C_WARM,
    filterFrequency: 5_000,
    lowCutFrequency: 170,
  },
  {
    id: 'pawprint-waltz',
    label: 'Pawprint Waltz',
    family: 'playful',
    styleLabel: 'Mallet · 3/4',
    description: 'A rounded mallet waltz adds motion while keeping every note short and light.',
    listeningPrompt: 'Is the three-beat bounce charming or too patterned?',
    bpm: 68,
    arrangement: 'waltz',
    instrument: 'mallet',
    progression: F_GARDEN,
    filterFrequency: 4_700,
  },
  {
    id: 'nook-carousel',
    label: 'Nook Carousel',
    family: 'playful',
    styleLabel: 'Organ · carousel',
    description:
      'A restrained carousel-like organ phrase, deliberately slower and softer than an arcade.',
    listeningPrompt: 'Is the character delightful, or does it call too much attention to itself?',
    bpm: 72,
    arrangement: 'melody',
    instrument: 'organ',
    progression: G_SUNNY,
    filterFrequency: 4_100,
  },
  {
    id: 'firefly-bells',
    label: 'Firefly Bells',
    family: 'playful',
    styleLabel: 'Bells · occasional',
    description:
      'Warm bell sparks appear in pairs rather than forming a constant foreground melody.',
    listeningPrompt: 'Do the pauses keep the bells special instead of repetitive?',
    bpm: 60,
    arrangement: 'sparse',
    instrument: 'bell',
    progression: A_CLOUD,
    filterFrequency: 6_400,
    lowCutFrequency: 190,
    ambience: { delaySeconds: 0.16, feedback: 0.025, mix: 0.018 },
  },
];

const SHORT_EXPERIMENT_TRACKS: readonly MusicLabTrackDefinition[] = EXPERIMENT_RECIPES.map(
  (recipe) => ({
    id: recipe.id,
    label: recipe.label,
    family: recipe.family,
    styleLabel: recipe.styleLabel,
    description: recipe.description,
    listeningPrompt: recipe.listeningPrompt,
    bpm: recipe.bpm,
    beatsPerLoop: recipe.progression.length * (recipe.arrangement === 'waltz' ? 3 : 4),
    filterFrequency: recipe.filterFrequency,
    lowCutFrequency: recipe.lowCutFrequency ?? 135,
    ambience: recipe.ambience,
    notes: arrange(recipe),
  }),
);

export const MUSIC_EXPERIMENT_TRACKS: readonly MusicLabTrackDefinition[] = [
  COZY_ELECTRIC_PIANO_EXTENDED,
  ...SHORT_EXPERIMENT_TRACKS,
];

const COZY_ELECTRIC_PIANO_THEME_LAB: MusicLabTrackDefinition = {
  ...COZY_ELECTRIC_PIANO_THEME,
  label: 'Cozy Electric Piano — Theme',
  family: 'piano',
  styleLabel: 'Production default · 60-second composition',
  description:
    'A recognizable melody returns, answers itself, visits a brighter middle theme, and comes home over one steady accompaniment pattern.',
  listeningPrompt:
    'Does the recurring tune feel purposeful and memorable instead of like familiar notes being rearranged?',
};

const REFERENCE_TRACKS: readonly MusicLabTrackDefinition[] = MUSIC_TRACKS.filter(
  (track) => track.id !== COZY_ELECTRIC_PIANO_THEME.id,
).map((track) => ({
  ...track,
  family: 'reference',
}));

export const MUSIC_LAB_TRACKS: readonly MusicLabTrackDefinition[] = [
  COZY_ELECTRIC_PIANO_THEME_LAB,
  ...MUSIC_EXPERIMENT_TRACKS,
  ...REFERENCE_TRACKS,
];

export function getMusicLabTrack(id: string): MusicLabTrackDefinition {
  const track = MUSIC_LAB_TRACKS.find((candidate) => candidate.id === id);
  if (!track) throw new Error(`Unknown Music Lab track: ${id}`);
  return track;
}
