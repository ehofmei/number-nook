import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { SaveData } from '../../src/storage/save';

async function onboard(page: Page) {
  await page.getByLabel('What should we call you?').fill('Ada');
  await page.getByRole('button', { name: 'Moonbeam', exact: true }).click();
  await page.getByRole('button', { name: 'Start with Moonbeam' }).click();
  await expect(page.getByRole('heading', { name: "Ada's Number Nook" })).toBeVisible();
}

function solveEquation(text: string): number {
  const operands = text.match(/(-?\d+)\s*([+−×÷])\s*(-?\d+)/);
  if (!operands) throw new Error(`Could not parse equation: ${text}`);
  const left = Number(operands[1]);
  const right = Number(operands[3]);
  switch (operands[2]) {
    case '+':
      return left + right;
    case '−':
      return left - right;
    case '×':
      return left * right;
    case '÷':
      return left / right;
    default:
      throw new Error(`Unknown operator: ${operands[2]}`);
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    let nextSeed = 20_260_820;
    const browserGetRandomValues = crypto.getRandomValues.bind(crypto);
    Object.defineProperty(crypto, 'getRandomValues', {
      configurable: true,
      value: <T extends Exclude<BufferSource, ArrayBuffer>>(values: T): T => {
        if (values instanceof Uint32Array && values.length === 1) {
          values[0] = nextSeed;
          nextSeed += 1;
          return values;
        }
        return browserGetRandomValues(values);
      },
    });
  });
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('a first companion must be chosen deliberately before entering the Nook', async ({ page }) => {
  const sunny = page.getByRole('button', { name: 'Sunny', exact: true });
  const moonbeam = page.getByRole('button', { name: 'Moonbeam', exact: true });
  const pepper = page.getByRole('button', { name: 'Pepper', exact: true });
  const continueButton = page.getByRole('button', { name: 'Choose a companion to continue' });

  await expect(sunny).toHaveAttribute('aria-pressed', 'false');
  await expect(moonbeam).toHaveAttribute('aria-pressed', 'false');
  await expect(pepper).toHaveAttribute('aria-pressed', 'false');
  await expect(continueButton).toBeDisabled();

  await page.getByLabel('What should we call you?').fill('Ada');
  await expect(continueButton).toBeDisabled();
  await moonbeam.click();
  await expect(moonbeam).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Moonbeam is ready to join you!')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start with Moonbeam' })).toBeEnabled();
});

