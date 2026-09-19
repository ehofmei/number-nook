import { useEffect, useRef, useState } from 'react';
import { levelProgress, levelsGained } from '../domain/leveling';

export function LevelProgress({
  lifetimeCoinsEarned,
  className = '',
}: {
  lifetimeCoinsEarned: number;
  className?: string;
}) {
  const progress = levelProgress(lifetimeCoinsEarned);
  const accessibleLabel = progress.isMaxLevel
    ? `Level ${progress.level}, maximum level`
    : `Level ${progress.level}, ${progress.percent} percent progress to Level ${progress.nextLevel}`;

  return (
    <div className={`level-progress ${className}`.trim()}>
      <div className="level-progress__labels">
        <strong>Level {progress.level}</strong>
        <span>
          {progress.isMaxLevel
            ? 'Nook Legend'
            : `${progress.percent}% to Level ${progress.nextLevel}`}
        </span>
      </div>
      <span
        className="level-progress__track"
        role="progressbar"
        aria-label={accessibleLabel}
        aria-valuemin={0}
        aria-valuemax={progress.coinsForLevel}
        aria-valuenow={progress.coinsIntoLevel}
        aria-valuetext={accessibleLabel}
      >
        <span style={{ width: `${progress.percent}%` }} />
      </span>
    </div>
  );
}

export function AnimatedLevelProgress({
  previousLifetimeCoinsEarned,
  lifetimeCoinsEarned,
  animate,
  startAnimation,
  dailyMilestoneReached,
  dailyCoinMilestone,
  onLevelUp,
}: {
  previousLifetimeCoinsEarned: number;
  lifetimeCoinsEarned: number;
  animate: boolean;
  startAnimation: boolean;
  dailyMilestoneReached: boolean;
  dailyCoinMilestone: number;
  onLevelUp: () => void;
}) {
  const [displayedTotal, setDisplayedTotal] = useState(
    animate ? previousLifetimeCoinsEarned : lifetimeCoinsEarned,
  );
  const [complete, setComplete] = useState(!animate);
  const presentedRef = useRef(!animate);
  const gained = levelsGained(previousLifetimeCoinsEarned, lifetimeCoinsEarned);
  const finalProgress = levelProgress(lifetimeCoinsEarned);

  useEffect(() => {
    if (!animate || !startAnimation || presentedRef.current) return;
    presentedRef.current = true;

    const finish = () => {
      setDisplayedTotal(lifetimeCoinsEarned);
      setComplete(true);
      if (gained > 0) onLevelUp();
    };

    if (
      lifetimeCoinsEarned <= previousLifetimeCoinsEarned ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      finish();
      return;
    }

    const duration = Math.min(1_800, 700 + gained * 350);
    let frame = 0;
    let startedAt: number | undefined;
    const step = (now: number) => {
      startedAt ??= now;
      const elapsed = now - startedAt;
      const position = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - position) ** 3;
      setDisplayedTotal(
        Math.floor(
          previousLifetimeCoinsEarned + (lifetimeCoinsEarned - previousLifetimeCoinsEarned) * eased,
        ),
      );
      if (position < 1) frame = window.requestAnimationFrame(step);
      else finish();
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [
    animate,
    gained,
    lifetimeCoinsEarned,
    onLevelUp,
    previousLifetimeCoinsEarned,
    startAnimation,
  ]);

  const levelAnnouncement =
    gained === 1
      ? `Level up! You reached Level ${finalProgress.level}.`
      : `You climbed ${gained} levels! You're now Level ${finalProgress.level}.`;

  return (
    <section className="result-level" aria-label="Level progress">
      <LevelProgress lifetimeCoinsEarned={displayedTotal} className="level-progress--results" />
      {complete && (gained > 0 || dailyMilestoneReached) && (
        <div
          className="progress-celebrations"
          role={animate ? 'status' : undefined}
          aria-live={animate ? 'polite' : undefined}
        >
          {gained > 0 && (
            <div className="progress-celebration progress-celebration--level">
              <span aria-hidden="true">★</span>
              <div>
                <strong>{levelAnnouncement}</strong>
                <p>Every round helps your Nook grow.</p>
              </div>
            </div>
          )}
          {dailyMilestoneReached && (
            <div className="progress-celebration progress-celebration--daily">
              <span aria-hidden="true">✦</span>
              <div>
                <strong>Daily Paw Coin goal complete!</strong>
                <p>
                  You reached {dailyCoinMilestone} today. Every correct answer still earns coins.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
