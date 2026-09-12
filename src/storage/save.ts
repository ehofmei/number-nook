import { z } from 'zod';
import { artStyleSchema, type ArtStyle } from '../content/schema';
import { DEFAULT_SETTINGS, DIFFICULTY_IDS, OPERATION_IDS, type GameSettings } from '../domain/math';
import { archiveSessions, createEmptyArchivedProgress } from '../domain/progress';
import {
  DAILY_COIN_MILESTONE,
  DAILY_PARTICIPATION_BONUS,
  LEGACY_DAILY_COIN_CAP,
  QUALIFYING_ROUND_CORRECT_ANSWERS,
  WEEKLY_PARTICIPATION_BONUS,
} from '../domain/rewards';
import type { AnswerRecord, SessionSummary } from '../domain/session';

const settingsSchema = z.object({
  mode: z.enum(['quick', 'practice']).optional(),
  operations: z
    .array(z.enum(OPERATION_IDS))
    .min(1)
    .max(OPERATION_IDS.length)
    .refine((operations) => new Set(operations).size === operations.length, {
      message: 'Selected operations must be unique.',
    }),
  difficulty: z.enum(DIFFICULTY_IDS),
  questionCount: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(50)]),
});

const legacyAnswerSchema = z.object({
  problemId: z.string(),
  skillKey: z.string(),
  selectedAnswer: z.number(),
  correctAnswer: z.number(),
  correct: z.boolean(),
  responseMs: z.number().nonnegative(),
});

const answerSchema = legacyAnswerSchema.extend({
  practice: z
    .object({
      attempts: z.array(z.number().int()).min(1).max(4),
      hintUsed: z.boolean(),
      completionMs: z.number().nonnegative(),
      recapAttempts: z.array(z.number().int()).max(4),
      recapHintUsed: z.boolean(),
    })
    .optional(),
  operation: z.enum(OPERATION_IDS),
  left: z.number().int(),
  right: z.number().int(),
  choices: z.array(z.number().int()).max(4),
  correctChoiceIndex: z.number().int().min(-1).max(3),
});

const legacySessionFields = {
  id: z.string(),
  completedAt: z.string(),
  settings: settingsSchema,
  seed: z.number().int(),
  correctCount: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(1),
  elapsedMs: z.number().nonnegative(),
  score: z.number().nonnegative(),
  coinsEarned: z.number().int().nonnegative(),
};

const legacySessionSchema = z.object({
  ...legacySessionFields,
  answers: z.array(legacyAnswerSchema).min(1),
});

const legacyDetailedSessionSchema = z.object({
  ...legacySessionFields,
  rulesetVersion: z.number().int().positive(),
  coinsPotential: z.number().int().nonnegative(),
  answers: z.array(answerSchema).min(1),
});

