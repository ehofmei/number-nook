import { describe, expect, it } from 'vitest';
import { practiceHint } from './practice';
import { DEFAULT_SETTINGS, generateSession } from './math';
import { SeededRandom } from './random';
import { FakeClock } from './clock';
import { scoreAnswer, summarizeSession } from './session';
import { configurationKey, progressForSessions } from './progress';
import {
  applyCompletedSession,
  createInitialSave,
  LocalStorageSaveRepository,
} from '../storage/save';
import { buildPlayHistoryExport } from '../analytics/history';

describe('Practice mode', () => {
  it('awards a fixed score for correct first answers without a speed bonus', () => {
    expect(scoreAnswer(true, 100, true)).toBe(100);
    expect(scoreAnswer(true, 60_000, true)).toBe(100);
    expect(scoreAnswer(false, 100, true)).toBe(0);
  });

  it('provides useful strategies for all operations, zero, and negative subtraction', () => {
    expect(practiceHint({ operation: 'addition', left: 28, right: 14 })).toContain('10 and 4');
    expect(practiceHint({ operation: 'addition', left: 2, right: 5 })).toContain('Start at 5');
    expect(practiceHint({ operation: 'addition', left: 11, right: 0 })).toContain('Adding zero');
    expect(practiceHint({ operation: 'subtraction', left: 9, right: 4 })).toContain('gap');
    expect(practiceHint({ operation: 'subtraction', left: 4, right: 9 })).toContain('negative');
    expect(practiceHint({ operation: 'multiplication', left: 8, right: 7 })).toContain(
      '7 groups of 8',
    );
    expect(practiceHint({ operation: 'multiplication', left: 0, right: 7 })).toContain('zero');
    expect(practiceHint({ operation: 'multiplication', left: 7, right: 0 })).toContain('zero');
    expect(practiceHint({ operation: 'division', left: 56, right: 8 })).toContain(
      '8 × what number = 56',
    );
  });

  it('preserves first-attempt rewards and practice detail across summaries, archives, and backups', () => {
    const settings = { ...DEFAULT_SETTINGS, mode: 'practice' as const };
    const problems = generateSession(settings, new SeededRandom(13));
    const answers = problems.map((problem, index) => ({
      operation: problem.operation,
      left: problem.left,
      right: problem.right,
      correctAnswer: problem.correctAnswer,
      choices: problem.choices,
      correctChoiceIndex: problem.correctChoiceIndex,
      skillKey: problem.skillKey,
      problemId: problem.id,
      selectedAnswer: index === 0 ? problem.correctAnswer + 1 : problem.correctAnswer,
      correct: index !== 0,
      responseMs: 100,
      practice: {
        attempts:
          index === 0
            ? [problem.correctAnswer + 1, problem.correctAnswer]
            : [problem.correctAnswer],
        hintUsed: index === 0,
        completionMs: 900,
        recapAttempts: index === 0 ? [problem.correctAnswer] : [],
        recapHintUsed: false,
      },
    }));
    const summary = summarizeSession(problems, answers, settings, 13, new FakeClock(1));
    expect(summary.score).toBe(900);
    expect(summary.correctCount).toBe(9);
    expect(summary.coinsEarned).toBe(23);
    const progress = progressForSessions([summary]);
    expect(progress.overall.score).toBe(900);
    expect(progress.operations.reduce((sum, operation) => sum + operation.score, 0)).toBe(900);
    expect(configurationKey(settings, 8)).not.toBe(configurationKey(DEFAULT_SETTINGS, 8));
    expect(configurationKey({ ...DEFAULT_SETTINGS, mode: 'quick' }, 8)).toBe(
      configurationKey(DEFAULT_SETTINGS, 8),
    );
    expect(configurationKey({ ...DEFAULT_SETTINGS, mode: 'trail' }, 8)).toContain('|trail');
    const save = applyCompletedSession(
      createInitialSave('Practice', 'cozy-cats:sunny'),
      summary,
      '2026-09-07',
    );
    const repository = new LocalStorageSaveRepository();
    expect(repository.parseImport(repository.export(save))).toEqual(save);
    expect(
      buildPlayHistoryExport(save, '2026-09-07').sessions[0]?.questions[0]?.practice?.attempts,
    ).toHaveLength(2);
    expect(buildPlayHistoryExport(save, '2026-09-07').sessions[0]?.questions[1]?.scoreAwarded).toBe(
      100,
    );
  });

  it('upgrades schema 6 without resetting welcome or participation progress', () => {
    const save = createInitialSave('Ada', 'cozy-cats:sunny');
    save.rewardProgress.welcomeCapsuleStatus = 'opened';
    save.rewardProgress.dailyBonusDate = '2026-09-07';
    const migrated = new LocalStorageSaveRepository().parseImport(
      JSON.stringify({ ...save, schemaVersion: 6 }),
    );
    expect(migrated).toEqual(save);
    expect(migrated.settings.mode ?? 'quick').toBe('quick');
  });
});
