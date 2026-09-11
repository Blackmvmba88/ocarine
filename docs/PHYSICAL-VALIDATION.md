# BlackMamba Ocarina — physical validation gate

This document defines the minimum evidence required before an instrument profile can move from `reference` to `validated`.

## Reference fingering

The current six-hole C profile follows the natural-note relationships shown in STL Ocarina's **Complete Fingering Chart for 6 Hole Ocarina in C Major**:

https://cdn.shopify.com/s/files/1/0103/7756/0119/files/6_Hole_C_Major_Chart.pdf?6941=

The source also states that the actual sounding pitch depends on the specific product. For that reason the software keeps fingering semantics separate from physical pitch validation.

## Hole order used by the app

```text
0  front-upper-left
1  front-upper-right
2  front-lower-left
3  front-lower-right
4  thumb-left
5  thumb-right
```

`true` means covered.

Before manufacturing, compare this coordinate convention with the production 3D model so the rendered holes and the physical finger positions cannot silently diverge.

## Bench validation procedure

For every note in the target profile:

1. Warm the instrument to normal playing temperature.
2. Record the physical instrument ID and approximate ambient temperature.
3. Use the documented fingering without changing the hole order.
4. Play a stable tone with repeatable breath pressure.
5. Measure sounding frequency with a tuner or pitch detector.
6. Capture at least five stable readings per note.
7. Record the measured octave; do not infer it from the written fingering chart.
8. Calculate cents error against the intended concert-pitch target.
9. Repeat any note with unstable attack or obvious breath-pressure drift.

The helper module `src/core/instrumentValidation.ts` provides frequency-to-cents conversion and a profile-level completeness/tolerance summary.

## Initial BlackMamba acceptance target

For the first physical prototype the engineering target is:

- every required natural note measured;
- median stable pitch within ±10 cents of its intended target;
- no note promoted as validated from a single reading;
- sounding octave explicitly recorded;
- hole ordering confirmed against the production model;
- breath behavior checked after ambient microphone calibration.

The ±10-cent value is a BlackMamba project target for the prototype, not a universal claim about commercial ocarina tolerances.

## Promotion rule

A profile can move to `validated` only when the repository contains physical measurement evidence for the exact instrument/profile combination. A published fingering chart is enough for `reference` status, but not for `validated` status.

## Next physical slice

The next useful artifact is a calibration capture containing:

```text
instrument id
profile id
ambient temperature
note
fingering
expected Hz
measured Hz
cents error
trial number
breath level / observation
```

That dataset will let the digital tutor, MIDI export and eventual production 3D body share the same measured instrument truth.
