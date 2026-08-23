import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MUSIC_TRANSFORM,
  DEFAULT_MUSIC_TRACK_ID,
  MUSIC_TRACKS,
  getMusicTrack,
  musicTrackDuration,
  serializeMusicRecipe,
  transformMusicTrack,
} from './music';

describe('music definitions', () => {
  it('uses the selected smooth favorite as the production default', () => {
    expect(DEFAULT_MUSIC_TRACK_ID).toBe('starlight-stream');
    expect(getMusicTrack(DEFAULT_MUSIC_TRACK_ID).label).toBe('Starlight Stream');
  });

  it('provides one reference and three distinct smooth offline experiments', () => {
    expect(MUSIC_TRACKS).toHaveLength(4);
    expect(new Set(MUSIC_TRACKS.map((track) => track.id)).size).toBe(MUSIC_TRACKS.length);
    for (const track of MUSIC_TRACKS) {
      expect(track.styleLabel.length).toBeGreaterThan(4);
      expect(track.listeningPrompt).toMatch(/\?$/);
      expect(track.notes.length).toBeGreaterThan(10);
      expect(
        Math.max(...track.notes.map((note) => note.startBeat + note.durationBeats)),
      ).toBeLessThanOrEqual(track.beatsPerLoop + 0.5);
      expect(musicTrackDuration(track)).toBeGreaterThan(12);
      expect(musicTrackDuration(track)).toBeLessThanOrEqual(17);
      if (track.ambience) {
        expect(track.ambience.delaySeconds).toBeLessThanOrEqual(0.5);
        expect(track.ambience.feedback).toBeLessThan(0.25);
        expect(track.ambience.mix).toBeLessThanOrEqual(0.15);
      }
    }

    const track = getMusicTrack('cozy-nook');
    expect(track.notes.length).toBeGreaterThan(20);
    expect(musicTrackDuration(track)).toBeCloseTo(13.333, 2);
  });

  it('clamps lab transforms and scales every foreground role without changing the bed', () => {
    const original = getMusicTrack('cozy-nook');
    const transformed = transformMusicTrack(original, {
      tempoPercent: 200,
      warmth: -10,
      foregroundPercent: 50,
    });
    expect(transformed.bpm).toBe(original.bpm * 1.3);
    expect(transformed.filterFrequency).toBe(4_340);
    expect(transformed.notes.find((note) => note.role === 'sparkle')?.gain).toBe(
      (original.notes.find((note) => note.role === 'sparkle')?.gain ?? 0) * 0.5,
    );
    expect(transformed.notes.find((note) => note.role === 'bed')?.gain).toBe(
      original.notes.find((note) => note.role === 'bed')?.gain,
    );
    expect(original.bpm).toBe(72);
  });

  it('defines three meaningfully different smooth architectures', () => {
    const pad = getMusicTrack('quiet-cove');
    const dreamy = transformMusicTrack(getMusicTrack('moonlit-window'), DEFAULT_MUSIC_TRANSFORM);
    const flowing = transformMusicTrack(getMusicTrack('starlight-stream'), DEFAULT_MUSIC_TRANSFORM);
    expect(pad.notes.every((note) => note.role === 'bed')).toBe(true);
    expect(
      dreamy.notes
        .filter((note) => note.role === 'melody')
        .every((note) => note.wave === 'sine' && note.durationBeats >= 2.5),
    ).toBe(true);
    expect(flowing.notes.filter((note) => note.role === 'flow').length).toBeGreaterThan(15);
    expect(flowing.filterFrequency).toBeGreaterThan(dreamy.filterFrequency);
  });

  it('serializes a reproducible Music Lab recipe', () => {
    expect(JSON.parse(serializeMusicRecipe('cozy-nook', DEFAULT_MUSIC_TRANSFORM))).toEqual({
      trackId: 'cozy-nook',
      transform: DEFAULT_MUSIC_TRANSFORM,
    });
  });
});
