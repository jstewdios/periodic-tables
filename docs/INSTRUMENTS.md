# First instrument slice — issue #3

## Architecture decision

Use **ordinary static document navigation** as the experiment boundary. This is the smallest useful mount/unmount mechanism for two existing, self-contained ES-module applications. A shared SPA, iframe host, router, base class, or common audio engine would introduce coupling without improving the first slice.

| URL | Responsibility |
| --- | --- |
| `/` and existing `/#table`, `/#workbench`, `/#everyday`, `/#trails`, `/#collection` | Existing chemistry application |
| `/instruments/` | Invitation, two collection entries, status, source and credit |
| `/instruments/hushpod/` | Independent Hushpod document, UI, model, renderer and audio |
| `/instruments/odd-sympathy/` | Independent Odd Sympathy document, UI, model, renderer and audio |

Links are relative, so the same tree also works under a static-host subdirectory. No rewrite rules or catch-all route are necessary. There is no extra Hushpod download when someone opens chemistry or the collection. The chemistry collection storage key and schema remain `periodic-tables.collection.v1`; no migration is needed. An unsaved workbench is still in-memory. Normal browser history may retain it, but full document reload does not promise to restore it.

`dist/instruments/catalog.js` is a small authored metadata array. The launcher renders it without importing any instrument's engine. The optional preview artwork is in the launcher's `app.js`; it has no scientific meaning and does not drive the instrument. There are three entries: unfinished prototypes do not appear as unavailable promises.

## Minimal instrument contract

1. **Address:** a stable directory URL and an ordinary link back to the collection. Keep submodules/assets relative to that directory.
2. **Invitation:** name, one-sentence invitation, status, category, URL, source and visible credit in the catalog. Include limitations and licensing/provenance in the instrument's own help or README.
3. **Independence:** keep the experiment's model, rendering, gestures, and sound in its directory. Preserve distinct collaborator interpretations. Share a primitive only after a concrete repeated need appears.
4. **Audio ownership:** create/resume audio from a user gesture. Handle denied/failed activation visibly, with retry. Suspend on hidden/interruptions, release held input, and require a fresh gesture. On `pagehide`, close audio nodes/context, cancel timers/animation, and stop observers. Guard pending async initialization against navigation. A back/forward-cache restore must be silent and usable.
5. **Touch/accessibility:** use bounded play surfaces with appropriate touch-action, pointer capture/cancellation, reachable 44px controls, safe-area spacing, keyboard alternatives, labels, visible focus, and meaningful reduced-motion behavior. Check portrait before landscape.
6. **Verification:** run the model's own checks, add regression coverage for meaningful integration risks, test the served page, and state which physical devices were actually used. Never label desktop touch emulation as phone testing.

For the next instrument: add its self-contained folder, add one catalog entry, optionally add a preview, record its provenance and limitations, then verify its lifecycle and return trip to chemistry. No changes to the chemistry router are required.

## Hushpod reuse and changes

