# First playable slice: verification record

Recorded October 18, 2026 for issue #3. These notes distinguish observed browser behavior from untested physical-device behavior.

## Automated results

- `npm test`: **34 passing** chemistry, model, processor, geometry, lifecycle and provenance checks.
- `npm run check`: all production JavaScript/ES modules pass Node syntax checks.
- `git diff --check`: clean.
- `python3 scripts/sync-notices.py`: deployed license/notices synchronized.
- `npm run test:browser`: passed in headless Chromium **139.0.7258.5**, using the installed Playwright runner and a localhost static server. No autoplay policy bypass. No page exceptions or failed asset requests in the exercised flows.

The initial runtime browser download was unavailable; an available Chromium headless shell was used instead. This is an explicit browser version, not a claim to have checked every current engine.

| Surface | Observed result |
| --- | --- |
| Desktop, 1440 × 1000 | Collection links; 118 tiles; keyboard table navigation; water creation and save; complete family trail and keepsake; everyday phone view; opt-in chemistry sound; Hushpod keyboard tap, waist controls and mute; return to saved chemistry |
| Touch emulation, 390 × 844 | Vertical playable pod; controls fit; 44px main controls; no horizontal overflow; real AudioWorklet loaded after tap; nonzero simulated motion; two-finger pocket/waist interaction; pointer cancellation; rotation; explicit resume; mute; navigation cleanup; return/reload silent |
| Touch emulation, 320 × 568 | Same flows; vertical pod and main controls remain reachable without scrolling |
| Touch emulation, 844 × 390 | Same flows; horizontal pod and vertical waist gesture; no forced-rotation overlay |
| Reduced-motion emulation | Sound and controls work; screenshot reviewed; renderer disables rippling displacement while retaining amplitude feedback |
| Navigation | `pagehide` closed the audio context in both instruments; browser back and reload remained usable and silent until a gesture; chemistry local discoveries survived |

Screenshots of the collection and Hushpod were visually reviewed at desktop, narrow portrait and landscape dimensions. Touch input was sent through Chromium's touch-event protocol, including two simultaneous contacts, movement and cancellation. This is stronger than merely resizing a desktop window but **is not physical-phone testing**.

Visibility transitions were dispatched synthetically to exercise the app's handlers and inspect the actual AudioContext state. Browser back was exercised, but the runner does not assert that Chromium chose its back/forward cache. Genuine OS sleep/wake, audio focus and cache-restoration policies remain in the device checklist below.

The original Hushpod numerical tests remain intact apart from import paths. They check action conservation with moving waists, natural decay, cancellation with retained motion, gentle hush preparation/release, closed-waist phase evolution, bounded input, transfer, and finite bounded pickup output at 44.1 and 48 kHz. This is numerical verification, not listening evaluation.

Integration regression tests cover delayed audio-module loading, leaving during initialization, backgrounding while taps/holds are queued, processor failure, failed-module retry, missing Web Audio, interruption without automatic restart, suspension during resume, refused resume, reset immediately before backgrounding, and the chemistry activation race. Source checks confirm the original model and processor hashes.

## Physical-device gaps — not tested here

| Platform | Status |
| --- | --- |
| Android Chrome, physical phone | Not available; needs touch, speakers/headphones, background and rotation testing |
| Android Firefox, physical phone | Not available; needs unlock and interruption checks as well as gestures |
| iPhone/iPad Safari | Not available; needs user-activation, interruption/recovery, safe areas, toolbar resizing and gesture checks |
| Desktop Firefox/Safari | Not run; Chromium is the only browser engine verified in this pass |
| VoiceOver/TalkBack | Not run; keyboard and accessible labels are implemented, touch assistive-technology behavior needs verification |

Before calling this mobile-verified, record device model, OS, browser version, output device and results for:

1. Open the deep link fresh. Confirm silence before a gesture; start sound with the button and with a pocket tap. Test a deliberate muted start and volume adjustment.
2. In portrait, tap/rub/rest pockets and move a waist with another finger. Lift fingers in different orders, move outside the stage, and interrupt a gesture. Check for stuck feeding/holding and unwanted page scrolling or zoom.
3. Repeat in landscape, rotate with fingers held, and expand/collapse browser toolbars. Verify controls clear notches/home indicators and remain reachable on smaller screens.
4. Switch apps, lock/unlock the phone, and interrupt audio with another audio app or a call. Return without touching: it should stay silent, then recover on a new gesture without a fresh page load.
5. Start loading on a slow connection and immediately leave/background. Return and retry; no delayed tap or orphaned sound should appear.
6. Mute, reset, leave for the collection/chemistry, then use browser back/forward. Verify silence on return and usable controls; repeat after the browser has actually restored from its back/forward cache.
7. Listen on device speakers and headphones at modest volume. Check crackles, distortion, touch latency and thermal/frame behavior during several minutes of play. Numeric peak limits do not establish speaker quality.
8. Try reduced motion and keyboard/screen-reader navigation, including accessible pocket activation, waist adjustment, field guide, and return links.

## Remaining integration dependencies

There is no dependency on the wider study or on unfinished prototypes for this slice to run. Hushpod needs HTTPS/localhost plus AudioWorklet. Full study archival material and more detailed cross-collaborator attribution remain separate follow-up work; see [provenance](hushpod-provenance.json) and [architecture notes](INSTRUMENTS.md). Offline installation and Hushpod session persistence are outside this slice.