const roundCoinBreakdownSchema = z.object({
  correctAnswerCoins: z.number().int().nonnegative(),
  difficultyMultiplier: z.number().positive(),
  difficultyAdjustedCoins: z.number().int().nonnegative(),
  difficultyBonusCoins: z.number().int().nonnegative(),
  accuracyBonusCoins: z.number().int().nonnegative(),
  perfectBonusCoins: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

const sessionSchema = legacyDetailedSessionSchema.extend({
  coinBreakdown: roundCoinBreakdownSchema,
  dailyBonusCoins: z.number().int().nonnegative(),
  weeklyBonusCoins: z.number().int().nonnegative(),
  dailyMilestoneReached: z.boolean(),
});

const legacyEconomyEventSchema = z.object({
  id: z.string(),
  occurredAt: z.string(),
  type: z.literal('capsule_opened'),
  coinsSpent: z.number().int().positive(),
  collectibleId: z.string(),
});

const economyEventSchema = z.object({
  id: z.string(),
  occurredAt: z.string(),
  type: z.literal('capsule_opened'),
  capsuleKind: z.enum(['welcome', 'surprise', 'collection']),
  collectionId: z.string().nullable(),
  coinsSpent: z.number().int().nonnegative(),
  collectibleId: z.string(),
  ownedCountBefore: z.number().int().nonnegative(),
  eligiblePoolSize: z.number().int().positive(),
});

export const DETAILED_SESSION_LIMIT = 30;

const progressTotalsSchema = z.object({
  rounds: z.number().int().nonnegative(),
  questions: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  score: z.number().nonnegative(),
  responseMs: z.number().nonnegative(),
});

const archivedProgressSchema = z.object({
  overall: progressTotalsSchema,
  rulesets: z
    .array(progressTotalsSchema.extend({ rulesetVersion: z.number().int().positive() }))
    .max(100),
  difficulties: z
    .array(progressTotalsSchema.extend({ difficulty: z.enum(DIFFICULTY_IDS) }))
    .max(DIFFICULTY_IDS.length),
  operations: z
    .array(progressTotalsSchema.extend({ operation: z.enum(OPERATION_IDS) }))
    .max(OPERATION_IDS.length),
  configurations: z
    .array(
      progressTotalsSchema.extend({
        key: z.string(),
        rulesetVersion: z.number().int().positive(),
        settings: settingsSchema,
        highScore: z.number().nonnegative(),
      }),
    )
    .max(1_000),
});

function commonSaveFields<T extends z.ZodType>(sessions: T, maximumSessions = 100) {
  return {
    player: z.object({
      name: z.string().min(1).max(30),
    }),
    settings: settingsSchema,
    coins: z.number().int().nonnegative(),
    ownedCollectibleIds: z.array(z.string()),
    equippedCollectibleId: z.string(),
    sessions: z.array(sessions).max(maximumSessions),
  };
}

const legacySaveV1Schema = z.object({
  schemaVersion: z.literal(1),
  ...commonSaveFields(legacySessionSchema),
});

const legacySaveV2Schema = z.object({
  schemaVersion: z.literal(2),
  ...commonSaveFields(legacySessionSchema),
  dailyCoins: z.object({
    date: z.string(),
    earned: z.number().int().min(0).max(LEGACY_DAILY_COIN_CAP),
  }),
});

const legacySaveV3Schema = z.object({
  schemaVersion: z.literal(3),
  ...commonSaveFields(legacyDetailedSessionSchema),
  dailyCoins: z.object({
    date: z.string(),
    earned: z.number().int().min(0).max(LEGACY_DAILY_COIN_CAP),
  }),
  economyEvents: z.array(legacyEconomyEventSchema).max(500),
});

const legacySaveV4Schema = z.object({
  schemaVersion: z.literal(4),
  ...commonSaveFields(legacyDetailedSessionSchema, DETAILED_SESSION_LIMIT),
  dailyCoins: z.object({
    date: z.string(),
    earned: z.number().int().min(0).max(LEGACY_DAILY_COIN_CAP),
  }),
  economyEvents: z.array(legacyEconomyEventSchema).max(500),
  archivedProgress: archivedProgressSchema,
});

const legacySaveV5Schema = z.object({
  schemaVersion: z.literal(5),
  ...commonSaveFields(legacyDetailedSessionSchema, DETAILED_SESSION_LIMIT),
  artStyle: artStyleSchema,
  dailyCoins: z.object({
    date: z.string(),
    earned: z.number().int().min(0).max(LEGACY_DAILY_COIN_CAP),
  }),
  economyEvents: z.array(legacyEconomyEventSchema).max(500),
  archivedProgress: archivedProgressSchema,
});

const rewardProgressSchema = z.object({
  welcomeCapsuleStatus: z.enum(['locked', 'available', 'opened']),
  dailyBonusDate: z.string(),
  weekly: z.object({
    weekId: z.string(),
    qualifyingDates: z.array(z.string()).max(7),
    bonusAwarded: z.boolean(),
  }),
});

const legacySaveV6Schema = z.object({
  schemaVersion: z.literal(6),
  ...commonSaveFields(sessionSchema, DETAILED_SESSION_LIMIT),
  artStyle: artStyleSchema,
  dailyCoins: z.object({
    date: z.string(),
    earned: z.number().int().nonnegative(),
  }),
  rewardProgress: rewardProgressSchema,
  economyEvents: z.array(economyEventSchema).max(500),
  archivedProgress: archivedProgressSchema,
});

export const saveSchema = legacySaveV6Schema.extend({ schemaVersion: z.literal(7) });

export type SaveData = z.infer<typeof saveSchema>;
export const DEFAULT_ART_STYLE: ArtStyle = 'sticker';

function enrichLegacyAnswer(answer: z.infer<typeof legacyAnswerSchema>): AnswerRecord {
  const structured = answer.problemId.match(
    /^q\d+:(addition|subtraction|multiplication|division):(-?\d+):(-?\d+)$/,
  );
  const legacyAddition = answer.problemId.match(/^q\d+:(-?\d+)\+(-?\d+)$/);
  const operationCandidate = structured?.[1] ?? answer.skillKey.split(':')[0];
  const operation = OPERATION_IDS.find((value) => value === operationCandidate) ?? 'addition';
  const left = Number(structured?.[2] ?? legacyAddition?.[1] ?? 0);
  const right = Number(structured?.[3] ?? legacyAddition?.[2] ?? 0);
  return {
    ...answer,
    operation,
    left,
    right,
    choices: [],
    correctChoiceIndex: -1,
  };
}

function enrichLegacySession(session: z.infer<typeof legacySessionSchema>): SessionSummary {
  const accuracyBonusCoins = session.accuracy >= 0.8 ? 2 : 0;
  const perfectBonusCoins = session.accuracy === 1 ? 3 : 0;
  return {
    ...session,
    rulesetVersion: 1,
    coinBreakdown: {
      correctAnswerCoins: session.correctCount,
      difficultyMultiplier: 1,
      difficultyAdjustedCoins: session.correctCount,
      difficultyBonusCoins: 0,
      accuracyBonusCoins,
      perfectBonusCoins,
      total: session.coinsEarned,
    },
    dailyBonusCoins: 0,
    weeklyBonusCoins: 0,
    dailyMilestoneReached: false,
    coinsPotential: session.coinsEarned,
    answers: session.answers.map(enrichLegacyAnswer),
  };
}

function enrichDetailedSession(
  session: z.infer<typeof legacyDetailedSessionSchema>,
): SessionSummary {
  const accuracyBonusCoins = session.accuracy >= 0.8 ? 2 : 0;
  const perfectBonusCoins = session.accuracy === 1 ? 3 : 0;
  const correctAnswerCoins = Math.max(
    0,
    session.coinsPotential - accuracyBonusCoins - perfectBonusCoins,
  );
  return {
    ...session,
    coinBreakdown: {
      correctAnswerCoins,
      difficultyMultiplier: 1,
      difficultyAdjustedCoins: correctAnswerCoins,
      difficultyBonusCoins: 0,
      accuracyBonusCoins,
      perfectBonusCoins,
      total: session.coinsPotential,
    },
    dailyBonusCoins: 0,
    weeklyBonusCoins: 0,
    dailyMilestoneReached: false,
  };
}

function weekIdForDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf())) return date;
  const day = parsed.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  parsed.setUTCDate(parsed.getUTCDate() - daysSinceMonday);
  return parsed.toISOString().slice(0, 10);
}

