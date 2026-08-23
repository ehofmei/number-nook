export const MUSIC_TRACK_IDS = [
  'cozy-nook',
  'quiet-cove',
  'moonlit-window',
  'starlight-stream',
] as const;

export type MusicTrackId = (typeof MUSIC_TRACK_IDS)[number];

export const DEFAULT_MUSIC_TRACK_ID: MusicTrackId = 'starlight-stream';

export interface MusicNoteSpec {
  frequency: number;
  startBeat: number;
  durationBeats: number;
  gain: number;
  wave: OscillatorType;
  role: 'bed' | 'melody' | 'flow' | 'sparkle';
  attackSeconds?: number;
  releaseSeconds?: number;
}

export interface MusicAmbience {
  delaySeconds: number;
  feedback: number;
  mix: number;
}

export interface MusicTrackDefinition {
  id: MusicTrackId;
  label: string;
  styleLabel: string;
  description: string;
  listeningPrompt: string;
  bpm: number;
  beatsPerLoop: number;
  filterFrequency: number;
  ambience?: MusicAmbience;
  notes: readonly MusicNoteSpec[];
}

interface NoteShape {
  wave?: OscillatorType;
  role?: MusicNoteSpec['role'];
  attackSeconds?: number;
  releaseSeconds?: number;
}

function chord(
  frequencies: readonly number[],
  startBeat: number,
  durationBeats: number,
  gain: number,
  shape: NoteShape = {},
): MusicNoteSpec[] {
  return frequencies.map((frequency, index) => ({
    frequency,
    startBeat,
    durationBeats,
    gain: gain * (index === 0 ? 1 : 0.72),
    wave: shape.wave ?? 'sine',
    role: shape.role ?? 'bed',
    attackSeconds: shape.attackSeconds,
    releaseSeconds: shape.releaseSeconds,
  }));
}

type PhraseNote = readonly [
  frequency: number,
  startBeat: number,
  durationBeats: number,
  gain: number,
  role?: MusicNoteSpec['role'],
  wave?: OscillatorType,
  attackSeconds?: number,
  releaseSeconds?: number,
];

function phrase(notes: readonly PhraseNote[]): MusicNoteSpec[] {
  return notes.map(
    ([
      frequency,
      startBeat,
      durationBeats,
      gain,
      role = 'melody',
      wave = 'sine',
      attackSeconds,
      releaseSeconds,
    ]) => ({
      frequency,
      startBeat,
      durationBeats,
      gain,
      wave,
      role,
      attackSeconds,
      releaseSeconds,
    }),
  );
}

export interface MusicTrackTransform {
  tempoPercent: number;
  warmth: number;
  foregroundPercent: number;
}

export const DEFAULT_MUSIC_TRANSFORM: MusicTrackTransform = {
  tempoPercent: 100,
  warmth: 65,
  foregroundPercent: 100,
};

const COZY_NOOK_NOTES: readonly MusicNoteSpec[] = [
  ...chord([130.81, 164.81, 196], 0, 3.8, 0.065),
  ...chord([130.81, 164.81, 220], 4, 3.8, 0.057),
  ...chord([130.81, 174.61, 220], 8, 3.8, 0.052),
  ...chord([146.83, 196, 246.94], 12, 3.8, 0.052),
  ...phrase([
    [523.25, 0.5, 0.8, 0.052, 'melody', 'triangle', 0.08, 0.18],
    [659.25, 2, 0.7, 0.045, 'melody', 'triangle', 0.08, 0.18],
    [783.99, 3.25, 0.6, 0.038, 'sparkle', 'sine', 0.08, 0.18],
    [440, 4.75, 0.8, 0.048, 'melody', 'triangle', 0.08, 0.18],
    [523.25, 6.25, 0.8, 0.044, 'melody', 'triangle', 0.08, 0.18],
    [659.25, 7.25, 0.5, 0.028, 'sparkle', 'sine', 0.08, 0.18],
    [440, 8.75, 0.8, 0.046, 'melody', 'triangle', 0.08, 0.18],
    [392, 10.25, 0.8, 0.044, 'melody', 'triangle', 0.08, 0.18],
    [349.23, 11.25, 0.55, 0.025, 'sparkle', 'sine', 0.08, 0.18],
    [587.33, 12.5, 0.75, 0.048, 'melody', 'triangle', 0.08, 0.18],
    [493.88, 14, 0.7, 0.042, 'melody', 'triangle', 0.08, 0.18],
    [392, 15.1, 0.65, 0.03, 'sparkle', 'sine', 0.08, 0.18],
  ]),
];

