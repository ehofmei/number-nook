import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { getCollectibleImage } from '../content/catalog';
import type { ArtStyle, CollectibleDefinition } from '../content/schema';
import { formatProblem, OPERATION_SYMBOLS, type Problem } from '../domain/math';
import { TRAIL_QUEST_LENGTH, type TrailRunDefinition } from './trails';

interface TrailQuestPlayProps {
  problem: Problem;
  feedback: { selected: number; correct: boolean } | null;
  previous: { correct: boolean } | null;
  collectedCount: number;
  complete: boolean;
  companion: CollectibleDefinition;
  artStyle: ArtStyle;
  soundEnabled: boolean;
  trail: TrailRunDefinition;
  onAnswer: (answer: number) => void;
  onExit: () => void;
  onToggleAudio: () => void;
}

function answerState(
  choice: number,
  problem: Problem,
  feedback: TrailQuestPlayProps['feedback'],
): 'idle' | 'correct' | 'incorrect' | 'muted' {
  if (!feedback) return 'idle';
  if (choice === problem.correctAnswer) return 'correct';
  if (choice === feedback.selected) return 'incorrect';
  return 'muted';
}

export function TrailQuestPlay({
  problem,
  feedback,
  previous,
  collectedCount,
  complete,
  companion,
  artStyle,
  soundEnabled,
  trail,
  onAnswer,
  onExit,
  onToggleAudio,
}: TrailQuestPlayProps) {
  const equationRef = useRef<HTMLHeadingElement>(null);
  const [loadedCollectibles, setLoadedCollectibles] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const trailPosition = Math.min(collectedCount, trail.items.length);
  const currentPosition = trail.landscapeRoute[trailPosition] ?? trail.landscapeRoute.at(-1)!;
  const currentPortraitPosition = trail.portraitRoute[trailPosition] ?? trail.portraitRoute.at(-1)!;
  const nextPosition = trail.landscapeRoute[trailPosition + 1] ?? trail.landscapeRoute.at(-1)!;
  const nextPortraitPosition =
    trail.portraitRoute[trailPosition + 1] ?? trail.portraitRoute.at(-1)!;
  const portraitCollectibleSide = nextPortraitPosition[0] > 72 ? 'left' : 'right';
  const nextCollectible = trail.items[trailPosition];
  const collectedItems = trail.items.slice(0, collectedCount);

  const markCollectibleLoaded = useCallback((src: string) => {
    setLoadedCollectibles((current) => {
      if (current.has(src)) return current;
      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  useEffect(() => {
    equationRef.current?.focus({ preventScroll: true });
  }, [problem.id]);

  useEffect(() => {
    const sources = [
      trail.landscapeBoard,
      trail.portraitBoard,
      ...trail.itemPool.map(({ src }) => src),
    ];
    const preloaders = sources.map((src) => {
      const image = new Image();
      image.onload = () => markCollectibleLoaded(src);
      image.src = src;
      return image;
    });
    return () => preloaders.forEach((image) => (image.onload = null));
  }, [markCollectibleLoaded, trail]);

  const feedbackMessage = complete
    ? `${companion.name} reached the ${trail.destination}!`
    : feedback?.correct && nextCollectible
      ? `Correct! ${companion.name} collected the ${nextCollectible.name}.`
      : feedback
        ? `That was a small detour. ${formatProblem(problem)} = ${problem.correctAnswer}.`
        : previous?.correct
          ? 'Treasure collected! Choose the next trail marker.'
          : previous
            ? `${companion.name} stayed put. Try a fresh marker to clear this stop.`
            : 'Choose a trail marker to begin.';

  return (
    <main className="trail-lab trail-play page-shell">
      <header className="trail-lab__header trail-play__header">
        {!complete ? (
          <button className="icon-button" type="button" onClick={onExit} aria-label="Exit game">
            ×
          </button>
        ) : (
          <span className="trail-play__header-spacer" aria-hidden="true" />
        )}
        <div>
          <span className="eyebrow">Trail Quest · {trail.name}</span>
          <h1>{complete ? 'Trail complete!' : 'Find the next treasure'}</h1>
        </div>
        <button
          className="icon-button sound-toggle"
          type="button"
          onClick={onToggleAudio}
          aria-label={soundEnabled ? 'Mute sound effects' : 'Turn on sound effects'}
          title={soundEnabled ? 'Mute sound effects' : 'Turn on sound effects'}
        >
          <span aria-hidden="true">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>
      </header>

      <section className="trail-lab__status" aria-label="Trail status">
        <strong>
          {complete ? (
            'Trail complete'
          ) : (
            <>
              <span className="trail-lab__progress-long">
                {trailPosition} of {TRAIL_QUEST_LENGTH} stops cleared
              </span>
              <span className="trail-lab__progress-short">
                {trailPosition}/{TRAIL_QUEST_LENGTH} stops
              </span>
            </>
          )}
        </strong>
        <span className="trail-lab__score" aria-label={`${collectedCount} trail treasures`}>
          <span className="trail-lab__collection" aria-hidden="true">
            {collectedItems.slice(-5).map((item, index, visibleItems) => (
              <img
                key={item.name}
                className={index === visibleItems.length - 1 ? 'is-new' : ''}
                src={item.src}
                alt=""
              />
            ))}
          </span>
          <strong>
            {collectedCount}/{TRAIL_QUEST_LENGTH}
          </strong>
        </span>
      </section>

      {!complete && (
        <section className="trail-lab__equation" aria-labelledby="trail-equation">
          <span className="eyebrow">Which marker clears the trail?</span>
          <h2 id="trail-equation" ref={equationRef} tabIndex={-1}>
            <span>{problem.left}</span>
            <span>{OPERATION_SYMBOLS[problem.operation]}</span>
            <span>{problem.right}</span>
            <span>=</span>
            <span>?</span>
          </h2>
        </section>
      )}

      <section
        className={`trail-board${complete ? ' trail-board--complete' : ''}${feedback?.correct ? ' trail-board--correct' : ''}${feedback && !feedback.correct ? ' trail-board--incorrect' : ''}`}
        aria-label={`${companion.name} is at trail stop ${trailPosition + 1} of ${TRAIL_QUEST_LENGTH + 1}`}
      >
        <picture className="trail-board__picture" aria-hidden="true">
          <source media="(orientation: portrait)" srcSet={trail.portraitBoard} />
          <img src={trail.landscapeBoard} alt="" />
        </picture>

        {!complete && nextCollectible && (
          <>
            <span className="trail-board__collectible-description" aria-live="polite">
              Next trail treasure: {nextCollectible.name}.
            </span>
            <span
              key={`${trailPosition}-${nextCollectible.name}`}
              className={`trail-board__collectible-marker trail-board__collectible-marker--${portraitCollectibleSide}${feedback?.correct ? ' is-collecting' : ''}`}
              aria-hidden="true"
              data-testid="trail-collectible-target"
              style={
                {
                  '--trail-portrait-x': `${nextPortraitPosition[0]}%`,
                  '--trail-portrait-y': `${nextPortraitPosition[1]}%`,
                  '--trail-landscape-x': `${nextPosition[0]}%`,
                  '--trail-landscape-y': `${nextPosition[1]}%`,
                } as CSSProperties
              }
            >
              <img
                className={`trail-board__collectible${loadedCollectibles.has(nextCollectible.src) ? ' is-loaded' : ''}${feedback?.correct ? ' is-collecting' : ''}`}
                src={nextCollectible.src}
                alt=""
                aria-hidden="true"
                data-testid="trail-collectible"
                onLoad={() => markCollectibleLoaded(nextCollectible.src)}
              />
            </span>
          </>
        )}

        <img
          className="trail-board__traveler"
          src={`${import.meta.env.BASE_URL}${getCollectibleImage(companion, artStyle)}`}
          alt=""
          style={
            {
              '--trail-portrait-x': `${currentPortraitPosition[0]}%`,
              '--trail-portrait-y': `${currentPortraitPosition[1]}%`,
              '--trail-landscape-x': `${currentPosition[0]}%`,
              '--trail-landscape-y': `${currentPosition[1]}%`,
            } as CSSProperties
          }
        />

        {!complete && (
          <div className="trail-board__answers" aria-label="Answer markers">
            {problem.choices.map((choice, index) => {
              const state = answerState(choice, problem, feedback);
              return (
                <button
                  key={choice}
                  type="button"
                  className={`trail-answer trail-answer--${state}`}
                  disabled={Boolean(feedback)}
                  onClick={() => onAnswer(choice)}
                  aria-label={`Answer ${choice}`}
                >
                  <span className="trail-answer__shortcut" aria-hidden="true">
                    {index + 1}
                  </span>
                  <strong>{choice}</strong>
                  {state === 'correct' && (
                    <span className="trail-answer__feedback" aria-hidden="true">
                      ✓
                    </span>
                  )}
                  {state === 'incorrect' && (
                    <span className="trail-answer__feedback" aria-hidden="true">
                      ×
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {complete && (
          <div className="trail-board__finish" role="status">
            <strong>
              {trail.destination[0]?.toUpperCase() + trail.destination.slice(1)} reached!
            </strong>
            <span>{TRAIL_QUEST_LENGTH} trail treasures collected</span>
            <span className="trail-board__treasure-row" aria-hidden="true">
              {trail.items.map((item) => (
                <img key={item.name} src={item.src} alt="" />
              ))}
            </span>
          </div>
        )}
      </section>

      <p className="trail-lab__feedback" role="status" aria-live="polite">
        {feedbackMessage}
      </p>
      {!complete && <p className="keyboard-hint">Tip: use keys 1–4 to choose a marker.</p>}
    </main>
  );
}
