import type { Clock } from './clock';
import type { PracticeRecord } from './practice';
import type { GameSettings, OperationId, Problem } from './math';
import { calculateRoundCoins, type RoundCoinBreakdown } from './rewards';

export const RULESET_VERSION = 8;

export interface AnswerRecord {
  practice?: PracticeRecord;
  problemId: string;
  skillKey: string;
  operation: OperationId;
  left: number;
  right: number;
  choices: number[];
  correctChoiceIndex: number;
  selectedAnswer: number;
  correctAnswer: number;
  correct: boolean;
  responseMs: number;
}

export interface SessionSummary {
  rulesetVersion: number;
  id: string;
  completedAt: string;
  settings: GameSettings;
  seed: number;
  answers: AnswerRecord[];
  correctCount: number;
  accuracy: number;
  elapsedMs: number;
  score: number;
  coinBreakdown: RoundCoinBreakdown;
  dailyBonusCoins: number;
  weeklyBonusCoins: number;
  dailyMilestoneReached: boolean;
  coinsPotential: number;
  coinsEarned: number;
}

export function scoreAnswer(correct: boolean, responseMs: number, practice = false): number {
  if (!correct) return 0;
  if (practice) return 100;
  const boundedResponse = Math.max(0, responseMs);
  const speedBonus = Math.max(0, Math.round(50 - boundedResponse / 200));
  return 100 + speedBonus;
}

export function summarizeSession(
  problems: readonly Problem[],
  answers: readonly AnswerRecord[],
  settings: GameSettings,
  seed: number,
  clock: Clock,
): SessionSummary {
  if (answers.length !== problems.length) {
    throw new Error('A completed session needs one answer per problem.');
  }
  const correctCount = answers.filter((answer) => answer.correct).length;
  const elapsedMs = answers.reduce((sum, answer) => sum + Math.max(0, answer.responseMs), 0);
  const score = answers.reduce(
    (sum, answer) =>
      sum + scoreAnswer(answer.correct, answer.responseMs, settings.mode === 'practice'),
    0,
  );
  const coinBreakdown = calculateRoundCoins(correctCount, problems.length, settings.difficulty);

  return {
    rulesetVersion: RULESET_VERSION,
    id: `session:${clock.now()}:${seed}`,
    completedAt: new Date(clock.now()).toISOString(),
    settings,
    seed,
    answers: [...answers],
    correctCount,
    accuracy: correctCount / problems.length,
    elapsedMs,
    score,
    coinBreakdown,
    dailyBonusCoins: 0,
    weeklyBonusCoins: 0,
    dailyMilestoneReached: false,
    coinsPotential: coinBreakdown.total,
    coinsEarned: coinBreakdown.total,
  };
}
