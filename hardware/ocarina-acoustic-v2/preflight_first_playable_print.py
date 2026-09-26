#!/usr/bin/env python3
"""Preflight gate for BM-OC-002 FIRST PLAYABLE PRINT.

This script does not claim acoustic validation. It checks that the canonical
design/report and the generated Blender geometry report agree well enough to
allow a first calibration print.

Run after the Blender generation/validation pass:

    python3 hardware/ocarina-acoustic-v2/preflight_first_playable_print.py

Optional explicit paths:

    python3 hardware/ocarina-acoustic-v2/preflight_first_playable_print.py \
      --glb hardware/ocarina-acoustic-v2/OCARINA_ACOUSTIC_V2.glb \
      --geometry-report hardware/ocarina-acoustic-v2/geometry_validation_v2.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DESIGN_PATH = ROOT / "acoustic_design_v2.json"
ACOUSTIC_REPORT_PATH = ROOT / "acoustic_report_v2.json"
DEFAULT_GLB = ROOT / "OCARINA_ACOUSTIC_V2.glb"
DEFAULT_GEOMETRY_REPORT = ROOT / "geometry_validation_v2.json"
OUTPUT = ROOT / "first_playable_print_preflight.json"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def close(a: float, b: float, tol: float = 1e-6) -> bool:
    return math.isclose(float(a), float(b), abs_tol=tol, rel_tol=0.0)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--glb", type=Path, default=DEFAULT_GLB)
    parser.add_argument("--geometry-report", type=Path, default=DEFAULT_GEOMETRY_REPORT)
    args = parser.parse_args()

    design = load_json(DESIGN_PATH)
    acoustic = load_json(ACOUSTIC_REPORT_PATH)

    checks: dict[str, bool] = {}
    evidence: dict[str, object] = {}

    checks["revision_is_bm_oc_002"] = design.get("revision") == "BM-OC-002"
    checks["six_opening_steps"] = len(design["acoustics"]["opening_order"]) == 6
    checks["closed_note_is_c5"] = design["acoustics"]["closed_note"]["name"] == "C5"
    checks["minimum_shell_target_at_least_3mm"] = float(design["manufacturing"]["minimum_shell_target"]) >= 3.0
    checks["windway_is_1p4_by_9p5mm"] = (
        close(design["voicing"]["windway_height"], 1.4)
        and close(design["voicing"]["windway_width"], 9.5)
    )
    checks["voice_window_is_14_by_8mm"] = (
        close(design["voicing"]["window_length"], 14.0)
        and close(design["voicing"]["window_width"], 8.0)
    )
    checks["labium_tip_is_0p45mm"] = close(design["voicing"]["labium_tip_thickness"], 0.45)

    report_holes = acoustic.get("holes", [])
    design_holes = design["acoustics"]["opening_order"]
    checks["acoustic_report_has_six_holes"] = len(report_holes) == 6
    checks["hole_ids_match_h1_h6"] = [h.get("id") for h in report_holes] == [f"H{i}" for i in range(1, 7)]
    checks["hole_notes_match_design"] = [h.get("note") for h in report_holes] == [h["note"] for h in design_holes]
    checks["pilot_holes_are_undersize"] = all(
        float(h["pilot_diameter_mm"]) < float(h["target_diameter_mm"]) for h in report_holes
    )

    geometry_ok = False
    if args.geometry_report.exists():
        geometry = load_json(args.geometry_report)
        geometry_ok = (
            geometry.get("revision") == "BM-OC-002"
            and bool(geometry.get("passed"))
            and bool(geometry.get("checks", {}).get("shell_is_manifold"))
            and bool(geometry.get("checks", {}).get("labium_is_manifold"))
            and bool(geometry.get("checks", {}).get("overall_length_approximately_180_mm"))
        )
        evidence["geometry_report"] = str(args.geometry_report)
        evidence["geometry_report_passed"] = bool(geometry.get("passed"))
    checks["generated_geometry_report_passes"] = geometry_ok

    glb_ok = args.glb.exists() and args.glb.is_file() and args.glb.stat().st_size > 0
    checks["production_glb_exists"] = glb_ok
    if glb_ok:
        evidence["glb"] = str(args.glb)
        evidence["glb_size_bytes"] = args.glb.stat().st_size
        evidence["glb_sha256"] = sha256(args.glb)

    passed = all(checks.values())
    result = {
        "revision": "BM-OC-002",
        "gate": "FIRST_PLAYABLE_PRINT",
        "scope": "manufacturing preflight only; not acoustic validation",
        "checks": checks,
        "evidence": evidence,
        "passed": passed,
        "next_action": (
            "PRINT_CALIBRATION_PROTOTYPE"
            if passed
            else "HOLD_AND_FIX_PREFLIGHT"
        ),
        "physical_validation_required_after_print": True,
    }
    OUTPUT.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
