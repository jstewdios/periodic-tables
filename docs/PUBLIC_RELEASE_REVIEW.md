# Public-release preparation review

Reviewed 2026-09-06 against GitHub `main` at `44b2df5f04eac3bae21b5eca30b0a092f8f81697`.

## Scope and evidence

GitHub's reference listing contained `refs/heads/main` and `refs/pull/1/head`, with no tags or other branch tips. The complete reachable ancestry contained three commits and two distinct file trees:

| Commit | Contents |
| --- | --- |
| `b5a3e0d9e8fea87f36ccf1fe6cb1b9f0a279e232` | Initial README only; inspected separately. |
| `ef6870e9c5989bddab417abd76773c4f696ad0a6` | First implementation; 20 tracked files. |
| `44b2df5f04eac3bae21b5eca30b0a092f8f81697` | Merge of PR #1; identical implementation tree. |

The local implementation's Git tree matched GitHub's `92d1bccda43b58b656df3ebbc861e0a57263be44` exactly, covering names, bytes, and modes, including the two font binaries. Its 18 text files were scanned for private keys, common GitHub/AWS token formats, bearer credentials, credential-bearing URLs, quoted secret assignments, email addresses, and private local paths. The scan returned no matches. Tracked paths, configuration, notices, and source provenance were reviewed. The initial README contained no sensitive material.

No `.env` files, credentials, private recordings, user databases, or analytics exports were present in the reviewed trees. The `.openai/hosting.json` identifier is a hosting project identifier, not a credential. It is retained for the existing Site, with fork guidance in CONTRIBUTING.md.

This is a review of the returned Git refs, their reachable source history, and commit metadata. It does not cover inaccessible/dangling server objects, provider logs, account secrets, future commits, or a full application security audit. No history was rewritten and no repository visibility was changed.

## Publication decision: commit email

All three reviewed commits contain the maintainer's personal email in author and/or committer metadata. The address is deliberately not repeated here. Making this history public will expose that metadata.

Before switching visibility, decide whether to keep the history as-is or prepare a clean history using a GitHub-provided noreply address. Changing an account's email privacy setting or adding `.mailmap` does not remove addresses already stored in raw commits. A rewrite would need to account for retained branch/PR refs and should be planned separately; it is not part of this preparation pass. Connector-created commits may also inherit the account email, so check the final branch history as part of that decision.

## Licensing and provenance

- MIT added for original application code, authored content, and documentation; package metadata and deployed license copy included.
- DM Sans and Manrope retain their existing complete OFL 1.1 notices; exact file hashes and acquisition references are recorded.
- PubChem's original response and generated data are attributed separately, with NCBI policy links and explicit limits on blanket licensing claims.
- License and third-party notices are available from the app's Sources dialog and are included in `dist/` for static-site redistribution.
- CONTRIBUTING.md describes small question-led contributions, scientific constraints, source attribution, and the inbound MIT license.

## Domain and final release steps

The intended primary address is [periodictables.xyz](https://periodictables.xyz/). During this pass, the existing [Vercel deployment](https://periodic-tables-pied.vercel.app/) returned HTTP 200 with the expected title; the new domain returned HTTP 502 from this environment. This does not establish whether DNS, Vercel configuration, propagation, or the checking environment is responsible.

The README records both addresses. Canonical metadata and redirects are deferred until the custom domain is confirmed working. Connect the registered domain to the existing Vercel project, follow Vercel's displayed DNS instructions, and confirm HTTPS before making it the sole advertised link.

After merging the preparation PR: resolve the commit-email preference, confirm the desired public history, then change repository visibility when ready. Before classroom promotion, run the documented browser/device checks; this preparation pass does not certify classroom suitability or replace scientific review.
