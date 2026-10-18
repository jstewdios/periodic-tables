# Hushpod

A small playable instrument for catching, hiding, and revealing vibration.

## Play

Open the hosted page and choose **Begin listening**, or tap a pocket directly.

- Tap a broad pocket to wake it.
- Rub across its skin to feed its existing vibration.
- Keep a finger or mouse still to absorb vibration.
- Drag a narrow waist up to open, down to close. On the vertical phone layout, drag right to open and left to close.
- Each waist stays where you leave it. Mouse, trackpad, multitouch, and keyboard input are supported.

To find the defining interaction: open both waists fully, tap one end, and rest on the middle for about two seconds. Lift your hand. If the ends still tremble, move a waist to hear the retained vibration. Try moving it slowly back toward its original opening.

The question mark contains brief instructions. **Inspect** shows real simulation measurements and can export recent local diagnostics. There are no accounts, uploads, or external services in the instrument code.

Keyboard: 1/2/3 tap pockets; Shift + a number damps while held. Tab to a waist and use the arrows; Home closes, End opens. M mutes, R resets, D shows diagnostics, ? opens help.

## Run locally

The hosted app includes a standalone download in its field guide. After unzipping that download, run:

```
python3 -m http.server 8000
```

Open http://localhost:8000 in a current browser. On Windows, `py -m http.server 8000` is an alternative.

For this source checkout, run `python3 -m http.server 8000 --directory dist` instead. HTTPS or localhost is needed for AudioWorklet; opening index.html directly is not the supported launch path.

There are no packages to install and no build step. Tests run with `node --test tests/*.test.mjs`.

## Simulated and approximated

The physical state is three complex amplitudes. Their relative phase controls real exchange through the two waists. Contact supplies bounded gain or damping. Each pocket's frequency rises with its own squared amplitude. The same fixed rules produce exchange, nonlinear trapping, cancellation, and quiet-middle transfer. No effect detector writes the state, schedules a spill, or restores hidden vibration.

The model uses oscillator action (sum of squared amplitudes), not a full mechanical energy in joules. Coupling conserves that action; excitation and damping are measured separately. Numerically, an exact three-site coupling map is interleaved with local phase, gain, and damping updates at 4 kHz on the audio thread. The resulting complex pickup is interpolated to the device sample rate and modulates a 220 Hz carrier. This is coherent coupled-mode synthesis, not a simulated fluid or elastic membrane.

The pickup weights are 1 / 0.35 / 1. The signal is summed first, then passes through a fixed gentle saturation for headroom; there is no automatic gain control, extra soundtrack, reverb, or independent panned voices. The volume control changes output only. Mute does not destroy stored vibration.

The skin is a Canvas drawing. Ridge displacement and brightness follow the actual local state; the carrier is slowed visually to make phase relationships visible. The drawn dimples are direct contact feedback, not additional simulated mechanics.

Compared with the revised specification, natural amplitude damping is 0.045/s instead of 0.06/s, and maximum rub gain is 1.65/s instead of 1.2/s. These make contact more immediate and retain vibration longer. The other material constants remain at the proposed values: coupling 0–4/s, nonlinear coefficient 16, hold damping 8/s, saturation 1.6, and tap action 0.0125 from rest. There is one material configuration for all interactions.

For backgrounding, all held contacts release and the audio context suspends; returning requires a new gesture to resume. This avoids stuck input and unexpected background sound. Tab suspension pauses simulation time rather than pretending to simulate elapsed wall time.

## Verification

Automated checks exercise the actual shared simulation and AudioWorklet processor: norm conservation under moving waists, natural decay, nonlinear dark-state persistence, ordinary hush preparation and release, isolated phase drift, saturating input and action accounting, sequential transfer, finite bounded stereo output, stale-contact release, and 44.1/48 kHz operation.

With the current material, an ordinary gentle impulse, 0.3 s evolution, and 2 s middle hold retained 40.6% of initial action at about -65.8 dB normalized pickup output. A six-second slow waist excursion and return retained 58.3% of its post-preparation action and returned to about -36.4 dB. These are numerical checks, not human-playtest results or guarantees for arbitrary gestures.

The Canvas renderer was inspected at desktop and portrait phone sizes. Full browser interaction and device-speaker verification remain unverified: the managed preview failed at startup with an infrastructure mount error. No browser-specific behavior was substituted to conceal that limitation.

## Files

- `dist/model.mjs`: authoritative three-resonator model.
- `dist/worklet.mjs`: audio-thread integration and pickup synthesis.
- `dist/audio.mjs`: audio activation, lifecycle, and gain.
- `dist/skin.mjs`: responsive Canvas renderer and geometry.
- `dist/app.mjs`: pointer, keyboard, accessible controls, help, and diagnostics.
- `dist/index.html`, `dist/style.css`, `dist/icon.svg`: interface.
- `tests/`: meaningful model and processor checks.

No behavioral telemetry is sent. The optional diagnostics download is generated locally by the user's browser.
