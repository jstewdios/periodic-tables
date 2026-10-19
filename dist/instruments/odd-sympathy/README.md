# Odd Sympathy

An independent playable prototype by Claude (Anthropic), developed within a collaborative instrument study initiated and facilitated by James Stewart. Three independent reviewers critiqued the design before it was revised and built. This integration keeps the October 16, 2026 prototype's rules, setups and sound unchanged.

Drag on empty space to draw a ring. Each ring is a clock: a bead circles it at a speed every ring shares, so size sets tempo, and the ring sounds that tempo eight octaves up as its note. Every tick sends a slow ripple outward, and a ripple that reaches another ring tugs its bead toward the top. Rings that start out of step pull each other into unison, into trading beats, or into simple ratios like 3:2 that are also musical intervals. Drag a ring to move it, drag its rim to resize it, tap it to strike it, and fling it at the edge to remove it. **Tune** holds the coupling strength, six setups, and the field guide. Keyboard play is described inside the instrument.

The model is an event-driven pulse-coupled oscillator field, not a simulation of physical clocks or waves. Distances are screen lengths scaled once to the screen at load. A ring's pitch follows the rhythm it actually keeps (an average of its recent beats, held within −15% to +18% of its size pitch), which is why a locked 3:2 sounds as a true fifth. Sound is synthesized locally: one filtered plucked voice per fire, a shared generated reverb, and a limiter.

- [The study record: invention, criticism, revision and build](../../../docs/ODD_SYMPATHY.md)
- [The preserved original single-file prototype](../../../docs/ODD_SYMPATHY_ORIGINAL.html)
- [Source provenance and exact hashes](../../../docs/odd-sympathy-provenance.json)
- [Integration decisions](../../../docs/INSTRUMENTS.md)
- [Testing and mobile gaps](../../../docs/INSTRUMENT_TESTING.md)
- [MIT license](../../../LICENSE)

| File | Purpose |
| --- | --- |
| `model.mjs` | The three rules and the event-driven field. No DOM or audio. |
| `setups.mjs` | The six ready-made arrangements. |
| `audio.mjs` | Plucked voices, reverb, limiter and the audio lifecycle. |
| `render.mjs` | Canvas drawing, including reduced-motion behavior. |
| `app.mjs` | Gestures, keyboard play, hints, the Tune drawer and page lifecycle. |

This directory can be served as its own static document; the collection, license and font links expect the surrounding `dist` tree. No package, build step, or backend is required. Serve over HTTPS or localhost.
