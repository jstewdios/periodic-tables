# Periodic Tables

A playground for playable scientific and musical instruments. Discover patterns in the elements, explore compounds, catch and reveal vibration with Hushpod, or let ring clocks pull each other into rhythm and harmony with Odd Sympathy.

[Try the current app](https://periodic-tables-pied.vercel.app/) · [Contribute](CONTRIBUTING.md) · [MIT license](LICENSE)

The registered primary domain is [periodictables.xyz](https://periodictables.xyz/); use the Vercel link until its HTTPS setup is confirmed.

## The first collection

Open **Instruments** in the chemistry navigation, or go straight to `/instruments/`. The collection currently contains chemistry, **Hushpod**, a self-contained, touch-playable coupled-resonator prototype, and **Odd Sympathy**, a field of pulse-coupled ring clocks where size is tempo and tempo is pitch. Each keeps its own interface, source, and credits. Existing chemistry URLs and saved discoveries are unchanged.

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
