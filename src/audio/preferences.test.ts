import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_AUDIO_PREFERENCES, LocalStorageAudioPreferencesRepository } from './preferences';

describe('audio preferences', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
  });

  it('defaults effects on and music off at restrained volumes, then persists changes', () => {
    const repository = new LocalStorageAudioPreferencesRepository();
    expect(repository.load()).toEqual(DEFAULT_AUDIO_PREFERENCES);
    const saved = repository.save({
      effectsEnabled: false,
      effectsVolume: 0.25,
      musicEnabled: true,
      musicVolume: 0.2,
      musicTrackId: 'moonlit-window',
    });
    expect(saved).toEqual({
      effectsEnabled: false,
      effectsVolume: 0.25,
      musicEnabled: true,
      musicVolume: 0.2,
      musicTrackId: 'moonlit-window',
    });
    expect(repository.load()).toEqual(saved);
  });

  it('migrates the existing effects-only preference shape without losing it', () => {
    localStorage.setItem(
      LocalStorageAudioPreferencesRepository.key,
      JSON.stringify({ effectsEnabled: false, effectsVolume: 0.25 }),
    );
    expect(new LocalStorageAudioPreferencesRepository().load()).toEqual({
      effectsEnabled: false,
      effectsVolume: 0.25,
      musicEnabled: false,
      musicVolume: 0.18,
      musicTrackId: 'cozy-electric-piano-theme',
    });
  });

  it('adds the default soundtrack to preferences saved before soundtrack selection existed', () => {
    localStorage.setItem(
      LocalStorageAudioPreferencesRepository.key,
      JSON.stringify({
        effectsEnabled: true,
        effectsVolume: 0.3,
        musicEnabled: true,
        musicVolume: 0.15,
      }),
    );
    expect(new LocalStorageAudioPreferencesRepository().load()).toEqual({
      effectsEnabled: true,
      effectsVolume: 0.3,
      musicEnabled: true,
      musicVolume: 0.15,
      musicTrackId: 'cozy-electric-piano-theme',
    });
  });

  it('migrates the former default once but preserves later soundtrack choices', () => {
    localStorage.setItem(
      LocalStorageAudioPreferencesRepository.key,
      JSON.stringify({
        effectsEnabled: true,
        effectsVolume: 0.4,
        musicEnabled: true,
        musicVolume: 0.18,
        musicTrackId: 'starlight-stream',
      }),
    );
    const repository = new LocalStorageAudioPreferencesRepository();
    expect(repository.load().musicTrackId).toBe('cozy-electric-piano-theme');

    repository.save({
      ...DEFAULT_AUDIO_PREFERENCES,
      musicEnabled: true,
      musicTrackId: 'starlight-stream',
    });
    expect(repository.load().musicTrackId).toBe('starlight-stream');
  });

  it('falls back safely when stored preferences are malformed', () => {
    localStorage.setItem(LocalStorageAudioPreferencesRepository.key, '{');
    expect(new LocalStorageAudioPreferencesRepository().load()).toEqual(DEFAULT_AUDIO_PREFERENCES);

    localStorage.setItem(
      LocalStorageAudioPreferencesRepository.key,
      JSON.stringify({ effectsEnabled: true, effectsVolume: 4 }),
    );
    expect(new LocalStorageAudioPreferencesRepository().load()).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });
});
