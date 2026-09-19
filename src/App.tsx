import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { buildPlayHistoryExport, serializePlayHistory } from './analytics/history';
import { GAME_AUDIO_CUES } from './audio/cues';
import { MUSIC_TRACKS } from './audio/music';
import {
  DEFAULT_AUDIO_PREFERENCES,
  LocalStorageAudioPreferencesRepository,
  type AudioPreferences,
} from './audio/preferences';
import { useAudioPlayer } from './audio/useAudioPlayer';
import { useMusicPlayer } from './audio/useMusicPlayer';
import { rememberDialoguePhrase, selectCompanionDialogue } from './companions/engine';
import { BUILD_LABEL } from './buildInfo';
import { deriveResultDialogueFacts } from './companions/resultFacts';
import type { DialogueContext, ResultDialogueFacts, SelectedDialogue } from './companions/types';
import { AnswerCard } from './components/AnswerCard';
import { CollectibleCard } from './components/CollectibleCard';
import { CompanionDialogue } from './components/CompanionDialogue';
import {
  catalog,
  getCollectible,
  getCollectibleImage,
  getCollection,
  getStarterCollectibles,
} from './content/catalog';
import type { ArtStyle, CollectibleDefinition } from './content/schema';
import { companionThemeCssVariables, DEFAULT_COMPANION_THEME } from './content/theme';
import { DEVELOPMENT_COIN_GRANT, grantDevelopmentCoins } from './dev/cheats';
import { SystemClock } from './domain/clock';
import { answerFeedbackDelay } from './domain/feedback';
import {
  DEFAULT_SETTINGS,
  DIFFICULTY_IDS,
  DIFFICULTY_LABELS,
  formatProblem,
  GAME_MODE_IDS,
  generateSession,
  OPERATION_IDS,
  OPERATION_LABELS,
  OPERATION_SYMBOLS,
  QUESTION_COUNTS,
  type DifficultyId,
  type GameSettings,
  type OperationId,
  type Problem,
} from './domain/math';
import { practiceHint, PRACTICE_ENCOURAGEMENT } from './domain/practice';
import { createRandomSeed, SeededRandom } from './domain/random';
import {
  COLLECTION_CAPSULE_COST,
  DAILY_COIN_MILESTONE,
  eligibleCapsuleRewards,
  SURPRISE_CAPSULE_COST,
} from './domain/rewards';
import {
  scoreAnswer,
  summarizeSession,
  type AnswerRecord,
  type SessionSummary,
} from './domain/session';
import {
  applyCompletedSession,
  clearPlayHistory,
  createInitialSave,
  dailyCoinsEarned,
  DEFAULT_ART_STYLE,
  LocalStorageSaveRepository,
  type SaveData,
  updateArtStyle,
  updateSettings,
} from './storage/save';
import { openCapsule, type CapsuleChoice } from './storage/economy';
import { TrailQuestPlay } from './trail/TrailQuestPlay';
import { TRAIL_QUEST_LENGTH } from './trail/trails';

type Screen =
  | 'onboarding'
  | 'home'
  | 'setup'
  | 'play'
  | 'results'
  | 'review'
  | 'backup'
  | 'capsule'
  | 'gallery'
  | 'history'
  | 'settings';

interface ReviewState {
  summary: SessionSummary;
  back: 'results' | 'history';
}

interface EquipDialogueEvent {
  companionId: string;
  sequence: number;
}

interface ActiveGame {
  practice: boolean;
  trail: boolean;
  trailComplete: boolean;
  trailPosition: number;
  attempts: number[];
  firstResponseMs: number | null;
  hintUsed: boolean;
  recap: number[] | null;
  seed: number;
  problems: Problem[];
  index: number;
  answers: AnswerRecord[];
  questionStartedAt: number;
  startedAt: number;
  feedback: { selected: number; correct: boolean } | null;
  previous: { answer: AnswerRecord; prompt: string } | null;
}

const StateGallery = import.meta.env.DEV
  ? lazy(() =>
      import('./dev/StateGallery').then(({ StateGallery: DevelopmentStateGallery }) => ({
        default: DevelopmentStateGallery,
      })),
    )
  : null;
const SoundLab = import.meta.env.DEV
  ? lazy(() =>
      import('./dev/SoundLab').then(({ SoundLab: DevelopmentSoundLab }) => ({
        default: DevelopmentSoundLab,
      })),
    )
  : null;
const MusicLab = import.meta.env.DEV
  ? lazy(() =>
      import('./dev/MusicLab').then(({ MusicLab: DevelopmentMusicLab }) => ({
        default: DevelopmentMusicLab,
      })),
    )
  : null;
const ArtLab = import.meta.env.DEV
  ? lazy(() =>
      import('./dev/ArtLab').then(({ ArtLab: DevelopmentArtLab }) => ({
        default: DevelopmentArtLab,
      })),
    )
  : null;
const ThemeLab = import.meta.env.DEV
  ? lazy(() =>
      import('./dev/ThemeLab').then(({ ThemeLab: DevelopmentThemeLab }) => ({
        default: DevelopmentThemeLab,
      })),
    )
  : null;
const CompanionLab = import.meta.env.DEV
  ? lazy(() =>
      import('./dev/CompanionLab').then(({ CompanionLab: DevelopmentCompanionLab }) => ({
        default: DevelopmentCompanionLab,
      })),
    )
  : null;
const TrailQuestLab = import.meta.env.DEV
  ? lazy(() =>
      import('./dev/TrailQuestLab').then(({ TrailQuestLab: DevelopmentTrailQuestLab }) => ({
        default: DevelopmentTrailQuestLab,
      })),
    )
  : null;

function DevelopmentViewLoading() {
  return (
    <main className="loading-screen">
      <div className="loading-paw">🐾</div>
      <p>Opening development lab…</p>
    </main>
  );
}

const repository = new LocalStorageSaveRepository();
const audioPreferencesRepository = new LocalStorageAudioPreferencesRepository();
const clock = new SystemClock();
const MAX_BACKUP_FILE_BYTES = 5 * 1024 * 1024;

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, milliseconds) / 1_000;
  return `${seconds.toFixed(1)}s`;
}

function settingsSummary(settings: GameSettings): string {
  const operations = settings.operations.map((operation) => OPERATION_SYMBOLS[operation]).join(' ');
  const mode = settings.mode ?? 'quick';
  const modeLabel = mode === 'practice' ? 'Practice · ' : mode === 'trail' ? 'Trail Quest · ' : '';
  const lengthLabel =
    mode === 'trail' ? `${TRAIL_QUEST_LENGTH} treasures` : `${settings.questionCount} questions`;
  return `${modeLabel}${DIFFICULTY_LABELS[settings.difficulty]} · ${operations} · ${lengthLabel}`;
}

function difficultyDescription(difficulty: DifficultyId): string {
  const descriptions: Record<DifficultyId, string> = {
    easy: 'Foundational facts with friendly number ranges.',
    medium: 'Larger addition and subtraction, with tables through 10.',
    hard: 'Multi-digit arithmetic and multiplication tables through 12.',
    advanced: 'Large numbers, tables through 20, and negative subtraction answers.',
  };
  return descriptions[difficulty];
}

function resultHeadline(facts: ResultDialogueFacts | null): string {
  if (facts?.firstRound) return 'First score on the board!';
  if (facts?.perfect) return 'Perfect from start to finish!';
  if (facts?.personalBest) return 'New personal best!';
  if (facts?.accuracyImproved) return 'Your accuracy just grew!';
  return 'Another strong practice round!';
}

function SoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      className="icon-button sound-toggle"
      type="button"
      onClick={onToggle}
      aria-label={enabled ? 'Mute sound effects' : 'Turn on sound effects'}
      title={enabled ? 'Mute sound effects' : 'Turn on sound effects'}
    >
      <span aria-hidden="true">{enabled ? '🔊' : '🔇'}</span>
    </button>
  );
}

function MusicToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      className="icon-button music-toggle"
      type="button"
      onClick={onToggle}
      aria-label={enabled ? 'Mute background music' : 'Turn on background music'}
      title={enabled ? 'Mute background music' : 'Turn on background music'}
    >
      <span aria-hidden="true">{enabled ? '♫' : '♪'}</span>
    </button>
  );
}

function Onboarding({
  onComplete,
  onRestore,
  onStarterSelect,
}: {
  onComplete: (name: string, starterId: string) => void;
  onRestore: () => void;
  onStarterSelect: () => void;
}) {
  const starters = getStarterCollectibles();
  const [name, setName] = useState('');
  const [starterId, setStarterId] = useState('');
  const selectedStarter = starters.find((starter) => starter.id === starterId);
  const trimmedName = name.trim();
  const callToAction = !selectedStarter
    ? 'Choose a companion to continue'
    : !trimmedName
      ? 'Add your name to continue'
      : `Start with ${selectedStarter.name}`;

  return (
    <main className="onboarding page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">A little practice. A lot of progress.</span>
          <h1>Welcome to Number Nook</h1>
          <p>
            Solve quick math puzzles, earn Paw Coins, and discover companions for your collection.
          </p>
          <ul className="onboarding-promises" aria-label="How Number Nook works">
            <li>
              <span aria-hidden="true">＋</span>
              <strong>Practice</strong>
            </li>
            <li>
              <span aria-hidden="true">🐾</span>
              <strong>Earn</strong>
            </li>
            <li>
              <span aria-hidden="true">✦</span>
              <strong>Discover</strong>
            </li>
          </ul>
        </div>
        <div className="math-doodles" aria-hidden="true">
          <span>7 + 6</span>
          <span>= 13</span>
          <span>★</span>
        </div>
      </section>

      <form
        className="panel onboarding-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim() && starterId) onComplete(name, starterId);
        }}
      >
        <div className="field-group">
          <label htmlFor="player-name">What should we call you?</label>
          <input
            id="player-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={30}
            placeholder="Your name"
            autoComplete="nickname"
          />
        </div>

        <fieldset>
          <legend>Choose your first companion</legend>
          <p className="field-help">
            Pick the friend you want beside you. You can discover the others later.
          </p>
          <div className="starter-grid">
            {starters.map((starter) => {
              const selected = starterId === starter.id;
              return (
                <button
                  key={starter.id}
                  className={`starter-choice ${selected ? 'starter-choice--selected' : ''}`}
                  type="button"
                  aria-pressed={selected}
                  aria-label={starter.name}
                  style={companionThemeCssVariables(starter.theme)}
                  onClick={() => {
                    setStarterId(starter.id);
                    onStarterSelect();
                  }}
                >
                  <span className="starter-choice__art">
                    <img
                      src={`${import.meta.env.BASE_URL}${getCollectibleImage(starter, DEFAULT_ART_STYLE)}`}
                      alt=""
                    />
                    {selected && (
                      <span className="starter-choice__check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </span>
                  <span className="starter-choice__name">{starter.name}</span>
                  <span className={`rarity rarity--${starter.rarity}`}>{starter.rarity}</span>
                </button>
              );
            })}
          </div>
          <div
            className={`starter-introduction ${selectedStarter ? 'starter-introduction--ready' : ''}`}
            style={selectedStarter ? companionThemeCssVariables(selectedStarter.theme) : undefined}
            aria-live="polite"
          >
            <span className="starter-introduction__spark" aria-hidden="true">
              {selectedStarter ? '✦' : '?'}
            </span>
            <span>
              <strong>
                {selectedStarter
                  ? `${selectedStarter.name} is ready to join you!`
                  : 'Who will be your first companion?'}
              </strong>
              <small>
                {selectedStarter
                  ? selectedStarter.description
                  : 'Choose one of the three friends above.'}
              </small>
            </span>
          </div>
        </fieldset>

        <button className="primary-button" type="submit" disabled={!name.trim() || !starterId}>
          {callToAction}
        </button>
        <button className="text-button" type="button" onClick={onRestore}>
          Restore a backup
        </button>
        <p className="onboarding-local-note">No account needed. Progress stays on this device.</p>
      </form>
    </main>
  );
}

