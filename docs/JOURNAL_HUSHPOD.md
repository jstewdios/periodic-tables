# Hushpod journal — experiment v1

Issue #8: `/journal/hushpod/`, **The Sound That Was Still There**.

Static files only; no build, package runtime, backend, or instrument edits. The collection links to the story. `experiment.mjs` imports the canonical `Pod` directly. The journal AudioWorklet is a narrow adapter for initial-state loading and pause, retaining the original pickup/carrier/saturation mapping. The complete instrument and its recorded model/worklet hashes remain unchanged.

## Reproduction

Serve `dist` with `npm run dev`. Reset quiet state, Start, then narrow the left waist. Initial amplitudes `(0.5, 0, −0.5)`; total action 0.5; canonical material constants. Left waist target changes from 1 to 0.2, right stays 1. No injection during evolution. Phase slider resets to `(0.5, 0, 0.5 exp(iθ))`, equal total action, time zero, paused, both waists open. Runs end at 12 simulation seconds. Phase differences are starting conditions, not a claim that relative phase stays fixed after evolution.

Actual state supplies local/total action, squared weighted pickup, normalized pickup fraction, currents, waist openness, loss and accounting residual. Explicitly distinct meter scales: N 0–0.5, |p|² 0–1.06125 (the Cauchy–Schwarz bound at initial N). No loudness or physical-energy calibration.

Opt-in audio transfers the state to the worklet, which becomes the sole simulation authority. Silent mode uses the same fixed-step model on the main thread. Turning sound off resumes from the most recent report (at most roughly 33 ms behind the audio thread). Slow frames cap catch-up at 50 ms; displayed time is simulation time. Page hiding closes audio and pauses; returning never automatically restarts. Native buttons and range input supply keyboard/touch alternatives. Reduced motion hides phase arrows and limits numeric redraw to 4 Hz; pause freezes measurements.

## Numerical evidence (2026-10-23)

`npm test`: 69 passing checks, including existing chemistry, Hushpod, and Odd Sympathy checks, and 10 new journal model/processor/audio-lifecycle checks. `npm run check`: passes.

- Both aligned and opposite initial states have N = 0.5; |p|² is respectively 1 and less than 1e-30.
- Opposite state at 8 s: N = 0.5 exp(−0.72), about 0.243376; relative retention 48.6752%; C < 1e-20.
- After 1 s in the quiet preset, narrow left waist to 0.2: C exceeds 0.03 within the next second. Injected action remains exactly 0.5, and N follows the same decay law.
- A non-symmetric trajectory approaches the finer-step solution as dt halves from 1/4000 to 1/8000 to 1/16000 s. This is a limited convergence check, not a universal error bound.
- Actual processor tested at 44.1/48 kHz: finite matching stereo, quiet state, waist release, pause and reset.
- Audio mocks test opt-in, transfer, cancellation during loading, context cleanup, interruption, failure and retry. Mocks do not verify device audio.

## Browser validation

`npm run test:journal:browser` runs the focused browser suite. Like the repository's existing smoke script, it requires a separately installed Playwright and Chromium, never shipped to visitors. Optional `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` select installed tools; `SCREENSHOT_DIR` saves evidence.

The suite covers 1440×1000, 390×844, 320×568, 844×390 and reduced motion; keyboard phase endpoints, silent evolution, waist release, pause, real AudioWorklet handoff, reset, synthetic visibility lifecycle, navigation cleanup, missing-audio fallback, and failed assets/page errors.

Local browser execution currently blocked: the cloud browser cannot reach the workspace localhost, and the Playwright Chromium download returned an invalid/truncated archive. The suite is authored but not yet claimed passing. Deployment-browser observations, if available, are recorded below.

## Honest limits

No physical validation or peer review. No real iPhone/iPad Safari, Android sleep/audio-focus interruption, hardware speaker/headphone, or screen-reader validation in this environment. Synthetic visibility tests cannot establish OS lifecycle behavior. Exact cancellation depends on symmetric parameters and initial state; changing pickup weights changes audibility. This entry demonstrates cancellation, not a measured nonlinear trapping threshold.

## Provenance

Hushpod: ChatGPT / Codex, independently developed in James Stewart's collaborative study. James initiated, facilitated, evaluated and directed integration. Claude, Gemini and Grok participated in the broader study, not attributed here as Hushpod coauthors. Journal implementation: Codex, at James's direction, 2026-10-23.

Primary historical archive: https://github.com/jstewdios/collaborative-instruments/tree/main/studies/001-emergent-musical-toys (proposals, blind reviews, revisions, timeline and explicit archive gaps). Existing `docs/hushpod-provenance.json` and `docs/HUSHPOD_ORIGINAL.md` are retained as historical import records, including their original wording about then-missing archives.
