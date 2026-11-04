# Ring journal — experiment v1

`/journal/ring/`, **The Ring That Will Not Close** (Field Note 002).

Static files only; no build, package runtime, backend, or instrument catalog entry. The Ring is not a Periodic Tables instrument. The journal folder carries the archived Round 4 ring core (`ring-core.js`) byte for byte, and `experiment.mjs` imports it as a configured presentation, not a second set of equations. `full.html` is the archived standalone Round 4 instrument (`dist/ring-local.html` in the study archive), also byte for byte, so the page's "Play the full Ring" link plays. Hashes are in `docs/ring-journal-provenance.json` and checked by `tests/journal/ring.test.mjs`.

## Reproduction

Serve `dist` with `npm run dev` and open `/journal/ring/`. The ring starts in equal temperament (every fifth −C/12 ≈ −1.955 cents). Push voice 3 sharp, then Start. Push adds +20 cents to voice 3. Parameters are those of archived check T1: λ = ½, R = 1/s, no tuner gate, no pins, noise 0. The model advances in fixed 1/60 s frames (the archived checks' step), each split by the core into ≤ 4 ms Euler sub-steps; a run stops at 40 simulated seconds. Slow frames cap catch-up at 50 ms, so the ring slows rather than jumping. Switching the curve prepares a fresh, paused ring in equal temperament with voice 3 already pushed. Reset prepares it unpushed.

The listening window moves one fifth every 2 s while the ring runs or sound is on; it never changes the dynamics. Opt-in sound plays the heard fifth as two oscillators with the archived page's six-harmonic wave (amplitudes 0.88ᵏ⁻¹), lower voice at its pitch class above 220 Hz, upper a fifth above mistuned by that edge's error; gains 0.5 and 0.42 under a 0.35 master. Hiding the page or navigating away pauses the ring and closes audio; returning never restarts it. Reduced motion limits redraw to 4 Hz.

## Numerical evidence (2026-11-04)

`npm test`: 78 passing checks, 8 of them for this page. `npm run check`: passes.

- The core and the full Ring copy hash to the archived files.
- Push from equal temperament, 40 s, through the page's adapter: quadratic ends with every fifth between −1.95 and −1.96 cents; roughness ends with −19.61 cents on fifth 3 and −0.35 on the other eleven. Both sum to −23.46. This matches archived check T1.
- The sum of errors stays at −C to 1e-9 cents at every step, with pushes mid-run.
- Without a push, equal temperament holds to within 0.01 cents over the 40 s run. Under roughness it is a repeller: rounding error of about 1e-13 cents grows to about 1e-3 cents by 40 s.
- Reset is exact; pause holds; each dyad is a fifth mistuned by exactly the heard error, lower voice in 220–440 Hz.

## Browser validation (2026-11-04)

`npm run test:journal:ring:browser` runs the focused browser suite with a separately installed Playwright and Chromium (`PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, `CHROMIUM_ARGS`, `SCREENSHOT_DIR`). It passed on the cloud execution machine with headless Chromium 131 (`@sparticuz/chromium`): 1440×1000, 390×844, 320×568 and 390×844 reduced motion, covering no horizontal overflow, no audio before opt-in, silent evolution, pause, real AudioContext start, the window walking, synthetic hiding closing audio, the curve switch, both 40 s runs in the page matching T1, the full Ring link opening and starting audio, and no page errors or failed local assets.

## Honest limits

Headless Chromium with muted output: audio contexts were verified running, not heard. No real phone, iOS/Safari, OS audio-focus interruption, speaker or screen-reader testing. Synthetic visibility tests cannot establish OS lifecycle behavior. `full.html` loads IBM Plex from Google Fonts when online and falls back to system faces; it has no link back to the journal, because it is unchanged. The roughness curve follows Sethares (1993) as recalled in Round 4, with parameters not checked against the paper. No listener study has been run.

## Provenance

The Ring That Will Not Close: proposed and built by Claude (Anthropic) in Study 02, *The Question That Changes*, initiated, facilitated and evaluated by James Stewart. ChatGPT, Gemini and Grok took part in the broader study and reviewed the Ring anonymously; they are not attributed here as its coauthors. Journal implementation: Claude, at James's direction, 2026-11-04.

Primary historical archive: https://github.com/jstewdios/collaborative-instruments/tree/main/studies/002-the-question-that-changes
