# Instruments & Journal homepage — verification

November 4, 2026. Related to issue #3; this contribution leaves the issue open.

## Navigation and presentation

- `/` is the three-instrument collection, with a full illustrated section for both published Field Notes.
- `/journal/` is a separate static collection with links to each story, related playable artifact, and original study.
- `/chemistry/` serves the existing chemistry UI. Original root fragments `#table`, `#workbench`, `#everyday`, `#trails`, and `#collection` replace the current history entry with the same fragment and query at `/chemistry/`.
- `/instruments/` replaces its history entry with the homepage. Without JavaScript it supplies a normal homepage link. Instrument navigation now links directly to the homepage, avoiding the alias hop.
- Research-story headers and footers return to the Journal; the full Ring remains a related research artifact rather than a fourth catalog instrument.
- The chemistry collection key and schema are unchanged. Models, experiment adapters, audio implementations, study archives, credits, and scientific caveats are preserved. Only document links and the moved chemistry document's asset paths change inside the existing experiences.

The two collections are authored from separate metadata arrays using `npm run render:collections`. Their complete HTML is tracked in `dist/`; visitors and static hosts need no rendering framework, runtime dependency, or build step. Preview SVGs are illustrative, not running simulations. The chemistry miniature uses the existing element positions and family colors.

## Completed checks

| Check | Result |
| --- | --- |
| `npm test` | 82 tests pass, including all 78 existing tests and four collection/navigation regressions. Preserved original models/cores still pass their provenance checks. |
| `npm run check` | Production JavaScript syntax and generated collection HTML pass. |
| `node --check scripts/collections-browser.mjs` | Pass. |
| `git diff --check` | Pass. |
| Static links/assets | Collection, chemistry, both instruments, and both journal documents resolve on root and subdirectory hosts; all five legacy fragments preserve their query and destination using history replacement. |
| Served chemistry interaction | Opened `/?legacy=1#workbench`, arrived at `/chemistry/?legacy=1#workbench`, assembled and saved water, visited the homepage, reopened chemistry, and found Water in the saved collection. |
| Browser history | Chemistry → Workbench → Back → Back → Forward returned to chemistry, the homepage, and chemistry respectively, with no compatibility-loop entry. |
| Keyboard | The first Tab reaches the visible skip link; Enter focuses the main content; the next Tab reaches Explore chemistry with a visible focus outline. |
| Served layout checks | Chrome desktop at 1348 × 926; both collections inspected in 320, 390, 768, and 844 CSS-pixel frames. No horizontal overflow; narrow layouts use one column. Navigation/play/secondary research links have at least 44px targets. |
| Journal navigation and experiments | Opened both stories from the index and returned through the Journal brand link. Field Note 001 began at action `0.5000` / pickup `0.0000`, then revealed pickup `0.1791` after narrowing the waist. Field Note 002 loaded with its expected `−23.46 ¢` sum and accepted Push/Run. |

## Screenshots

These captures come from the served source at the same revision as the PR's presentation changes. Desktop images show a 1348 × 926 viewport. Phone images are exact crops of 390 × 844 embedded document frames in desktop Chrome. They establish responsive layout, **not** mobile-browser, touch, speaker, or operating-system behavior.

| Page | Desktop | Phone layout |
| --- | --- | --- |
| Instruments | [Desktop](homepage/homepage-desktop.jpg) | [390px frame](homepage/homepage-phone.jpg) |
| Journal | [Desktop](homepage/journal-desktop.jpg) | [390px frame](homepage/journal-phone.jpg) |

[The Journal section on the homepage](homepage/homepage-journal.jpg) is also captured separately.

## Browser automation and limitations

The new `npm run test:collections:browser` suite covers 1440 × 1000, 390 × 844, 320 × 568, 844 × 390, and 768 × 1024 layouts, every story entrance, legacy URLs, browser back/forward, keyboard launch, reduced motion, no-JavaScript browsing, and failed asset requests. With `SCREENSHOT_DIR`, it produces full-page desktop and phone images.

`.github/workflows/verify.yml` runs that suite and **all three existing browser suites**, including chemistry saves/trails, actual AudioWorklet startup, touch gestures, audio context closure on navigation, background/recovery handlers, and both journal experiments. It uploads `collection-screenshots`. At preparation of this record, GitHub had accepted the jobs but had not assigned a runner; these browser suites are **queued, not reported as passing**. Local Playwright's Chromium installation failed because the browser download was not a valid archive.

The served visual preview uses HTTP on a non-localhost hostname. Hushpod correctly reports that it needs HTTPS/localhost and AudioWorklet support. Consequently real worklet playback/cleanup could not be established there; lifecycle unit tests pass, while secure-context browser integration remains for the queued workflow. Synthetic visibility tests in the existing runners exercise application handlers, not real OS interruptions.

Vercel reported the PR preview Ready. Opening it redirected this browser toward Vercel sign-in, where automatic approval review blocked access to private account metadata. No sign-in, protection setting, or account access was changed. The deployment's content has not been independently verified through that protected URL.

No physical Android/iOS device, Safari, real touch hardware, OS interruption, or assistive-technology session was used. These remain explicit verification gaps.
