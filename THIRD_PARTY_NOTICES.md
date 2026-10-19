# Third-party notices

The original application code, authored diagrams, explanations, and documentation are offered under the [MIT license](LICENSE), copyright 2026 James Stewart. Imported assets and data retain their own terms below. The MIT license does not replace those terms or grant rights to third-party material.

This notice is also distributed as `dist/THIRD_PARTY_NOTICES.txt`. The production directory includes `LICENSE.txt` and both complete font licenses, so a copy of the static site carries its notices.

## Bundled fonts

| Asset | Attribution | License |
| --- | --- | --- |
| `dist/fonts/dm-sans.woff2` | Copyright 2014 The DM Sans Project Authors ([upstream](https://github.com/googlefonts/dm-fonts)) | [SIL Open Font License 1.1](dist/fonts/DM-Sans-OFL.txt) |
| `dist/fonts/manrope.woff2` | Copyright 2018 The Manrope Project Authors ([upstream](https://github.com/sharanda/manrope)) | [SIL Open Font License 1.1](dist/fonts/Manrope-OFL.txt) |

These Latin variable-font files were obtained from Google Fonts on 2026-09-06 and have not been modified by this project. Google Fonts' versioned delivery URLs and the source stylesheet request are recorded in [the provenance manifest](docs/provenance.json). License texts were retrieved from the Google Fonts `ofl/dmsans/OFL.txt` and `ofl/manrope/OFL.txt` files. The manifest records SHA-256 hashes of the exact bundled files; it does not assume a moving upstream branch will remain identical.

When distributing the fonts, preserve their copyright notices and complete OFL texts. Modified fonts must satisfy the OFL, including any applicable Reserved Font Name rules. Fonts cannot be sold by themselves. See the [official OFL text and guidance](https://openfontlicense.org/).

## PubChem factual element data

`docs/pubchem-periodic-table.json` is the unmodified 118-element response retrieved on 2026-09-06 from [PubChem PUG REST](https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON). `dist/elements.js` derives from that response. Acknowledgment: PubChem, National Center for Biotechnology Information, National Library of Medicine, National Institutes of Health, and the contributing data sources identified by PubChem.

Reuse is governed by the [NCBI policies, including Copyright Status and Molecular Data Usage](https://www.ncbi.nlm.nih.gov/home/about/policies/). NCBI places no restrictions of its own on use or distribution of its molecular data, but warns that contributors may hold rights that NCBI cannot transfer. This project therefore does **not** label all PubChem content as MIT, CC0, or universally public domain.

The retained export consists of element identifiers, numeric/factual properties, configurations, categories, and discovery years. It does not include compound-page descriptions, photographs, spectrum images, journal text, or artwork. The aggregate endpoint does not include field-level license or contributor identifiers; that limitation is recorded in `docs/provenance.json`. For additional content, inspect the specific record's sources and reuse terms before importing it. The [PubChem team's description of its periodic table](https://pmc.ncbi.nlm.nih.gov/articles/PMC8276875/) explains its integration of multiple authoritative sources.

Transformations and scientific limitations are documented in [SCIENCE.md](docs/SCIENCE.md). Keep this acknowledgment and provenance with redistributed data and derived files. The project asserts no exclusive rights over chemical facts.

## Linked references and original material

The app links to RSC element guides, IUPAC, and PubChem compound records for further reading. Their websites and linked content remain subject to their respective owners' terms; linking does not relicense them. No RSC/IUPAC artwork, screenshots, copied narrative passages, or external molecular images are bundled. The SVG diagrams and explanatory prose were authored for this application, with AI assistance, using chemical facts and cited references.

The app has no bundled third-party JavaScript packages. Platform APIs, such as Web Audio and local storage, are browser features rather than redistributed libraries. No affiliation with or endorsement by the reference organizations is implied.

## Hushpod independent prototype

`dist/instruments/hushpod/` incorporates James Stewart's owner-provided, AI-assisted Hushpod prototype, built with ChatGPT / Codex during the collaborative instrument study. The source snapshot is the October 16, 2026 version, commit `e02ad3ea211228abbf36c48c4dfc1b409907c988`. It is contributed here under this repository's MIT license at the owner's request. The supplied snapshot did not carry a separate license file; no third-party license has been overwritten or inferred for unrelated study contributions.

The model and AudioWorklet processor are imported without modification. Changes to the interface, lifecycle, and renderer are recorded in `docs/hushpod-provenance.json`; `docs/HUSHPOD_ORIGINAL.md` preserves the original README. No sampled sounds, third-party fonts, external images, or third-party JavaScript are imported with Hushpod. Its sound is synthesized, and its visual skin is drawn in Canvas. The original source download ZIP and hosting identity are not redistributed.

The broader study's original prompts, cross-reviews, and other participants' artifacts are not part of this import. Their publication and detailed study-level attribution remain separate work. This integration does not claim authorship of, or rights over, Odd Sympathy, TAUT, Phaseweave, or other independent experiments.

## Odd Sympathy independent prototype

`dist/instruments/odd-sympathy/` incorporates James Stewart's owner-provided, AI-assisted Odd Sympathy prototype, invented, revised and built by Claude (Anthropic) during the collaborative instrument study. The source is the single-file prototype published on October 16, 2026, preserved unchanged in `docs/ODD_SYMPATHY_ORIGINAL.html` (SHA-256 `d51648fc8a76ee49f55999f3bceb86f7558ea75649ec63025856ea97f348f9df`). It is contributed here under this repository's MIT license at the owner's request. The original carried no separate license file.

The simulation, setups and sound synthesis are carried over with their behavior unchanged; changes to the interface, lifecycle and renderer are recorded in `docs/odd-sympathy-provenance.json`, and the study history is summarised in `docs/ODD_SYMPATHY.md`. No sampled sounds, external images, or third-party JavaScript are imported. The original page requested the IM Fell English and Karla fonts from Google Fonts at runtime; this integration does not load or redistribute them, and instead reuses the bundled DM Sans listed above and system serif fonts. The preserved original in `docs/` still contains that font request and is an archive, not part of the deployed site.

The three reviewers who critiqued the design (recorded in the study's reviewer key as Gemini, ChatGPT and Grok) are not authors of Odd Sympathy, and their reviews are not reproduced here; they are preserved in the separate study archive under their own terms. Nothing in this import claims authorship of their contributions or of other participants' instruments.
