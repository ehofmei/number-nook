# Practice Mode

Practice is an untimed alternative to Quick Game. Choose it in Game Setup alongside the existing operations, difficulty, and 10/20/30/50 question choices. The mode is remembered; Reset defaults returns to Quick Game.

## Question flow

- A correct answer advances after the usual brief feedback.
- A wrong answer stays visibly crossed out and disabled. Other choices unlock after the 500 ms feedback beat; the correct answer is not highlighted or disclosed.
- After the first miss, **Show a hint** offers a concise arithmetic strategy. A second miss shows it automatically.
- Hints cover all four operations, including zero multiplication and negative subtraction, without rendering large numbers of counters for Advanced problems.
- Companion encouragement rotates through 24 gentle phrases. Selection is stable while the player considers a question.
- After the original questions, every first-attempt miss returns once in a clearly labeled recap. This provides separation from the original correction for most missed facts without replacing generated questions or weakening the generator's composition guarantees. A miss on the last original question can return immediately if it is the only recap item.
- The recap allows the same retries and hints. Its questions do not recursively return again.
- Results appear after the recap, or immediately after the original questions when all first answers were correct.

## Accuracy, rewards, and progress

Only the first answer to each original question determines accuracy, score, Paw Coins, and participation-bonus eligibility. Practice awards 100 points per first-try correct answer and no speed bonus. The ordinary difficulty-scaled coin formula applies unchanged. Retries, hints, and recap never add rewards or increase the counted question total.

The game quietly records time to the first answer and time to solve each original question. Results emphasize first-try accuracy and questions worked out with another try; they do not emphasize speed or announce pace improvements. Exiting abandons the round without awarding currency, consistent with Quick Game. In-progress rounds are not restored after a reload.

Round review preserves the first answer plus the sequence of attempts, hint use, time to solve, and recap attempts/hint use. Play History labels Practice configurations explicitly. Exact-configuration comparisons include the mode; lifetime totals across all modes remain cumulative.

## Persistence and compatibility

Save schema 7 adds the optional `settings.mode` and per-answer `practice` record. Missing mode means Quick Game. Schemas 1–6 migrate without losing collection, coins, participation progress, or prior results. Quick Game retains its existing configuration keys and ruleset 8 generator; Practice uses a distinct configuration suffix. Analysis export 5 includes Practice attempts and hints. The newest 30 detailed rounds retain these records; older rounds use the existing compact archive.

## Verification inventory

- Switch both modes, reload, reset defaults, and replay.
- Correct first answer; one miss plus manual hint; two misses plus automatic hint; disabled choices via mouse and keyboard.
- Complete mixed-operation Practice, recap, results, and review; verify first-attempt coins and score.
- Perfect round skips recap. Exiting during feedback cancels the pending transition.
- Preserve Practice records through export/import and schema 6 migration; keep Quick and Practice comparisons distinct.
- Inspect desktop, phone, and Advanced long equations with hints visible; check readability, touch targets, focus, and horizontal overflow.

More elaborate visual teaching aids and mastery-based question selection are future extensions. The current strategy hints and bounded recap are the complete first Practice slice.
