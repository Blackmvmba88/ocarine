"""Build BM-OC-002 as a hollow Blender model with playable air path.

Run inside Blender:
  blender --background --python build_ocarina_acoustic_v2.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parent
DESIGN = json.loads((ROOT / "acoustic_design_v2.json").read_text(encoding="utf-8"))
REPORT = json.loads((ROOT / "acoustic_report_v2.json").read_text(encoding="utf-8"))
MM = 0.001
COLLECTION_NAME = "BM_OCARINA_ACOUSTIC_V2"


def activate(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def apply_transform(obj):
    activate(obj)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def material(name, color, metallic=0.0, roughness=0.3):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
    return mat


def move_to_collection(obj, collection):
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    collection.objects.link(obj)


def ellipsoid(name, center_mm, axes_mm, collection):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=64, location=[v * MM for v in center_mm])
    obj = bpy.context.object
    obj.name = name
    obj.scale = tuple(axis * MM / 2.0 for axis in axes_mm)
    apply_transform(obj)
    move_to_collection(obj, collection)
    return obj


def cone_x(name, length_mm, diameter_start_mm, diameter_end_mm, center_mm, collection):
    bpy.ops.mesh.primitive_cone_add(
        vertices=96,
        radius1=diameter_start_mm * MM / 2.0,
        radius2=diameter_end_mm * MM / 2.0,
        depth=length_mm * MM,
        location=[v * MM for v in center_mm],
        rotation=(0.0, math.radians(90.0), 0.0),
    )
    obj = bpy.context.object
    obj.name = name
    apply_transform(obj)
    move_to_collection(obj, collection)
    return obj


def box(name, center_mm, dimensions_mm, collection, rotation_y=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=[v * MM for v in center_mm])
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = tuple(v * MM for v in dimensions_mm)
    obj.rotation_euler.y = rotation_y
    apply_transform(obj)
    move_to_collection(obj, collection)
    return obj


def box_between(name, start_mm, end_mm, width_mm, height_mm, collection):
    start = Vector(start_mm)
    end = Vector(end_mm)
    delta = end - start
    center = (start + end) / 2.0
    length = delta.length
    rotation_y = math.atan2(-delta.z, delta.x)
    return box(name, center, [length, width_mm, height_mm], collection, rotation_y)


def cylinder_z(name, center_mm, diameter_mm, depth_mm, collection):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=64,
        radius=diameter_mm * MM / 2.0,
        depth=depth_mm * MM,
        location=[v * MM for v in center_mm],
    )
    obj = bpy.context.object
    obj.name = name
    apply_transform(obj)
    move_to_collection(obj, collection)
    return obj


def boolean(target, cutter, operation, label):
    modifier = target.modifiers.new(name=label, type="BOOLEAN")
    modifier.operation = operation
    try:
        modifier.solver = "EXACT"
    except Exception:
        pass
    modifier.object = cutter
    activate(target)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def labium_prism(name, collection):
    # Triangular section in X/Z, extruded across Y. The upstream point is the blade.
    points_xz = [(84.8, -15.1), (88.0, -21.5), (88.0, -11.0)]
    half_y = 4.0
    vertices = []
    for y in (-half_y, half_y):
        vertices.extend([(x * MM, y * MM, z * MM) for x, z in points_xz])
    faces = [
        (0, 2, 1), (3, 4, 5),
        (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5),
    ]
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj


def reset_collection():
    old = bpy.data.collections.get(COLLECTION_NAME)
    if old:
        for obj in list(old.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(old)
    collection = bpy.data.collections.new(COLLECTION_NAME)
    bpy.context.scene.collection.children.link(collection)
    return collection


def main():
    collection = reset_collection()
    blue = material("BM_Cobalt_Ceramic_V2", (0.015, 0.055, 0.55, 1.0), metallic=0.12, roughness=0.18)
    dark = material("BM_Labium_Dark_V2", (0.004, 0.009, 0.06, 1.0), metallic=0.05, roughness=0.24)

    outer = DESIGN["outer"]
    shell = ellipsoid(
        "BM_OCARINA_SHELL_V2",
        [outer["body_center_x"], 0.0, 0.0],
        outer["body_axes"],
        collection,
    )
    mouthpiece = cone_x(
        "BM_MOUTHPIECE_OUTER_V2",
        outer["mouthpiece_length"],
        outer["mouthpiece_tip_diameter"],
        outer["mouthpiece_base_diameter"],
        [outer["mouthpiece_length"] / 2.0, 0.0, 0.0],
        collection,
    )
    boolean(shell, mouthpiece, "UNION", "BM_union_mouthpiece")

    cavity = DESIGN["cavity"]
    inner = ellipsoid("CUT_INNER_CAVITY", cavity["center"], cavity["axes"], collection)
    boolean(shell, inner, "DIFFERENCE", "BM_hollow_cavity")

    voicing = DESIGN["voicing"]
    windway = box_between(
        "CUT_WINDWAY",
        voicing["windway_start"],
        voicing["windway_end"],
        voicing["windway_width"],
        voicing["windway_height"],
        collection,
    )
    boolean(shell, windway, "DIFFERENCE", "BM_cut_windway")

    window = box(
        "CUT_VOICE_WINDOW",
        voicing["window_center"],
        [voicing["window_length"], voicing["window_width"], 18.0],
        collection,
    )
    boolean(shell, window, "DIFFERENCE", "BM_cut_voice_window")

    for hole in REPORT["holes"]:
        x, y, z = hole["center"]
        pilot = cylinder_z(
            f"CUT_{hole['id']}_{hole['note']}",
            [x, y, z],
            hole["pilot_diameter_mm"],
            28.0,
            collection,
        )
        boolean(shell, pilot, "DIFFERENCE", f"BM_cut_{hole['id']}")

    labium = labium_prism("BM_LABIUM_BLADE_V2", collection)
    labium.data.materials.append(dark)
    shell.data.materials.append(blue)
    for poly in shell.data.polygons:
        poly.use_smooth = True

    shell["bm_revision"] = DESIGN["revision"]
    shell["cavity_target_cc"] = cavity["target_volume_cc"]
    shell["closed_note"] = DESIGN["acoustics"]["closed_note"]["name"]
    shell["prototype_warning"] = "Calibration prototype; enlarge pilot holes only after tuner measurements."

    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "MILLIMETERS"
    blend_path = ROOT / "OCARINA_ACOUSTIC_V2.blend"
    glb_path = ROOT / "OCARINA_ACOUSTIC_V2.glb"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.objects:
        if obj.type == "MESH":
            obj.select_set(True)
    bpy.context.view_layer.objects.active = shell
    bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format="GLB", use_selection=True)
    print(f"Wrote {blend_path}")
    print(f"Wrote {glb_path}")


if __name__ == "__main__":
    main()