function migratedRewardProgress(hasPriorPractice: boolean) {
  return {
    welcomeCapsuleStatus: hasPriorPractice ? ('opened' as const) : ('locked' as const),
    dailyBonusDate: '',
    weekly: { weekId: '', qualifyingDates: [], bonusAwarded: false },
  };
}

function migrateEconomyEvents(events: readonly z.infer<typeof legacyEconomyEventSchema>[]) {
  return events.map((event) => ({
    ...event,
    capsuleKind: 'surprise' as const,
    collectionId: null,
    ownedCountBefore: 0,
    eligiblePoolSize: 1,
  }));
}

export function createInitialSave(name: string, starterId: string): SaveData {
  return {
    schemaVersion: 7,
    player: { name: name.trim() },
    settings: DEFAULT_SETTINGS,
    artStyle: DEFAULT_ART_STYLE,
    coins: 0,
    dailyCoins: { date: '', earned: 0 },
    rewardProgress: {
      welcomeCapsuleStatus: 'locked',
      dailyBonusDate: '',
      weekly: { weekId: '', qualifyingDates: [], bonusAwarded: false },
    },
    economyEvents: [],
    archivedProgress: createEmptyArchivedProgress(),
    ownedCollectibleIds: [starterId],
    equippedCollectibleId: starterId,
    sessions: [],
  };
}

