# Periodic Tables

A collection of playable learning instruments for discovering visual patterns in the elements and exploring the compounds they form.

## The first collection

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

Initial validation covers syntax, static assets, source consistency, exact formula matching, diagram inventories, trail targets, and audio mapping. Browser visual and end-to-end QA are not part of that check; verify the main flows on the devices you plan to support before a broad public launch.
