import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../styles.css';
import { AnimatedLevelProgress, LevelProgress } from './LevelProgress';

describe('LevelProgress in a real browser', () => {
  afterEach(async () => {
    await cleanup();
    vi.restoreAllMocks();
  });

  it('shows an accessible within-level value without exposing XP', async () => {
    await render(<LevelProgress lifetimeCoinsEarned={79} />);

    await expect.element(page.getByText('Level 2', { exact: true })).toBeVisible();
    await expect.element(page.getByText('53% to Level 3')).toBeVisible();
    await expect
      .element(page.getByRole('progressbar'))
      .toHaveAttribute('aria-label', 'Level 2, 53 percent progress to Level 3');
    await expect.element(page.getByText(/XP|experience/i)).not.toBeInTheDocument();
  });

  it('animates across multiple thresholds and announces only the final result', async () => {
    const onLevelUp = vi.fn();
    await render(
      <AnimatedLevelProgress
        previousLifetimeCoinsEarned={0}
        lifetimeCoinsEarned={120}
        animate
        startAnimation
        dailyMilestoneReached
        dailyCoinMilestone={100}
        onLevelUp={onLevelUp}
      />,
    );

    await expect
      .element(page.getByRole('status'))
      .toHaveTextContent("You climbed 2 levels! You're now Level 3.");
    await expect
      .element(page.getByRole('status'))
      .toHaveTextContent('Daily Paw Coin goal complete!');
    await expect
      .element(page.getByRole('progressbar'))
      .toHaveAttribute('aria-label', 'Level 3, 25 percent progress to Level 4');
    expect(onLevelUp).toHaveBeenCalledTimes(1);
  });

  it('presents Level 100 as a completed Nook Legend bar', async () => {
    await render(<LevelProgress lifetimeCoinsEarned={100_000} />);

    await expect.element(page.getByText('Level 100')).toBeVisible();
    await expect.element(page.getByText('Nook Legend')).toBeVisible();
    await expect
      .element(page.getByRole('progressbar'))
      .toHaveAttribute('aria-label', 'Level 100, maximum level');
  });

  it('skips staged movement while preserving the level-up under reduced motion', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => undefined,
          removeListener: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          dispatchEvent: () => true,
        }) as MediaQueryList,
    );
    const onLevelUp = vi.fn();
    await render(
      <AnimatedLevelProgress
        previousLifetimeCoinsEarned={49}
        lifetimeCoinsEarned={82}
        animate
        startAnimation
        dailyMilestoneReached={false}
        dailyCoinMilestone={100}
        onLevelUp={onLevelUp}
      />,
    );

    await expect
      .element(page.getByRole('progressbar'))
      .toHaveAttribute('aria-label', 'Level 2, 58 percent progress to Level 3');
    await expect
      .element(page.getByRole('status'))
      .toHaveTextContent('Level up! You reached Level 2.');
    expect(onLevelUp).toHaveBeenCalledTimes(1);
  });
});