export function dailyCoinsEarned(save: SaveData, date: string): number {
  return save.dailyCoins.date === date ? save.dailyCoins.earned : 0;
}

export function applyCompletedSession(
  save: SaveData,
  summary: SessionSummary,
  date: string,
): SaveData {
  if (save.sessions.some((session) => session.id === summary.id)) return save;
  const earnedBeforeSession = save.dailyCoins.date === date ? save.dailyCoins.earned : 0;
  const qualifies = summary.correctCount >= QUALIFYING_ROUND_CORRECT_ANSWERS;
  const dailyBonusCoins =
    qualifies && save.rewardProgress.dailyBonusDate !== date ? DAILY_PARTICIPATION_BONUS : 0;
  const weekId = weekIdForDate(date);
  const currentWeekly =
    save.rewardProgress.weekly.weekId === weekId
      ? save.rewardProgress.weekly
      : { weekId, qualifyingDates: [], bonusAwarded: false };
  const qualifyingDates =
    qualifies && !currentWeekly.qualifyingDates.includes(date)
      ? [...currentWeekly.qualifyingDates, date]
      : currentWeekly.qualifyingDates;
  const weeklyBonusCoins =
    qualifyingDates.length >= 3 && !currentWeekly.bonusAwarded ? WEEKLY_PARTICIPATION_BONUS : 0;
  const coinsEarned = summary.coinBreakdown.total + dailyBonusCoins + weeklyBonusCoins;
  const earnedAfterSession = earnedBeforeSession + coinsEarned;
  const storedSummary = {
    ...summary,
    dailyBonusCoins,
    weeklyBonusCoins,
    dailyMilestoneReached:
      earnedBeforeSession < DAILY_COIN_MILESTONE && earnedAfterSession >= DAILY_COIN_MILESTONE,
    coinsPotential: coinsEarned,
    coinsEarned,
  };
  const detailedSessions = [...save.sessions, storedSummary];
  const archivedSessions = detailedSessions.slice(
    0,
    Math.max(0, detailedSessions.length - DETAILED_SESSION_LIMIT),
  );
  return {
    ...save,
    coins: save.coins + coinsEarned,
    dailyCoins: { date, earned: earnedAfterSession },
    rewardProgress: {
      welcomeCapsuleStatus:
        save.rewardProgress.welcomeCapsuleStatus === 'locked'
          ? 'available'
          : save.rewardProgress.welcomeCapsuleStatus,
      dailyBonusDate: dailyBonusCoins > 0 ? date : save.rewardProgress.dailyBonusDate,
      weekly: {
        weekId,
        qualifyingDates,
        bonusAwarded: currentWeekly.bonusAwarded || weeklyBonusCoins > 0,
      },
    },
    archivedProgress: archiveSessions(save.archivedProgress, archivedSessions),
    sessions: detailedSessions.slice(-DETAILED_SESSION_LIMIT),
  };
}

export function clearPlayHistory(save: SaveData): SaveData {
  return {
    ...save,
    sessions: [],
    archivedProgress: createEmptyArchivedProgress(),
  };
}

export function updateSettings(save: SaveData, settings: GameSettings): SaveData {
  return { ...save, settings };
}

export function updateArtStyle(save: SaveData, artStyle: ArtStyle): SaveData {
  return { ...save, artStyle };
}

export interface SaveRepository {
  load(): Promise<SaveData | null>;
  save(data: SaveData): Promise<void>;
  export(data: SaveData): string;
  parseImport(serialized: string): SaveData;
}