const QUIET_COVE_NOTES: readonly MusicNoteSpec[] = [
  ...chord([130.81, 196, 246.94, 329.63], 0, 4.35, 0.042, {
    attackSeconds: 0.7,
    releaseSeconds: 0.85,
  }),
  ...chord([110, 164.81, 196, 261.63], 3.9, 4.35, 0.04, {
    attackSeconds: 0.7,
    releaseSeconds: 0.85,
  }),
  ...chord([87.31, 130.81, 164.81, 220], 7.8, 4.35, 0.04, {
    attackSeconds: 0.7,
    releaseSeconds: 0.85,
  }),
  ...chord([98, 146.83, 196, 220], 11.7, 4.5, 0.041, {
    attackSeconds: 0.7,
    releaseSeconds: 0.9,
  }),
];

const MOONLIT_WINDOW_NOTES: readonly MusicNoteSpec[] = [
  ...chord([98, 146.83, 196, 246.94], 0, 4.4, 0.039, {
    attackSeconds: 0.65,
    releaseSeconds: 0.85,
  }),
  ...chord([110, 164.81, 220, 261.63], 3.9, 4.4, 0.038, {
    attackSeconds: 0.65,
    releaseSeconds: 0.85,
  }),
  ...chord([87.31, 130.81, 174.61, 220], 7.8, 4.4, 0.038, {
    attackSeconds: 0.65,
    releaseSeconds: 0.85,
  }),
  ...chord([98, 146.83, 196, 246.94], 11.7, 4.5, 0.039, {
    attackSeconds: 0.65,
    releaseSeconds: 0.9,
  }),
  ...phrase([
    [392, 0.8, 2.8, 0.019, 'melody', 'sine', 0.42, 0.75],
    [440, 3.15, 2.55, 0.018, 'melody', 'sine', 0.42, 0.75],
    [392, 5.3, 2.7, 0.018, 'melody', 'sine', 0.42, 0.8],
    [349.23, 7.65, 2.55, 0.017, 'melody', 'sine', 0.42, 0.75],
    [329.63, 9.85, 2.65, 0.017, 'melody', 'sine', 0.42, 0.8],
    [392, 12.1, 3.75, 0.018, 'melody', 'sine', 0.45, 0.9],
  ]),
];

const STARLIGHT_STREAM_NOTES: readonly MusicNoteSpec[] = [
  ...chord([130.81, 196, 246.94], 0, 4.35, 0.032, {
    attackSeconds: 0.65,
    releaseSeconds: 0.8,
  }),
  ...chord([110, 164.81, 220], 3.9, 4.35, 0.031, {
    attackSeconds: 0.65,
    releaseSeconds: 0.8,
  }),
  ...chord([87.31, 130.81, 174.61], 7.8, 4.35, 0.031, {
    attackSeconds: 0.65,
    releaseSeconds: 0.8,
  }),
  ...chord([98, 146.83, 196], 11.7, 4.5, 0.032, {
    attackSeconds: 0.65,
    releaseSeconds: 0.85,
  }),
  ...phrase([
    [261.63, 0, 1.35, 0.015, 'flow', 'sine', 0.24, 0.45],
    [329.63, 0.8, 1.35, 0.014, 'flow', 'sine', 0.24, 0.45],
    [392, 1.6, 1.35, 0.014, 'flow', 'sine', 0.24, 0.45],
    [493.88, 2.4, 1.35, 0.013, 'flow', 'sine', 0.24, 0.45],
    [440, 3.2, 1.35, 0.013, 'flow', 'sine', 0.24, 0.45],
    [261.63, 4, 1.35, 0.015, 'flow', 'sine', 0.24, 0.45],
    [329.63, 4.8, 1.35, 0.014, 'flow', 'sine', 0.24, 0.45],
    [440, 5.6, 1.35, 0.014, 'flow', 'sine', 0.24, 0.45],
    [523.25, 6.4, 1.35, 0.013, 'flow', 'sine', 0.24, 0.45],
    [440, 7.2, 1.35, 0.013, 'flow', 'sine', 0.24, 0.45],
    [261.63, 8, 1.35, 0.015, 'flow', 'sine', 0.24, 0.45],
    [349.23, 8.8, 1.35, 0.014, 'flow', 'sine', 0.24, 0.45],
    [440, 9.6, 1.35, 0.014, 'flow', 'sine', 0.24, 0.45],
    [523.25, 10.4, 1.35, 0.013, 'flow', 'sine', 0.24, 0.45],
    [440, 11.2, 1.35, 0.013, 'flow', 'sine', 0.24, 0.45],
    [246.94, 12, 1.35, 0.015, 'flow', 'sine', 0.24, 0.45],
    [293.66, 12.8, 1.35, 0.014, 'flow', 'sine', 0.24, 0.45],
    [392, 13.6, 1.35, 0.014, 'flow', 'sine', 0.24, 0.45],
    [493.88, 14.4, 1.35, 0.013, 'flow', 'sine', 0.24, 0.45],
    [392, 15.2, 1.2, 0.013, 'flow', 'sine', 0.24, 0.45],
  ]),
];

