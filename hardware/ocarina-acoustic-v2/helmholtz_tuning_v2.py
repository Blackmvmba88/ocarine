#!/usr/bin/env python3
"""First-order multi-aperture Helmholtz sizing for BM-OC-002.

This is deliberately a calibration model. It sizes pilot holes from acoustic
conductance; the final diameters must be reached experimentally on a printed
prototype because the jet/labium and real end corrections shift pitch.
"""

from __future__ import annotations

import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DESIGN_PATH = ROOT / "acoustic_design_v2.json"
REPORT_PATH = ROOT / "acoustic_report_v2.json"


def circular_conductance(diameter_m: float, length_m: float, end_factor: float) -> float:
    area = math.pi * (diameter_m / 2.0) ** 2
    effective_length = length_m + end_factor * diameter_m / 2.0
    return area / effective_length


def rectangular_conductance(width_m: float, length_m: float, neck_m: float, end_factor: float) -> float:
    area = width_m * length_m
    equivalent_radius = math.sqrt(area / math.pi)
    effective_length = neck_m + end_factor * equivalent_radius
    return area / effective_length


def required_conductance(frequency_hz: float, volume_m3: float, speed_m_s: float) -> float:
    return volume_m3 * (2.0 * math.pi * frequency_hz / speed_m_s) ** 2


def frequency_from_conductance(conductance_m: float, volume_m3: float, speed_m_s: float) -> float:
    return speed_m_s / (2.0 * math.pi) * math.sqrt(conductance_m / volume_m3)


def diameter_for_conductance(target_m: float, wall_m: float, end_factor: float) -> float:
    low, high = 0.00025, 0.020
    for _ in range(96):
        middle = (low + high) / 2.0
        if circular_conductance(middle, wall_m, end_factor) < target_m:
            low = middle
        else:
            high = middle
    return (low + high) / 2.0


def build_report(design: dict) -> dict:
    acoustics = design["acoustics"]
    voicing = design["voicing"]
    manufacturing = design["manufacturing"]
    speed = acoustics["speed_of_sound_m_s"]
    end_factor = acoustics["end_correction_factor"]
    volume = design["cavity"]["target_volume_cc"] * 1e-6
    finger_wall = acoustics["finger_hole_effective_wall"] * 1e-3

    permanent = rectangular_conductance(
        voicing["window_width"] * 1e-3,
        voicing["window_length"] * 1e-3,
        voicing["effective_window_length"] * 1e-3,
        end_factor,
    )
    predicted_closed = frequency_from_conductance(permanent, volume, speed)
    closed_target = acoustics["closed_note"]
    previous_required = required_conductance(closed_target["frequency_hz"], volume, speed)
    cumulative = permanent
    holes = []

    for hole in acoustics["opening_order"]:
        total_required = required_conductance(hole["frequency_hz"], volume, speed)
        incremental = max(total_required - previous_required, 1e-12)
        target_diameter = diameter_for_conductance(incremental, finger_wall, end_factor)
        pilot_diameter = max(
            1.0e-3,
            target_diameter - manufacturing["pilot_hole_reduction"] * 1e-3,
        )
        cumulative += circular_conductance(target_diameter, finger_wall, end_factor)
        predicted = frequency_from_conductance(cumulative, volume, speed)
        cents = 1200.0 * math.log2(predicted / hole["frequency_hz"])
        holes.append({
            **hole,
            "target_diameter_mm": round(target_diameter * 1e3, 3),
            "pilot_diameter_mm": round(pilot_diameter * 1e3, 3),
            "first_order_prediction_hz": round(predicted, 3),
            "first_order_error_cents": round(cents, 3),
        })
        previous_required = total_required

    return {
        "revision": design["revision"],
        "model": "multi-aperture Helmholtz conductance, first order",
        "cavity_volume_cc": design["cavity"]["target_volume_cc"],
        "closed_note": closed_target,
        "predicted_closed_hz": round(predicted_closed, 3),
        "holes": holes,
        "warning": "Pilot dimensions are intentionally undersize. Tune a physical prototype by measurement; do not treat these values as concert-certified.",
    }


def main() -> None:
    design = json.loads(DESIGN_PATH.read_text(encoding="utf-8"))
    report = build_report(design)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Closed note: {report['predicted_closed_hz']} Hz")
    for hole in report["holes"]:
        print(
            f"{hole['id']} {hole['note']}: pilot {hole['pilot_diameter_mm']:.3f} mm, "
            f"target {hole['target_diameter_mm']:.3f} mm"
        )
    print(f"Wrote {REPORT_PATH}")


if __name__ == "__main__":
    main()
