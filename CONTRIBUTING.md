# Contributing to Periodic Tables

Every instrument or trail should help someone notice something, ask a better question, or correct a misconception.

Small contributions are welcome: one clearer explanation, a scientific correction with a source, a keyboard or touch fix, or a short trail with a good question. You do not need to be a developer to suggest an improvement through [an issue](https://github.com/jstewdios/periodic-tables/issues).

## Propose a question

For a new trail, tell us:

1. What question starts the exploration?
2. What does the learner actually do or compare?
3. What might they notice, and what misconception should we avoid?
4. Which primary source supports the explanation?

For a bug, include what you did, what happened, what you expected, and your browser/device. Screenshots help with layout issues. Omit private information, student details, and credentials. Discuss substantial new instruments in an issue before a large implementation.

## Make a focused change

Fork the repository, create a branch, and serve the site locally:

```sh
python3 -m http.server 4173 --directory dist
```

Open `http://localhost:4173`. No JavaScript dependencies or API keys are needed. Production source lives in `dist/`; see [README.md](README.md) for the file map. Vercel and ordinary static servers do not use the maintainer's `.openai/hosting.json`; leave that identity unchanged in contributions. For an independent Sites deployment, create your own Site identity rather than reusing it.

Check your change with Node 20+:

```sh
node --test tests/*.test.js
node --check dist/app.js
node --check dist/chemistry.js
node --check dist/elements.js
node --check dist/audio.js
```

For UI changes, try the affected flow with a keyboard and at a narrow viewport. Report what you actually checked in the pull request. Add a regression test when correcting substantive matching or data logic; prose and styling changes do not need implementation-mirroring tests.

## Keep the science honest

Read [SCIENCE.md](docs/SCIENCE.md) before changing scientific content. Keep missing values missing; preserve exact molecular counts; distinguish molecules from extended solids; and never treat an unrecognized composition as proof of impossibility. Diagrams and sound mappings must state what they represent. Cite primary sources near new facts or in the provenance documentation. More entries are useful when they support better questions.

Regenerate element data from the recorded snapshot with `python3 scripts/generate-elements.py`. Do not silently replace that snapshot. A data update needs a retrieval date, source, changed-value review, terms review, and refreshed hashes in `docs/provenance.json`.

## Rights and review

Contribute only material you have the right to share. Unless explicitly identified as third-party material with compatible terms, your original contributions are submitted under this project's [MIT license](LICENSE). Keep imported material's attribution and license in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). AI-assisted contributions are welcome; you remain responsible for verifying behavior, scientific claims, and sources. Flag material uncertainty for reviewers.

If you edit license notices, run `python3 scripts/sync-notices.py` and commit the deployed copies too. Keep discussion kind, concrete, and focused on helping people learn. This is an experimental project; review timing and feature acceptance are not guaranteed.