The available local source matches the original Hushpod Site v1, published October 16, 2026. The original git snapshot is `e02ad3ea211228abbf36c48c4dfc1b409907c988`. The saved Site metadata identifies the original as [Hushpod](https://hushpod.jstewdios.chatgpt.site); access to that independent study artifact may require its existing permissions. Playing this integration requires no access to that Site.

Imported rather than rewritten:

- Three-resonator model, constants, exact coupling map and action accounting (`model.mjs` unchanged).
- 4 kHz simulation and device-rate pickup synthesis (`worklet.mjs` unchanged).
- Original Canvas skin, visual identity, pointer/keyboard interactions, local diagnostics, and field guide.
- Original model, worklet and geometry tests (only their import paths changed).

Integration changes are confined to collection navigation, attribution, touch target/safe-area adjustments, orientation-aware labels, reduced-motion rendering, and lifecycle reliability. Reduced motion stops the ripple displacement while retaining amplitude brightness and direct input feedback. Page navigation closes the engine; a cached return retains waist controls but clears vibration. Backgrounding pauses simulation time, clears held contact, and resumes only on a gesture. There is no wall-clock catch-up.

The audio startup race is explicitly guarded: a module fetch finishing after `pagehide` cannot construct a new node, and finishing after background suspension cannot replay queued taps. A processor/module failure disposes its context and permits a clean retry. Ordinary interruption clears contact and disallows automatic sound recovery. Mute changes output only. Reset, queued impulses, animation, resize observation, and pointer captures are cleaned up when leaving.

Chemistry retains its hash router and features. Its audio module now also cancels pending activation on navigation, suspends on backgrounding, and closes on `pagehide`; returning starts with sound off.

## Odd Sympathy reuse and changes

The source is the single-file prototype Claude published on October 16, 2026, preserved byte for byte as [`ODD_SYMPATHY_ORIGINAL.html`](ODD_SYMPATHY_ORIGINAL.html). The page was split into `model.mjs`, `setups.mjs`, `audio.mjs`, `render.mjs` and `app.mjs` so the rules can be tested without a browser.

Preserved rather than rewritten:

- The three rules, constants, event-driven scheduler, tempo-following pitch and evaluation order. `tests/odd-sympathy/model.test.mjs` executes the original page's own simulation and setup code next to `model.mjs` and requires identical fire times and pitches.
- The six setups, the gestures and their thresholds, the 40-ring limit, the hint sequence, the intro and the Tune drawer.
- The voice, filter envelope, panning, generated reverb, limiter and 42-voice cap.

Integration changes follow the contract above: collection navigation; a Sound button; keyboard and screen-reader play through one button per ring (inert until the intro closes), with a canvas-drawn focus halo; proportional remapping of rings when the field resizes; an About section; visible audio failure with retry while the field keeps playing silently; suspension on hide with no automatic recovery and no catch-up; full audio close on `pagehide`; and stronger reduced-motion behaviour. The simulation clock follows the audio clock while sound runs and the page clock otherwise, mapped so switching between them never jumps time. The original's Google Fonts are not loaded. One drawer sentence about the Triangle was corrected because the model shows it settling; see the [study record](ODD_SYMPATHY.md). Exact file-level notes are in [`odd-sympathy-provenance.json`](odd-sympathy-provenance.json).

Odd Sympathy needs Web Audio for sound but not AudioWorklet; voices are scheduled from the main thread with a 35 ms lookahead, as in the original. It has no saved fields: reloading starts with one ring. The revision's proposed diagnostics layer and URL-set study conditions are not built yet.

## Dependencies and deliberate limits

- HTTPS (or localhost), Web Audio and AudioWorklet are required for Hushpod sound. Missing APIs or module failures show a retryable explanation. There is no lower-fidelity fallback engine.
- The source snapshot had no separate license file. This owner-requested import contributes the owner's AI-assisted original material under the repository's existing MIT license; see the notices. No licenses are assigned to other study contributions.
- For Hushpod, the original prompts, reviews and full collaborative-study attribution still need archival work. Odd Sympathy has a summarised study record, but its reviewers' texts are not included. This is a preserved playable artifact, not a claim that the wider study has concluded. No dependency on unfinished prototypes blocks this slice.
- There are no runtime package dependencies, sensor/microphone permissions, remote recordings, accounts, or analytics. All diagnostics are local downloads.
- Files are static and can be hosted locally, but there is **no service worker or guaranteed offline install** in this slice.
- Hushpod has no saved sessions. Reloading/navigating away ends its current vibration. Existing saved chemistry discoveries are preserved.
- Physical Android/iOS behavior, OS audio interruptions, device speakers, and touch screen readers require the follow-up checks in [the test record](INSTRUMENT_TESTING.md).

## Verification commands

```sh
npm test
npm run check
python3 scripts/sync-notices.py
```

Optional browser verification (development only; installs no production dependency):

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
npm run test:browser
```

`scripts/browser-smoke.mjs` starts its own local static server, drives Chromium, and closes both. Set `SCREENSHOT_DIR` to save local QA captures; leave it unset in CI. `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` can point to an existing Playwright module and browser executable in a managed runtime. No autoplay-bypass flags are used. The runner covers served pages, actual AudioWorklet loading, touch events via CDP, and synthetic visibility events; the latter exercise our handlers rather than simulate an entire operating system.
