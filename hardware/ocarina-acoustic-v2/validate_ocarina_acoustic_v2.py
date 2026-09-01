"""Validate the generated BM-OC-002 mesh inside Blender."""

from __future__ import annotations

import json
from pathlib import Path

import bmesh
import bpy


ROOT = Path(__file__).resolve().parent
REPORT_PATH = ROOT / "geometry_validation_v2.json"


def inspect_mesh(obj):
    mesh = obj.data
    changed = mesh.validate(verbose=False, clean_customdata=True)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    non_manifold = sum(1 for edge in bm.edges if not edge.is_manifold)
    volume_m3 = abs(bm.calc_volume(signed=True))
    bm.free()
    return {
        "name": obj.name,
        "vertices": len(mesh.vertices),
        "edges": len(mesh.edges),
        "polygons": len(mesh.polygons),
        "non_manifold_edges": non_manifold,
        "mesh_validate_changed_data": bool(changed),
        "solid_volume_cm3": round(volume_m3 * 1e6, 4),
        "dimensions_mm": [round(value * 1000.0, 3) for value in obj.dimensions],
    }


def main():
    shell = bpy.data.objects.get("BM_OCARINA_SHELL_V2")
    labium = bpy.data.objects.get("BM_LABIUM_BLADE_V2")
    missing = [name for name, obj in (("shell", shell), ("labium", labium)) if obj is None]
    if missing:
        raise RuntimeError("Missing required objects: " + ", ".join(missing))

    objects = [inspect_mesh(shell), inspect_mesh(labium)]
    checks = {
        "required_objects_present": True,
        "shell_is_manifold": objects[0]["non_manifold_edges"] == 0,
        "labium_is_manifold": objects[1]["non_manifold_edges"] == 0,
        "overall_length_approximately_180_mm": 178.0 <= objects[0]["dimensions_mm"][0] <= 182.0,
    }
    report = {
        "revision": "BM-OC-002",
        "blend": bpy.data.filepath,
        "objects": objects,
        "checks": checks,
        "passed": all(checks.values()),
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not report["passed"]:
        raise RuntimeError(f"Geometry validation failed; inspect {REPORT_PATH}")


if __name__ == "__main__":
    main()
