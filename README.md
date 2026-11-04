# Periodic Tables

A playground for playable scientific and musical instruments. Discover patterns in the elements, explore compounds, catch and reveal vibration with Hushpod, or let ring clocks pull each other into rhythm and harmony with Odd Sympathy.

[Try the current app](https://periodic-tables-pied.vercel.app/) · [Contribute](CONTRIBUTING.md) · [MIT license](LICENSE)

The registered primary domain is [periodictables.xyz](https://periodictables.xyz/); use the Vercel link until its HTTPS setup is confirmed.

## The first collection

The homepage is the **Instruments** collection. Chemistry lives at `/chemistry/`, and the playable **Journal** has its own index at `/journal/`. Existing `/instruments/` bookmarks still open the homepage; original chemistry fragment links such as `/#workbench` open the corresponding chemistry view. The collection currently contains chemistry, **Hushpod**, a self-contained, touch-playable coupled-resonator prototype, and **Odd Sympathy**, a field of pulse-coupled ring clocks where size is tempo and tempo is pitch. Each keeps its own interface, source, and credits. Existing chemistry URLs and saved discoveries are unchanged.

- **The table:** all 118 elements; family colors, electron-pull gradients, room-temperature states, and atomic number; element details, source links, arrow-key navigation, and optional sonification.
- **Compound workbench:** tap or drag elements, adjust atom counts, and explore 14 authored compositions. Molecular models show connectivity; ionic/network solids show ratios. Unmatched compositions stay open questions.
- **Everyday matter:** a leaf, window, phone, and seashell connect familiar materials to their elements.
- **Trails:** four guided, three-step questions tied to real interactions.
- **Collection:** keep compound discoveries and completed trails in this browser, with honest storage-failure handling.

The design gives visual exploration and the workbench priority. There is no sign-up, timer, score, microphone input, analytics script, or external data request from the app. Sound is off until requested. Learning links open primary reference sites.

## Run locally

Requires Node 20+ for checks and Python 3 for the small local server. There are no JavaScript dependencies to install and no build step.

```sh
python3 -m http.server 4173 --directory dist
# Open http://localhost:4173
node --test tests/*.test.js
node --check dist/app.js
```

Equivalent `npm run dev`, `npm test`, and `npm run check` commands are defined. Serve the files through HTTP; ES modules do not work reliably when opening `index.html` directly as a local file.

## Deployment

All production assets are authored and tracked in `dist/`. `vercel.json` configures a static deployment with `dist` as the output directory; no build command or secrets are required. The `.openai/hosting.json` file identifies the private Sites version. The same assets can be hosted by any static HTTP host. No API keys or backend are needed.

Keep `LICENSE.txt`, `THIRD_PARTY_NOTICES.txt`, and the font license files when redistributing the static site. Forks using ordinary static hosting can ignore `.openai/hosting.json`; an independent Sites deployment requires its own project identity. The package's `private: true` prevents accidental npm publication; it does not restrict MIT use or control GitHub visibility.

## License and contributions

Original code, authored learning content, and documentation are available under the [MIT license](LICENSE), copyright 2026 James Stewart. Bundled fonts remain OFL-licensed; imported PubChem data retains its source terms. See [third-party notices](THIRD_PARTY_NOTICES.md) and the [provenance manifest](docs/provenance.json) for attribution, retrieval details, and exact file hashes.

One useful question or correction can make a good contribution. Read the short [contribution guide](CONTRIBUTING.md), especially the scientific constraints and source expectations. The initial implementation used AI assistance; review and corrections are welcome.

## Structure

| File | Purpose |
| --- | --- |
| `dist/app.js` | Accessible UI, navigation, workbench actions, trails, collection |
| `dist/styles.css` | Responsive visual system and reduced-motion rules |
| `dist/elements.js` | Bundled 118-element data |
| `dist/chemistry.js` | Curated compound models and scientific matching rules |
| `dist/audio.js` | Bounded, opt-in Web Audio sonification |
| `docs/SCIENCE.md` | Provenance, scientific limitations, and next experiment questions |
| `scripts/generate-elements.py` | Regenerate element data from the checked-in PubChem snapshot |

Changes to scientific matching or data should retain the core guarantees in `tests/chemistry.test.js`: no invented values, no simplified molecular formulas, no fictitious molecules for extended solids, and no claim that an unmatched composition is impossible.

Validation includes chemistry checks, Hushpod's original model and processor checks, a replay of the preserved original Odd Sympathy against its collection version, and audio lifecycle regression tests. An optional browser smoke runner exercises the real pages and AudioWorklet. See [instrument architecture and contributor notes](docs/INSTRUMENTS.md), [Hushpod provenance](docs/hushpod-provenance.json), the [Odd Sympathy study record](docs/ODD_SYMPATHY.md) and [provenance](docs/odd-sympathy-provenance.json), and the [first-slice test record](docs/INSTRUMENT_TESTING.md). Real Android and iOS testing remains a release follow-up; emulation does not establish speaker quality or OS interruption behavior.

## Playable journal

Browse both Field Notes at `/journal/`, or open either directly from the homepage. The Journal keeps focused investigations separate from the three full instruments. The collection pages are complete static HTML and remain browsable without JavaScript. To edit a collection, update `dist/instruments/catalog.js`, `dist/journal/catalog.js`, or the template in `scripts/render-collections.mjs`, then run `npm run render:collections` and commit the generated HTML. `npm run check` catches stale pages; hosting still requires no build step.

[The Sound That Was Still There](dist/journal/hushpod/index.html) is a focused Hushpod research story at `/journal/hushpod/`. Compare oscillator action with the actual combined pickup, prepare different starting phases, and break cancellation by narrowing a waist. Sound is opt-in. [Reproduction, evidence and testing gaps](docs/JOURNAL_HUSHPOD.md).

[The Ring That Will Not Close](dist/journal/ring/index.html) is Field Note 002 at `/journal/ring/`. Push one voice of a twelve-voice ring of fifths and compare where a roughness ear and a quadratic ear leave the Pythagorean comma. It runs the archived Study 02 ring core unchanged and links to an unchanged copy of the full Round 4 instrument. Sound is opt-in. [Reproduction, evidence and testing gaps](docs/JOURNAL_RING.md).

`npm run test:journal:browser` runs the optional focused Playwright suite (development dependency only; see the verification record for setup and current execution gaps). `npm run test:journal:ring:browser` does the same for the Ring.

`npm run test:collections:browser` checks the homepage and Journal at desktop, phone, narrow-phone, tablet and landscape sizes, plus legacy navigation, history, keyboard, reduced motion and no-JavaScript browsing. The GitHub verification workflow runs this alongside all three existing browser suites; its `collection-screenshots` artifact contains the desktop and phone captures.

See the [homepage verification record](docs/HOMEPAGE_TESTING.md) for navigation details, desktop/phone-layout captures, and current browser/device testing limits.