export const MUSIC_TRACKS: readonly MusicTrackDefinition[] = [
  {
    id: 'cozy-nook',
    label: 'Cozy Nook',
    styleLabel: 'Original reference',
    description: 'The original smooth chords plus short triangle-wave foreground notes.',
    listeningPrompt: 'Do the new approaches feel more unified and pleasant than this reference?',
    bpm: 72,
    beatsPerLoop: 16,
    filterFrequency: 2_800,
    notes: COZY_NOOK_NOTES,
  },
  {
    id: 'quiet-cove',
    label: 'Quiet Cove',
    styleLabel: 'Pad only · no melody',
    description: 'Slow overlapping chords with no separate foreground instrument.',
    listeningPrompt: 'Is the absence of a melody peaceful, or does the track feel too empty?',
    bpm: 58,
    beatsPerLoop: 16,
    filterFrequency: 2_350,
    ambience: { delaySeconds: 0.32, feedback: 0.14, mix: 0.1 },
    notes: QUIET_COVE_NOTES,
  },
  {
    id: 'moonlit-window',
    label: 'Moonlit Window',
    styleLabel: 'Blended legato melody',
    description:
      'Overlapping chords and sparse long notes made from the same soft sine-wave color.',
    listeningPrompt:
      'Do the longer notes finally feel like part of the background, or still separate?',
    bpm: 62,
    beatsPerLoop: 16,
    filterFrequency: 2_250,
    ambience: { delaySeconds: 0.3, feedback: 0.13, mix: 0.1 },
    notes: MOONLIT_WINDOW_NOTES,
  },
  {
    id: 'starlight-stream',
    label: 'Starlight Stream',
    styleLabel: 'Flowing overlapping pattern',
    description: 'A continuous ribbon of quiet chord tones instead of isolated melodic bursts.',
    listeningPrompt:
      'Does the gentle motion feel cohesive, or is any repeating pattern still distracting?',
    bpm: 76,
    beatsPerLoop: 16,
    filterFrequency: 2_650,
    ambience: { delaySeconds: 0.22, feedback: 0.11, mix: 0.08 },
    notes: STARLIGHT_STREAM_NOTES,
  },
];

export function getMusicTrack(id: MusicTrackId): MusicTrackDefinition {
  const track = MUSIC_TRACKS.find((candidate) => candidate.id === id);
  if (!track) throw new Error(`Unknown music track: ${id}`);
  return track;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function musicTrackDuration(track: MusicTrackDefinition): number {
  return (track.beatsPerLoop * 60) / track.bpm;
}

export function transformMusicTrack(
  track: MusicTrackDefinition,
  transform: MusicTrackTransform,
): MusicTrackDefinition {
  const tempoPercent = clamp(transform.tempoPercent, 70, 130);
  const warmth = clamp(transform.warmth, 0, 100);
  const foregroundPercent = clamp(transform.foregroundPercent, 0, 150);
  const warmthMultiplier = 1.55 - warmth * 0.0085;
  return {
    ...track,
    bpm: track.bpm * (tempoPercent / 100),
    filterFrequency: clamp(track.filterFrequency * warmthMultiplier, 900, 7_000),
    notes: track.notes.map((note) => ({
      ...note,
      gain: note.role === 'bed' ? note.gain : note.gain * (foregroundPercent / 100),
    })),
  };
}

export function serializeMusicRecipe(
  trackId: MusicTrackId,
  transform: MusicTrackTransform,
): string {
  return JSON.stringify({ trackId, transform }, null, 2);
}