function Home({
  save,
  dialogue,
  onPlay,
  onSetup,
  onGallery,
  onCapsule,
  onHistory,
  onBackup,
  onSettings,
  audioPreferences,
  onToggleAudio,
  onToggleMusic,
}: {
  save: SaveData;
  dialogue?: SelectedDialogue;
  onPlay: () => void;
  onSetup: () => void;
  onGallery: () => void;
  onCapsule: () => void;
  onHistory: () => void;
  onBackup: () => void;
  onSettings: () => void;
  audioPreferences: AudioPreferences;
  onToggleAudio: () => void;
  onToggleMusic: () => void;
}) {
  const companion = getCollectible(save.equippedCollectibleId);
  const lastSession = save.sessions.at(-1);
  const isFirstRound = !lastSession;
  const isPractice = save.settings.mode === 'practice';
  const isTrail = save.settings.mode === 'trail';
  const collectionPercent = Math.round(
    (save.ownedCollectibleIds.length / catalog.collectibles.length) * 100,
  );

  return (
    <main className="page-shell home-page">
      <header className="home-header">
        <div>
          <span className="eyebrow">{isFirstRound ? 'Welcome to the Nook' : 'Welcome back'}</span>
          <h1>{save.player.name}'s Number Nook</h1>
        </div>
        <div className="home-status">
          <SoundToggle
            enabled={audioPreferences.effectsEnabled && audioPreferences.effectsVolume > 0}
            onToggle={onToggleAudio}
          />
          <MusicToggle
            enabled={audioPreferences.musicEnabled && audioPreferences.musicVolume > 0}
            onToggle={onToggleMusic}
          />
          <div className="coin-pill" aria-label={`${save.coins} Paw Coins`}>
            <span>🐾</span>
            {save.coins}
          </div>
        </div>
      </header>

      <section className="play-card">
        <div className="play-card__copy">
          <span className="mode-pill">{settingsSummary(save.settings)}</span>
          <h2>
            {isFirstRound
              ? isTrail
                ? 'Your first trail is ready!'
                : 'Your first round is ready!'
              : isPractice
                ? 'Ready to practice?'
                : isTrail
                  ? 'Ready for a Trail Quest?'
                  : 'Ready for a quick game?'}
          </h2>
          <p>
            {isFirstRound
              ? isTrail
                ? 'Collect ten treasures, reach the picnic nook, and earn your first Paw Coins.'
                : `Try ${save.settings.questionCount} questions, earn your first Paw Coins, and see how the Nook feels.`
              : isPractice
                ? 'Take your time, use a hint when you need one, and learn from every try.'
                : isTrail
                  ? 'Follow the path, collect ten treasures, and reach the picnic nook.'
                  : 'Aim carefully, find your rhythm, and see what you can improve.'}
          </p>
          <div className="play-actions">
            <button className="primary-button" type="button" onClick={onPlay}>
              {isFirstRound ? 'Start first round' : 'Play now'}
            </button>
            <button className="secondary-button" type="button" onClick={onSetup}>
              Change game
            </button>
          </div>
        </div>
        {companion && (
          <button
            className="home-companion"
            type="button"
            onClick={onGallery}
            aria-label={`View ${companion.name} in your collection`}
          >
            {dialogue ? (
              <CompanionDialogue
                companion={companion}
                artStyle={save.artStyle}
                dialogue={dialogue}
                variant="home"
                decorativePortrait
              />
            ) : (
              <>
                <span className="home-companion__portrait">
                  <img
                    src={`${import.meta.env.BASE_URL}${getCollectibleImage(companion, save.artStyle)}`}
                    alt=""
                  />
                </span>
                <span className="home-companion__identity">
                  <strong>{companion.name}</strong>
                  <span>Your companion</span>
                </span>
              </>
            )}
            <span className="home-companion__action">
              View companion <span aria-hidden="true">→</span>
            </span>
          </button>
        )}
      </section>

      <div className="home-grid">
        <button
          className="dashboard-card dashboard-card--collection"
          type="button"
          onClick={onGallery}
        >
          {companion ? (
            <span className="dashboard-icon dashboard-icon--portrait" aria-hidden="true">
              <img
                src={`${import.meta.env.BASE_URL}${getCollectibleImage(companion, save.artStyle)}`}
                alt=""
              />
            </span>
          ) : (
            <span className="dashboard-icon" aria-hidden="true">
              ✦
            </span>
          )}
          <span>
            <strong>Collection</strong>
            <small>
              {save.ownedCollectibleIds.length} of {catalog.collectibles.length} discovered
            </small>
            <span className="dashboard-progress" aria-hidden="true">
              <span style={{ width: `${collectionPercent}%` }} />
            </span>
          </span>
          <span aria-hidden="true">→</span>
        </button>
        <button className="dashboard-card" type="button" onClick={onCapsule}>
          <span className="dashboard-icon" aria-hidden="true">
            🐾
          </span>
          <span>
            <strong>Capsule Shelf</strong>
            <small>
              {save.rewardProgress.welcomeCapsuleStatus === 'available'
                ? 'Your free welcome capsule is ready!'
                : save.coins >= SURPRISE_CAPSULE_COST
                  ? 'A new companion is waiting!'
                  : `${SURPRISE_CAPSULE_COST - save.coins} more coins to open one`}
            </small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
        <button className="dashboard-card" type="button" onClick={onHistory}>
          <span className="dashboard-icon" aria-hidden="true">
            ↗
          </span>
          <span>
            <strong>Your progress</strong>
            <small>
              {lastSession
                ? `${Math.round(lastSession.accuracy * 100)}% last game`
                : 'Your first game is waiting'}
            </small>
            <small>
              {dailyCoinsEarned(save, clock.today())} earned today · {DAILY_COIN_MILESTONE}-coin
              goal
            </small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
        <button className="dashboard-card" type="button" onClick={onBackup}>
          <span className="dashboard-icon" aria-hidden="true">
            ⇄
          </span>
          <span>
            <strong>Backup &amp; restore</strong>
            <small>Save progress or move it to another device</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
        <button
          className="dashboard-card dashboard-card--settings"
          type="button"
          onClick={onSettings}
        >
          <span className="dashboard-icon" aria-hidden="true">
            ♪
          </span>
          <span>
            <strong>Settings</strong>
            <small>Sound effects, music, volume, and soundtrack</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
}

export function Settings({
  preferences,
  onChange,
  onReset,
  onBack,
}: {
  preferences: AudioPreferences;
  onChange: (preferences: AudioPreferences) => void;
  onReset: () => void;
  onBack: () => void;
}) {
  const update = (changes: Partial<AudioPreferences>) => onChange({ ...preferences, ...changes });
  const effectsAudible = preferences.effectsEnabled && preferences.effectsVolume > 0;
  const musicAudible = preferences.musicEnabled && preferences.musicVolume > 0;

  return (
    <main className="page-shell settings-page">
      <header className="page-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div>
          <span className="eyebrow">Device preferences</span>
          <h1>Settings</h1>
          <p>Choose how Number Nook sounds on this device.</p>
          <p className="build-version" aria-label="Application build">
            {BUILD_LABEL}
          </p>
        </div>
      </header>

      <div className="settings-stack">
        <section className="panel settings-panel" aria-labelledby="effects-settings-heading">
          <div className="settings-panel__heading">
            <span className="settings-panel__icon" aria-hidden="true">
              ✦
            </span>
            <div>
              <h2 id="effects-settings-heading">Sound effects</h2>
              <p>Answer feedback, Paw Coins, capsules, and other little cues.</p>
            </div>
          </div>
          <label className="sound-switch">
            <input
              type="checkbox"
              checked={effectsAudible}
              onChange={(event) =>
                update({
                  effectsEnabled: event.currentTarget.checked,
                  effectsVolume:
                    event.currentTarget.checked && preferences.effectsVolume === 0
                      ? DEFAULT_AUDIO_PREFERENCES.effectsVolume
                      : preferences.effectsVolume,
                })
              }
            />
            <span>Sound effects {effectsAudible ? 'on' : 'off'}</span>
          </label>
          <label className="settings-volume" htmlFor="settings-effects-volume">
            <span>Effects volume</span>
            <output htmlFor="settings-effects-volume">
              {Math.round(preferences.effectsVolume * 100)}%
            </output>
            <input
              id="settings-effects-volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={preferences.effectsVolume}
              disabled={!preferences.effectsEnabled}
              onChange={(event) => update({ effectsVolume: Number(event.currentTarget.value) })}
            />
          </label>
        </section>

        <section className="panel settings-panel" aria-labelledby="music-settings-heading">
          <div className="settings-panel__heading">
            <span className="settings-panel__icon" aria-hidden="true">
              ♪
            </span>
            <div>
              <h2 id="music-settings-heading">Background music</h2>
              <p>Gentle instrumental loops for menus and progress screens.</p>
            </div>
          </div>
          <label className="sound-switch">
            <input
              type="checkbox"
              checked={musicAudible}
              onChange={(event) =>
                update({
                  musicEnabled: event.currentTarget.checked,
                  musicVolume:
                    event.currentTarget.checked && preferences.musicVolume === 0
                      ? DEFAULT_AUDIO_PREFERENCES.musicVolume
                      : preferences.musicVolume,
                })
              }
            />
            <span>Background music {musicAudible ? 'on' : 'off'}</span>
          </label>
          <label className="settings-volume" htmlFor="settings-music-volume">
            <span>Music volume</span>
            <output htmlFor="settings-music-volume">
              {Math.round(preferences.musicVolume * 100)}%
            </output>
            <input
              id="settings-music-volume"
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={preferences.musicVolume}
              disabled={!preferences.musicEnabled}
              onChange={(event) => update({ musicVolume: Number(event.currentTarget.value) })}
            />
          </label>

          <fieldset className="settings-soundtracks">
            <legend>Soundtrack</legend>
            <p>
              Pick a favorite now, even if music is off. Changes play immediately when it is on.
            </p>
            <div className="settings-track-grid">
              {MUSIC_TRACKS.map((track) => {
                const selected = preferences.musicTrackId === track.id;
                return (
                  <button
                    key={track.id}
                    className={`settings-track ${selected ? 'settings-track--selected' : ''}`}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => update({ musicTrackId: track.id })}
                  >
                    <span className="music-style-label">{track.styleLabel}</span>
                    <strong>{track.label}</strong>
                    <small>{track.description}</small>
                    {selected && <span className="settings-track__selected">Selected</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section className="settings-reset" aria-label="Reset audio settings">
          <div>
            <strong>Want the original setup?</strong>
            <span>Effects on, music off, and Cozy Electric Piano selected.</span>
          </div>
          <button className="secondary-button" type="button" onClick={onReset}>
            Reset audio defaults
          </button>
        </section>
      </div>
    </main>
  );
}

function Setup({
  settings,
  companion,
  dialogue,
  artStyle,
  onChange,
  onBack,
  onStart,
}: {
  settings: GameSettings;
  companion?: CollectibleDefinition;
  dialogue?: SelectedDialogue;
  artStyle: ArtStyle;
  onChange: (settings: GameSettings) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const toggleOperation = (operation: OperationId) => {
    const selected = settings.operations.includes(operation);
    if (selected && settings.operations.length === 1) return;
    onChange({
      ...settings,
      operations: selected
        ? settings.operations.filter((value) => value !== operation)
        : [...settings.operations, operation],
    });
  };

  return (
    <main className="page-shell narrow-page">
      <header className="page-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div>
          <span className="eyebrow">Game setup</span>
          <h1>Choose your challenge</h1>
        </div>
      </header>
      <section className="panel setup-panel">
        {companion && (
          <div className="setup-companion">
            {dialogue ? (
              <CompanionDialogue
                companion={companion}
                artStyle={artStyle}
                dialogue={dialogue}
                variant="setup"
              />
            ) : (
              <>
                <img
                  src={`${import.meta.env.BASE_URL}${getCollectibleImage(companion, artStyle)}`}
                  alt={companion.altText}
                />
                <div>
                  <strong>{companion.name} will cheer you on.</strong>
                  <span>Your companion and settings are ready for this round.</span>
                </div>
              </>
            )}
          </div>
        )}
        <div className="setting-block">
          <h2>Mode</h2>
          <div className="choice-row">
            {GAME_MODE_IDS.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`choice-chip ${(settings.mode ?? 'quick') === mode ? 'choice-chip--selected' : ''}`}
                aria-pressed={(settings.mode ?? 'quick') === mode}
                onClick={() =>
                  onChange({
                    ...settings,
                    mode,
                    questionCount: mode === 'trail' ? TRAIL_QUEST_LENGTH : settings.questionCount,
                  })
                }
              >
                {mode === 'quick' ? 'Quick Game' : mode === 'practice' ? 'Practice' : 'Trail Quest'}
              </button>
            ))}
          </div>
          <p>
            {settings.mode === 'practice'
              ? 'Take your time, try again, and get a little help. First answers earn your score and coins.'
              : settings.mode === 'trail'
                ? 'Answer correctly to move along the path and collect ten treasures. A mistake keeps you at the same stop.'
                : 'Answer once per question and see your accuracy and pace.'}
          </p>
        </div>
        <div className="setting-block">
          <h2>Operation</h2>
          <div className="choice-row">
            {OPERATION_IDS.map((operation) => {
              const selected = settings.operations.includes(operation);
              return (
                <button
                  key={operation}
                  className={`choice-chip ${selected ? 'choice-chip--selected' : ''}`}
                  type="button"
                  aria-pressed={selected}
                  aria-disabled={selected && settings.operations.length === 1}
                  onClick={() => toggleOperation(operation)}
                >
                  {OPERATION_SYMBOLS[operation]} {OPERATION_LABELS[operation]}
                </button>
              );
            })}
          </div>
          <p>Select one operation or mix several in a balanced round.</p>
        </div>
        <div className="setting-block">
          <h2>Difficulty</h2>
          <div className="choice-row">
            {DIFFICULTY_IDS.map((difficulty) => (
              <button
                key={difficulty}
                className={`choice-chip ${settings.difficulty === difficulty ? 'choice-chip--selected' : ''}`}
                type="button"
                aria-pressed={settings.difficulty === difficulty}
                onClick={() => onChange({ ...settings, difficulty })}
              >
                {DIFFICULTY_LABELS[difficulty]}
              </button>
            ))}
          </div>
          <p>{difficultyDescription(settings.difficulty)}</p>
        </div>
        {settings.mode === 'trail' ? (
          <div className="setting-block">
            <h2>Trail length</h2>
            <p>
              {TRAIL_QUEST_LENGTH} treasures lead to the picnic nook. Wrong answers add another
              problem without moving you backward.
            </p>
          </div>
        ) : (
          <div className="setting-block">
            <h2>Questions</h2>
            <div className="choice-row">
              {QUESTION_COUNTS.map((questionCount) => (
                <button
                  key={questionCount}
                  className={`choice-chip ${settings.questionCount === questionCount ? 'choice-chip--selected' : ''}`}
                  type="button"
                  aria-pressed={settings.questionCount === questionCount}
                  onClick={() => onChange({ ...settings, questionCount })}
                >
                  {questionCount}
                </button>
              ))}
            </div>
          </div>
        )}
        <button className="text-button" type="button" onClick={() => onChange(DEFAULT_SETTINGS)}>
          Reset defaults
        </button>
        <button className="primary-button primary-button--wide" type="button" onClick={onStart}>
          Start game
        </button>
      </section>
    </main>
  );
}

function Play({
  game,
  elapsed,
  companion,
  artStyle,
  onAnswer,
  onHint,
  onExit,
  audioPreferences,
  onToggleAudio,
}: {
  game: ActiveGame;
  elapsed: number;
  companion?: CollectibleDefinition;
  artStyle: ArtStyle;
  onAnswer: (answer: number) => void;
  onHint: () => void;
  onExit: () => void;
  audioPreferences: AudioPreferences;
  onToggleAudio: () => void;
}) {
  const problem = game.problems[game.index];
  const equationRef = useRef<HTMLHeadingElement>(null);
  const [hoverReadyQuestionIndex, setHoverReadyQuestionIndex] = useState(-1);
  const answerHoverReady = hoverReadyQuestionIndex === game.index;

  useEffect(() => {
    equationRef.current?.focus({ preventScroll: true });
  }, [game.index]);

  if (!problem) return null;

  return (
    <main className={`game-page page-shell${game.practice ? ' game-page--practice' : ''}`}>
      <header className="game-header">
        <button className="icon-button" type="button" onClick={onExit} aria-label="Exit game">
          ×
        </button>
        <div
          className="game-progress"
          aria-label={
            game.recap
              ? `Practice recap, ${game.recap.length} left`
              : `Question ${game.index + 1} of ${game.problems.length}`
          }
        >
          <div className="game-progress__label">
            {companion && (
              <img
                src={`${import.meta.env.BASE_URL}${getCollectibleImage(companion, artStyle)}`}
                alt=""
                width="42"
                height="42"
              />
            )}
            <span>
              {game.recap
                ? `Practice recap · ${game.recap.length} left`
                : `Question ${game.index + 1} of ${game.problems.length}`}
            </span>
          </div>
          <div className="progress-track">
            <span
              style={{
                width: `${game.recap ? ((game.answers.filter((answer) => !answer.correct).length - game.recap.length) / game.answers.filter((answer) => !answer.correct).length) * 100 : ((game.index + 1) / game.problems.length) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="game-tools">
          <SoundToggle
            enabled={audioPreferences.effectsEnabled && audioPreferences.effectsVolume > 0}
            onToggle={onToggleAudio}
          />
          {!game.practice && (
            <div className="timer-pill" aria-label={`Elapsed time ${formatTime(elapsed)}`}>
              ◷ {formatTime(elapsed)}
            </div>
          )}
        </div>
      </header>

      <div className="feedback-slot" aria-live="polite">
        {game.previous && !game.recap && (
          <div
            className={`feedback-ribbon feedback-ribbon--${game.previous.answer.correct ? 'correct' : 'incorrect'}`}
          >
            {game.previous.answer.correct ? '✓ ' : ''}
            {game.previous.prompt} = {game.previous.answer.correctAnswer}
          </div>
        )}
      </div>

      <section className="question-panel" aria-labelledby="equation">
        <span className="eyebrow">What is the answer?</span>
        <h1
          id="equation"
          ref={equationRef}
          tabIndex={-1}
          className={
            String(problem.left).length + String(problem.right).length > 5 ? 'equation--long' : ''
          }
        >
          <span>{problem.left}</span>
          <span className="operator">{OPERATION_SYMBOLS[problem.operation]}</span>
          <span>{problem.right}</span>
          <span className="equals">=</span>
          <span className="answer-blank">?</span>
        </h1>
      </section>

      <div
        className={`answer-grid${answerHoverReady ? ' answer-grid--hover-ready' : ''}`}
        data-hover-ready={answerHoverReady}
        onPointerMove={(event) => {
          if (event.pointerType === 'mouse' && !answerHoverReady) {
            setHoverReadyQuestionIndex(game.index);
          }
        }}
      >
        {problem.choices.map((choice, index) => {
          let state: 'idle' | 'correct' | 'incorrect' | 'muted' = 'idle';
          if (game.feedback) {
            if (choice === problem.correctAnswer && (!game.practice || game.feedback.correct))
              state = 'correct';
            else if (choice === game.feedback.selected) state = 'incorrect';
            else state = 'muted';
          }
          if (game.practice && game.attempts.includes(choice) && choice !== problem.correctAnswer)
            state = 'incorrect';
          return (
            <AnswerCard
              key={choice}
              answer={choice}
              index={index}
              disabled={Boolean(game.feedback) || (game.practice && game.attempts.includes(choice))}
              state={state}
              onChoose={() => onAnswer(choice)}
            />
          );
        })}
      </div>
      {game.practice && (
        <section className="practice-help" aria-label="Practice help">
          <p role="status">
            {game.feedback?.correct
              ? 'There it is! Nicely untangled.'
              : game.attempts.length > 0
                ? `${companion?.name ?? 'Your companion'}: ${PRACTICE_ENCOURAGEMENT[(game.index + game.attempts.length - 1) % PRACTICE_ENCOURAGEMENT.length]}`
                : game.recap
                  ? 'A little second look. Recap helps the idea stick; it adds no extra coins.'
                  : 'Take your time. There is no race here.'}
          </p>
          {game.hintUsed ? (
            <p className="practice-hint">{practiceHint(problem)}</p>
          ) : (
            game.attempts.length > 0 && (
              <button
                type="button"
                className="secondary-button"
                onClick={onHint}
                disabled={Boolean(game.feedback)}
              >
                Show a hint
              </button>
            )
          )}
        </section>
      )}
      <p className="keyboard-hint">Tip: use keys 1–4 to choose an answer.</p>
    </main>
  );
}

function Results({
  summary,
  resultFacts,
  companion,
  dialogue,
  artStyle,
  onReplay,
  onHome,
  onCapsule,
  onReview,
  dailyEarned,
  presentCoinReward,
  onCoinsPresented,
}: {
  summary: SessionSummary;
  resultFacts: ResultDialogueFacts | null;
  companion?: CollectibleDefinition;
  dialogue?: SelectedDialogue;
  artStyle: ArtStyle;
  onReplay: () => void;
  onHome: () => void;
  onCapsule: () => void;
  onReview: () => void;
  dailyEarned: number;
  presentCoinReward: boolean;
  onCoinsPresented: (summaryId: string) => void;
}) {
  const [shouldPresentCoinReward] = useState(presentCoinReward);
  const [visibleCoins, setVisibleCoins] = useState(
    shouldPresentCoinReward ? 0 : summary.coinsEarned,
  );

  useEffect(() => {
    if (!shouldPresentCoinReward || summary.coinsEarned <= 0) return;

    let interval: number | undefined;
    const delay = window.setTimeout(() => {
      onCoinsPresented(summary.id);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setVisibleCoins(summary.coinsEarned);
        return;
      }

      const steps = Math.min(6, summary.coinsEarned);
      let step = 0;
      interval = window.setInterval(() => {
        step += 1;
        setVisibleCoins(Math.ceil((summary.coinsEarned * step) / steps));
        if (step >= steps && interval !== undefined) window.clearInterval(interval);
      }, 75);
    }, 650);

    return () => {
      window.clearTimeout(delay);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [onCoinsPresented, shouldPresentCoinReward, summary.coinsEarned, summary.id]);

  return (
    <main className="page-shell narrow-page results-page">
      <section
        className={`celebration-card ${companion ? 'celebration-card--with-companion' : ''}`}
      >
        <div className="celebration-copy">
          <span className="celebration-stars" aria-hidden="true">
            ✦ ★ ✦
          </span>
          <span className="eyebrow">
            {summary.settings.mode === 'trail' ? 'Trail complete' : 'Round complete'}
          </span>
          <h1>
            {summary.settings.mode === 'practice'
              ? 'A little wiser, a little brighter!'
              : summary.settings.mode === 'trail'
                ? 'The picnic nook is yours!'
                : resultHeadline(resultFacts)}
          </h1>
          <p>
            {summary.settings.mode === 'practice'
              ? `You worked through all ${summary.answers.length} questions. Every little rethink counts.`
              : summary.settings.mode === 'trail'
                ? `You collected all ${TRAIL_QUEST_LENGTH} treasures in ${summary.answers.length} problems.`
                : `You completed all ${summary.answers.length} questions and added another practice round.`}
          </p>
        </div>
        {companion && (
          <div className="results-companion">
            {dialogue ? (
              <CompanionDialogue
                companion={companion}
                artStyle={artStyle}
                dialogue={dialogue}
                variant="results"
              />
            ) : (
              <>
                <img
                  src={`${import.meta.env.BASE_URL}${getCollectibleImage(companion, artStyle)}`}
                  alt={companion.altText}
                />
                <strong>
                  {companion.name} is cheering for your{' '}
                  {summary.settings.mode === 'trail' ? 'adventure' : 'practice'}!
                </strong>
              </>
            )}
          </div>
        )}
      </section>
      <section className="results-grid" aria-label="Game results">
        <article>
          <span>
            {summary.settings.mode === 'practice'
              ? 'First-try accuracy'
              : summary.settings.mode === 'trail'
                ? 'Trail accuracy'
                : 'Accuracy'}
          </span>
          <strong>{Math.round(summary.accuracy * 100)}%</strong>
          <small>
            {summary.correctCount} of {summary.answers.length} correct
          </small>
        </article>
        <article>
          <span>
            {summary.settings.mode === 'practice'
              ? 'Worked out'
              : summary.settings.mode === 'trail'
                ? 'Detours'
                : 'Time'}
          </span>
          <strong>
            {summary.settings.mode === 'practice'
              ? summary.answers.filter((answer) => !answer.correct).length
              : summary.settings.mode === 'trail'
                ? summary.answers.filter((answer) => !answer.correct).length
                : formatTime(summary.elapsedMs)}
          </strong>
          <small>
            {summary.settings.mode === 'practice'
              ? 'with another try'
              : summary.settings.mode === 'trail'
                ? 'extra problems'
                : 'thinking time'}
          </small>
        </article>
        <article>
          <span>Score</span>
          <strong>{summary.score.toLocaleString()}</strong>
          <small>
            {summary.settings.mode === 'practice'
              ? 'first answers · no speed bonus'
              : 'accuracy first'}
          </small>
        </article>
        <article className="coin-result">
          <span>Paw Coins</span>
          <strong key={visibleCoins} className="coin-tally">
            +{visibleCoins}
          </strong>
          <small>{dailyEarned} earned today · keep going if you want!</small>
        </article>
      </section>
      {summary.dailyMilestoneReached && (
        <section className="daily-milestone" role="status">
          <span aria-hidden="true">✦</span>
          <div>
            <strong>Daily Paw Coin goal complete!</strong>
            <p>You reached {DAILY_COIN_MILESTONE} today. Every correct answer still earns coins.</p>
          </div>
        </section>
      )}
      <details className="coin-breakdown">
        <summary>How you earned {summary.coinsEarned} Paw Coins</summary>
        {summary.settings.mode === 'practice' && (
          <p>
            Coins come from your first answers. Retries, hints, and the recap help you learn without
            adding extra rewards.
          </p>
        )}
        <dl>
          <div>
            <dt>{summary.correctCount} correct × 2</dt>
            <dd>{summary.coinBreakdown.correctAnswerCoins}</dd>
          </div>
          {summary.coinBreakdown.difficultyBonusCoins > 0 && (
            <div>
              <dt>
                {DIFFICULTY_LABELS[summary.settings.difficulty]} challenge ×
                {summary.coinBreakdown.difficultyMultiplier}
              </dt>
              <dd>+{summary.coinBreakdown.difficultyBonusCoins}</dd>
            </div>
          )}
          {summary.coinBreakdown.accuracyBonusCoins > 0 && (
            <div>
              <dt>Careful work bonus</dt>
              <dd>+{summary.coinBreakdown.accuracyBonusCoins}</dd>
            </div>
          )}
          {summary.coinBreakdown.perfectBonusCoins > 0 && (
            <div>
              <dt>Perfect round bonus</dt>
              <dd>+{summary.coinBreakdown.perfectBonusCoins}</dd>
            </div>
          )}
          {summary.dailyBonusCoins > 0 && (
            <div>
              <dt>First practice today</dt>
              <dd>+{summary.dailyBonusCoins}</dd>
            </div>
          )}
          {summary.weeklyBonusCoins > 0 && (
            <div>
              <dt>Three practice days this week</dt>
              <dd>+{summary.weeklyBonusCoins}</dd>
            </div>
          )}
          <div className="coin-breakdown__total">
            <dt>Total</dt>
            <dd>{summary.coinsEarned}</dd>
          </div>
        </dl>
      </details>
      <div className="result-actions">
        <button className="primary-button" type="button" onClick={onReplay}>
          Play again
        </button>
        <button className="secondary-button" type="button" onClick={onCapsule}>
          Open a capsule
        </button>
        <button className="secondary-button" type="button" onClick={onReview}>
          Review questions
        </button>
        <button className="text-button" type="button" onClick={onHome}>
          Back home
        </button>
      </div>
    </main>
  );
}

function RoundReview({ summary, onBack }: { summary: SessionSummary; onBack: () => void }) {
  const missedCount = summary.answers.filter(({ correct }) => !correct).length;
  const [filter, setFilter] = useState<'all' | 'missed'>(missedCount > 0 ? 'missed' : 'all');
  const visibleAnswers = summary.answers
    .map((answer, index) => ({ answer, index }))
    .filter(({ answer }) => filter === 'all' || !answer.correct);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="page-shell review-page">
      <header className="page-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div>
          <span className="eyebrow">Round review</span>
          <h1>Review your questions</h1>
          <p>Check the answers at your own pace. Review does not change your score or Paw Coins.</p>
        </div>
      </header>

      <section className="review-overview" aria-label="Review summary">
        <article>
          <span>Correct</span>
          <strong>
            {summary.correctCount} of {summary.answers.length}
          </strong>
        </article>
        <article>
          <span>Answers to review</span>
          <strong>{missedCount}</strong>
        </article>
        <article>
          <span>Thinking time</span>
          <strong>{formatTime(summary.elapsedMs)}</strong>
        </article>
      </section>

      <div className="filter-row review-filters" aria-label="Question review filters">
        <button
          type="button"
          className={`choice-chip ${filter === 'all' ? 'choice-chip--selected' : ''}`}
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All questions ({summary.answers.length})
        </button>
        <button
          type="button"
          className={`choice-chip ${filter === 'missed' ? 'choice-chip--selected' : ''}`}
          aria-pressed={filter === 'missed'}
          onClick={() => setFilter('missed')}
        >
          Review answers ({missedCount})
        </button>
      </div>

      {visibleAnswers.length === 0 ? (
        <section className="panel review-empty">
          <h2>Everything was correct!</h2>
          <p>There are no answers that need another look in this round.</p>
        </section>
      ) : (
        <section className="review-list" aria-label="Reviewed questions">
          {visibleAnswers.map(({ answer, index }) => (
            <article
              className={`review-card review-card--${answer.correct ? 'correct' : 'incorrect'}`}
              key={`${answer.problemId}:${index}`}
            >
              <header>
                <span>Question {index + 1}</span>
                <strong>{answer.correct ? 'Correct' : 'Answer to review'}</strong>
              </header>
              <div className="review-equation">
                <span>{answer.left}</span>
                <span>{OPERATION_SYMBOLS[answer.operation]}</span>
                <span>{answer.right}</span>
                <span>=</span>
                <span>{answer.correctAnswer}</span>
              </div>
              <dl>
                <div>
                  <dt>Your answer</dt>
                  <dd className={answer.correct ? '' : 'review-answer--incorrect'}>
                    {Number.isNaN(answer.selectedAnswer) ? 'No answer' : answer.selectedAnswer}
                  </dd>
                </div>
                <div>
                  <dt>Correct answer</dt>
                  <dd>{answer.correctAnswer}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{formatTime(answer.responseMs)}</dd>
                </div>
                <div>
                  <dt>Score</dt>
                  <dd>
                    {scoreAnswer(
                      answer.correct,
                      answer.responseMs,
                      summary.settings.mode === 'practice',
                    )}
                  </dd>
                </div>
                {answer.practice && (
                  <>
                    <div>
                      <dt>Attempts</dt>
                      <dd>{answer.practice.attempts.join(' → ')}</dd>
                    </div>
                    <div>
                      <dt>Hint</dt>
                      <dd>{answer.practice.hintUsed ? 'Used' : 'Not needed'}</dd>
                    </div>
                    <div>
                      <dt>Time to work it out</dt>
                      <dd>{formatTime(answer.practice.completionMs)}</dd>
                    </div>
                    {answer.practice.recapAttempts.length > 0 && (
                      <div>
                        <dt>Recap{answer.practice.recapHintUsed ? ' (with hint)' : ''}</dt>
                        <dd>{answer.practice.recapAttempts.join(' → ')}</dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </article>
          ))}
        </section>
      )}

      <button className="primary-button review-back" type="button" onClick={onBack}>
        Back
      </button>
    </main>
  );
}

function History({
  save,
  companion,
  dialogue,
  artStyle,
  onBack,
  onReview,
  onClear,
}: {
  save: SaveData;
  companion?: CollectibleDefinition;
  dialogue?: SelectedDialogue;
  artStyle: ArtStyle;
  onBack: () => void;
  onReview: (session: SessionSummary) => void;
  onClear: () => void;
}) {
  const [generatedAt] = useState(() => new Date().toISOString());
  const analysis = useMemo(() => buildPlayHistoryExport(save, generatedAt), [generatedAt, save]);
  const serialized = useMemo(() => serializePlayHistory(save, generatedAt), [generatedAt, save]);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [confirmClear, setConfirmClear] = useState(false);
  const [showAllRecentRounds, setShowAllRecentRounds] = useState(false);
  const [showAllConfigurations, setShowAllConfigurations] = useState(false);
  const recentRoundPreviewLimit = 5;
  const configurationPreviewLimit = 6;
  const recentSessions = [...save.sessions].reverse();
  const visibleRecentSessions = showAllRecentRounds
    ? recentSessions
    : recentSessions.slice(0, recentRoundPreviewLimit);
  const visibleConfigurations = showAllConfigurations
    ? analysis.configurations
    : analysis.configurations.slice(0, configurationPreviewLimit);

  const copyHistory = async () => {
    try {
      await navigator.clipboard.writeText(serialized);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const downloadHistory = () => {
    const url = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `number-nook-history-${generatedAt.slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <main className="page-shell history-page">
      <header className="page-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div>
          <span className="eyebrow">Local analysis</span>
          <h1>Play History</h1>
          <p>Your name and device identifiers are excluded from the analysis export.</p>
        </div>
      </header>

      {companion && dialogue && (
        <section className="history-companion-coach" aria-label="A note from your companion">
          <CompanionDialogue
            companion={companion}
            artStyle={artStyle}
            dialogue={dialogue}
            variant="progress"
          />
        </section>
      )}

      <section className="history-overview" aria-label="Overall play history">
        <article>
          <span>Rounds</span>
          <strong>{analysis.currentState.completedRoundCount}</strong>
        </article>
        <article>
          <span>Average accuracy</span>
          <strong>{analysis.overall.averageAccuracyPercent}%</strong>
        </article>
        <article>
          <span>Average score</span>
          <strong>{Math.round(analysis.overall.averageScore).toLocaleString()}</strong>
        </article>
        <article>
          <span>Questions answered</span>
          <strong>{analysis.overall.totalQuestions}</strong>
        </article>
      </section>

      <section className="panel history-export-panel">
        <div>
          <h2>Share for balance analysis</h2>
          <p>
            Copy the versioned JSON and paste it into our chat. It includes exact settings,
            questions, choices, scores, timing, reward breakdowns, and capsule details.
          </p>
        </div>
        <div className="history-actions">
          <button className="primary-button" type="button" onClick={() => void copyHistory()}>
            Copy analysis data
          </button>
          <button className="secondary-button" type="button" onClick={downloadHistory}>
            Download JSON
          </button>
        </div>
        <p className="copy-status" aria-live="polite">
          {copyStatus === 'copied' && 'Copied! You can paste it into the chat.'}
          {copyStatus === 'failed' &&
            'Clipboard access was blocked. Download the JSON or copy it from the preview below.'}
        </p>
        <details>
          <summary>Preview export JSON</summary>
          <textarea
            className="history-json"
            value={serialized}
            readOnly
            rows={12}
            aria-label="Play history export JSON"
            onFocus={(event) => event.currentTarget.select()}
          />
        </details>
      </section>

      {save.sessions.length > 0 && (
        <section className="history-section">
          <div className="history-section-heading">
            <h2>Recent detailed rounds</h2>
            {save.sessions.length > recentRoundPreviewLimit && (
              <button
                className="text-button"
                type="button"
                aria-expanded={showAllRecentRounds}
                onClick={() => setShowAllRecentRounds((current) => !current)}
              >
                {showAllRecentRounds
                  ? 'Show fewer rounds'
                  : `Show all ${save.sessions.length} rounds`}
              </button>
            )}
          </div>
          <p>
            The newest {analysis.retention.detailedRoundLimit} rounds keep complete question
            details. Older rounds remain included in lifetime totals.
          </p>
          <div className="session-history-list">
            {visibleRecentSessions.map((session) => (
              <article className="session-history-card" key={session.id}>
                <div>
                  <span className="mode-pill">{settingsSummary(session.settings)}</span>
                  <strong>
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(session.completedAt))}
                  </strong>
                  <small>Ruleset {session.rulesetVersion}</small>
                </div>
                <dl>
                  <div>
                    <dt>Score</dt>
                    <dd>{session.score.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Accuracy</dt>
                    <dd>{Math.round(session.accuracy * 100)}%</dd>
                  </div>
                  <div>
                    <dt>Time</dt>
                    <dd>{formatTime(session.elapsedMs)}</dd>
                  </div>
                  <div>
                    <dt>Coins</dt>
                    <dd>
                      +{session.coinsEarned}
                      {session.coinsEarned < session.coinsPotential
                        ? ` of ${session.coinsPotential}`
                        : ''}
                    </dd>
                  </div>
                </dl>
                <button className="text-button" type="button" onClick={() => onReview(session)}>
                  Review round
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="history-section">
        <div className="history-section-heading">
          <h2>Performance by setup</h2>
          {analysis.configurations.length > configurationPreviewLimit && (
            <button
              className="text-button"
              type="button"
              aria-expanded={showAllConfigurations}
              onClick={() => setShowAllConfigurations((current) => !current)}
            >
              {showAllConfigurations
                ? 'Show fewer setups'
                : `Show all ${analysis.configurations.length} setups`}
            </button>
          )}
        </div>
        {analysis.configurations.length === 0 ? (
          <div className="panel empty-history">
            <p>Complete a round and its balance data will appear here.</p>
          </div>
        ) : (
          <div className="configuration-grid">
            {visibleConfigurations.map((configuration) => (
              <article className="configuration-card" key={configuration.key}>
                <span className="mode-pill">{settingsSummary(configuration.settings)}</span>
                <small>Ruleset {configuration.rulesetVersion}</small>
                <strong>{configuration.highScore.toLocaleString()} high score</strong>
                <dl>
                  <div>
                    <dt>Rounds</dt>
                    <dd>{configuration.rounds}</dd>
                  </div>
                  <div>
                    <dt>Average score</dt>
                    <dd>{Math.round(configuration.averageScore).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Accuracy</dt>
                    <dd>{configuration.averageAccuracyPercent}%</dd>
                  </div>
                  <div>
                    <dt>Average answer</dt>
                    <dd>{formatTime(configuration.averageResponseMs)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel history-clear-panel">
        <div>
          <h2>Clear testing history</h2>
          <p>
            Remove scores, detailed rounds, and lifetime statistics. Paw Coins, companions, and game
            settings stay exactly as they are.
          </p>
        </div>
        {confirmClear ? (
          <div className="history-actions">
            <button
              className="secondary-button danger-button"
              type="button"
              onClick={() => {
                onClear();
                setConfirmClear(false);
              }}
            >
              Confirm clear history
            </button>
            <button className="text-button" type="button" onClick={() => setConfirmClear(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="text-button" type="button" onClick={() => setConfirmClear(true)}>
            Clear play history
          </button>
        )}
      </section>
    </main>
  );
}

function BackupRestore({
  save,
  onBack,
  onRestore,
}: {
  save: SaveData | null;
  onBack: () => void;
  onRestore: (restored: SaveData) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingRestore, setPendingRestore] = useState<SaveData | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [restoring, setRestoring] = useState(false);

  const saveBackupFile = async () => {
    if (!save) return;
    const generatedAt = new Date().toISOString();
    const filename = `number-nook-save-${generatedAt.slice(0, 10)}.json`;
    const file = new File([repository.export(save)], filename, { type: 'application/json' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Number Nook backup',
          text: 'Complete Number Nook progress backup',
        });
        setMessage({ kind: 'success', text: 'Backup shared successfully.' });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage({ kind: 'success', text: 'Backup file saved.' });
  };

  const selectBackup = async (file: File | undefined) => {
    setPendingRestore(null);
    setSelectedFileName(file?.name ?? '');
    setMessage(null);
    if (!file) return;
    if (file.size > MAX_BACKUP_FILE_BYTES) {
      setMessage({ kind: 'error', text: 'That file is too large to be a Number Nook backup.' });
      return;
    }
    try {
      setPendingRestore(repository.parseImport(await file.text()));
    } catch {
      setMessage({
        kind: 'error',
        text: 'That file is not a valid Number Nook backup. Your current progress was not changed.',
      });
    }
  };

  const pendingRoundCount = pendingRestore
    ? pendingRestore.archivedProgress.overall.rounds + pendingRestore.sessions.length
    : 0;

  const restoreBackup = async () => {
    if (!pendingRestore) return;
    setRestoring(true);
    try {
      await onRestore(pendingRestore);
      setPendingRestore(null);
      setSelectedFileName('');
      if (inputRef.current) inputRef.current.value = '';
      setMessage({ kind: 'success', text: 'Backup restored successfully.' });
    } catch {
      setMessage({
        kind: 'error',
        text: 'The backup was valid, but this device could not save it. Your current progress was not changed.',
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <main className="page-shell backup-page">
      <header className="page-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div>
          <span className="eyebrow">Local save tools</span>
          <h1>Backup &amp; restore</h1>
          <p>Move complete Number Nook progress between devices without an account.</p>
        </div>
      </header>

      <div className="backup-grid">
        {save && (
          <section className="panel backup-panel">
            <div>
              <h2>Save a backup</h2>
              <p>
                This includes the player name, settings, Paw Coins, companions, and complete play
                progress. Keep the file somewhere safe and private.
              </p>
            </div>
            <button className="primary-button" type="button" onClick={() => void saveBackupFile()}>
              Save backup file
            </button>
          </section>
        )}

        <section className="panel backup-panel">
          <div>
            <h2>Restore a backup</h2>
            <p>
              Select a Number Nook save file to preview it. Nothing changes until you confirm the
              restore.
            </p>
          </div>
          <div className="field-group">
            <label htmlFor="backup-file">Choose backup file</label>
            <input
              ref={inputRef}
              id="backup-file"
              className="backup-file-input"
              type="file"
              accept=".json,application/json"
              onChange={(event) => void selectBackup(event.currentTarget.files?.[0])}
            />
          </div>

          {pendingRestore && (
            <section className="backup-preview" aria-label="Backup preview">
              <span className="eyebrow">Ready to restore</span>
              <h3>{selectedFileName}</h3>
              <dl>
                <div>
                  <dt>Player</dt>
                  <dd>{pendingRestore.player.name}</dd>
                </div>
                <div>
                  <dt>Rounds</dt>
                  <dd>{pendingRoundCount}</dd>
                </div>
                <div>
                  <dt>Paw Coins</dt>
                  <dd>{pendingRestore.coins}</dd>
                </div>
                <div>
                  <dt>Companions</dt>
                  <dd>{pendingRestore.ownedCollectibleIds.length}</dd>
                </div>
              </dl>
              <p className="backup-warning">
                Restoring replaces all progress currently saved on this device.
              </p>
              <button
                className="secondary-button danger-button"
                type="button"
                disabled={restoring}
                onClick={() => void restoreBackup()}
              >
                {restoring ? 'Restoring…' : 'Restore this backup'}
              </button>
            </section>
          )}

          {message && (
            <p
              className={`backup-message backup-message--${message.kind}`}
              role={message.kind === 'error' ? 'alert' : 'status'}
            >
              {message.text}
            </p>
          )}
        </section>
      </div>

      <p className="backup-note">
        Play History analysis files cannot be restored. Choose a file created with{' '}
        <strong>Save backup file</strong>.
      </p>
    </main>
  );
}

function Capsule({
  save,
  companion,
  dialogue,
  reward,
  opening,
  activeChoice,
  onOpen,
  onGrantDevelopmentCoins,
  onEquip,
  onGallery,
  onBack,
}: {
  save: SaveData;
  companion?: CollectibleDefinition;
  dialogue?: SelectedDialogue;
  reward: CollectibleDefinition | null | undefined;
  opening: boolean;
  activeChoice?: CapsuleChoice;
  onOpen: (choice: CapsuleChoice) => void;
  onGrantDevelopmentCoins?: () => void;
  onEquip: (id: string) => void;
  onGallery: (collectionId?: string) => void;
  onBack: () => void;
}) {
  const surprisePool = eligibleCapsuleRewards(catalog.collectibles, save.ownedCollectibleIds);
  const ordinaryCollections = catalog.collections
    .map((collection) => {
      const collectibles = catalog.collectibles.filter(
        (collectible) =>
          collectible.collectionId === collection.id &&
          collectible.capsuleEligible &&
          !collectible.specialGuest,
      );
      const eligible = eligibleCapsuleRewards(
        collectibles,
        save.ownedCollectibleIds,
        collection.id,
      );
      return { collection, collectibles, eligible };
    })
    .filter(({ collectibles }) => collectibles.length > 0);
  const welcomeAvailable = save.rewardProgress.welcomeCapsuleStatus === 'available';
  const selectedCollection = activeChoice?.collectionId
    ? getCollection(activeChoice.collectionId)
    : undefined;
  const openingName =
    activeChoice?.kind === 'welcome'
      ? 'Welcome Capsule'
      : activeChoice?.kind === 'collection'
        ? `${selectedCollection?.name ?? 'Collection'} Capsule`
        : 'Surprise Capsule';
  return (
    <main className="page-shell capsule-page">
      <header className="page-header">
        <button
          className="icon-button"
          type="button"
          onClick={onBack}
          aria-label="Back"
          disabled={opening}
        >
          ←
        </button>
        <div>
          <span className="eyebrow">Companion corner</span>
          <h1>Capsule Shelf</h1>
          <p>Choose a broad surprise or explore one collection.</p>
        </div>
        <div className="coin-pill">
          <span>🐾</span>
          {save.coins}
        </div>
      </header>
      {companion && dialogue && !opening && !reward && (
        <section className="capsule-companion" aria-label="A note from your companion">
          <CompanionDialogue
            companion={companion}
            artStyle={save.artStyle}
            dialogue={dialogue}
            variant="capsule"
          />
        </section>
      )}
      {reward || opening ? (
        <section
          className={`capsule-machine ${reward ? 'capsule-machine--open' : ''} ${opening ? 'capsule-machine--opening' : ''}`}
          style={reward ? companionThemeCssVariables(reward.theme) : undefined}
        >
          {reward ? (
            <div className="reveal-card" aria-live="polite">
              <span className="reveal-burst" aria-hidden="true">
                ✦
              </span>
              <img
                src={`${import.meta.env.BASE_URL}${getCollectibleImage(reward, save.artStyle)}`}
                alt={reward.altText}
              />
              <span className={`rarity rarity--${reward.rarity}`}>{reward.rarity}</span>
              <h2>You found {reward.name}!</h2>
              {reward.specialGuest && <span className="guest-badge">Special Guest</span>}
              <p>{reward.description}</p>
              <div className="reveal-actions">
                {save.equippedCollectibleId === reward.id ? (
                  <span className="reveal-equipped" role="status">
                    <span aria-hidden="true">✓</span> Equipped
                  </span>
                ) : (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => onEquip(reward.id)}
                  >
                    Equip {reward.name}
                  </button>
                )}
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => onGallery(reward.collectionId)}
                >
                  View collection
                </button>
              </div>
            </div>
          ) : (
            <div className="capsule-opening" aria-live="polite">
              <div className="capsule-orb" aria-hidden="true">
                <span>✦</span>
              </div>
              <h2>Opening your {openingName}…</h2>
              <p>Something new is about to appear!</p>
            </div>
          )}
        </section>
      ) : (
        <>
          {welcomeAvailable && surprisePool.length > 0 && (
            <section className="welcome-capsule-card" aria-labelledby="welcome-capsule-heading">
              <div className="capsule-orb capsule-orb--small" aria-hidden="true">
                <span>✦</span>
              </div>
              <div>
                <span className="eyebrow">First-round gift</span>
                <h2 id="welcome-capsule-heading">Your Welcome Capsule is ready!</h2>
                <p>Open it free. It contains one new companion from anywhere in the Nook.</p>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => onOpen({ kind: 'welcome', collectionId: null })}
              >
                Open free capsule
              </button>
            </section>
          )}

          <section className="capsule-shelf" aria-label="Capsule choices">
            <article className="capsule-choice capsule-choice--surprise">
              <div className="capsule-choice__banner">
                <div className="capsule-orb capsule-orb--shelf" aria-hidden="true">
                  <span>?</span>
                </div>
                <div>
                  <span className="eyebrow">Best value</span>
                  <h2>Surprise Capsule</h2>
                  <p>Discover anyone still waiting across every collection.</p>
                </div>
              </div>
              <div className="capsule-choice__details">
                <span>{surprisePool.length} possible companions</span>
                <strong>🐾 {SURPRISE_CAPSULE_COST}</strong>
              </div>
              <button
                className="primary-button"
                type="button"
                disabled={surprisePool.length === 0 || save.coins < SURPRISE_CAPSULE_COST}
                onClick={() => onOpen({ kind: 'surprise', collectionId: null })}
              >
                {surprisePool.length === 0
                  ? 'Everything discovered!'
                  : save.coins < SURPRISE_CAPSULE_COST
                    ? `Need ${SURPRISE_CAPSULE_COST - save.coins} more coins`
                    : 'Open Surprise Capsule'}
              </button>
            </article>

            {ordinaryCollections.map(({ collection, collectibles, eligible }) => {
              const owned = collectibles.length - eligible.length;
              const anchor = collectibles[0];
              return (
                <article
                  className={`capsule-choice ${eligible.length === 0 ? 'capsule-choice--complete' : ''}`}
                  key={collection.id}
                  style={anchor ? companionThemeCssVariables(anchor.theme) : undefined}
                >
                  <div className="capsule-choice__banner capsule-choice__banner--collection">
                    <div className="capsule-choice__portraits" aria-hidden="true">
                      {collectibles.slice(0, 3).map((collectible) => (
                        <img
                          key={collectible.id}
                          src={`${import.meta.env.BASE_URL}${getCollectibleImage(collectible, save.artStyle)}`}
                          alt=""
                        />
                      ))}
                    </div>
                    <div>
                      <span className="eyebrow">Themed collection</span>
                      <h2>{collection.name}</h2>
                      <p>{collection.description}</p>
                    </div>
                  </div>
                  <div className="capsule-choice__details">
                    <span>
                      {owned}/{collectibles.length} found
                    </span>
                    <strong>
                      {eligible.length === 0 ? 'Complete ✓' : `🐾 ${COLLECTION_CAPSULE_COST}`}
                    </strong>
                  </div>
                  <span
                    className="collection-progress-track"
                    role="progressbar"
                    aria-label={`${owned} of ${collectibles.length} ${collection.name} companions found`}
                    aria-valuemin={0}
                    aria-valuemax={collectibles.length}
                    aria-valuenow={owned}
                  >
                    <span style={{ width: `${(owned / collectibles.length) * 100}%` }} />
                  </span>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={eligible.length === 0 || save.coins < COLLECTION_CAPSULE_COST}
                    onClick={() =>
                      onOpen({
                        kind: 'collection',
                        collectionId: collection.id,
                      })
                    }
                  >
                    {eligible.length === 0
                      ? 'Collection complete'
                      : save.coins < COLLECTION_CAPSULE_COST
                        ? `Need ${COLLECTION_CAPSULE_COST - save.coins} more coins`
                        : `Open ${collection.name} Capsule`}
                  </button>
                </article>
              );
            })}
          </section>

          {onGrantDevelopmentCoins && surprisePool.length > 0 && (
            <aside className="developer-cheat" aria-label="Developer testing tools">
              <span>Development tool</span>
              <button className="text-button" type="button" onClick={onGrantDevelopmentCoins}>
                Add {DEVELOPMENT_COIN_GRANT} Paw Coins
              </button>
              <small>Testing coins do not change today’s practice total.</small>
            </aside>
          )}
        </>
      )}
    </main>
  );
}

function Gallery({
  save,
  dialogue,
  initialFilter,
  onEquip,
  onArtStyleChange,
  onBack,
}: {
  save: SaveData;
  dialogue?: SelectedDialogue;
  initialFilter?: string;
  onEquip: (id: string) => void;
  onArtStyleChange: (artStyle: ArtStyle) => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState(
    initialFilter && getCollection(initialFilter) ? initialFilter : 'all',
  );
  const equippedCompanion = getCollectible(save.equippedCollectibleId);
  const selectedCollection = filter === 'all' ? undefined : getCollection(filter);
  const visible = catalog.collectibles
    .filter((item) => filter === 'all' || item.collectionId === filter)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const filterOptions = [
    { id: 'all', name: 'All', total: catalog.collectibles.length },
    ...catalog.collections.map(({ id, name }) => ({
      id,
      name,
      total: catalog.collectibles.filter((item) => item.collectionId === id).length,
    })),
  ];
  const ownedInFilter = visible.filter((item) => save.ownedCollectibleIds.includes(item.id)).length;
  return (
    <main className="page-shell gallery-page">
      <header className="page-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <div>
          <span className="eyebrow">Your discoveries</span>
          <h1>Companion Collection</h1>
          <p>
            {save.ownedCollectibleIds.length} of {catalog.collectibles.length} found
          </p>
        </div>
      </header>
      {equippedCompanion && (
        <section
          className={`collection-spotlight ${dialogue ? 'collection-spotlight--dialogue' : ''}`}
          aria-label="Equipped companion"
        >
          {dialogue ? (
            <CompanionDialogue
              companion={equippedCompanion}
              artStyle={save.artStyle}
              dialogue={dialogue}
              variant="equip"
            />
          ) : (
            <>
              <img
                src={`${import.meta.env.BASE_URL}${getCollectibleImage(equippedCompanion, save.artStyle)}`}
                alt={equippedCompanion.altText}
              />
              <div className="collection-spotlight__identity">
                <span className="equipped-spotlight-badge">
                  <span aria-hidden="true">✓</span> Equipped companion
                </span>
                <h2>{equippedCompanion.name}</h2>
                <p>{equippedCompanion.description}</p>
                <div className="collection-spotlight__meta">
                  <span className={`rarity rarity--${equippedCompanion.rarity}`}>
                    {equippedCompanion.rarity}
                  </span>
                  <span>{getCollection(equippedCompanion.collectionId)?.name}</span>
                </div>
              </div>
            </>
          )}
          <div className="collection-spotlight__progress">
            <strong>
              {save.ownedCollectibleIds.length}/{catalog.collectibles.length}
            </strong>
            <span>companions found</span>
            <span
              className="collection-progress-track"
              role="progressbar"
              aria-label={`${save.ownedCollectibleIds.length} of ${catalog.collectibles.length} companions found`}
              aria-valuemin={0}
              aria-valuemax={catalog.collectibles.length}
              aria-valuenow={save.ownedCollectibleIds.length}
            >
              <span
                style={{
                  width: `${(save.ownedCollectibleIds.length / catalog.collectibles.length) * 100}%`,
                }}
              />
            </span>
          </div>
        </section>
      )}
      <section className="art-style-control" aria-labelledby="art-style-heading">
        <div>
          <strong id="art-style-heading">Portrait style</strong>
          <span>Switch every companion without changing what you have collected.</span>
        </div>
        <div className="art-style-options" role="group" aria-label="Portrait style">
          {(
            [
              { id: 'sticker', label: 'Polished Sticker' },
              { id: 'classic', label: 'Simple SVG' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`choice-chip ${save.artStyle === id ? 'choice-chip--selected' : ''}`}
              aria-pressed={save.artStyle === id}
              onClick={() => onArtStyleChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <div className="filter-row" aria-label="Collection filters">
        {filterOptions.map(({ id, name, total }) => {
          const owned = catalog.collectibles.filter(
            (item) =>
              (id === 'all' || item.collectionId === id) &&
              save.ownedCollectibleIds.includes(item.id),
          ).length;
          return (
            <button
              key={id}
              type="button"
              className={`choice-chip collection-filter-chip ${filter === id ? 'choice-chip--selected' : ''}`}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              <span>{name}</span>
              <small>
                {owned}/{total}
              </small>
            </button>
          );
        })}
      </div>
      <p className="collection-description">
        {selectedCollection?.description ??
          'Explore every companion together, or choose a collection to see its neighborhood.'}{' '}
        <strong>
          {ownedInFilter} of {visible.length} found here.
        </strong>
      </p>
      <div className="collection-grid">
        {visible.map((item) => {
          const owned = save.ownedCollectibleIds.includes(item.id);
          return (
            <CollectibleCard
              key={item.id}
              collectible={item}
              owned={owned}
              artStyle={save.artStyle}
              equipped={save.equippedCollectibleId === item.id}
              onSelect={owned ? () => onEquip(item.id) : undefined}
            />
          );
        })}
      </div>
    </main>
  );
}

export default function App() {
  const developmentView = import.meta.env.DEV
    ? new URLSearchParams(location.search).get('dev')
    : null;
  const [save, setSave] = useState<SaveData | null | undefined>(undefined);
  const [screen, setScreen] = useState<Screen>('home');
  const [game, setGame] = useState<ActiveGame | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [resultDialogueFacts, setResultDialogueFacts] = useState<ResultDialogueFacts | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<SelectedDialogue | null>(null);
  const [equipDialogueEvent, setEquipDialogueEvent] = useState<EquipDialogueEvent | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);
  const [capsuleReward, setCapsuleReward] = useState<CollectibleDefinition | null | undefined>(
    undefined,
  );
  const [capsuleOpening, setCapsuleOpening] = useState(false);
  const [activeCapsuleChoice, setActiveCapsuleChoice] = useState<CapsuleChoice | undefined>();
  const [galleryInitialFilter, setGalleryInitialFilter] = useState<string | undefined>();
  const [audioPreferences, setAudioPreferences] = useState(() => audioPreferencesRepository.load());
  const { playCue } = useAudioPlayer(audioPreferences);
  const musicActive = !developmentView && screen !== 'play';
  const musicStartDelay = screen === 'results' ? 2_200 : 0;
  const { startMusicTrack, stopMusic } = useMusicPlayer(
    audioPreferences,
    musicActive,
    audioPreferences.musicTrackId,
    musicStartDelay,
  );
  const transitionTimer = useRef<number | null>(null);
  const capsuleTimer = useRef<number | null>(null);
  const [presentedCoinSummaryId, setPresentedCoinSummaryId] = useState<string | null>(null);
  const dialogueEventRef = useRef<string | null>(null);
  const recentDialogueRef = useRef<Partial<Record<DialogueContext, string[]>>>({});
  const equippedCompanion = save ? getCollectible(save.equippedCollectibleId) : undefined;
  const activeTheme = equippedCompanion?.theme ?? DEFAULT_COMPANION_THEME;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (theme: typeof activeTheme, id: string) => {
      for (const [property, value] of Object.entries(companionThemeCssVariables(theme))) {
        root.style.setProperty(property, value);
      }
      root.dataset.companionTheme = id;
    };

    applyTheme(activeTheme, equippedCompanion?.id ?? 'number-nook');
    return () => applyTheme(DEFAULT_COMPANION_THEME, 'number-nook');
  }, [activeTheme, equippedCompanion?.id]);

  useLayoutEffect(() => {
    let context: DialogueContext | null = null;
    if (screen === 'home') context = 'home';
    if (screen === 'setup') context = 'setup';
    if (screen === 'results') context = 'results';
    if (screen === 'capsule' && !capsuleOpening && !capsuleReward) context = 'capsule';
    if (screen === 'history') context = 'progress';
    if (screen === 'gallery' && equipDialogueEvent?.companionId === equippedCompanion?.id) {
      context = 'equip';
    }

    if (!context || !equippedCompanion) {
      dialogueEventRef.current = null;
      return;
    }

    const eventIdentity =
      context === 'results'
        ? (summary?.id ?? '')
        : context === 'equip'
          ? (equipDialogueEvent?.sequence ?? '')
          : '';
    const eventKey = `${context}:${equippedCompanion.id}:${eventIdentity}`;
    if (dialogueEventRef.current === eventKey) return;

    const recentPhraseIds = recentDialogueRef.current[context] ?? [];
    const selection = selectCompanionDialogue({
      companionId: equippedCompanion.id,
      companionName: equippedCompanion.name,
      context,
      facts:
        context === 'results' && resultDialogueFacts ? { result: resultDialogueFacts } : undefined,
      recentPhraseIds,
      random: new SeededRandom(createRandomSeed()),
    });
    recentDialogueRef.current[context] = rememberDialoguePhrase(recentPhraseIds, selection.id);
    dialogueEventRef.current = eventKey;
    queueMicrotask(() => {
      if (dialogueEventRef.current === eventKey) setActiveDialogue(selection);
    });
  }, [
    capsuleOpening,
    capsuleReward,
    equipDialogueEvent,
    equippedCompanion,
    resultDialogueFacts,
    screen,
    summary?.id,
  ]);

  const clearCapsuleTimer = useCallback(() => {
    if (capsuleTimer.current !== null) {
      window.clearTimeout(capsuleTimer.current);
      capsuleTimer.current = null;
    }
  }, []);

  const updateAudioPreferences = useCallback(
    (next: AudioPreferences) => {
      let saved = next;
      try {
        saved = audioPreferencesRepository.save(next);
      } catch {
        // The preference still works for this tab when storage is unavailable.
      }
      setAudioPreferences(saved);
      const musicChanged =
        saved.musicEnabled !== audioPreferences.musicEnabled ||
        saved.musicVolume !== audioPreferences.musicVolume ||
        saved.musicTrackId !== audioPreferences.musicTrackId;
      if (!musicChanged) return;
      if (saved.musicEnabled && saved.musicVolume > 0) {
        void startMusicTrack(saved.musicTrackId, saved);
      } else {
        stopMusic();
      }
    },
    [audioPreferences, startMusicTrack, stopMusic],
  );

  const toggleAudio = useCallback(() => {
    const isAudible = audioPreferences.effectsEnabled && audioPreferences.effectsVolume > 0;
    updateAudioPreferences({
      ...audioPreferences,
      effectsEnabled: !isAudible,
      effectsVolume:
        !isAudible && audioPreferences.effectsVolume === 0
          ? DEFAULT_AUDIO_PREFERENCES.effectsVolume
          : audioPreferences.effectsVolume,
    });
  }, [audioPreferences, updateAudioPreferences]);

  const toggleMusic = useCallback(() => {
    const isAudible = audioPreferences.musicEnabled && audioPreferences.musicVolume > 0;
    updateAudioPreferences({
      ...audioPreferences,
      musicEnabled: !isAudible,
      musicVolume:
        !isAudible && audioPreferences.musicVolume === 0
          ? DEFAULT_AUDIO_PREFERENCES.musicVolume
          : audioPreferences.musicVolume,
    });
  }, [audioPreferences, updateAudioPreferences]);

  useEffect(() => {
    void repository.load().then((loaded) => {
      setSave(loaded);
      setScreen(loaded ? 'home' : 'onboarding');
    });
    return () => {
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
      if (capsuleTimer.current !== null) window.clearTimeout(capsuleTimer.current);
    };
  }, []);

  useEffect(() => {
    if (screen !== 'play' || !game) return;
    const interval = window.setInterval(() => setElapsed(performance.now() - game.startedAt), 100);
    return () => window.clearInterval(interval);
  }, [game, screen]);

  const commitSave = useCallback((next: SaveData) => {
    setSave(next);
    void repository.save(next);
  }, []);

  const presentCoins = useCallback(
    (summaryId: string) => {
      setPresentedCoinSummaryId(summaryId);
      void playCue(GAME_AUDIO_CUES.coinsEarned);
    },
    [playCue],
  );

  const startGame = useCallback(() => {
    if (!save) return;
    stopMusic();
    void playCue(GAME_AUDIO_CUES.roundStart);
    const seed = createRandomSeed();
    const now = performance.now();
    const trail = save.settings.mode === 'trail';
    const problems = trail
      ? Array.from({ length: 4 }, (_, batch) =>
          generateSession({ ...save.settings, questionCount: 50 }, new SeededRandom(seed + batch)),
        ).flat()
      : generateSession(save.settings, new SeededRandom(seed));
    setGame({
      practice: save.settings.mode === 'practice',
      trail,
      trailComplete: false,
      trailPosition: 0,
      attempts: [],
      firstResponseMs: null,
      hintUsed: false,
      recap: null,
      seed,
      problems,
      index: 0,
      answers: [],
      questionStartedAt: now,
      startedAt: now,
      feedback: null,
      previous: null,
    });
    setElapsed(0);
    setSummary(null);
    setResultDialogueFacts(null);
    setReview(null);
    setCapsuleReward(undefined);
    setCapsuleOpening(false);
    setActiveCapsuleChoice(undefined);
    setScreen('play');
  }, [playCue, save, stopMusic]);

  const chooseAnswer = useCallback(
    (selectedAnswer: number) => {
      if (!game || !save || game.feedback || game.trailComplete) return;
      const problem = game.problems[game.index];
      if (!problem) return;
      if (
        !problem.choices.includes(selectedAnswer) ||
        (game.practice && game.attempts.includes(selectedAnswer))
      )
        return;
      const selectedCorrect = selectedAnswer === problem.correctAnswer;
      const attempts = [...game.attempts, selectedAnswer];
      const responseMs = Math.max(0, performance.now() - game.questionStartedAt);
      const firstResponseMs = game.firstResponseMs ?? responseMs;
      const hintUsed = game.hintUsed || (game.practice && !selectedCorrect && attempts.length >= 2);
      if (game.practice && !selectedCorrect) {
        void playCue(GAME_AUDIO_CUES.incorrectAnswer);
        setGame({
          ...game,
          attempts,
          firstResponseMs,
          hintUsed,
          feedback: { selected: selectedAnswer, correct: false },
        });
        transitionTimer.current = window.setTimeout(() => {
          setGame({ ...game, attempts, firstResponseMs, hintUsed, feedback: null });
        }, answerFeedbackDelay(false));
        return;
      }
      const answer: AnswerRecord = {
        problemId: problem.id,
        skillKey: problem.skillKey,
        operation: problem.operation,
        left: problem.left,
        right: problem.right,
        choices: [...problem.choices],
        correctChoiceIndex: problem.correctChoiceIndex,
        selectedAnswer: game.practice ? (attempts[0] ?? selectedAnswer) : selectedAnswer,
        correctAnswer: problem.correctAnswer,
        correct: game.practice ? attempts[0] === problem.correctAnswer : selectedCorrect,
        responseMs: game.practice ? firstResponseMs : responseMs,
        ...(game.practice
          ? {
              practice: {
                attempts,
                hintUsed,
                completionMs: responseMs,
                recapAttempts: [],
                recapHintUsed: false,
              },
            }
          : {}),
      };
      const nextAnswers = game.recap
        ? game.answers.map((original, index) =>
            index === game.index && original.practice
              ? {
                  ...original,
                  practice: {
                    ...original.practice,
                    recapAttempts: attempts,
                    recapHintUsed: hintUsed,
                  },
                }
              : original,
          )
        : [...game.answers, answer];
      void playCue(
        selectedCorrect ? GAME_AUDIO_CUES.correctAnswer : GAME_AUDIO_CUES.incorrectAnswer,
      );
      setGame({
        ...game,
        answers: nextAnswers,
        feedback: { selected: selectedAnswer, correct: selectedCorrect },
      });
      transitionTimer.current = window.setTimeout(() => {
        const recap = game.recap
          ? game.recap.slice(1)
          : game.practice && game.index === game.problems.length - 1
            ? nextAnswers.flatMap((record, index) => (record.correct ? [] : [index]))
            : null;
        const trailCompleted =
          game.trail &&
          selectedCorrect &&
          nextAnswers.filter((record) => record.correct).length >= TRAIL_QUEST_LENGTH;
        const completed = game.trail
          ? trailCompleted
          : game.recap
            ? recap?.length === 0
            : game.index === game.problems.length - 1 && (!recap || recap.length === 0);
        if (completed) {
          const completedProblems = game.trail
            ? game.problems.slice(0, nextAnswers.length)
            : game.problems;
          const nextSummary = summarizeSession(
            completedProblems,
            nextAnswers,
            save.settings,
            game.seed,
            clock,
          );
          const nextSave = applyCompletedSession(save, nextSummary, clock.today());
          const storedSummary = nextSave.sessions.at(-1) ?? nextSummary;
          const dialogueFacts = deriveResultDialogueFacts(
            storedSummary,
            save.sessions,
            save.archivedProgress,
          );
          commitSave(nextSave);
          setSummary(storedSummary);
          setResultDialogueFacts(dialogueFacts);
          void playCue(GAME_AUDIO_CUES.roundComplete);
          if (game.trail) {
            setGame({
              ...game,
              answers: nextAnswers,
              feedback: null,
              previous: { answer, prompt: formatProblem(problem) },
              trailComplete: true,
              trailPosition: TRAIL_QUEST_LENGTH,
            });
            transitionTimer.current = window.setTimeout(() => {
              setGame(null);
              setScreen('results');
              transitionTimer.current = null;
            }, 1_500);
          } else {
            setGame(null);
            setScreen('results');
          }
        } else {
          setGame({
            ...game,
            index: recap?.length ? (recap[0] ?? 0) : game.index + 1,
            recap: recap?.length ? recap : null,
            attempts: [],
            firstResponseMs: null,
            hintUsed: false,
            answers: nextAnswers,
            questionStartedAt: performance.now(),
            feedback: null,
            previous: { answer, prompt: formatProblem(problem) },
            trailPosition: game.trailPosition + (game.trail && selectedCorrect ? 1 : 0),
          });
        }
      }, answerFeedbackDelay(selectedCorrect));
    },
    [commitSave, game, playCue, save],
  );

  useEffect(() => {
    if (screen !== 'play' || !game || game.feedback || game.trailComplete) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const index = Number(event.key) - 1;
      const choice = game.problems[game.index]?.choices[index];
      if (choice !== undefined) chooseAnswer(choice);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [chooseAnswer, game, screen]);

  if (developmentView === 'states' && StateGallery)
    return (
      <Suspense fallback={<DevelopmentViewLoading />}>
        <StateGallery />
      </Suspense>
    );
  if (developmentView === 'sounds' && SoundLab)
    return (
      <Suspense fallback={<DevelopmentViewLoading />}>
        <SoundLab />
      </Suspense>
    );
  if (developmentView === 'music' && MusicLab)
    return (
      <Suspense fallback={<DevelopmentViewLoading />}>
        <MusicLab />
      </Suspense>
    );
  if (developmentView === 'art' && ArtLab)
    return (
      <Suspense fallback={<DevelopmentViewLoading />}>
        <ArtLab />
      </Suspense>
    );
  if (developmentView === 'themes' && ThemeLab)
    return (
      <Suspense fallback={<DevelopmentViewLoading />}>
        <ThemeLab />
      </Suspense>
    );
  if (developmentView === 'companions' && CompanionLab)
    return (
      <Suspense fallback={<DevelopmentViewLoading />}>
        <CompanionLab />
      </Suspense>
    );
  if (developmentView === 'trail' && TrailQuestLab)
    return (
      <Suspense fallback={<DevelopmentViewLoading />}>
        <TrailQuestLab />
      </Suspense>
    );
  if (save === undefined)
    return (
      <main className="loading-screen">
        <div className="loading-paw">🐾</div>
        <p>Opening Number Nook…</p>
      </main>
    );
  if (screen === 'backup')
    return (
      <BackupRestore
        save={save}
        onBack={() => setScreen(save ? 'home' : 'onboarding')}
        onRestore={async (restored) => {
          await repository.save(restored);
          if (transitionTimer.current !== null) {
            window.clearTimeout(transitionTimer.current);
            transitionTimer.current = null;
          }
          setSave(restored);
          setGame(null);
          setElapsed(0);
          setSummary(null);
          setResultDialogueFacts(null);
          setReview(null);
          setCapsuleReward(undefined);
          setCapsuleOpening(false);
          setActiveCapsuleChoice(undefined);
          clearCapsuleTimer();
        }}
      />
    );
  if (!save || screen === 'onboarding')
    return (
      <Onboarding
        onRestore={() => setScreen('backup')}
        onStarterSelect={() => void playCue(GAME_AUDIO_CUES.starterSelected)}
        onComplete={(name, starterId) => {
          const next = createInitialSave(name, starterId);
          commitSave(next);
          setScreen('home');
        }}
      />
    );

  if (screen === 'settings')
    return (
      <Settings
        preferences={audioPreferences}
        onChange={updateAudioPreferences}
        onReset={() => updateAudioPreferences(DEFAULT_AUDIO_PREFERENCES)}
        onBack={() => setScreen('home')}
      />
    );

  if (screen === 'setup')
    return (
      <Setup
        settings={save.settings}
        companion={equippedCompanion}
        dialogue={activeDialogue?.context === 'setup' ? activeDialogue : undefined}
        artStyle={save.artStyle}
        onChange={(settings) => commitSave(updateSettings(save, settings))}
        onBack={() => setScreen('home')}
        onStart={startGame}
      />
    );
  if (screen === 'play' && game?.trail && equippedCompanion) {
    const problem = game.problems[game.index];
    if (!problem) return null;
    return (
      <TrailQuestPlay
        problem={problem}
        feedback={game.feedback}
        previous={game.previous ? { correct: game.previous.answer.correct } : null}
        collectedCount={game.trailPosition}
        complete={game.trailComplete}
        companion={equippedCompanion}
        artStyle={save.artStyle}
        soundEnabled={audioPreferences.effectsEnabled && audioPreferences.effectsVolume > 0}
        onAnswer={chooseAnswer}
        onToggleAudio={toggleAudio}
        onExit={() => {
          if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
          setGame(null);
          setScreen('home');
        }}
      />
    );
  }
  if (screen === 'play' && game)
    return (
      <Play
        game={game}
        elapsed={elapsed}
        companion={equippedCompanion}
        artStyle={save.artStyle}
        onAnswer={chooseAnswer}
        onHint={() =>
          setGame((current) =>
            current && !current.feedback ? { ...current, hintUsed: true } : current,
          )
        }
        audioPreferences={audioPreferences}
        onToggleAudio={toggleAudio}
        onExit={() => {
          if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
          setGame(null);
          setScreen('home');
        }}
      />
    );
  if (screen === 'results' && summary)
    return (
      <Results
        summary={summary}
        resultFacts={resultDialogueFacts}
        companion={equippedCompanion}
        dialogue={activeDialogue?.context === 'results' ? activeDialogue : undefined}
        artStyle={save.artStyle}
        onReplay={startGame}
        onHome={() => setScreen('home')}
        onReview={() => {
          setReview({ summary, back: 'results' });
          setScreen('review');
        }}
        dailyEarned={dailyCoinsEarned(save, clock.today())}
        presentCoinReward={presentedCoinSummaryId !== summary.id}
        onCoinsPresented={presentCoins}
        onCapsule={() => {
          clearCapsuleTimer();
          setCapsuleReward(undefined);
          setCapsuleOpening(false);
          setActiveCapsuleChoice(undefined);
          setScreen('capsule');
        }}
      />
    );
  if (screen === 'review' && review)
    return (
      <RoundReview
        summary={review.summary}
        onBack={() => setScreen(review.back === 'results' && summary ? 'results' : 'history')}
      />
    );
  if (screen === 'history')
    return (
      <History
        save={save}
        companion={equippedCompanion}
        dialogue={activeDialogue?.context === 'progress' ? activeDialogue : undefined}
        artStyle={save.artStyle}
        onBack={() => setScreen('home')}
        onReview={(session) => {
          setReview({ summary: session, back: 'history' });
          setScreen('review');
        }}
        onClear={() => {
          commitSave(clearPlayHistory(save));
          setSummary(null);
          setResultDialogueFacts(null);
          setReview(null);
        }}
      />
    );
  if (screen === 'capsule')
    return (
      <Capsule
        save={save}
        companion={equippedCompanion}
        dialogue={activeDialogue?.context === 'capsule' ? activeDialogue : undefined}
        reward={capsuleReward}
        opening={capsuleOpening}
        activeChoice={activeCapsuleChoice}
        onOpen={(choice) => {
          if (capsuleOpening) return;
          const result = openCapsule(
            save,
            catalog.collectibles,
            choice,
            new SeededRandom(createRandomSeed()),
            clock.now(),
          );
          if (result.status !== 'opened') {
            if (result.status === 'complete') setCapsuleReward(null);
            else void playCue(GAME_AUDIO_CUES.unavailableAction);
            return;
          }
          const { reward } = result;
          commitSave(result.save);
          setActiveCapsuleChoice(choice);
          setCapsuleReward(undefined);
          setCapsuleOpening(true);
          void playCue(GAME_AUDIO_CUES.capsuleReveal);
          clearCapsuleTimer();
          capsuleTimer.current = window.setTimeout(() => {
            setCapsuleReward(reward);
            setCapsuleOpening(false);
            capsuleTimer.current = null;
          }, 760);
        }}
        onGrantDevelopmentCoins={
          import.meta.env.DEV ? () => commitSave(grantDevelopmentCoins(save)) : undefined
        }
        onEquip={(id) => {
          if (id === save.equippedCollectibleId) return;
          void playCue(GAME_AUDIO_CUES.companionEquipped);
          commitSave({ ...save, equippedCollectibleId: id });
        }}
        onGallery={(collectionId) => {
          setGalleryInitialFilter(collectionId);
          setScreen('gallery');
        }}
        onBack={() => setScreen(summary ? 'results' : 'home')}
      />
    );
  if (screen === 'gallery')
    return (
      <Gallery
        save={save}
        dialogue={activeDialogue?.context === 'equip' ? activeDialogue : undefined}
        initialFilter={galleryInitialFilter}
        onArtStyleChange={(artStyle) => commitSave(updateArtStyle(save, artStyle))}
        onEquip={(id) => {
          if (id === save.equippedCollectibleId) return;
          void playCue(GAME_AUDIO_CUES.companionEquipped);
          setEquipDialogueEvent((current) => ({
            companionId: id,
            sequence: (current?.sequence ?? 0) + 1,
          }));
          commitSave({ ...save, equippedCollectibleId: id });
        }}
        onBack={() => {
          setEquipDialogueEvent(null);
          setGalleryInitialFilter(undefined);
          setScreen('home');
        }}
      />
    );
  return (
    <Home
      save={save}
      dialogue={activeDialogue?.context === 'home' ? activeDialogue : undefined}
      onPlay={startGame}
      onSetup={() => setScreen('setup')}
      onGallery={() => setScreen('gallery')}
      onHistory={() => setScreen('history')}
      onBackup={() => setScreen('backup')}
      onSettings={() => setScreen('settings')}
      audioPreferences={audioPreferences}
      onToggleAudio={toggleAudio}
      onToggleMusic={toggleMusic}
      onCapsule={() => {
        clearCapsuleTimer();
        setSummary(null);
        setCapsuleReward(undefined);
        setCapsuleOpening(false);
        setActiveCapsuleChoice(undefined);
        setScreen('capsule');
      }}
    />
  );
}