export class LocalStorageSaveRepository implements SaveRepository {
  static readonly key = 'first-math-game:save';

  load(): Promise<SaveData | null> {
    const serialized = localStorage.getItem(LocalStorageSaveRepository.key);
    if (!serialized) return Promise.resolve(null);
    return Promise.resolve(this.parseImport(serialized));
  }

  save(data: SaveData): Promise<void> {
    localStorage.setItem(LocalStorageSaveRepository.key, JSON.stringify(saveSchema.parse(data)));
    return Promise.resolve();
  }

  export(data: SaveData): string {
    return JSON.stringify(saveSchema.parse(data), null, 2);
  }

  parseImport(serialized: string): SaveData {
    const input = JSON.parse(serialized) as unknown;
    const current = saveSchema.safeParse(input);
    if (current.success) return current.data;
    const legacyV6 = legacySaveV6Schema.safeParse(input);
    if (legacyV6.success) return saveSchema.parse({ ...legacyV6.data, schemaVersion: 7 });

    const retain = (sessions: readonly SessionSummary[]) => {
      const archived = sessions.slice(0, Math.max(0, sessions.length - DETAILED_SESSION_LIMIT));
      return {
        archivedProgress: archiveSessions(createEmptyArchivedProgress(), archived),
        sessions: sessions.slice(-DETAILED_SESSION_LIMIT),
      };
    };

    const legacyV5 = legacySaveV5Schema.safeParse(input);
    if (legacyV5.success) {
      const sessions = legacyV5.data.sessions.map(enrichDetailedSession);
      return saveSchema.parse({
        ...legacyV5.data,
        schemaVersion: 7,
        sessions,
        rewardProgress: migratedRewardProgress(
          sessions.length > 0 || legacyV5.data.archivedProgress.overall.rounds > 0,
        ),
        economyEvents: migrateEconomyEvents(legacyV5.data.economyEvents),
      });
    }

    const legacyV4 = legacySaveV4Schema.safeParse(input);
    if (legacyV4.success) {
      const sessions = legacyV4.data.sessions.map(enrichDetailedSession);
      return saveSchema.parse({
        ...legacyV4.data,
        schemaVersion: 7,
        artStyle: DEFAULT_ART_STYLE,
        sessions,
        rewardProgress: migratedRewardProgress(
          sessions.length > 0 || legacyV4.data.archivedProgress.overall.rounds > 0,
        ),
        economyEvents: migrateEconomyEvents(legacyV4.data.economyEvents),
      });
    }

    const legacyV3 = legacySaveV3Schema.safeParse(input);
    if (legacyV3.success) {
      const sessions = legacyV3.data.sessions.map(enrichDetailedSession);
      return saveSchema.parse({
        ...legacyV3.data,
        schemaVersion: 7,
        artStyle: DEFAULT_ART_STYLE,
        rewardProgress: migratedRewardProgress(sessions.length > 0),
        economyEvents: migrateEconomyEvents(legacyV3.data.economyEvents),
        ...retain(sessions),
      });
    }

    const legacyV2 = legacySaveV2Schema.safeParse(input);
    if (legacyV2.success) {
      const sessions = legacyV2.data.sessions.map(enrichLegacySession);
      return saveSchema.parse({
        ...legacyV2.data,
        schemaVersion: 7,
        artStyle: DEFAULT_ART_STYLE,
        rewardProgress: migratedRewardProgress(sessions.length > 0),
        economyEvents: [],
        ...retain(sessions),
      });
    }

    const legacyV1 = legacySaveV1Schema.parse(input);
    const sessions = legacyV1.sessions.map(enrichLegacySession);
    return saveSchema.parse({
      ...legacyV1,
      schemaVersion: 7,
      artStyle: DEFAULT_ART_STYLE,
      dailyCoins: { date: '', earned: 0 },
      rewardProgress: migratedRewardProgress(sessions.length > 0),
      economyEvents: [],
      ...retain(sessions),
    });
  }
}
