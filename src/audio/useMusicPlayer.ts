import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_MUSIC_TRACK_ID, type MusicTrackDefinition, type MusicTrackId } from './music';
import { MusicPlayer } from './musicPlayer';
import type { AudioPreferences } from './preferences';

export function useMusicPlayer(
  preferences: AudioPreferences,
  active: boolean,
  trackId: MusicTrackId = DEFAULT_MUSIC_TRACK_ID,
  startDelayMs = 0,
) {
  const [player] = useState(() => new MusicPlayer());

  const startMusic = useCallback(
    (nextPreferences: AudioPreferences = preferences) => player.start(trackId, nextPreferences),
    [player, preferences, trackId],
  );
  const startMusicTrack = useCallback(
    (nextTrackId: MusicTrackId, nextPreferences: AudioPreferences = preferences) =>
      player.start(nextTrackId, nextPreferences),
    [player, preferences],
  );
  const playMusicDefinition = useCallback(
    (track: MusicTrackDefinition, nextPreferences: AudioPreferences = preferences) =>
      player.startDefinition(track, nextPreferences),
    [player, preferences],
  );
  const stopMusic = useCallback(() => player.stop(), [player]);

  useEffect(() => {
    if (!active || !preferences.musicEnabled || preferences.musicVolume <= 0) {
      player.stop();
      return;
    }

    const retryStart = () => void player.start(trackId, preferences);
    const startTimer = window.setTimeout(retryStart, startDelayMs);
    if (startDelayMs === 0) {
      window.addEventListener('pointerdown', retryStart, { once: true });
      window.addEventListener('keydown', retryStart, { once: true });
    }
    return () => {
      window.clearTimeout(startTimer);
      window.removeEventListener('pointerdown', retryStart);
      window.removeEventListener('keydown', retryStart);
    };
  }, [active, player, preferences, startDelayMs, trackId]);

  useEffect(
    () => () => {
      void player.close();
    },
    [player],
  );

  return { startMusic, startMusicTrack, playMusicDefinition, stopMusic };
}
