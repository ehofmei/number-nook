# Sound Effects, Music, and Audio Labs

## Current scope

Number Nook provides optional synthesized sound effects and an opt-in background-music experiment without adding audio files or a music dependency. Both are generated at playback time with the browser's Web Audio API, store independent device-local preferences, and leave the game completely playable while muted.

Currently wired gameplay cues are:

| Event | Cue | Intent |
| --- | --- | --- |
| Round launched | Bright chime | Clear confirmation that the question loop has begun |
| Correct answer | Nook correct | Fast confirmation related to Round complete |
| Incorrect answer | Gentle answer cue | Neutral information without a failure buzzer |
| Round complete | Round complete | Brief four-note finish |
| Paw Coins presented | Paw Coin jingle | Synchronized with the results count-up |
| Capsule opened | Capsule anticipation | Latch, anticipation, and reveal chord synchronized with the opening animation |
| Unavailable capsule | Wooden tap | Neutral boundary feedback without pretending the purchase succeeded |
| Starter selected | Companion pop | Playful first-companion feedback |
| Companion equipped | Companion pop | Playful customization feedback |

The Sound Lab also contains deliberately unwired candidates for comparison:

- Correct-answer variations: Bright chime, Tiny triumph, and Correct spark.
- Paw Coin variations: Paw Coin sparkle and Metal Paw Coin.
- Reveal variations: Capsule reveal and Starlight capsule.

The Sound Lab marks the exact current gameplay set with **In game** badges.

## Background music

The production track is **Starlight Stream**, a quiet 16-beat loop built from overlapping sine-wave chord tones over a soft chord bed. At its default 76 BPM it repeats every 12.6 seconds. Slow envelopes, restrained shared delay, a low-pass filter, and conservative per-note gains keep it cohesive and behind dialogue and interface sounds. Music remains opt-in and off by default.

The development-only Music Lab keeps Cozy Nook as an original reference and provides three smoother candidates so listening feedback does not depend on knowing musical terminology:

| Track | Direction | Comparison question |
| --- | --- | --- |
| Cozy Nook | Original reference | Do the new approaches sound more unified? |
| Quiet Cove | Pad only, no melody | Peaceful or too empty? |
| Moonlit Window | Blended legato melody | Integrated or still separate? |
| Starlight Stream | Flowing overlapping pattern | Cohesive or still distracting? |

The second pass responds directly to the first sampler's short, disconnected foreground notes: the new tracks use overlapping chords, slower envelopes, soft sine-wave timbres, lower foreground gain, and restrained shared delay. Starlight Stream is the default, while all four tracks are available as player-facing choices so listening experiments can continue without blocking the rest of the app.

Music follows these product rules:

- It defaults off and begins only after the player deliberately enables it.
- A separate music-note button on Home does not change sound-effect preferences.
- It fades out before a math round starts so answers and feedback remain uncluttered.
- It resumes on non-question screens; Results waits 2.2 seconds so Round complete and Paw Coin cues remain clear.
- The loop is generated offline in the browser and adds no media download to the PWA.
- Browser autoplay failures are contained and retried after an eligible Home interaction.

## Player settings

Home keeps one-tap effects and music controls for convenience. Its full-width **Settings** entry opens a device-focused audio screen with:

- Independent effects and music toggles.
- Independent volume sliders with readable percentages.
- Cozy Nook, Quiet Cove, Moonlit Window, and Starlight Stream soundtrack choices.
- Immediate track switching while music is already playing.
- A reset that restores effects on at 40%, music off at 18%, and Starlight Stream selected.

Players can choose a soundtrack while music is off. The selection is ready the next time music is enabled. All choices persist locally on the device and intentionally remain outside progress backup files.

## Trying the audio labs

Start the development server:

```sh
npm run dev
```

Open `http://localhost:5173/?dev=sounds` for short cues or `http://localhost:5173/?dev=music` for background music. Both labs are development-only and are not included as normal navigation in the GitHub Pages build.

The lab can:

- Audition each cue independently and show which cues are currently used in the game.
- Change the effects volume in 5% steps.
- Mute or enable effects using the same preference as the playable app.
- Reset the audio preference to the current default of 40%.
- Show cue duration, tone count, and whether filtered noise is involved.
- Load any cue into the Sound Playground.
- Transpose it by up to one octave, stretch it from 50–180% length, and replace its oscillator mix with sine, triangle, or square waves.
- Adjust cue intensity, make its attack sharper or softer, scale or remove existing noise texture, and pan it between the left and right channels.
- Repeat a customized sound five times to expose repetition fatigue.
- Pair a customized cue with Round complete to test whether they sound related.
- Simulate a five-question finish or a Paw Coin/capsule/companion reward sequence.
- Copy a versioned JSON recipe containing the starting cue and exact adjustments.

For initial play-testing, compare Mac, iPhone, and iPad speakers at both low and normal system volume. Listen to fast answer cues repeatedly, not only once; a pleasant isolated sound can become tiring over a twenty-question round.

The Music Lab can:

- Enable music and change its independent volume using the production preference record.
- Compare the original against pad-only, blended-melody, and flowing-pattern approaches with one-button switching and a prompt explaining what to listen for.
- Start, restart, and stop any sampler loop with a short fade.
- Adjust tempo from 70–130%, warmth from 0–100%, and foreground presence from 0–150%; the foreground control is disabled for the intentionally melody-free Quiet Cove.
- Show the selected track's BPM and resulting loop duration, then copy a reproducible JSON recipe.
- Reset music without changing the player's sound-effect preference.

