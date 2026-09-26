"""Render a deterministic inspection image of BM-OC-002.

Run after build_ocarina_acoustic_v2.py against the generated .blend:
  blender OCARINA_ACOUSTIC_V2.blend --background --python render_inspection_v2.py
"""

from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "OCARINA_ACOUSTIC_V2_INSPECTION.png"

scene = bpy.context.scene
camera = bpy.data.objects.get("BM_INSPECTION_CAMERA")
shell = bpy.data.objects.get("BM_OCARINA_SHELL_V2")

if camera is None or shell is None:
    raise RuntimeError("Inspection camera or BM-OC-002 shell missing")

scene.camera = camera
scene.render.filepath = str(OUTPUT)
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False

world = scene.world
world.color = (0.025, 0.025, 0.025)

bpy.ops.render.render(write_still=True)
print(f"Wrote {OUTPUT}")
