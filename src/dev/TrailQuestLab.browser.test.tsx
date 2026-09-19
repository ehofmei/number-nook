import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import { afterEach, describe, expect, it } from 'vitest';
import { formatProblem, generateSession } from '../domain/math';
import { SeededRandom } from '../domain/random';
import { createRandomTrailRun, MEADOW_LEVEL } from '../trail/trails';
import '../styles.css';
import { TRAIL_QUEST_LAB_SEED, TrailQuestLab } from './TrailQuestLab';

const TRAIL_QUEST_LAB_TRAIL = createRandomTrailRun(new SeededRandom(TRAIL_QUEST_LAB_SEED), [
  MEADOW_LEVEL,
]);

function labProblems() {
  return generateSession(
    {
      mode: 'quick',
      operations: ['addition', 'subtraction'],
      difficulty: 'medium',
      questionCount: 50,
    },
    new SeededRandom(TRAIL_QUEST_LAB_SEED),
  );
}

describe('TrailQuestLab in a real browser', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('uses real answer controls and advances the traveler after a correct answer', async () => {
    const [first] = labProblems();
    const [firstItem, secondItem] = TRAIL_QUEST_LAB_TRAIL.items;
    await render(<TrailQuestLab />);

    await expect
      .element(page.getByRole('heading', { name: 'Trail Quest Overlay Lab' }))
      .toBeVisible();
    await expect.element(page.getByText('0 of 10 stops cleared')).toBeVisible();
    await expect.element(page.getByLabelText('Answer markers').getByRole('button')).toHaveLength(4);
    await expect.element(page.getByLabelText('Sunny is at trail stop 1 of 11')).toBeVisible();
    const collectible = page.getByTestId('trail-collectible');
    await expect.element(collectible).toBeVisible();
    await expect.element(collectible).toHaveAttribute('alt', '');
    await expect.element(collectible).toHaveAttribute('aria-hidden', 'true');
    await expect
      .element(page.getByText(`Next trail treasure: ${firstItem!.name}.`))
      .toBeInTheDocument();

    await page.getByRole('button', { name: `Answer ${first!.correctAnswer}` }).click();
    await expect
      .element(page.getByText(`Correct! Sunny collected the ${firstItem!.name}.`))
      .toBeVisible();
    await expect.element(page.getByLabelText('1 trail treasures')).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: `Answer ${first!.correctAnswer}` }))
      .toBeDisabled();

    await new Promise((resolve) => window.setTimeout(resolve, 850));
    await expect.element(page.getByText('1 of 10 stops cleared')).toBeVisible();
    await expect.element(page.getByLabelText('Sunny is at trail stop 2 of 11')).toBeVisible();
    await expect.element(page.getByTestId('trail-collectible')).toBeVisible();
    await expect
      .element(page.getByText(`Next trail treasure: ${secondItem!.name}.`))
      .toBeInTheDocument();
  });

  it('shows a gentle correction, serves a fresh problem, and does not move on a mistake', async () => {
    const [first, second] = labProblems();
    const wrong = first!.choices.find((choice) => choice !== first!.correctAnswer)!;
    await render(<TrailQuestLab />);

    await page.getByRole('button', { name: `Answer ${wrong}` }).click();
    await expect.element(page.getByText(/That was a small detour/)).toBeVisible();
    await expect.element(page.getByLabelText('0 trail treasures')).toBeVisible();

    await new Promise((resolve) => window.setTimeout(resolve, 850));
    await expect.element(page.getByLabelText('Sunny is at trail stop 1 of 11')).toBeVisible();
    await expect.element(page.getByText('0 of 10 stops cleared')).toBeVisible();
    await expect
      .element(page.getByRole('heading', { name: `${formatProblem(second!)} = ?` }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: `Answer ${second!.correctAnswer}` }))
      .toBeEnabled();

    await page.getByRole('button', { name: 'Restart trail' }).click();
    await expect.element(page.getByText('0 of 10 stops cleared')).toBeVisible();
    await expect.element(page.getByText('Choose a trail marker to begin.')).toBeVisible();
    await expect.element(page.getByLabelText('Sunny is at trail stop 1 of 11')).toBeVisible();
  });
});
