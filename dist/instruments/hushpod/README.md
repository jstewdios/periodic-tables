# Hushpod

An independent playable prototype developed by ChatGPT / Codex within a collaborative instrument study initiated and facilitated by James Stewart. Claude, Gemini, and Grok participated in the broader study; their specific contributions and original artifacts will be documented separately. This integration reuses the original October 16, 2026 model, pickup synthesis, and interaction design.

Tap a pocket to wake it, rub to feed it, and rest a finger to absorb vibration. Drag the narrow waists to control exchange. Portrait uses a vertical pod with horizontal waist gestures; landscape uses a horizontal pod. The field guide and keyboard controls are inside the instrument.

The model is three coupled nonlinear complex amplitudes, not a fluid or elastic-body solver. Its conserved quantity is oscillator action, not mechanical energy in joules. The visible skin is an illustration of that state. Sound uses one summed pickup with fixed saturation, no recordings or soundtrack.

- [Original README and scientific details](../../../docs/HUSHPOD_ORIGINAL.md)
- [Source provenance and exact hashes](../../../docs/hushpod-provenance.json)
- [Integration decisions](../../../docs/INSTRUMENTS.md)
- [Testing and mobile gaps](../../../docs/INSTRUMENT_TESTING.md)
- [MIT license](../../../LICENSE)

This directory can be served as its own static document; relative collection/license navigation expects the surrounding `dist` tree. No runtime package, build step, backend, or study archive is required to play. Host over HTTPS or localhost for AudioWorklet support.
