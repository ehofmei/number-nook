import type { Problem } from './math';

export interface PracticeRecord {
  attempts: number[];
  hintUsed: boolean;
  completionMs: number;
  recapAttempts: number[];
  recapHintUsed: boolean;
}

// Short strategies stay readable even for Advanced operands; never draw hundreds of counters.
export function practiceHint(problem: Pick<Problem, 'operation' | 'left' | 'right'>): string {
  const { left, right, operation } = problem;
  switch (operation) {
    case 'addition': {
      if (left === 0 || right === 0) return 'Adding zero leaves the other number just as it is.';
      const tens = Math.floor(right / 10) * 10;
      return tens > 0
        ? `Break ${right} into ${tens} and ${right - tens}. Add ${tens} to ${left}, then add ${right - tens}.`
        : `Start at ${Math.max(left, right)} and count forward ${Math.min(left, right)} steps.`;
    }
    case 'subtraction':
      if (right > left)
        return `Find the gap from ${left} to ${right}. You are taking away more than you started with, so the answer is negative.`;
      return `Find the gap: what would you add to ${right} to reach ${left}?`;
    case 'multiplication':
      if (left === 0 || right === 0)
        return 'Zero groups means nothing to count. Any number multiplied by zero is zero.';
      return `Think of ${Math.min(left, right)} groups of ${Math.max(left, right)}. You can split the groups into smaller parts and add their totals.`;
    case 'division':
      return `Turn it around: ${right} × what number = ${left}? Think of equal groups of ${right}.`;
  }
}

export const PRACTICE_ENCOURAGEMENT = [
  'Let’s give that one another little look.',
  'A tiny rethink can open a big door.',
  'No hurry. Your next idea is welcome here.',
  'Try a different path through the numbers.',
  'We have time to untangle this together.',
  'One choice crossed off. Keep exploring!',
  'Let’s slow down and spot the little clues.',
  'That was a brave try. Take another peek.',
  'Your thinking is still growing. Keep going!',
  'A little patience, a little number magic.',
  'There’s another way in. Let’s find it.',
  'I’m right here while you work it out.',
  'Let’s follow the numbers one small step at a time.',
  'A fresh look might be just the thing.',
  'Little clues have a way of adding up.',
  'You can borrow a hint if you need one.',
  'Every new try is another bit of thinking.',
  'There’s room for a little wondering here.',
  'Let’s make this puzzle a little smaller.',
  'Give those numbers a cozy second look.',
  'Your next thought might be the missing piece.',
  'I like watching your ideas take shape.',
  'We can take the scenic route through this one.',
  'Pause, peek, and try a new little idea.',
];
