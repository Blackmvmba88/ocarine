# BM-OC-002 web model

The runtime looks for the physical/digital-twin asset at:

```text
public/models/BM-OC-002.glb
```

Generate it from the acoustic prototype with:

```bash
./hardware/ocarina-acoustic-v2/apply_ocarina_acoustic_v2.command
```

The launcher now runs the acoustic calculation, Blender generation, mesh validation and cutaway render, then copies the generated `OCARINA_ACOUSTIC_V2.glb` into this directory as `BM-OC-002.glb`.

If the asset is missing, the web trainer keeps working with the procedural fallback. Once the GLB exists, `OcarinaScene` detects it and switches automatically while preserving the H1-H6 interactive overlays derived from the canonical acoustic coordinates.

Do not treat BM-OC-002 as concert-validated until a physical print has measured Hz/cents and repeatable breath-pressure data.
