# Odd Sympathy — study record

Odd Sympathy is one of the independent instruments from James Stewart's collaborative instrument study, run in October 2026. This record covers how the instrument was invented, criticised, revised and built, what the playable version actually does, and what is still open. It is written for anyone who wants to understand the instrument, check its claims, or continue the work.

**Play it:** [`/instruments/odd-sympathy/`](../dist/instruments/odd-sympathy/) · **Source:** [`dist/instruments/odd-sympathy/`](../dist/instruments/odd-sympathy/) · **Original prototype:** [`ODD_SYMPATHY_ORIGINAL.html`](ODD_SYMPATHY_ORIGINAL.html) · **Provenance:** [`odd-sympathy-provenance.json`](odd-sympathy-provenance.json) · **Study archive:** [collaborative-instruments, study 001](https://github.com/jstewdios/collaborative-instruments/tree/main/studies/001-emergent-musical-toys)

## The idea in one paragraph

In 1665 Christiaan Huygens, ill in bed, noticed two pendulum clocks on one beam swinging in step; knocked apart, they found each other again. Odd Sympathy turns that moment into a toy. Each ring you draw is a clock with a bead running around it. Every bead moves at the same speed, so a ring's size sets its tempo, and its note is that tempo eight octaves up: rhythm and pitch are one quantity. Each tick sends a slow ripple outward, and a ripple that reaches another ring tugs its bead. You never set a rhythm or a note. You arrange clocks, and they negotiate.

## How the study ran

The study gave each participant the same open brief, then exposed each design to independent criticism and asked its author to revise. Four instruments came out of it: TAUT, Odd Sympathy, Hushpod and Phaseweave. Odd Sympathy's inventor, reviser and builder was Claude (Anthropic); the original conversations confirm the attribution the study archive had inferred. The stages below are summarised from those conversations and from the study archive, [jstewdios/collaborative-instruments](https://github.com/jstewdios/collaborative-instruments) (study 001), which preserves the proposal, prompts, reviews and revision byte for byte, along with the revision's simulation scripts and the build conversation's record (added in its PR #3).

### 1. Invention — October 15, 2026

The brief asked for a new kind of interactive digital toy: no scores or levels, built on exactly three rules that combine into unexpected behaviour, with sound essential rather than decorative. It had to surprise a player within 30 seconds, still reveal new interactions after hours, and be buildable in a browser. It also asked for a single committed idea, a smallest-possible prototype that would prove the central interaction was fun, and a self-critique.

The first design proposed three rules: ring size sets tempo and pitch; pulses travel slowly and fade; a pulse pushes a bead forward in proportion to how far it has travelled. It claimed five emergent effects: two similar rings snapping into unison, consonant intervals as stable locks, distance switching between unison and alternation, the smallest ring acting as conductor, and domino-like avalanches. It also proposed a multi-hour discovery, a delay-line memory built from large relay rings.

Its self-critique found a "heat death" problem: purely forward pushes should drag everything into one thump. The fix kept three rules but changed the third, so that a pulse tugs the bead toward the top along the shorter way: forward late in the lap, backward early. The proposed test was simple: give it to five people with no instructions and see whether they start *hunting*, deliberately moving and stretching rings to find locks. If no coupling strength produces hunting, the idea is dead.

### 2. Criticism — three independent reviewers

Each reviewer saw three anonymous proposals. Odd Sympathy was reviewed in Reviews A, C and D, which the study's reviewer key records as Gemini, ChatGPT and Grok. The full reviews are in the study archive. Their main points about Odd Sympathy, as the revision answered them:

- **The snap.** A and C argued that, with travel delay, the original forward-only rule cannot produce unison. D disagreed.
- **Pitch versus rhythm.** A argued that a rhythm lock at a size ratio like 1.47 plays an out-of-tune fifth if pitch comes from size, and that a single tap would make pitch jump.
- **Memory and avalanches.** A and C doubted the delay-line memory and clean domino runs.
- **Recoverability.** C pressed for whether a player can break a groove and get it back, and noted frustrated arrangements might settle after all.

### 3. Revision under criticism — October 16, 2026

Rather than argue from intuition, the revision built a small event-driven Python simulation and tested each criticism. Its main findings:

| Topic | Finding in the revision's model |
| --- | --- |
| Snap under the original rule | A and C were right. Identical rings never reached unison; they settled at a lag of about one travel time. The appeal to the classic firefly result was wrong because it assumes zero delay. |
| Consonance wells | Survived, read literally. If pitch is the measured firing rate, a 3:2 rhythm lock holds across size ratios of about 1.40–1.65 and plays an exact fifth. |
| Distance and groove | Partly wrong, partly richer. Unison and alternation were *both* stable over a middle band of distances, so the path taken mattered. None of the reviewers had predicted this hysteresis. |
| Delay-line memory, ghost notes, chimeras | Withdrawn. The tug cannot tip a ring that just fired, and the backward tug cannot carry a bead back over the top. |
| Perpetual frustration | Withdrawn. Three tangent identical rings settled. |
| Heat death | Mostly not observed. Eight random rings kept five to eight distinct rates. |
| Edge-of-lock breathing | Survived. Just outside a lock, rates alternated between locked and slipping on a roughly 20-second cycle. |

It respecified the rules exactly, raised the coupling strength, and defined pitch as the ring's measured tempo. It proposed a two-stage validation: bench checks against the model's numbers, then six to eight players comparing coupled and uncoupled builds. It also named what would end the idea: coupled and uncoupled builds producing the same hunting behaviour, or tempo-pitch proving too unpleasant to keep rhythm and pitch as one quantity.

### 4. Build — October 16, 2026

The playable prototype was built as a single HTML page from the revised design. Before building, the author ran the rules headlessly in Node to confirm unison for similar adjacent rings, alternation for separated identical rings, and 3:2 and 2:1 locks at the expected size ratios. Two deliberate departures from the revised specification were disclosed at the time:

- **A smooth tug curve.** The revision's piecewise rule was replaced with one that pulls slightly back early in the lap, pushes forward late, and barely moves a bead that has just fired. Without that, close rings set each other off in loops of extra notes.
- **Pitch from kept rhythm, smoothed per beat.** Pitch follows the tempo a ring actually keeps, as a running average of its recent beat intervals, rather than the revision's six-lap window. This keeps a locked 3:2 in tune instead of up to about 85 cents off.

That page is preserved unchanged as [`ODD_SYMPATHY_ORIGINAL.html`](ODD_SYMPATHY_ORIGINAL.html). The version in this collection runs the same rules (see below).

## The rules as built

Lengths are screen pixels multiplied by a scale `u`, fixed once from the screen size when the page loads (`u = clamp(min(width, height) / 640, 0.55, 1.5)`).

1. **Every ring is a clock, and its tempo is its voice.** Beads move at 360·u px/s, so a ring of radius r has period T = 2πr / (360·u). When a bead reaches the top, the ring fires a plucked note and a ripple. The note's frequency is 256 / T, multiplied by a correction that follows the rhythm the ring is actually keeping: a running average (weight 0.2 per beat) of its natural period divided by its actual beat interval, held between 0.85 and 1.18.
2. **Ripples are slow.** A ripple leaves the firing ring's rim and expands at 240·u px/s. It reaches another ring when it has crossed the rim-to-rim gap, with strength s = 1 − gap / (500·u). Beyond 500·u it has faded to nothing. Each ripple acts on each ring once.
3. **A ripple tugs the bead toward the top.** With φ the fraction of its lap the bead has travelled and ε the Pull setting (default 0.22), the bead moves to φ + ε·s·φ·(2φ − 1). That is a small pull back in the first half of the lap, a push forward in the second, and almost nothing just after a fire. If the push reaches the top, the ring fires early, with an accent that grows with the ripple's strength.

The simulation is event-driven: it jumps from one fire or ripple contact to the next instead of stepping in fixed time, so timing does not depend on frame rate. Two rings firing within 25 ms draw a gold "sympathy thread" between them.

## What this integration verified

These are numerical checks of the model in [`tests/odd-sympathy/model.test.mjs`](../tests/odd-sympathy/model.test.mjs), not listening tests or playtests.

- **Faithfulness.** The test loads the preserved original page, runs its own simulation and setup code, and requires identical fire times and pitches from the collection version for all six setups over 30 simulated seconds, including moves, a resize, a Pull change and a strike.
- **Two strangers** (radii 57 and 54, nearly touching) close their flam and lock one-to-one within about ten seconds. They hold a steady offset of about 2.6% of a period (roughly 26 ms) rather than exact unison.
- **Trading.** Identical rings set half a ripple-period apart settle into exact alternation at Pull 0.12, 0.22 and 0.4.
- **Near a fifth.** A size ratio of 1.52 locks to a 3:2 firing-rate ratio within 0.2%. Because pitch follows kept rhythm, the sounded interval averages within 8 cents of a pure fifth, where the size ratio alone would be about 25 cents sharp.
- **Pulling apart.** Two rings in unison, dragged slowly apart to trading distance, switch to trading beats. The hint that says so is accurate.
- **Groove memory survives, narrower.** Sweeping a pair outward, unison held until the ripple delay reached about 0.32 of a period. Sweeping inward, trading bent smoothly from an even off-beat toward unison (a swing control) and snapped to unison only near 0.2. Between those distances, history decides the groove.
- **No heat death in a crowd.** Fourteen random rings kept 11 to 14 distinct tempos after two minutes at Pull 0.22, 0.4 and 0.6.
- **No coupling, no influence.** At Pull 0 every ring keeps its exact natural period and pitch.
- **Bounded.** At maximum Pull in a deliberately overcrowded field, all times and pitches stay finite and ordered, and in the tested run no ring fired more than about 8% faster than its natural rate. Packed overlapping rings can, however, hold a large ring back almost completely: one ring fired once in a minute.

### A correction to the original

The original Tune drawer said **"The triangle can never settle."** In this model it does. Three identical rings in the Triangle setup settle within about 20 seconds into two rings together and one trading against them, at every Pull tested. This matches the revision's own finding that frustration does not guarantee perpetual motion. The drawer text now says "The triangle splits two against one." No rule was changed.

## Integration changes

The rules, setups, gestures, hint sequence, intro text and synthesized sound are the original's. The collection version adds what the [instrument contract](INSTRUMENTS.md) requires:

- Rings and ripples keep their relative positions when the field changes size, such as on rotation, so none is left outside the visible stage. The original kept absolute positions.
- Navigation back to the collection and chemistry, and an About section with keyboard help, an explanation, origins and limits.
- **Keyboard and screen-reader play.** Each ring is a button, focusable once the intro is gone: activating it (Enter, Space or a screen reader's double-tap) strikes, arrows move, + and − resize, Delete removes, N adds a ring, M mutes, T opens Tune.
- **Audio lifecycle.** Sound starts only from a gesture. Failures are visible with retry, and the rings keep playing silently. Leaving the tab suspends sound, which needs a new gesture to resume; nothing catches up while away. Navigation closes the audio context.
- **Reduced motion** removes expanding ripples, flare glows and lurch trails, and shows a tug as a brief rim brightening. Beads still turn, because they are the clocks.
- **No external requests.** The original loaded two Google Fonts. The display face now uses the original's own fallback serif stack, and body text uses the collection's bundled DM Sans.

## Open questions

The central question from the study is still untested with people: **do players start hunting?** The revision's player study remains the right next step, adapted to the built rules:

1. Give six to eight people the toy with no instructions, coupled (Pull 0.22) and uncoupled (Pull 0, ripples still drawn), five minutes each in counterbalanced order.
2. From logs, check whether most players reach a lock within a minute of drawing a second ring, whether they break and recover locks more often when coupled, whether they pause inside lock zones when resizing, and whether they are still adjusting rings after two minutes.
3. Note whether the narrower groove memory is explored or read as random, and whether the small pitch wobble of unlocked rings is pleasant or tiring.

The [original revision](#3-revision-under-criticism--october-16-2026) set out what would end the idea: if coupled and uncoupled builds produce the same hunting behaviour, or if pitch-from-tempo is too unpleasant to keep, rhythm and pitch would have to separate, and that identity is the invention.

Other untested threads: whether the smallest ring really conducts a crowd; edge-of-lock breathing under the built tug curve; and whether players discover the swing control by sliding a trading ring inward.

The collection version does not yet have the diagnostics layer or URL-set conditions the revision proposed. They would be the first additions for a player study.