test('Practice retries, hints, recap, rewards, review, and remembered mode', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Change game' }).click();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: 'Quick Game', exact: true }).click();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.locator('.timer-pill')).toHaveCount(0);
  let firstAnswer = 0;
  for (let index = 0; index < 10; index++) {
    await expect(page.locator('.game-progress')).toHaveAttribute(
      'aria-label',
      `Question ${index + 1} of 10`,
    );
    const correct = solveEquation((await page.locator('#equation').textContent()) ?? '');
    const correctButton = page.getByRole('button', { name: `Answer ${correct}`, exact: true });
    if (index === 0 || index === 1) {
      if (index === 0) firstAnswer = correct;
      const wrong = page.locator('.answer-card').filter({ hasNotText: /^$/ });
      const choices = await wrong.evaluateAll((buttons) =>
        buttons.map((button) => Number(button.getAttribute('aria-label')?.replace('Answer ', ''))),
      );
      const misses = choices.filter((choice) => choice !== correct);
      await page.getByRole('button', { name: `Answer ${misses[0]}`, exact: true }).click();
      await expect(correctButton).not.toHaveClass(/answer-card--correct/);
      await expect(correctButton).toBeEnabled();
      await expect(
        page.getByRole('button', { name: `Answer ${misses[0]}`, exact: true }),
      ).toBeDisabled();
      if (index === 0) await page.getByRole('button', { name: 'Show a hint' }).click();
      else await page.getByRole('button', { name: `Answer ${misses[1]}`, exact: true }).click();
      await expect(page.locator('.practice-hint')).toBeVisible();
      await expect(correctButton).toBeEnabled();
    }
    await correctButton.click();
  }
  await expect(page.getByText('Practice recap · 2 left')).toBeVisible();
  await expect(page.locator('.feedback-ribbon')).toHaveCount(0);
  await page.getByRole('button', { name: `Answer ${firstAnswer}`, exact: true }).click();
  await expect(page.getByText('Practice recap · 1 left')).toBeVisible();
  const recapAnswer = solveEquation((await page.locator('#equation').textContent()) ?? '');
  await page.getByRole('button', { name: `Answer ${recapAnswer}`, exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'A little wiser, a little brighter!' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Game results' })).toContainText('80%');
  await expect(page.getByRole('region', { name: 'Game results' })).toContainText('800');
  await expect(page.getByText('How you earned 25 Paw Coins')).toBeVisible();
  await page.getByRole('button', { name: 'Review questions' }).click();
  await expect(page.getByText('Attempts', { exact: true })).toHaveCount(2);
  await expect(page.getByText('Recap', { exact: true })).toHaveCount(2);
  const record = await page.evaluate(
    () => JSON.parse(localStorage.getItem('first-math-game:save') ?? '{}') as SaveData,
  );
  expect(record.sessions[0]?.answers).toHaveLength(10);
  expect(record.sessions[0]?.answers[0]?.practice?.recapAttempts).toEqual([firstAnswer]);
  expect(record.sessions[0]?.answers[1]?.practice?.attempts).toHaveLength(3);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ready to practice?' })).toBeVisible();
  await page.getByRole('button', { name: 'Change game' }).click();
  await expect(page.getByRole('button', { name: 'Practice', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Reset defaults' }).click();
  await expect(page.getByRole('button', { name: 'Quick Game', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('exiting Practice during wrong-answer feedback cancels the pending transition', async ({
  page,
}) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Change game' }).click();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  const correct = solveEquation((await page.locator('#equation').textContent()) ?? '');
  await page
    .locator('.answer-card')
    .filter({ hasNot: page.locator(`span:text-is("${correct}")`) })
    .first()
    .click();
  await page.getByRole('button', { name: 'Exit game' }).click();
  await expect(page.getByRole('heading', { name: "Ada's Number Nook" })).toBeVisible();
  await page.getByRole('button', { name: 'Start first round' }).click();
  await expect(page.getByText('Take your time. There is no race here.')).toBeVisible();
  await expect(page.locator('.answer-card:disabled')).toHaveCount(0);
});

test('first launch, game, capsule, gallery, equip, and reload', async ({ page }) => {
  await onboard(page);
  await expect(page.locator('html')).toHaveAttribute('data-companion-theme', 'cozy-cats:moonbeam');
  await page.evaluate(() => {
    const key = 'first-math-game:save';
    const save = JSON.parse(localStorage.getItem(key) ?? '{}') as { coins: number };
    save.coins = 60;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Change game' }).click();
  await expect(page.locator('.player-companion-dialogue--setup')).toBeVisible();
  await page.getByRole('button', { name: '× Multiplication' }).click();
  await page.getByRole('button', { name: '÷ Division' }).click();
  await page.getByRole('button', { name: 'Easy' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.locator('.game-progress__label img')).toBeVisible();

  const operators = new Set<string>();
  for (let index = 0; index < 10; index += 1) {
    const equation = page.locator('#equation');
    const text = (await equation.textContent()) ?? '';
    const operator = text.match(/[+−×÷]/)?.[0];
    if (operator) operators.add(operator);
    const answer = solveEquation(text);
    await page.getByRole('button', { name: `Answer ${answer}`, exact: true }).click();
    if (index < 9) await expect(equation).not.toHaveText(text);
  }
  expect(operators).toEqual(new Set(['+', '−', '×', '÷']));

  await expect(
    page.getByRole('heading', { name: /First score|personal best|practice round/i }),
  ).toBeVisible();
  await expect(page.getByText('100%')).toBeVisible();
  const rewardBreakdown = page.getByText('How you earned 30 Paw Coins');
  await expect(rewardBreakdown).toBeVisible();
  await rewardBreakdown.click();
  await expect(page.locator('.coin-breakdown')).toContainText('Perfect round bonus');
  await expect(page.locator('.coin-breakdown')).toContainText('First practice today');
  await expect(page.locator('.player-companion-dialogue--results')).toBeVisible();
  await expect(page.locator('.player-companion-dialogue--results')).toHaveAttribute(
    'data-dialogue-id',
    /results-first-round-/,
  );
  const coinTally = page.locator('.coin-tally');
  const awardedCoins = await page.evaluate<number>(() => {
    const save = JSON.parse(localStorage.getItem('first-math-game:save') ?? '{}') as {
      sessions: { coinsEarned: number }[];
    };
    return save.sessions.at(-1)?.coinsEarned ?? 0;
  });
  const awardedCoinText = `+${awardedCoins}`;
  await expect(coinTally).toHaveText(awardedCoinText);
  await page.getByRole('button', { name: 'Review questions' }).click();
  await expect(page.getByRole('heading', { name: 'Review your questions' })).toBeVisible();
  await expect(page.locator('.review-card')).toHaveCount(10);
  await page.getByRole('button', { name: 'Back', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Review questions' })).toBeVisible();
  await expect(coinTally).toHaveText(awardedCoinText);
  await page.waitForTimeout(800);
  await expect(coinTally).toHaveText(awardedCoinText);
  await page.getByRole('button', { name: 'Open a capsule' }).click();
  await expect(page.locator('.player-companion-dialogue--capsule')).toHaveAttribute(
    'data-dialogue-context',
    'capsule',
  );
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(coinTally).toHaveText(awardedCoinText);
  await page.waitForTimeout(800);
  await expect(coinTally).toHaveText(awardedCoinText);
  await page.getByRole('button', { name: 'Open a capsule' }).click();
  await page.getByRole('button', { name: 'Open free capsule' }).click();
  await expect(page.getByRole('heading', { name: 'Opening your Welcome Capsule…' })).toBeVisible();
  await expect(page.locator('.player-companion-dialogue--capsule')).toBeHidden();
  await expect(page.getByRole('heading', { name: /You found/ })).toBeVisible();
  const foundName = ((await page.getByRole('heading', { name: /You found/ }).textContent()) ?? '')
    .replace('You found ', '')
    .replace('!', '');
  await page.getByRole('button', { name: `Equip ${foundName}` }).click();
  await expect(page.getByRole('status')).toContainText('Equipped');
  await page.getByRole('button', { name: 'View collection' }).click();
  await expect(page.getByRole('heading', { name: 'Companion Collection' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'The Nook Neighbors' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Special Guests' })).toBeVisible();
  await expect(page.getByRole('button', { name: `${foundName}, equipped` })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const equippedId = await page.evaluate<string>(() => {
    const save = JSON.parse(localStorage.getItem('first-math-game:save') ?? '{}') as {
      equippedCollectibleId: string;
    };
    return save.equippedCollectibleId;
  });
  await expect(page.locator('html')).toHaveAttribute('data-companion-theme', equippedId);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.locator('.home-companion')).toContainText(foundName);
  const companionShortcut = page.getByRole('button', {
    name: `View ${foundName} in your collection`,
  });
  await expect(companionShortcut).toBeVisible();
  await companionShortcut.click();
  await expect(page.getByRole('heading', { name: 'Companion Collection' })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.reload();
  await expect(page.locator('.home-companion')).toContainText(foundName);
});

test('the Capsule Shelf opens a selected collection and records the transaction', async ({
  page,
}) => {
  await onboard(page);
  await page.evaluate(() => {
    const key = 'first-math-game:save';
    const save = JSON.parse(localStorage.getItem(key) ?? '{}') as { coins: number };
    save.coins = 140;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Capsule Shelf' }).click();

  await expect(page.getByRole('heading', { name: 'Surprise Capsule' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nookside Pups' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lantern Lane Cats' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Special Guests' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open Nookside Pups Capsule' }).click();
  await expect(
    page.getByRole('heading', { name: 'Opening your Nookside Pups Capsule…' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /You found/ })).toBeVisible();

  const transaction = await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('first-math-game:save') ?? '{}') as {
      coins: number;
      ownedCollectibleIds: string[];
      economyEvents: Array<{
        capsuleKind: string;
        collectionId: string | null;
        coinsSpent: number;
        eligiblePoolSize: number;
      }>;
    };
    return {
      coins: save.coins,
      newestId: save.ownedCollectibleIds.at(-1),
      event: save.economyEvents.at(-1),
    };
  });
  expect(transaction).toMatchObject({
    coins: 60,
    newestId: expect.stringMatching(/^nookside-pups:/),
    event: {
      capsuleKind: 'collection',
      collectionId: 'nookside-pups',
      coinsSpent: 80,
      eligiblePoolSize: 10,
    },
  });
});

test('companion dialogue remains stable through unrelated rerenders', async ({ page }) => {
  await onboard(page);

  const homeDialogue = page.locator('.player-companion-dialogue--home');
  await expect(homeDialogue).toBeVisible();
  const homePhraseId = await homeDialogue.getAttribute('data-dialogue-id');
  const homeText = await homeDialogue.locator('p').textContent();

  await page.getByRole('button', { name: 'Mute sound effects' }).click();
  await expect(homeDialogue).toHaveAttribute('data-dialogue-id', homePhraseId ?? '');
  await expect(homeDialogue.locator('p')).toHaveText(homeText ?? '');

  await page.getByRole('button', { name: 'Change game' }).click();
  const setupDialogue = page.locator('.player-companion-dialogue--setup');
  await expect(setupDialogue).toBeVisible();
  const setupPhraseId = await setupDialogue.getAttribute('data-dialogue-id');
  const setupText = await setupDialogue.locator('p').textContent();

  await page.getByRole('button', { name: '× Multiplication' }).click();
  await page.getByRole('button', { name: 'Hard' }).click();
  await expect(setupDialogue).toHaveAttribute('data-dialogue-id', setupPhraseId ?? '');
  await expect(setupDialogue.locator('p')).toHaveText(setupText ?? '');
});

test('game settings and home capsule access remain available after reload', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Capsule Shelf' }).click();
  await expect(page.getByRole('heading', { name: 'Capsule Shelf' })).toBeVisible();
  const unavailableCapsule = page.getByRole('button', { name: 'Need 60 more coins' });
  await expect(unavailableCapsule).toBeDisabled();
  await expect(page.getByRole('button', { name: /Add \d+ Paw Coins/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Back', exact: true }).click();

  await page.getByRole('button', { name: 'Change game' }).click();
  await page.getByRole('button', { name: '+ Addition' }).click();
  await page.getByRole('button', { name: '× Multiplication' }).click();
  await page.getByRole('button', { name: 'Hard' }).click();
  await page.getByRole('button', { name: '20' }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByText('Hard · − × · 20 questions')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Hard · − × · 20 questions')).toBeVisible();
});

test('the complete collection shares one remembered art-style preference', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: /^Collection/ }).click();

  await expect.poll(() => page.evaluate<number>('window.scrollY')).toBe(0);
  await expect(page.locator('.collection-grid .collectible-card')).toHaveCount(51);
  await expect(page.getByRole('button', { name: 'Polished Sticker' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('region', { name: 'Equipped companion' })).toContainText('Moonbeam');
  await expect(page.getByRole('progressbar', { name: '1 of 51 companions found' })).toHaveAttribute(
    'aria-valuenow',
    '1',
  );
  await expect(page.getByRole('button', { name: 'The Nook Neighbors 1/10' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nookside Pups 0/10' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lantern Lane Cats 0/10' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Moonbeam' }).locator('img')).toHaveAttribute(
    'src',
    /moonbeam-sticker\.webp$/,
  );
  const buttonBunnyPortrait = page
    .locator('.collection-grid .collectible-card')
    .last()
    .locator('img');
  await expect(buttonBunnyPortrait).toHaveAttribute('src', /button-bunny-sticker\.webp$/);
  const poppyPortrait = page.locator('.collection-grid .collectible-card').nth(10).locator('img');
  await expect(poppyPortrait).toHaveAttribute('src', /poppy-sticker\.webp$/);
  const crumpetPortrait = page.locator('.collection-grid .collectible-card').nth(20).locator('img');
  await expect(crumpetPortrait).toHaveAttribute('src', /crumpet-sticker\.webp$/);

  await page.getByRole('button', { name: 'Simple SVG' }).click();
  await expect(page.getByRole('button', { name: 'Moonbeam' }).locator('img')).toHaveAttribute(
    'src',
    /moonbeam\.svg$/,
  );
  await expect(buttonBunnyPortrait).toHaveAttribute('src', /button-bunny\.svg$/);
  await expect(poppyPortrait).toHaveAttribute('src', /poppy\.svg$/);
  await expect(crumpetPortrait).toHaveAttribute('src', /crumpet\.svg$/);
  await page.reload();
  await page.getByRole('button', { name: /^Collection/ }).click();
  await expect(page.getByRole('button', { name: 'Simple SVG' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('sound and music preferences persist independently and recover from zero volume', async ({
  page,
}) => {
  await onboard(page);

  await page.getByRole('button', { name: 'Mute sound effects' }).click();
  await expect(page.getByRole('button', { name: 'Turn on sound effects' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Turn on sound effects' })).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem(
      'first-math-game:audio-preferences',
      JSON.stringify({ effectsEnabled: true, effectsVolume: 0 }),
    );
  });
  await page.reload();
  await page.getByRole('button', { name: 'Turn on sound effects' }).click();
  await expect(page.getByRole('button', { name: 'Mute sound effects' })).toBeVisible();
  const serialized = await page.evaluate(
    () => localStorage.getItem('first-math-game:audio-preferences') ?? '{}',
  );
  expect(JSON.parse(serialized) as unknown).toEqual({
    effectsEnabled: true,
    effectsVolume: 0.4,
    musicEnabled: false,
    musicVolume: 0.18,
    musicTrackId: 'cozy-electric-piano-theme',
    musicCatalogVersion: 2,
  });

  await page.getByRole('button', { name: 'Turn on background music' }).click();
  await expect(page.getByRole('button', { name: 'Mute background music' })).toBeVisible();
  await page.getByRole('button', { name: 'Start first round' }).click();
  await expect(page.getByRole('button', { name: 'Mute background music' })).toBeHidden();
  await page.getByRole('button', { name: 'Exit game' }).click();
  await expect(page.getByRole('button', { name: 'Mute background music' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Mute background music' })).toBeVisible();
});

test('audio settings persist volumes and soundtrack selection, then reset cleanly', async ({
  page,
}) => {
  await onboard(page);
  await page.getByRole('button', { name: /^Settings/ }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.locator('.settings-track')).toHaveCount(5);
  await expect(page.getByRole('button', { name: /Solo Nook Piano/ })).toHaveCount(0);

  await page.getByRole('slider', { name: 'Effects volume' }).fill('0.65');
  await page.getByRole('checkbox', { name: 'Background music off' }).click();
  await page.getByRole('slider', { name: 'Music volume' }).fill('0.3');
  await page.getByRole('button', { name: /Moonlit Window/ }).click();
  await expect(page.getByRole('button', { name: /Moonlit Window/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.reload();
  await page.getByRole('button', { name: /^Settings/ }).click();
  await expect(page.getByRole('slider', { name: 'Effects volume' })).toHaveValue('0.65');
  await expect(page.getByRole('slider', { name: 'Music volume' })).toHaveValue('0.3');
  await expect(page.getByRole('button', { name: /Moonlit Window/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Reset audio defaults' }).click();
  await expect(page.getByRole('slider', { name: 'Effects volume' })).toHaveValue('0.4');
  await expect(page.getByRole('slider', { name: 'Music volume' })).toHaveValue('0.18');
  await expect(page.getByRole('checkbox', { name: 'Background music off' })).not.toBeChecked();
  await expect(page.getByRole('button', { name: /Cozy Electric Piano/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('focus moves away from the selected answer when the next question appears', async ({
  page,
}) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Start first round' }).click();

  const equation = page.locator('#equation');
  const firstEquation = (await equation.textContent()) ?? '';
  await page.locator('.answer-card').nth(3).click();
  await expect(equation).not.toHaveText(firstEquation);

  await expect(equation).toBeFocused();
  await expect(equation).toHaveCSS('outline-style', 'none');
  await expect(page.locator('.answer-card').nth(3)).not.toBeFocused();
});

test('a stationary pointer does not highlight the next answer after keyboard play', async ({
  page,
}, testInfo) => {
  test.skip(
    ['phone', 'tablet'].includes(testInfo.project.name),
    'Stationary fine-pointer hover is a desktop-only interaction.',
  );
  await onboard(page);
  await page.getByRole('button', { name: 'Start first round' }).click();

  const equation = page.locator('#equation');
  const firstEquation = (await equation.textContent()) ?? '';
  const fourthAnswer = page.locator('.answer-card').nth(3);

  await fourthAnswer.hover();
  await expect(page.locator('.answer-grid')).toHaveAttribute('data-hover-ready', 'true');
  await expect(fourthAnswer).toHaveCSS('border-color', 'rgb(173, 155, 248)');

  await page.keyboard.press('4');
  await expect(equation).not.toHaveText(firstEquation);
  await expect(page.locator('.answer-grid')).toHaveAttribute('data-hover-ready', 'false');
  await expect(page.locator('.answer-card').nth(3)).toHaveCSS('border-color', 'rgb(232, 223, 214)');

  await page.mouse.move(0, 0);
  await page.locator('.answer-card').nth(3).hover();
  await expect(page.locator('.answer-grid')).toHaveAttribute('data-hover-ready', 'true');
  await expect(page.locator('.answer-card').nth(3)).toHaveCSS('border-color', 'rgb(173, 155, 248)');
});

test('history copies a name-free, versioned analysis export', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Clipboard export is covered once in Chromium.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await onboard(page);
  await page.getByRole('button', { name: 'Start first round' }).click();

  for (let index = 0; index < 10; index += 1) {
    const equation = page.locator('#equation');
    const text = (await equation.textContent()) ?? '';
    await page.getByRole('button', { name: `Answer ${solveEquation(text)}`, exact: true }).click();
    if (index < 9) await expect(equation).not.toHaveText(text);
  }

  await page.getByRole('button', { name: 'Back home' }).click();
  await page.getByRole('button', { name: 'Your progress' }).click();
  await expect(page.getByRole('heading', { name: 'Play History' })).toBeVisible();
  await expect(page.locator('.player-companion-dialogue--progress')).toHaveAttribute(
    'data-dialogue-context',
    'progress',
  );
  await expect(page.getByText('Ruleset 8').first()).toBeVisible();
  await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
  await expect.poll(() => page.evaluate<number>('window.scrollY')).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Review round' }).click();
  await expect(page.getByRole('heading', { name: 'Review your questions' })).toBeVisible();
  await expect.poll(() => page.evaluate<number>('window.scrollY')).toBe(0);
  await page.getByRole('button', { name: 'Back', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Play History' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy analysis data' }).click();
  await expect(page.getByText('Copied! You can paste it into the chat.')).toBeVisible();

  const clipboard = await page.evaluate<string>('navigator.clipboard.readText()');
  const analysis = JSON.parse(clipboard) as {
    format: string;
    exportVersion: number;
    privacy: { playerNameIncluded: boolean };
    sessions: unknown[];
  };
  expect(analysis).toMatchObject({
    format: 'number-nook-play-history',
    exportVersion: 5,
    privacy: { playerNameIncluded: false },
  });
  expect(analysis.sessions).toHaveLength(1);
  expect(clipboard).not.toContain('Ada');

  await page.getByRole('button', { name: 'Clear play history' }).click();
  await page.getByRole('button', { name: 'Confirm clear history' }).click();
  await expect(page.locator('.history-overview article').first()).toContainText('0');
  await expect(
    page.getByText('Complete a round and its balance data will appear here.'),
  ).toBeVisible();
});

test('history keeps large setup collections compact until expanded', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'The setup preview behavior is covered once in Chromium.');
  await onboard(page);
  await page.evaluate(() => {
    const key = 'first-math-game:save';
    const save = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      sessions: unknown[];
    };
    const settings = [
      { operations: ['addition'], difficulty: 'easy', questionCount: 10 },
      { operations: ['subtraction'], difficulty: 'easy', questionCount: 10 },
      { operations: ['multiplication'], difficulty: 'easy', questionCount: 10 },
      { operations: ['division'], difficulty: 'easy', questionCount: 10 },
      { operations: ['addition'], difficulty: 'medium', questionCount: 10 },
      { operations: ['addition'], difficulty: 'hard', questionCount: 10 },
      { operations: ['addition'], difficulty: 'advanced', questionCount: 10 },
      { operations: ['addition', 'subtraction'], difficulty: 'medium', questionCount: 10 },
    ];
    save.sessions = settings.map((gameSettings, index) => ({
      id: `setup-preview-${index}`,
      completedAt: new Date(Date.UTC(2026, 7, index + 1)).toISOString(),
      settings: gameSettings,
      seed: index + 1,
      rulesetVersion: 8,
      correctCount: 1,
      accuracy: 1,
      elapsedMs: 1_000,
      score: 1_000,
      coinsPotential: 1,
      coinsEarned: 1,
      coinBreakdown: {
        correctAnswerCoins: 1,
        difficultyMultiplier: 1,
        difficultyAdjustedCoins: 1,
        difficultyBonusCoins: 0,
        accuracyBonusCoins: 0,
        perfectBonusCoins: 0,
        total: 1,
      },
      dailyBonusCoins: 0,
      weeklyBonusCoins: 0,
      dailyMilestoneReached: false,
      answers: [
        {
          problemId: `setup-preview-question-${index}`,
          skillKey: 'addition:1:1',
          operation: 'addition',
          left: 1,
          right: 1,
          choices: [2, 1, 3, 4],
          correctChoiceIndex: 0,
          selectedAnswer: 2,
          correctAnswer: 2,
          correct: true,
          responseMs: 1_000,
        },
      ],
    }));
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Your progress' }).click();

  await expect(page.locator('.session-history-card')).toHaveCount(5);
  await page.getByRole('button', { name: 'Show all 8 rounds' }).click();
  await expect(page.locator('.session-history-card')).toHaveCount(8);
  await page.getByRole('button', { name: 'Show fewer rounds' }).click();
  await expect(page.locator('.session-history-card')).toHaveCount(5);
  await expect(page.locator('.configuration-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Show all 8 setups' }).click();
  await expect(page.locator('.configuration-card')).toHaveCount(8);
  await page.getByRole('button', { name: 'Show fewer setups' }).click();
  await expect(page.locator('.configuration-card')).toHaveCount(6);
});

test('complete backup downloads and safely replaces existing progress', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Download behavior is covered once in Chromium.');
  await onboard(page);
  await page.evaluate(() => {
    const key = 'first-math-game:save';
    const save = JSON.parse(localStorage.getItem(key) ?? '{}') as { coins: number };
    save.coins = 42;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Backup & restore' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save backup file' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^number-nook-save-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();

  await page.evaluate(() => {
    const key = 'first-math-game:save';
    const save = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      player: { name: string };
      coins: number;
    };
    save.player.name = 'Bea';
    save.coins = 7;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Backup & restore' }).click();

  await page.getByLabel('Choose backup file').setInputFiles({
    name: 'not-a-save.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{}'),
  });
  await expect(page.getByRole('alert')).toContainText('not a valid Number Nook backup');

  await page.getByLabel('Choose backup file').setInputFiles(backupPath);
  const preview = page.getByRole('region', { name: 'Backup preview' });
  await expect(preview).toContainText('Ada');
  await expect(preview).toContainText('42');
  expect(
    await page.evaluate(() => {
      const save = JSON.parse(localStorage.getItem('first-math-game:save') ?? '{}') as {
        player: { name: string };
      };
      return save.player.name;
    }),
  ).toBe('Bea');

  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await expect(page.getByRole('status')).toHaveText('Backup restored successfully.');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { name: "Ada's Number Nook" })).toBeVisible();
  await expect(page.getByLabel('42 Paw Coins')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: "Ada's Number Nook" })).toBeVisible();
});

test('a backup can be restored on a device before onboarding', async ({ page }) => {
  await onboard(page);
  const backup = await page.evaluate<string>('localStorage.getItem("first-math-game:save") ?? ""');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Restore a backup' }).click();
  await expect(page.getByRole('heading', { name: 'Backup & restore' })).toBeVisible();
  await page.getByLabel('Choose backup file').setInputFiles({
    name: 'number-nook-save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backup),
  });
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { name: "Ada's Number Nook" })).toBeVisible();
});

test('onboarding and primary menu screens have no detectable accessibility violations', async ({
  page,
}) => {
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await onboard(page);
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.getByRole('button', { name: 'Your progress' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Back', exact: true }).click();

  await page.getByRole('button', { name: 'Backup & restore' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Back', exact: true }).click();

  await page.getByRole('button', { name: /^Settings/ }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Back', exact: true }).click();

  await page.getByRole('button', { name: 'Capsule Shelf' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Back', exact: true }).click();

  await page.getByRole('button', { name: 'Change game' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('@visual onboarding phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'This baseline targets the phone viewport.');
  await expect(page).toHaveScreenshot('onboarding.png', { fullPage: true });
});

test('@visual onboarding selected starter phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'This baseline targets the phone viewport.');
  await page.getByLabel('What should we call you?').fill('Ada');
  await page.getByRole('button', { name: 'Moonbeam', exact: true }).click();
  await expect(page).toHaveScreenshot('onboarding-ready.png', { fullPage: true });
});

test('@visual setup phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'This baseline targets the phone viewport.');
  await onboard(page);
  await page.getByRole('button', { name: 'Change game' }).click();
  await expect(page).toHaveScreenshot('setup.png', { fullPage: true });
});

test('@visual Practice hint phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'This baseline targets the phone viewport.');
  await onboard(page);
  await page.getByRole('button', { name: 'Change game' }).click();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  const correct = solveEquation((await page.locator('#equation').textContent()) ?? '');
  const choices = await page
    .locator('.answer-card')
    .evaluateAll((buttons) =>
      buttons.map((button) => Number(button.getAttribute('aria-label')?.replace('Answer ', ''))),
    );
  const wrong = choices.find((choice) => choice !== correct);
  if (wrong === undefined) throw new Error('Practice visual needs one incorrect choice.');
  await page.getByRole('button', { name: `Answer ${wrong}`, exact: true }).click();
  await page.getByRole('button', { name: 'Show a hint' }).click();
  const phoneLayout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    answerHeights: [...document.querySelectorAll<HTMLElement>('.answer-card')].map(
      (card) => card.getBoundingClientRect().height,
    ),
    hintWidth: document.querySelector<HTMLElement>('.practice-help')?.getBoundingClientRect().width,
  }));
  expect(phoneLayout.documentWidth).toBeLessThanOrEqual(phoneLayout.viewportWidth);
  expect(Math.min(...phoneLayout.answerHeights)).toBeGreaterThanOrEqual(44);
  expect(phoneLayout.hintWidth).toBeLessThanOrEqual(phoneLayout.viewportWidth);
  await expect(page).toHaveScreenshot('practice-hint.png', { fullPage: true });
});

test('@visual home responsive layout', async ({ page }, testInfo) => {
  test.skip(
    !['phone', 'tablet'].includes(testInfo.project.name),
    'This baseline targets phone and tablet viewports.',
  );
  await onboard(page);
  await expect(page).toHaveScreenshot('home.png', { fullPage: true, maxDiffPixels: 50 });
});

test('@visual settings phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'This baseline targets the phone viewport.');
  await onboard(page);
  await page.getByRole('button', { name: /^Settings/ }).click();
  await expect(page).toHaveScreenshot('settings.png', { fullPage: true });
});

test('@visual empty history phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'This baseline targets the phone viewport.');
  await onboard(page);
  await page.getByRole('button', { name: 'Your progress' }).click();
  await expect(page).toHaveScreenshot('history-empty.png', { fullPage: true });
});

test('@visual capsule companion phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'This baseline targets the phone viewport.');
  await onboard(page);
  await page.getByRole('button', { name: 'Capsule Shelf' }).click();
  await expect(page).toHaveScreenshot('capsule-companion.png', {
    fullPage: true,
    maxDiffPixels: 150,
  });
});

test('@visual equip confirmation phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'This baseline targets the phone viewport.');
  await onboard(page);
  await page.evaluate(() => {
    const key = 'first-math-game:save';
    const save = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      ownedCollectibleIds: string[];
    };
    save.ownedCollectibleIds.push('cozy-cats:sunny');
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole('button', { name: /^Collection/ }).click();
  await page.getByRole('button', { name: 'Sunny' }).click();
  await expect(page.locator('.collection-spotlight')).toHaveScreenshot('equip-confirmation.png', {
    maxDiffPixels: 150,
  });
});

test('@visual backup phone layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone', 'This baseline targets the phone viewport.');
  await onboard(page);
  await page.getByRole('button', { name: 'Backup & restore' }).click();
  await expect(page).toHaveScreenshot('backup.png', { fullPage: true });
});

test('@visual companion gallery responsive layout', async ({ page }, testInfo) => {
  test.skip(
    !['phone', 'tablet'].includes(testInfo.project.name),
    'This baseline targets phone and tablet viewports.',
  );
  await onboard(page);
  await page.getByRole('button', { name: /^Collection/ }).click();
  await expect(page).toHaveScreenshot('gallery.png');
});

test('@pwa production build works after the network goes offline', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Offline reload is covered once in Chromium.');
  await expect(page).toHaveTitle('Number Nook');
  const installMetadata = await page.evaluate(async () => {
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const appleTouchLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!manifestLink || !appleTouchLink) throw new Error('Install metadata links are missing.');
    const manifestResponse = await fetch(manifestLink.href);
    const manifest = (await manifestResponse.json()) as {
      name: string;
      short_name: string;
      theme_color: string;
      background_color: string;
      icons: { src: string; sizes: string; type: string; purpose?: string }[];
    };
    const readPng = async (src: string) => {
      const response = await fetch(new URL(src, manifestLink.href));
      const bitmap = await createImageBitmap(await response.blob());
      const result = { ok: response.ok, width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return result;
    };
    return {
      manifest,
      manifestPath: new URL(manifestLink.href).pathname,
      appleTouchPath: new URL(appleTouchLink.href).pathname,
      htmlMetadata: {
        themeColor: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content,
        applicationName: document.querySelector<HTMLMetaElement>('meta[name="application-name"]')
          ?.content,
        appleTitle: document.querySelector<HTMLMetaElement>(
          'meta[name="apple-mobile-web-app-title"]',
        )?.content,
      },
      pngs: await Promise.all(
        manifest.icons
          .filter(({ type }) => type === 'image/png')
          .map(async (icon) => ({ ...icon, ...(await readPng(icon.src)) })),
      ),
      appleTouch: await readPng(appleTouchLink.href),
    };
  });
  expect(installMetadata.manifest).toMatchObject({
    name: 'Number Nook',
    short_name: 'Number Nook',
    theme_color: '#5433ed',
    background_color: '#fff8ee',
  });
  expect(installMetadata.manifestPath).toBe('/number-nook/manifest.webmanifest');
  expect(installMetadata.appleTouchPath).toBe('/number-nook/apple-touch-icon.png');
  expect(installMetadata.htmlMetadata).toEqual({
    themeColor: '#5433ed',
    applicationName: 'Number Nook',
    appleTitle: 'Number Nook',
  });
  expect(installMetadata.pngs).toEqual([
    expect.objectContaining({
      sizes: '192x192',
      purpose: 'any',
      ok: true,
      width: 192,
      height: 192,
    }),
    expect.objectContaining({
      sizes: '512x512',
      purpose: 'any',
      ok: true,
      width: 512,
      height: 512,
    }),
    expect.objectContaining({
      sizes: '512x512',
      purpose: 'maskable',
      ok: true,
      width: 512,
      height: 512,
    }),
  ]);
  expect(installMetadata.appleTouch).toEqual({ ok: true, width: 180, height: 180 });

  await page.evaluate('navigator.serviceWorker.ready');
  const starterPortrait = page.getByRole('button', { name: 'Moonbeam' }).locator('img');
  await expect(starterPortrait).toHaveAttribute('src', /moonbeam-sticker\.webp$/);
  await expect
    .poll(() => starterPortrait.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBe(768);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome to Number Nook' })).toBeVisible();
  await expect
    .poll(() => starterPortrait.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBe(768);
});
