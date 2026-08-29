import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_MUSIC_TRANSFORM,
  musicTrackDuration,
  serializeMusicRecipe,
  transformMusicTrack,
  type MusicTrackTransform,
} from '../audio/music';
import {
  MUSIC_LAB_FAMILIES,
  MUSIC_LAB_TRACKS,
  getMusicLabTrack,
  type MusicLabFamily,
} from '../audio/musicExperiments';
import { MusicPlayer } from '../audio/musicPlayer';
import {
  DEFAULT_AUDIO_PREFERENCES,
  LocalStorageAudioPreferencesRepository,
  type AudioPreferences,
} from '../audio/preferences';

const preferencesRepository = new LocalStorageAudioPreferencesRepository();

const FAMILY_LABELS: Record<MusicLabFamily, string> = {
  piano: 'Piano',
  plucked: 'Plucked',
  smooth: 'Smooth',
  playful: 'Playful',
  reference: 'References',
};

export function MusicLab() {
  const [preferences, setPreferences] = useState(() => preferencesRepository.load());
  const [selectedTrackId, setSelectedTrackId] = useState<string>('cozy-electric-piano-theme');
  const [familyFilter, setFamilyFilter] = useState<MusicLabFamily | 'all'>('piano');
  const [transform, setTransform] = useState<MusicTrackTransform>(DEFAULT_MUSIC_TRANSFORM);
  const [status, setStatus] = useState(
    'Music is stopped. Start with one family, then compare only the tracks that catch your ear.',
  );
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [player] = useState(() => new MusicPlayer());
  const baseTrack = useMemo(() => getMusicLabTrack(selectedTrackId), [selectedTrackId]);
  const visibleTracks = useMemo(
    () =>
      familyFilter === 'all'
        ? MUSIC_LAB_TRACKS
        : MUSIC_LAB_TRACKS.filter((track) => track.family === familyFilter),
    [familyFilter],
  );
  const customizedTrack = useMemo(
    () => transformMusicTrack(baseTrack, transform),
    [baseTrack, transform],
  );
  const hasForeground = useMemo(
    () => baseTrack.notes.some((note) => note.role !== 'bed'),
    [baseTrack.notes],
  );
  const recipe = useMemo(
    () => serializeMusicRecipe(baseTrack.id, transform),
    [baseTrack.id, transform],
  );

  useEffect(
    () => () => {
      void player.close();
    },
    [player],
  );

  const updatePreferences = (next: AudioPreferences) => {
    try {
      setPreferences(preferencesRepository.save(next));
    } catch {
      setPreferences(next);
      setStatus('The setting works for this tab, but this browser could not save it.');
    }
    if (!next.musicEnabled || next.musicVolume <= 0) {
      player.stop();
      setPlayingTrackId(null);
      setStatus(
        next.musicEnabled
          ? 'Music volume is at 0%. Raise it before trying a track.'
          : 'Music is off. Turn it on when you are ready to compare tracks.',
      );
    } else if (playingTrackId) {
      void player.startDefinition(customizedTrack, next);
      setStatus(
        `Playing “${customizedTrack.label}” at ${Math.round(next.musicVolume * 100)}% volume.`,
      );
    } else {
      setStatus('Music is on. Choose any track below to begin comparing styles.');
    }
  };

  const playTrack = async (trackId: string) => {
    const nextTransform = DEFAULT_MUSIC_TRANSFORM;
    const track = transformMusicTrack(getMusicLabTrack(trackId), nextTransform);
    player.stop();
    setSelectedTrackId(trackId);
    setTransform(nextTransform);
    const started = await player.startDefinition(track, preferences);
    setPlayingTrackId(started ? trackId : null);
    setStatus(
      started
        ? `Playing “${track.label}.” Let it repeat twice, then try a contrasting style.`
        : 'Turn music on and raise its volume before trying a track.',
    );
  };

  const startLoop = async () => {
    player.stop();
    const started = await player.startDefinition(customizedTrack, preferences);
    setPlayingTrackId(started ? selectedTrackId : null);
    setStatus(
      started
        ? `Playing “${customizedTrack.label}” at ${Math.round(preferences.musicVolume * 100)}% volume.`
        : 'Turn music on and raise its volume before starting the loop.',
    );
  };

  const stopLoop = () => {
    player.stop();
    setPlayingTrackId(null);
    setStatus('Music stopped with a short fade.');
  };

  const resetLab = () => {
    player.stop();
    setPlayingTrackId(null);
    setSelectedTrackId('cozy-electric-piano-theme');
    setFamilyFilter('piano');
    setTransform(DEFAULT_MUSIC_TRANSFORM);
    updatePreferences({
      ...preferences,
      musicEnabled: DEFAULT_AUDIO_PREFERENCES.musicEnabled,
      musicVolume: DEFAULT_AUDIO_PREFERENCES.musicVolume,
    });
    setStatus('Restored the quiet production defaults. Music is off.');
  };

  const copyRecipe = async () => {
    try {
      await navigator.clipboard.writeText(recipe);
      setStatus('Copied the music recipe. Paste it into the chat when sharing feedback.');
    } catch {
      setStatus('Clipboard access was blocked. Expand the recipe below and copy it manually.');
    }
  };

  return (
    <main className="state-gallery music-lab page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Development only</span>
          <h1>Number Nook Music Lab</h1>
          <p>
            Compare 30 bass-light sketches across piano, plucked, smooth, and playful families. The
            loops are generated with Web Audio and add no downloaded music files.
          </p>
        </div>
      </header>

      <section className="panel music-controls" aria-labelledby="music-controls-heading">
        <div>
          <h2 id="music-controls-heading">Listening controls</h2>
          <p>Music is opt-in and uses a separate preference from gameplay sound effects.</p>
        </div>
        <label className="sound-switch">
          <input
            type="checkbox"
            checked={preferences.musicEnabled}
            onChange={(event) =>
              updatePreferences({ ...preferences, musicEnabled: event.currentTarget.checked })
            }
          />
          <span>Background music {preferences.musicEnabled ? 'on' : 'off'}</span>
        </label>
        <label className="volume-control" htmlFor="music-volume">
          <span>Music volume</span>
          <input
            id="music-volume"
            type="range"
            min="0"
            max="0.5"
            step="0.02"
            value={preferences.musicVolume}
            onChange={(event) =>
              updatePreferences({
                ...preferences,
                musicVolume: Number(event.currentTarget.value),
              })
            }
          />
          <strong>{Math.round(preferences.musicVolume * 100)}%</strong>
        </label>
        <button className="text-button" type="button" onClick={resetLab}>
          Reset music defaults
        </button>
        <p className="sound-status" role="status" aria-label="Music Lab status">
          {status}
        </p>
      </section>

      <section className="panel music-sampler" aria-labelledby="music-sampler-heading">
        <div className="music-sampler-heading">
          <div>
            <span className="eyebrow">Style sampler</span>
            <h2 id="music-sampler-heading">Find your direction</h2>
            <p>
              You do not need music vocabulary. Begin with one sound family, let promising tracks
              repeat, and notice which ones stay pleasant on the phone.
            </p>
          </div>
          <span className="mode-pill">25 experiments + 5 production tracks</span>
        </div>

        <div className="music-family-filters" aria-label="Filter tracks by sound family">
          <button
            className="choice-chip"
            type="button"
            aria-pressed={familyFilter === 'all'}
            onClick={() => setFamilyFilter('all')}
          >
            All <span>{MUSIC_LAB_TRACKS.length}</span>
          </button>
          {MUSIC_LAB_FAMILIES.map((family) => {
            const count = MUSIC_LAB_TRACKS.filter((track) => track.family === family).length;
            return (
              <button
                className="choice-chip"
                type="button"
                aria-pressed={familyFilter === family}
                onClick={() => setFamilyFilter(family)}
                key={family}
              >
                {FAMILY_LABELS[family]} <span>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="music-track-grid">
          {visibleTracks.map((track) => {
            const isSelected = selectedTrackId === track.id;
            const isPlaying = playingTrackId === track.id;
            return (
              <article
                className={`music-track-card${isSelected ? ' music-track-card--selected' : ''}`}
                key={track.id}
              >
                <div>
                  <span className="music-style-label">{track.styleLabel}</span>
                  <h3>{track.label}</h3>
                  <p>{track.description}</p>
                </div>
                <p className="music-listening-prompt">{track.listeningPrompt}</p>
                <div className="music-track-meta">
                  <span>{track.bpm} BPM</span>
                  <span>{musicTrackDuration(track).toFixed(1)}s loop</span>
                  <span>{track.lowCutFrequency ?? 90} Hz low cut</span>
                </div>
                <button
                  className={isPlaying ? 'primary-button' : 'secondary-button'}
                  type="button"
                  aria-pressed={isPlaying}
                  disabled={!preferences.musicEnabled || preferences.musicVolume <= 0}
                  onClick={() => void playTrack(track.id)}
                >
                  {isPlaying ? `Playing ${track.label}` : `Play ${track.label}`}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel music-playground" aria-labelledby="music-playground-heading">
        <div className="sound-playground-heading">
          <div>
            <span className="eyebrow">Tune selected track</span>
            <h2 id="music-playground-heading">{customizedTrack.label}</h2>
            <p>{customizedTrack.description}</p>
          </div>
          <span className="mode-pill">{musicTrackDuration(customizedTrack).toFixed(1)}s loop</span>
        </div>

        <div className="music-slider-grid">
          <label className="sound-field sound-slider">
            <span>Tempo</span>
            <output>{transform.tempoPercent}%</output>
            <input
              aria-label="Music tempo"
              type="range"
              min="70"
              max="130"
              step="5"
              value={transform.tempoPercent}
              onChange={(event) =>
                setTransform({ ...transform, tempoPercent: Number(event.currentTarget.value) })
              }
            />
          </label>
          <label className="sound-field sound-slider">
            <span>Warmth</span>
            <output>{transform.warmth}%</output>
            <input
              aria-label="Music warmth"
              type="range"
              min="0"
              max="100"
              step="5"
              value={transform.warmth}
              onChange={(event) =>
                setTransform({ ...transform, warmth: Number(event.currentTarget.value) })
              }
            />
          </label>
          <label className="sound-field sound-slider">
            <span>Foreground presence</span>
            <output>{hasForeground ? `${transform.foregroundPercent}%` : 'None'}</output>
            <input
              aria-label="Music foreground presence"
              type="range"
              min="0"
              max="150"
              step="10"
              value={transform.foregroundPercent}
              disabled={!hasForeground}
              onChange={(event) =>
                setTransform({
                  ...transform,
                  foregroundPercent: Number(event.currentTarget.value),
                })
              }
            />
          </label>
        </div>

        <div className="sound-playground-actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => void startLoop()}
            disabled={!preferences.musicEnabled || preferences.musicVolume <= 0}
          >
            {playingTrackId === selectedTrackId
              ? 'Restart customized loop'
              : 'Start customized loop'}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={stopLoop}
            disabled={!playingTrackId}
          >
            Stop music
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setTransform(DEFAULT_MUSIC_TRANSFORM);
              setStatus('Restored the selected track’s default tuning. Restart to hear it.');
            }}
          >
            Reset recipe
          </button>
          <button className="text-button" type="button" onClick={() => void copyRecipe()}>
            Copy music recipe
          </button>
        </div>

        <details className="sound-recipe">
          <summary>View recipe JSON</summary>
          <pre>{recipe}</pre>
        </details>
      </section>

      <section className="panel sound-lab-notes">
        <h2>Production behavior</h2>
        <ul>
          <li>Production now uses Cozy Electric Piano as the main theme.</li>
          <li>Players can choose among all five production tracks in Settings.</li>
          <li>The 25 remaining experiments stay development-only for a later music pass.</li>
          <li>Every experiment removes deep bass and uses little or no echo for phone comfort.</li>
          <li>Music begins only after the player turns it on.</li>
          <li>The loop fades out for active questions so answer cues remain clear.</li>
          <li>It resumes on menus and results after the browser has allowed audio.</li>
          <li>Sound effects keep their own mute and volume preferences.</li>
        </ul>
        <p>
          Compare short cues in the <a href="?dev=sounds">Sound Lab</a>, or return to the{' '}
          <a href="?dev=states">state gallery</a>.
        </p>
      </section>
    </main>
  );
}
