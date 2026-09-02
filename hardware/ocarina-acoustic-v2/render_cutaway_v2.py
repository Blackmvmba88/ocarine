"""Create a non-destructive half-section inspection render of BM-OC-002."""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parent
OUT_BLEND = ROOT / "OCARINA_ACOUSTIC_V2_CUTAWAY.blend"
OUT_PNG = ROOT / "OCARINA_ACOUSTIC_V2_CUTAWAY.png"


def activate(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def material(name, color, metallic=0.0, roughness=0.35):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
    return mat


def remove_positive_y_half(obj):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.10, 0.50, 0.0))
    cutter = bpy.context.object
    cutter.name = "BM_CUTAWAY_HALFSPACE"
    cutter.dimensions = (1.0, 1.0, 1.0)
    activate(cutter)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    modifier = obj.modifiers.new(name="BM_cutaway", type="BOOLEAN")
    modifier.operation = "DIFFERENCE"
    try:
        modifier.solver = "EXACT"
    except Exception:
        pass
    modifier.object = cutter
    activate(obj)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def add_area(name, location, energy, size, target=(0.105, 0.0, -0.002)):
    data = bpy.data.lights.new(name=name, type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)


def main():
    source_shell = bpy.data.objects.get("BM_OCARINA_SHELL_V2")
    source_labium = bpy.data.objects.get("BM_LABIUM_BLADE_V2")
    if source_shell is None or source_labium is None:
        raise RuntimeError("Run build_ocarina_acoustic_v2.py first.")

    source_shell.hide_render = True
    source_labium.hide_render = True
    shell = source_shell.copy()
    shell.data = source_shell.data.copy()
    shell.name = "BM_OCARINA_CUTAWAY_V2"
    bpy.context.scene.collection.objects.link(shell)
    remove_positive_y_half(shell)

    labium = source_labium.copy()
    labium.data = source_labium.data.copy()
    labium.name = "BM_LABIUM_CUTAWAY_V2"
    bpy.context.scene.collection.objects.link(labium)
    remove_positive_y_half(labium)

    interior = material("BM_Cutaway_Interior", (0.45, 0.015, 0.02, 1.0), metallic=0.08, roughness=0.3)
    if len(shell.data.materials) < 2:
        shell.data.materials.append(interior)

    bpy.ops.mesh.primitive_plane_add(size=0.7, location=(0.10, 0.0, -0.031))
    ground = bpy.context.object
    ground.name = "BM_Cutaway_Ground"
    ground.data.materials.append(material("BM_Cutaway_Ground_Mat", (0.006, 0.009, 0.02, 1.0), metallic=0.05, roughness=0.42))

    camera_data = bpy.data.cameras.new("BM_Cutaway_Camera")
    camera = bpy.data.objects.new("BM_Cutaway_Camera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = (0.29, 0.30, 0.125)
    camera.data.lens = 67.0
    look_at(camera, (0.105, 0.0, -0.002))
    bpy.context.scene.camera = camera

    add_area("BM_Cutaway_Key", (0.12, 0.15, 0.24), 1050.0, 0.16)
    add_area("BM_Cutaway_Rim", (0.20, -0.16, 0.14), 800.0, 0.13)
    add_area("BM_Cutaway_Fill", (-0.03, 0.02, 0.08), 430.0, 0.12)

    scene = bpy.context.scene
    if scene.world is None:
        scene.world = bpy.data.worlds.new("BM_Cutaway_World")
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.003, 0.005, 0.014, 1.0)
        background.inputs["Strength"].default_value = 0.24
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except Exception:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(OUT_PNG)

    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND))
    bpy.ops.render.render(write_still=True)
    print(f"Wrote {OUT_BLEND}")
    print(f"Wrote {OUT_PNG}")


if __name__ == "__main__":
    main()