Let each candidate repeat twice before switching. First narrow the field to two tracks using only simple reactions such as “more playful,” “less busy,” or “I like this one.” Then judge those finalists for at least one full minute. The main questions are whether their restart feels seamless, whether repetition becomes distracting, and whether the default 18% volume stays behind interface cues on small device speakers.

## What Web Audio is doing

The Web Audio API is a small real-time sound studio built into the browser. The current engine demonstrates:

- **Oscillators:** sine waves sound clean and soft; triangle waves add a little more character.
- **Pitch automation:** notes can glide upward or downward to create pops, bubbles, and gentle corrections.
- **Gain envelopes:** every tone fades in and out over milliseconds, avoiding clicks and harsh starts.
- **Chords and arpeggios:** multiple scheduled tones create round-completion and reward sounds.
- **Filtered noise:** deterministic noise passed through low-pass or high-pass filters creates taps, shimmer, and a small reveal whoosh.
- **Precise scheduling:** several sound parts can start fractions of a second apart while the interface continues immediately.
- **Look-ahead loop scheduling:** the music engine schedules complete phrases ahead of playback, then queues the next loop before the current one ends.
- **Filtering and fades:** the music bed passes through a low-pass filter and fades during screen transitions instead of stopping abruptly.

This approach is tiny, offline-friendly, easy to tune in TypeScript, and avoids licensing questions. It is best for UI feedback and short game-like effects. Recorded samples become more attractive when a sound needs an identifiable instrument, voice, animal sound, or richer texture.

The playground intentionally exposes a useful subset rather than every Web Audio parameter. Future controls can add filter cutoff and resonance, echo time and feedback, reverb mix, tremolo, vibrato, oscillator detuning, per-note editing, and procedural variation. Those controls require additional signal-chain or cue-editor UI and should be added in coherent groups rather than as unexplained raw numbers.

## Runtime and persistence rules

- The audio context is created lazily on the first eligible player action, which respects mobile browser autoplay restrictions.
- Effects default to enabled at 40% volume.
- Music defaults to disabled at 18% volume.
- A speaker button on the home and question screens toggles effects immediately.
- A separate music-note button on Home toggles background music immediately.
- Unsupported or blocked audio fails quietly and never blocks an answer or reward.
- The engine reuses one audio context instead of creating a new one for every cue.
- Effects and music enable/volume values plus the soundtrack ID share the version-tolerant device-local `first-math-game:audio-preferences` record. Existing effects-only and pre-soundtrack records migrate by adding music-off and Starlight Stream defaults.
- Audio preferences are intentionally separate from progress backups. They describe the destination device's output, not player achievement.

## Test coverage

Automated tests verify:

- Every cue has a unique stable ID, bounded duration, safe frequency and gain values, and a valid lookup.
- Muted playback creates no audio resources.
- A suspended context resumes before playback, one backend is reused, and the selected volume reaches it.
- Browser audio failures are contained.
- Cue transformations are clamped, deterministic, serializable, and do not mutate the catalog definition.
- Sound Lab controls are semantic, persist mute/reset behavior, customize cues, and run stoppable sequences in a real Chromium component test.
- All four sampler definitions have unique IDs, useful comparison guidance, safe durations, bounded ambience, and notes that fit within their scheduled loop tails; transforms are clamped and serializable, and muted playback creates no music backend.
- The Music Lab exposes independent enable/volume controls, fast track switching, reproducible transforms, and stoppable real-browser loops.
- Real-browser Settings coverage verifies independent toggles, sliders, all soundtrack choices, reset behavior, navigation, persistence, accessibility, and a phone layout.
- The player journey verifies that music and soundtrack selection persist, music disappears from the active-question interface, and returns when the player exits the round.
- The player journey verifies coin presentation, capsule-opening timing, unavailable-capsule behavior, and persistence in Chromium, WebKit, and the iPad browser project.

Automation can verify the sound graph and controls but cannot judge taste or the character of a physical speaker. Final cue selection therefore requires a short human listening pass on the devices the children will use.

## Recommended next audio steps

1. Play one or two complete rounds to judge Bright chime, Nook correct, Gentle answer cue, Round complete, and the Paw Coin count-up in context.
2. Open a capsule and confirm the sound's reveal chord aligns with the collectible appearing.
3. Try selecting and equipping companions, plus pressing an unaffordable capsule once.
4. Record only obvious problems that should block the next development phase; preserve subjective refinements in the deferred backlog.
5. Check the same flows on an iPad before calling the contextual pass complete.

The smooth-architecture sampler is now implemented. Compare the original with the three new approaches before investing in a longer arrangement or more advanced synthesis. Once a direction emerges, listen for looping fatigue, cue masking, speaker distortion, and awkward resume timing on a Mac, iPhone, and iPad. Keep production music disabled by default until that pass feels consistently pleasant.

## Deferred audio backlog

The contextual-audio pass deliberately stops after round launch, answers, round completion, results coins, capsule opening, unavailable capsules, and companion selection/equipping. Preserve these ideas for a later polish cycle:

- A distinct personal-best accent layered after Round complete.
- Daily and weekly goal-completion cues when those systems exist.
- A successful direct-purchase sequence when the shop exists.
- Optional final-seconds feedback for a future Time Rush mode.
- A tiny confirmation when sound is turned on.
- Filter, resonance, echo, reverb, tremolo, vibrato, detuning, and per-note Sound Lab controls.
- Rarity-sensitive reveal variations after the base capsule animation has been play-tested.
- Recorded or generated samples only where synthesis cannot express the desired character.
- Longer arrangements, companion-specific variations, or reactive layers only after the sampler identifies a direction and background music proves that it improves the experience.

Ordinary navigation, review/history interaction, scrolling, text entry, and every settings chip should remain silent unless play-testing reveals a specific usability problem.
