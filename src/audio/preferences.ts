import { z } from 'zod';
import { DEFAULT_MUSIC_TRACK_ID, MUSIC_TRACK_IDS, type MusicTrackId } from './music';

export interface AudioPreferences {
  effectsEnabled: boolean;
  effectsVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  musicTrackId: MusicTrackId;
}

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  effectsEnabled: true,
  effectsVolume: 0.4,
  musicEnabled: false,
  musicVolume: 0.18,
  musicTrackId: DEFAULT_MUSIC_TRACK_ID,
};

const audioPreferencesSchema = z.object({
  effectsEnabled: z.boolean(),
  effectsVolume: z.number().min(0).max(1),
  musicEnabled: z.boolean().default(DEFAULT_AUDIO_PREFERENCES.musicEnabled),
  musicVolume: z.number().min(0).max(1).default(DEFAULT_AUDIO_PREFERENCES.musicVolume),
  musicTrackId: z.enum(MUSIC_TRACK_IDS).default(DEFAULT_AUDIO_PREFERENCES.musicTrackId),
});

export class LocalStorageAudioPreferencesRepository {
  static readonly key = 'first-math-game:audio-preferences';

  load(): AudioPreferences {
    const serialized = localStorage.getItem(LocalStorageAudioPreferencesRepository.key);
    if (!serialized) return DEFAULT_AUDIO_PREFERENCES;
    try {
      return audioPreferencesSchema.parse(JSON.parse(serialized) as unknown);
    } catch {
      return DEFAULT_AUDIO_PREFERENCES;
    }
  }

  save(preferences: AudioPreferences): AudioPreferences {
    const validated = audioPreferencesSchema.parse(preferences);
    localStorage.setItem(LocalStorageAudioPreferencesRepository.key, JSON.stringify(validated));
    return validated;
  }
}
