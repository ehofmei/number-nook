import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { getCollectible, getCollectibleImage } from '../content/catalog';
import { formatProblem, generateSession, OPERATION_SYMBOLS, type Problem } from '../domain/math';
import { SeededRandom } from '../domain/random';
import { MEADOW_TRAIL, TRAIL_QUEST_LENGTH } from '../trail/trails';

export const TRAIL_QUEST_LAB_SEED = 20_260_917;
const FEEDBACK_MS = 780;
const TRAIL_LENGTH = TRAIL_QUEST_LENGTH;
const TRAIL_COLLECTIBLES = MEADOW_TRAIL.collectibles;
const PORTRAIT_ROUTE = MEADOW_TRAIL.portraitRoute;
const LANDSCAPE_ROUTE = MEADOW_TRAIL.landscapeRoute;

function buildProblems(): Problem[] {
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

function answerState(
  choice: number,
  problem: Problem,
  feedback: { selected: number; correct: boolean } | null,
): 'idle' | 'correct' | 'incorrect' | 'muted' {
  if (!feedback) return 'idle';
  if (choice === problem.correctAnswer) return 'correct';
  if (choice === feedback.selected) return 'incorrect';
  return 'muted';
}

export function TrailQuestLab() {
  const problems = useMemo(() => buildProblems(), []);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [trailPosition, setTrailPosition] = useState(0);
  const [stars, setStars] = useState(0);
  const [loadedCollectibles, setLoadedCollectibles] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [feedback, setFeedback] = useState<{ selected: number; correct: boolean } | null>(null);
  const [lastResult, setLastResult] = useState('Choose a trail marker to begin.');
  const [complete, setComplete] = useState(false);
  const transitionTimer = useRef<number | null>(null);
  const problem = problems[questionIndex % problems.length];
  const sunny = getCollectible('cozy-cats:sunny');
  const portraitPosition = PORTRAIT_ROUTE[trailPosition] ?? PORTRAIT_ROUTE.at(-1)!;
  const landscapePosition = LANDSCAPE_ROUTE[trailPosition] ?? LANDSCAPE_ROUTE.at(-1)!;
  const nextPortraitPosition = PORTRAIT_ROUTE[trailPosition + 1] ?? PORTRAIT_ROUTE.at(-1)!;
  const nextLandscapePosition = LANDSCAPE_ROUTE[trailPosition + 1] ?? LANDSCAPE_ROUTE.at(-1)!;
  const nextCollectible = TRAIL_COLLECTIBLES[trailPosition % TRAIL_COLLECTIBLES.length]!;
  const collectedItems = Array.from(
    { length: stars },
    (_, index) => TRAIL_COLLECTIBLES[index % TRAIL_COLLECTIBLES.length]!,
  );

  const markCollectibleLoaded = useCallback((src: string) => {
    setLoadedCollectibles((current) => {
      if (current.has(src)) return current;
      const next = new Set(current);
      next.add(src);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    transitionTimer.current = null;
    setQuestionIndex(0);
    setTrailPosition(0);
    setStars(0);
    setFeedback(null);
    setLastResult('Choose a trail marker to begin.');
    setComplete(false);
  }, []);

  const chooseAnswer = useCallback(
    (selected: number) => {
      if (!problem || feedback || complete || !problem.choices.includes(selected)) return;
      const correct = selected === problem.correctAnswer;
      setFeedback({ selected, correct });
      setLastResult(
        correct
          ? `Correct! Sunny collected the ${nextCollectible.name}.`
          : `That was a small detour. ${formatProblem(problem)} = ${problem.correctAnswer}.`,
      );
      if (correct) setStars((current) => current + 1);

      transitionTimer.current = window.setTimeout(() => {
        setFeedback(null);
        setQuestionIndex((current) => current + 1);

        if (!correct) {
          setLastResult('Sunny stayed put. Try a fresh marker to clear this stop.');
          return;
        }

        const nextPosition = trailPosition + 1;
        setTrailPosition(nextPosition);
        if (nextPosition === TRAIL_LENGTH) {
          setComplete(true);
          setLastResult('Sunny reached the picnic nook!');
          return;
        }
        setLastResult('Treasure collected! Choose the next trail marker.');
      }, FEEDBACK_MS);
    },
    [complete, feedback, nextCollectible.name, problem, trailPosition],
  );

  useEffect(() => {
    return () => {
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    };
  }, []);

  useEffect(() => {
    const preloaders = TRAIL_COLLECTIBLES.map(({ src }) => {
      const image = new Image();
      image.onload = () => markCollectibleLoaded(src);
      image.src = src;
      return image;
    });

    return () => {
      preloaders.forEach((image) => {
        image.onload = null;
      });
    };
  }, [markCollectibleLoaded]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || complete) return;
      const choiceIndex = Number(event.key) - 1;
      const choice = problem?.choices[choiceIndex];
      if (choice !== undefined) chooseAnswer(choice);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [chooseAnswer, complete, problem]);

  if (!problem || !sunny) return null;

  return (
    <main className="trail-lab page-shell">
      <header className="trail-lab__header">
        <div>
          <span className="eyebrow">Development only</span>
          <h1>Trail Quest Overlay Lab</h1>
          <p>
            Test whether real answer controls can live comfortably inside a responsive game scene.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={reset}>
          Restart trail
        </button>
      </header>

      <section className="trail-lab__status" aria-label="Trail status">
        <strong>
          {complete ? (
            'Trail complete'
          ) : (
            <>
              <span className="trail-lab__progress-long">
                {trailPosition} of {TRAIL_LENGTH} stops cleared
              </span>
              <span className="trail-lab__progress-short">
                {trailPosition}/{TRAIL_LENGTH} stops
              </span>
            </>
          )}
        </strong>
        <span className="trail-lab__score" aria-label={`${stars} trail treasures`}>
          <span className="trail-lab__collection" aria-hidden="true">
            {collectedItems.slice(-5).map((item, index) => (
              <img
                key={`${stars}-${index}`}
                className={index === collectedItems.slice(-5).length - 1 ? 'is-new' : ''}
                src={item.src}
                alt=""
              />
            ))}
          </span>
          <strong>{stars}/10</strong>
        </span>
      </section>

      {!complete && (
        <section className="trail-lab__equation" aria-labelledby="trail-equation">
          <span className="eyebrow">Which marker clears the trail?</span>
          <h2 id="trail-equation">
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
        aria-label={`Sunny is at trail stop ${trailPosition + 1} of ${TRAIL_LENGTH + 1}`}
      >
        <picture className="trail-board__picture" aria-hidden="true">
          <source media="(orientation: portrait)" srcSet={MEADOW_TRAIL.portraitBoard} />
          <img src={MEADOW_TRAIL.landscapeBoard} alt="" />
        </picture>

        {!complete && (
          <>
            <span className="trail-board__collectible-description" aria-live="polite">
              Next trail treasure: {nextCollectible.name}.
            </span>
            <img
              key={`${trailPosition}-${nextCollectible.name}`}
              className={`trail-board__collectible${loadedCollectibles.has(nextCollectible.src) ? ' is-loaded' : ''}${feedback?.correct ? ' is-collecting' : ''}`}
              src={nextCollectible.src}
              alt=""
              aria-hidden="true"
              data-testid="trail-collectible"
              onLoad={() => markCollectibleLoaded(nextCollectible.src)}
              style={
                {
                  '--trail-portrait-x': `${nextPortraitPosition[0]}%`,
                  '--trail-portrait-y': `${nextPortraitPosition[1]}%`,
                  '--trail-landscape-x': `${nextLandscapePosition[0]}%`,
                  '--trail-landscape-y': `${nextLandscapePosition[1]}%`,
                } as CSSProperties
              }
            />
          </>
        )}

        <img
          className="trail-board__traveler"
          src={`${import.meta.env.BASE_URL}${getCollectibleImage(sunny, 'sticker')}`}
          alt=""
          style={
            {
              '--trail-portrait-x': `${portraitPosition[0]}%`,
              '--trail-portrait-y': `${portraitPosition[1]}%`,
              '--trail-landscape-x': `${landscapePosition[0]}%`,
              '--trail-landscape-y': `${landscapePosition[1]}%`,
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
                  onClick={() => chooseAnswer(choice)}
                  aria-label={`Answer ${choice}`}
                >
                  <span className="trail-answer__shortcut" aria-hidden="true">
                    {index + 1}
                  </span>
                  <strong>{choice}</strong>
                  {state === 'correct' && <span aria-hidden="true">✓</span>}
                  {state === 'incorrect' && <span aria-hidden="true">×</span>}
                </button>
              );
            })}
          </div>
        )}

        {complete && (
          <div className="trail-board__finish" role="status">
            <strong>Picnic nook reached!</strong>
            <span>{stars} of 10 trail treasures collected</span>
            <span className="trail-board__treasure-row" aria-hidden="true">
              {collectedItems.map((item, index) => (
                <img key={`${item.name}-${index}`} src={item.src} alt="" />
              ))}
            </span>
          </div>
        )}
      </section>

      <p className="trail-lab__feedback" role="status" aria-live="polite">
        {lastResult}
      </p>
      <p className="keyboard-hint">Tip: use keys 1–4 to choose a marker.</p>
    </main>
  );
}
