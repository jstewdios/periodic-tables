# Scientific model and provenance

This first version is an exploratory interface, not a reaction simulator. It is intentionally a small authored set of learning instruments on top of a complete table.

For redistribution terms, see [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). The [provenance manifest](provenance.json) records the exact snapshot, derived file, font assets, retrieval references, and SHA-256 hashes. The MIT license for our original code does not relicense imported data or fonts.

## Element data

- Source: [PubChem PUG REST periodic table](https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON), retrieved 2026-09-06. The unmodified response is checked in as `pubchem-periodic-table.json`.
- `scripts/generate-elements.py` derives the bundled module, preserving names, atomic numbers, the source mass strings, electron configurations, and Pauling electronegativities. The UI does not fetch a third-party data service at runtime.
- Layout uses the common 18-column table with the lanthanide and actinide series detached. These remain part of periods 6 and 7; the detached rows are not periods 9 and 10. The full series is displayed below and corresponding placeholders appear in the main table.
- Categories follow PubChem's conventional group blocks. Its broad transition category includes the d-block, including group 12. Boundaries of informal categories such as metalloids and post-transition metals vary. Superheavy classifications are flagged as predicted.
- Missing electronegativity remains `null`, is visibly hatched, is labeled missing, and is silent in the electron-pull sound mode. It must never be coerced to zero.
- State labels describe conditions near room temperature and ordinary pressure. All elements 104–118 use the deliberately conservative label **Unknown** for bulk state. The source includes predictions and some unqualified labels for elements without macroscopic samples; this UI does not present those as measured states.
- Mass strings reproduce PubChem's values, including its variable rounding and isotope-specific entries for elements lacking a standard atomic weight. They are secondary reference data, not values for analytical calculations. A future mass comparison should choose and explain a consistent IUPAC convention.
- [IUPAC periodic-table reference](https://iupac.org/what-we-do/periodic-table-of-elements/) and [RSC element guides](https://periodic-table.rsc.org/) are provided for deeper reading. Element narratives are concise original explanations.

## Workbench

There are 14 curated compositions, each linked from its result to its [PubChem compound record](https://pubchem.ncbi.nlm.nih.gov/).

| Kind | Included examples | Representation |
| --- | --- | --- |
| Discrete molecules | H2O, H2O2, CO2, CO, CH4, NH3 | Explicit, authored connectivity diagrams; flattened where necessary. |
| Ionic solids | NaCl, CaCO3, NaHCO3, MgO, Fe2O3, KCl, CaCl2 | Atom-count ratios with no fictitious molecular bonds. |
| Network solid | SiO2 | An atom-count ratio, not an isolated SiO2 molecule. |

Matching requires the exact listed count inventory. Molecular formulas are never reduced to an empirical ratio: H2O2 is not HO. Multiple copies of a formula do not match in this version; the UI tells users to use the listed ratio for solids. A match identifies a curated example with that composition, not a unique structure inferred from counts. Avoid adding formulas with multiple common isomers without extending this interaction to present the ambiguity.

The diagrams are schematic, not measured geometries or scale models. Methane and ammonia diagrams state their actual three-dimensional geometry in the caption. Peroxide is explicitly a flattened connectivity diagram. No molecular dynamics, energy minimization, reaction prediction, temperature controls, or synthesis instructions are present.

Unmatched input says it is outside the small collection. It must not imply that the composition is impossible, unstable, or nonexistent. `SiO` is a useful regression example: it is a known composition outside the curated set. The 24-atom cap is a UI limit only.

## Sonification

All sound is designed and opt-in. A browser AudioContext starts only after an explicit sound/play action.

- Families / state: main-table column determines pitch; the detached series has a separate ascending sequence. This produces repeated column pitches, not a measured atomic property.
- Electron pull: higher Pauling electronegativity gives a higher continuous pitch. Missing values are silent.
- Atomic number: proton count maps continuously to ascending pitch.
- Broad element categories select a sine or triangle timbre; these are not measured spectra.
- Playback is bounded, stops on navigation or hidden tabs, and respects Stop. No recording or microphone access exists.

## Learning and privacy

Four three-step trails track actions in memory: one extra oxygen; a family resemblance; electron attraction; and molecules versus networks. Completed trails and explicitly kept compounds persist only in local storage in the current browser. Invalid storage is ignored. Storage failures retain a session-only collection and tell the learner. No app login, external database, analytics script, upload, or network AI call is present. External learning resources open only on user request. The hosting provider receives ordinary page requests.

The everyday examples are selected connections, not exhaustive compositions. Phone materials vary by device. Window glass is not claimed to be pure SiO2, and leaves are not claimed to have one formula.

## Next experiments

Observe whether the family colors lead people to compare down a column; whether H2O to H2O2 produces a meaningful discovery; and whether ratio-only models make solid structure clearer. Add more compositions only when they support a good question. Possible next instruments include an explicit comparison view, a lattice/network diagram with a clear scale and boundary, and arrangements of the same formula.
