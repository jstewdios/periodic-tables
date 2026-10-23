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

At initial PR publication, the automated browser suite remained unexecuted: the cloud browser cannot reach workspace localhost, and the Playwright Chromium download returned an invalid/truncated archive. No automated viewport-matrix pass was claimed at that stage.

### Deployed desktop browser check (2026-10-23)

After James authorized temporary preview access, the deployed journal was inspected in cloud Chrome at approximately 1348×926. The introduction, experiment, meters and article layout rendered cleanly in screenshots. These manual browser interactions passed:

- Keyboard Home on the phase control prepared N = 0.5000 and pickup squared = 1.0000; End restored the quiet phase.
- Silent evolution showed N = 0.4823 at 0.40 s with displayed pickup 0.0000.
- Opt-in sound loaded the actual worklet and supplied evolving measurements. After narrowing a waist and pausing at 7.4015 s, N = 0.2568450792, pickup squared = 0.2161296849, waist openness = (0.2, 1), and action accounting residual = 2.18e-12.
- Pause held the clock at 7.40 s across subsequent actions; sound disable, reset, re-enable, and explicit Start worked.
- Navigation opened the complete Hushpod instrument. Browser Back returned to the journal paused, with sound disabled and the explicit resume message.

The browser log inspection showed extension metadata errors; none of the inspected errors originated in journal code. This is not a full network/error audit. Audio activation and state evolution were verified, not subjective speaker audibility. Mobile viewport, reduced-motion emulation, and the complete automated interaction suite remain unverified in this environment.

### Review follow-up (2026-10-23)

All 70 unit tests and production syntax checks pass. Startup now rechecks the AudioContext after resume/module loading; a context suspended during that wait is closed and reported as a retryable error, so the silent experiment continues. A deterministic unit regression covers cleanup and retry.

The automated journal suite now passes in workspace-local headless Chromium on the cloud execution machine (Playwright with `/usr/bin/chromium`, not the remote cloud-browser service). All five viewport/reduced-motion cases listed above pass, including real AudioWorklet evolution, keyboard controls, lifecycle cleanup, navigation, no-audio fallback, and no failed assets or page exceptions. An added real-context regression forces suspension before module loading settles and verifies the error, closed context, silent continuation, and successful explicit audio retry. This forced race does not establish real OS/audio-focus behavior.

James separately reports successful manual use on Windows 10 Chrome/Firefox and Pixel 6 Chrome. That report is supplemental device evidence, not proof of the suspension race or speaker measurements. iOS/Safari, screen readers and hardware audibility remain unverified here. Published model-check and verification-record links now use `main`, so feature-branch deletion cannot break them.

## Honest limits

No physical validation or peer review. No real iPhone/iPad Safari, Android sleep/audio-focus interruption, hardware speaker/headphone, or screen-reader validation in this environment. Synthetic visibility tests cannot establish OS lifecycle behavior. Exact cancellation depends on symmetric parameters and initial state; changing pickup weights changes audibility. This entry demonstrates cancellation, not a measured nonlinear trapping threshold.

## Provenance

Hushpod: ChatGPT / Codex, independently developed in James Stewart's collaborative study. James initiated, facilitated, evaluated and directed integration. Claude, Gemini and Grok participated in the broader study, not attributed here as Hushpod coauthors. Journal implementation: Codex, at James's direction, 2026-10-23.

Primary historical archive: https://github.com/jstewdios/collaborative-instruments/tree/main/studies/001-emergent-musical-toys (proposals, blind reviews, revisions, timeline and explicit archive gaps). Existing `docs/hushpod-provenance.json` and `docs/HUSHPOD_ORIGINAL.md` are retained as historical import records, including their original wording about then-missing archives.