import { describe, expect, it } from 'vitest';
import { COZY_ELECTRIC_PIANO_THEME, MUSIC_TRACKS, musicTrackDuration } from './music';
import {
  COZY_ELECTRIC_PIANO_EXTENDED,
  MUSIC_EXPERIMENT_TRACKS,
  MUSIC_LAB_TRACKS,
  getMusicLabTrack,
} from './musicExperiments';

describe('Music Lab experiment catalog', () => {
  it('provides 25 development experiments around the five production tracks', () => {
    expect(MUSIC_EXPERIMENT_TRACKS).toHaveLength(25);
    expect(MUSIC_LAB_TRACKS).toHaveLength(30);
    expect(new Set(MUSIC_LAB_TRACKS.map((track) => track.id)).size).toBe(30);
    expect(
      Object.fromEntries(
        ['piano', 'plucked', 'smooth', 'playful', 'reference'].map((family) => [
          family,
          MUSIC_LAB_TRACKS.filter((track) => track.family === family).length,
        ]),
      ),
    ).toEqual({ piano: 10, plucked: 5, smooth: 6, playful: 5, reference: 4 });
  });

  it('keeps every experiment bass-light, bounded, and useful for comparison', () => {
    const instruments = new Set<string>();
    for (const track of MUSIC_EXPERIMENT_TRACKS) {
      expect(track.lowCutFrequency).toBeGreaterThanOrEqual(120);
      expect(Math.min(...track.notes.map((note) => note.frequency))).toBeGreaterThanOrEqual(160);
      expect(
        Math.max(...track.notes.map((note) => note.startBeat + note.durationBeats)),
      ).toBeLessThanOrEqual(track.beatsPerLoop + 0.5);
      expect(musicTrackDuration(track)).toBeGreaterThan(9);
      expect(musicTrackDuration(track)).toBeLessThan(76);
      expect(track.listeningPrompt).toMatch(/\?$/);
      for (const note of track.notes) {
        expect(note.instrument).toBeTruthy();
        instruments.add(note.instrument ?? '');
      }
      if (track.ambience) {
        expect(track.ambience.feedback).toBeLessThanOrEqual(0.04);
        expect(track.ambience.mix).toBeLessThanOrEqual(0.03);
      }
    }
    expect(instruments.size).toBeGreaterThanOrEqual(10);
  });

  it('keeps the Cozy extended version as a deliberate five-section arrangement', () => {
    expect(musicTrackDuration(COZY_ELECTRIC_PIANO_EXTENDED)).toBe(75);
    expect(COZY_ELECTRIC_PIANO_EXTENDED.notes).toHaveLength(144);
    expect(
      COZY_ELECTRIC_PIANO_EXTENDED.notes.every(
        (note) => note.instrument === 'electric-piano' && note.role === 'flow',
      ),
    ).toBe(true);
    expect(COZY_ELECTRIC_PIANO_EXTENDED.notes.every((note) => note.releaseSeconds === 0.5)).toBe(
      true,
    );
    expect(
      Math.max(
        ...COZY_ELECTRIC_PIANO_EXTENDED.notes.map((note) => note.startBeat + note.durationBeats),
      ),
    ).toBeLessThanOrEqual(COZY_ELECTRIC_PIANO_EXTENDED.beatsPerLoop + 0.5);
  });

  it('builds the Cozy theme as a composed A-A2-B-A-prime form', () => {
    expect(musicTrackDuration(COZY_ELECTRIC_PIANO_THEME)).toBe(60);
    expect(COZY_ELECTRIC_PIANO_THEME.notes).toHaveLength(126);
    expect(
      COZY_ELECTRIC_PIANO_THEME.notes.every(
        (note) => note.instrument === 'electric-piano' && note.releaseSeconds! >= 0.5,
      ),
    ).toBe(true);

    const melody = COZY_ELECTRIC_PIANO_THEME.notes.filter((note) => note.role === 'melody');
    const opening = melody.filter((note) => note.startBeat < 4).map((note) => note.frequency);
    const answerOpening = melody
      .filter((note) => note.startBeat >= 16 && note.startBeat < 20)
      .map((note) => note.frequency);
    const returnOpening = melody
      .filter((note) => note.startBeat >= 48 && note.startBeat < 52)
      .slice(0, 3)
      .map((note) => note.frequency);
    expect(answerOpening).toEqual(opening);
    expect(returnOpening).toEqual(opening.slice(0, 3));
    expect(melody.some((note) => note.startBeat >= 32 && note.startBeat < 48)).toBe(true);
    expect(
      Math.max(
        ...COZY_ELECTRIC_PIANO_THEME.notes.map((note) => note.startBeat + note.durationBeats),
      ),
    ).toBeLessThanOrEqual(COZY_ELECTRIC_PIANO_THEME.beatsPerLoop + 0.5);
  });

  it('features the main theme with Piano and keeps the other production choices as references', () => {
    expect(
      MUSIC_LAB_TRACKS.filter((track) => track.family === 'reference').map((track) => track.id),
    ).toEqual(
      MUSIC_TRACKS.filter((track) => track.id !== COZY_ELECTRIC_PIANO_THEME.id).map(
        (track) => track.id,
      ),
    );
    expect(getMusicLabTrack(COZY_ELECTRIC_PIANO_THEME.id).family).toBe('piano');
    expect(getMusicLabTrack('solo-nook-piano').label).toBe('Solo Nook Piano');
    expect(() => getMusicLabTrack('missing-track')).toThrow('Unknown Music Lab track');
  });
});
