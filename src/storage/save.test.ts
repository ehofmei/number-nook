import { beforeEach, describe, expect, it } from 'vitest';
import { FakeClock } from '../domain/clock';
import { DEFAULT_SETTINGS, generateSession } from '../domain/math';
import { SeededRandom } from '../domain/random';
import { summarizeSession } from '../domain/session';
import {
  applyCompletedSession,
  clearPlayHistory,
  createInitialSave,
  dailyCoinsEarned,
  DETAILED_SESSION_LIMIT,
  LocalStorageSaveRepository,
  updateArtStyle,
  updateSettings,
} from './save';

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

describe('save data', () => {
  it('creates, stores, exports, and reloads a versioned save', async () => {
    const repository = new LocalStorageSaveRepository();
    const save = createInitialSave(' Ada ', 'cozy-cats:sunny');
    expect(save.player.name).toBe('Ada');
    expect(save.schemaVersion).toBe(8);
    expect(save.lifetimeCoinsEarned).toBe(0);
    expect(save.artStyle).toBe('sticker');
    await repository.save(save);
    await expect(repository.load()).resolves.toEqual(save);
    expect(repository.parseImport(repository.export(save))).toEqual(save);
    expect(storage.get(LocalStorageSaveRepository.key)).not.toContain('\n');
    expect(repository.export(save)).toContain('\n');
  });

  it('migrates a version 1 save without losing progress', () => {
    const repository = new LocalStorageSaveRepository();
    const current = createInitialSave('Ada', 'cozy-cats:sunny');
    const { dailyCoins: _dailyCoins, ...legacy } = current;
    void _dailyCoins;
    const migrated = repository.parseImport(JSON.stringify({ ...legacy, schemaVersion: 1 }));
    expect(migrated).toMatchObject({
      schemaVersion: 8,
      lifetimeCoinsEarned: 0,
      player: { name: 'Ada' },
      coins: 0,
      artStyle: 'sticker',
      dailyCoins: { date: '', earned: 0 },
    });
  });

  it('initializes lifetime level progress when migrating a version 7 development save', () => {
    const repository = new LocalStorageSaveRepository();
    const current = createInitialSave('Ada', 'cozy-cats:sunny');
    const { lifetimeCoinsEarned: _lifetimeCoinsEarned, ...legacy } = current;
    void _lifetimeCoinsEarned;

    const migrated = repository.parseImport(
      JSON.stringify({ ...legacy, schemaVersion: 7, coins: 42 }),
    );

    expect(migrated).toMatchObject({
      schemaVersion: 8,
      coins: 42,
      lifetimeCoinsEarned: 0,
    });
  });

  it('migrates version 2 sessions into reproducible analysis records', () => {
    const repository = new LocalStorageSaveRepository();
    const initial = createInitialSave('Ada', 'cozy-cats:sunny');
    const problems = generateSession(DEFAULT_SETTINGS, new SeededRandom(7));
    const answers = problems.map((problem) => ({
      problemId: problem.id,
      skillKey: problem.skillKey,
      operation: problem.operation,
      left: problem.left,
      right: problem.right,
      choices: problem.choices,
      correctChoiceIndex: problem.correctChoiceIndex,
      selectedAnswer: problem.correctAnswer,
      correctAnswer: problem.correctAnswer,
      correct: true,
      responseMs: 700,
    }));
    const summary = summarizeSession(problems, answers, DEFAULT_SETTINGS, 7, new FakeClock(7));
    const current = applyCompletedSession(initial, summary, '2026-01-02');
    const legacySessions = current.sessions.map((session) => ({
      id: session.id,
      completedAt: session.completedAt,
      settings: session.settings,
      seed: session.seed,
      answers: session.answers.map((answer) => ({
        problemId: answer.problemId,
        skillKey: answer.skillKey,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: answer.correctAnswer,
        correct: answer.correct,
        responseMs: answer.responseMs,
      })),
      correctCount: session.correctCount,
      accuracy: session.accuracy,
      elapsedMs: session.elapsedMs,
      score: session.score,
      coinsEarned:
        session.correctCount + (session.accuracy >= 0.8 ? 2 : 0) + (session.accuracy === 1 ? 3 : 0),
    }));
    const legacyV2 = {
      ...current,
      schemaVersion: 2,
      dailyCoins: { date: '2026-01-02', earned: 15 },
      sessions: [
        ...legacySessions,
        {
          ...legacySessions[0],
          id: 'old-addition-format',
          answers: [
            {
              ...legacySessions[0]!.answers[0],
              problemId: 'q1:7+3',
              skillKey: 'addition:3+7',
            },
          ],
          correctCount: 1,
          accuracy: 1,
        },
      ],
    };

    const migrated = repository.parseImport(JSON.stringify(legacyV2));
    expect(migrated.schemaVersion).toBe(8);
    expect(migrated.lifetimeCoinsEarned).toBe(0);
    expect(migrated.sessions[0]).toMatchObject({
      rulesetVersion: 1,
      coinsPotential: 15,
    });
    expect(typeof migrated.sessions[0]?.answers[0]?.operation).toBe('string');
    expect(migrated.sessions[0]?.answers[0]?.choices).toEqual([]);
    expect(migrated.sessions[0]?.answers[0]?.correctChoiceIndex).toBe(-1);
    expect(migrated.sessions[1]?.answers[0]).toMatchObject({
      operation: 'addition',
      left: 7,
      right: 3,
    });
  });

  it('returns null when no save exists and rejects malformed imports', async () => {
    const repository = new LocalStorageSaveRepository();
    await expect(repository.load()).resolves.toBeNull();
    expect(() => repository.parseImport('{')).toThrow();
    expect(() => repository.parseImport('{}')).toThrow();
  });

  it('applies a completed session exactly once and retains settings', () => {
    const save = createInitialSave('Ada', 'cozy-cats:sunny');
    const problems = generateSession(DEFAULT_SETTINGS, new SeededRandom(3));
    const answers = problems.map((problem) => ({
      problemId: problem.id,
      skillKey: problem.skillKey,
      operation: problem.operation,
      left: problem.left,
      right: problem.right,
      choices: problem.choices,
      correctChoiceIndex: problem.correctChoiceIndex,
      selectedAnswer: problem.correctAnswer,
      correctAnswer: problem.correctAnswer,
      correct: true,
      responseMs: 400,
    }));
    const summary = summarizeSession(problems, answers, DEFAULT_SETTINGS, 3, new FakeClock(1));
    const once = applyCompletedSession(save, summary, '2026-01-02');
    const twice = applyCompletedSession(once, summary, '2026-01-02');
    expect(once.coins).toBe(33);
    expect(once.lifetimeCoinsEarned).toBe(33);
    expect(once.sessions.at(-1)).toMatchObject({
      coinsEarned: 33,
      dailyBonusCoins: 5,
      weeklyBonusCoins: 0,
    });
    expect(twice).toEqual(once);
    expect(updateSettings(once, DEFAULT_SETTINGS).settings).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps earning after the daily milestone and awards bounded participation bonuses', () => {
    const initial = createInitialSave('Ada', 'cozy-cats:sunny');
    const problems = generateSession(DEFAULT_SETTINGS, new SeededRandom(3));
    const answers = problems.map((problem) => ({
      problemId: problem.id,
      skillKey: problem.skillKey,
      operation: problem.operation,
      left: problem.left,
      right: problem.right,
      choices: problem.choices,
      correctChoiceIndex: problem.correctChoiceIndex,
      selectedAnswer: problem.correctAnswer,
      correctAnswer: problem.correctAnswer,
      correct: true,
      responseMs: 400,
    }));
    const makeSummary = (seed: number) =>
      summarizeSession(problems, answers, DEFAULT_SETTINGS, seed, new FakeClock(seed));

    const first = applyCompletedSession(initial, makeSummary(1), '2026-01-02');
    const second = applyCompletedSession(first, makeSummary(2), '2026-01-02');
    const third = applyCompletedSession(second, makeSummary(3), '2026-01-02');
    const fourth = applyCompletedSession(third, makeSummary(4), '2026-01-02');
    expect(fourth.coins).toBe(117);
    expect(fourth.lifetimeCoinsEarned).toBe(117);
    expect(fourth.sessions.at(-1)).toMatchObject({
      coinsEarned: 28,
      dailyBonusCoins: 0,
      dailyMilestoneReached: true,
    });
    expect(dailyCoinsEarned(fourth, '2026-01-02')).toBe(117);
    expect(dailyCoinsEarned(fourth, '2026-01-03')).toBe(0);

    const nextDay = applyCompletedSession(fourth, makeSummary(5), '2026-01-03');
    const thirdPracticeDay = applyCompletedSession(nextDay, makeSummary(6), '2026-01-04');
    expect(nextDay.sessions.at(-1)).toMatchObject({ dailyBonusCoins: 5, weeklyBonusCoins: 0 });
    expect(thirdPracticeDay.sessions.at(-1)).toMatchObject({
      dailyBonusCoins: 5,
      weeklyBonusCoins: 15,
    });
    expect(thirdPracticeDay.rewardProgress.weekly).toMatchObject({
      qualifyingDates: ['2026-01-02', '2026-01-03', '2026-01-04'],
      bonusAwarded: true,
    });
  });

  it('retains thirty detailed rounds and rolls older sessions into lifetime progress', () => {
    const initial = createInitialSave('Ada', 'cozy-cats:sunny');
    const problems = generateSession(DEFAULT_SETTINGS, new SeededRandom(3));
    const answers = problems.map((problem) => ({
      problemId: problem.id,
      skillKey: problem.skillKey,
      operation: problem.operation,
      left: problem.left,
      right: problem.right,
      choices: problem.choices,
      correctChoiceIndex: problem.correctChoiceIndex,
      selectedAnswer: problem.correctAnswer,
      correctAnswer: problem.correctAnswer,
      correct: true,
      responseMs: 400,
    }));
    let save = initial;
    for (let index = 0; index < 35; index += 1) {
      const summary = summarizeSession(
        problems,
        answers,
        DEFAULT_SETTINGS,
        index + 1,
        new FakeClock(index + 1),
      );
      save = applyCompletedSession(save, summary, '2026-01-02');
    }

    expect(save.sessions).toHaveLength(DETAILED_SESSION_LIMIT);
    expect(save.archivedProgress.overall).toMatchObject({
      rounds: 5,
      questions: 50,
      correct: 50,
    });
    expect(save.archivedProgress.configurations[0]).toMatchObject({ rounds: 5, questions: 50 });
    expect(save.archivedProgress.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ operation: 'addition', rounds: 5, questions: 25 }),
        expect.objectContaining({ operation: 'subtraction', rounds: 5, questions: 25 }),
      ]),
    );
  });

  it('migrates a version 3 save into retained detail and archived progress', () => {
    const repository = new LocalStorageSaveRepository();
    const initial = createInitialSave('Ada', 'cozy-cats:sunny');
    const problems = generateSession(DEFAULT_SETTINGS, new SeededRandom(4));
    const answers = problems.map((problem) => ({
      problemId: problem.id,
      skillKey: problem.skillKey,
      operation: problem.operation,
      left: problem.left,
      right: problem.right,
      choices: problem.choices,
      correctChoiceIndex: problem.correctChoiceIndex,
      selectedAnswer: problem.correctAnswer,
      correctAnswer: problem.correctAnswer,
      correct: true,
      responseMs: 500,
    }));
    const sessions = Array.from({ length: 35 }, (_, index) =>
      summarizeSession(problems, answers, DEFAULT_SETTINGS, index + 1, new FakeClock(index + 1)),
    );
    const { archivedProgress: _archivedProgress, ...withoutArchive } = initial;
    void _archivedProgress;
    const migrated = repository.parseImport(
      JSON.stringify({ ...withoutArchive, schemaVersion: 3, sessions }),
    );

    expect(migrated.schemaVersion).toBe(8);
    expect(migrated.lifetimeCoinsEarned).toBe(0);
    expect(migrated.artStyle).toBe('sticker');
    expect(migrated.sessions).toHaveLength(DETAILED_SESSION_LIMIT);
    expect(migrated.archivedProgress.overall).toMatchObject({ rounds: 5, questions: 50 });
  });

  it('migrates a version 4 save with the new default art style', () => {
    const repository = new LocalStorageSaveRepository();
    const current = createInitialSave('Ada', 'cozy-cats:sunny');
    const { artStyle: _artStyle, ...legacy } = current;
    void _artStyle;

    const migrated = repository.parseImport(JSON.stringify({ ...legacy, schemaVersion: 4 }));

    expect(migrated).toMatchObject({
      schemaVersion: 8,
      lifetimeCoinsEarned: 0,
      artStyle: 'sticker',
    });
  });

  it('migrates an established version 5 save without changing its balance', () => {
    const repository = new LocalStorageSaveRepository();
    const current = createInitialSave('Ada', 'cozy-cats:sunny');
    const {
      rewardProgress: _rewardProgress,
      schemaVersion: _schemaVersion,
      ...legacyFields
    } = current;
    void _rewardProgress;
    void _schemaVersion;
    const migrated = repository.parseImport(
      JSON.stringify({
        ...legacyFields,
        schemaVersion: 5,
        coins: 42,
        dailyCoins: { date: '2026-08-30', earned: 30 },
      }),
    );

    expect(migrated).toMatchObject({
      schemaVersion: 8,
      lifetimeCoinsEarned: 0,
      coins: 42,
      dailyCoins: { date: '2026-08-30', earned: 30 },
      rewardProgress: { welcomeCapsuleStatus: 'locked' },
    });
  });

  it('does not grant participation bonuses for a round with fewer than five correct answers', () => {
    const initial = createInitialSave('Ada', 'cozy-cats:sunny');
    const problems = generateSession(DEFAULT_SETTINGS, new SeededRandom(12));
    const answers = problems.map((problem, index) => ({
      problemId: problem.id,
      skillKey: problem.skillKey,
      operation: problem.operation,
      left: problem.left,
      right: problem.right,
      choices: problem.choices,
      correctChoiceIndex: problem.correctChoiceIndex,
      selectedAnswer: index < 4 ? problem.correctAnswer : Number.MIN_SAFE_INTEGER,
      correctAnswer: problem.correctAnswer,
      correct: index < 4,
      responseMs: 400,
    }));
    const completed = applyCompletedSession(
      initial,
      summarizeSession(problems, answers, DEFAULT_SETTINGS, 12, new FakeClock(12)),
      '2026-08-31',
    );

    expect(completed.sessions.at(-1)).toMatchObject({
      dailyBonusCoins: 0,
      weeklyBonusCoins: 0,
    });
    expect(completed.rewardProgress.dailyBonusDate).toBe('');
    expect(completed.rewardProgress.weekly.qualifyingDates).toEqual([]);
  });

  it('updates the master art style without changing collection progress', () => {
    const initial = createInitialSave('Ada', 'cozy-cats:sunny');
    const classic = updateArtStyle(initial, 'classic');

    expect(classic.artStyle).toBe('classic');
    expect(classic.ownedCollectibleIds).toEqual(initial.ownedCollectibleIds);
    expect(classic.equippedCollectibleId).toBe(initial.equippedCollectibleId);
  });

  it('clears play statistics without removing currency, companions, or settings', () => {
    const initial = {
      ...createInitialSave('Ada', 'cozy-cats:sunny'),
      coins: 42,
      ownedCollectibleIds: ['cozy-cats:sunny', 'cozy-cats:moonbeam'],
    };
    const problems = generateSession(DEFAULT_SETTINGS, new SeededRandom(5));
    const answers = problems.map((problem) => ({
      problemId: problem.id,
      skillKey: problem.skillKey,
      operation: problem.operation,
      left: problem.left,
      right: problem.right,
      choices: problem.choices,
      correctChoiceIndex: problem.correctChoiceIndex,
      selectedAnswer: problem.correctAnswer,
      correctAnswer: problem.correctAnswer,
      correct: true,
      responseMs: 400,
    }));
    const withHistory = applyCompletedSession(
      initial,
      summarizeSession(problems, answers, DEFAULT_SETTINGS, 5, new FakeClock(5)),
      '2026-01-02',
    );
    const cleared = clearPlayHistory(withHistory);

    expect(cleared.sessions).toEqual([]);
    expect(cleared.archivedProgress.overall.rounds).toBe(0);
    expect(cleared).toMatchObject({
      coins: withHistory.coins,
      lifetimeCoinsEarned: withHistory.lifetimeCoinsEarned,
      ownedCollectibleIds: initial.ownedCollectibleIds,
      settings: initial.settings,
      artStyle: initial.artStyle,
    });
  });
});
