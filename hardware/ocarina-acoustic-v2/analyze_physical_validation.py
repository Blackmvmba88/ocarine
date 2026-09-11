#!/usr/bin/env python3
"""Analyze repeatable physical tuning measurements for BM-OC-002.

The first-order Helmholtz model is only a starting point. This tool turns real
prototype measurements into an explicit promotion gate using pitch error,
repeatability and a recorded breath reference.
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DESIGN_PATH = ROOT / "acoustic_design_v2.json"
DEFAULT_MEASUREMENTS_PATH = ROOT / "physical_measurements.json"
TEMPLATE_PATH = ROOT / "physical_measurements_template.json"
DEFAULT_REPORT_PATH = ROOT / "physical_validation_report.json"


def cents_error(measured_hz: float, expected_hz: float) -> float:
    if measured_hz <= 0 or expected_hz <= 0:
        raise ValueError("frequencies must be greater than zero")
    return 1200.0 * math.log2(measured_hz / expected_hz)


def target_frequencies(design: dict[str, Any]) -> dict[str, float]:
    acoustics = design["acoustics"]
    targets = {
        acoustics["closed_note"]["name"]: float(acoustics["closed_note"]["frequency_hz"]),
    }
    for hole in acoustics["opening_order"]:
        targets[str(hole["note"])] = float(hole["frequency_hz"])
    return targets


def _number(value: Any) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    value = float(value)
    return value if math.isfinite(value) else None


def _mean_optional(rows: list[dict[str, Any]], key: str) -> float | None:
    values = [_number(row.get(key)) for row in rows]
    present = [value for value in values if value is not None]
    return statistics.fmean(present) if present else None


def analyze(design: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    if payload.get("revision") != design.get("revision"):
        raise ValueError(
            f"measurement revision {payload.get('revision')!r} does not match "
            f"design revision {design.get('revision')!r}"
        )

    targets = target_frequencies(design)
    criteria = payload.get("criteria", {})
    tolerance_cents = float(criteria.get("tolerance_cents", 10.0))
    max_std_dev_cents = float(criteria.get("max_std_dev_cents", 5.0))
    min_samples_per_note = int(criteria.get("min_samples_per_note", 3))
    require_breath_reference = bool(criteria.get("require_breath_reference", True))

    rows_by_note: dict[str, list[dict[str, Any]]] = {note: [] for note in targets}
    ignored_rows: list[dict[str, Any]] = []

    for raw in payload.get("measurements", []):
        note = str(raw.get("note", ""))
        measured_hz = _number(raw.get("measured_hz"))
        if note not in targets or measured_hz is None or measured_hz <= 0:
            if measured_hz is not None or note not in targets:
                ignored_rows.append(raw)
            continue

        row = dict(raw)
        row["measured_hz"] = measured_hz
        row["cents_error"] = cents_error(measured_hz, targets[note])
        rows_by_note[note].append(row)

    note_reports: list[dict[str, Any]] = []
    missing_notes: list[str] = []
    insufficient_samples: list[str] = []
    unstable_notes: list[str] = []
    out_of_tolerance_notes: list[str] = []
    missing_breath_reference_notes: list[str] = []

    for note, expected_hz in targets.items():
        rows = rows_by_note[note]
        if not rows:
            missing_notes.append(note)
            continue

        cents = [float(row["cents_error"]) for row in rows]
        frequencies = [float(row["measured_hz"]) for row in rows]
        mean_cents = statistics.fmean(cents)
        std_dev_cents = statistics.pstdev(cents) if len(cents) > 1 else 0.0
        mean_frequency = statistics.fmean(frequencies)
        breath_referenced = all(
            _number(row.get("breath_pressure_pa")) is not None
            or _number(row.get("breath_level")) is not None
            for row in rows
        )
        enough_samples = len(rows) >= min_samples_per_note
        repeatable = std_dev_cents <= max_std_dev_cents
        in_tolerance = abs(mean_cents) <= tolerance_cents
        accepted = (
            enough_samples
            and repeatable
            and in_tolerance
            and (breath_referenced or not require_breath_reference)
        )

        if not enough_samples:
            insufficient_samples.append(note)
        if not repeatable:
            unstable_notes.append(note)
        if not in_tolerance:
            out_of_tolerance_notes.append(note)
        if require_breath_reference and not breath_referenced:
            missing_breath_reference_notes.append(note)

        note_reports.append(
            {
                "note": note,
                "expected_hz": round(expected_hz, 6),
                "sample_count": len(rows),
                "mean_hz": round(mean_frequency, 6),
                "mean_cents_error": round(mean_cents, 3),
                "std_dev_cents": round(std_dev_cents, 3),
                "min_cents_error": round(min(cents), 3),
                "max_cents_error": round(max(cents), 3),
                "mean_breath_level": _round_optional(_mean_optional(rows, "breath_level")),
                "mean_breath_pressure_pa": _round_optional(_mean_optional(rows, "breath_pressure_pa")),
                "mean_hole_diameter_mm": _round_optional(_mean_optional(rows, "hole_diameter_mm")),
                "disposition": "in-tune" if in_tolerance else ("flat" if mean_cents < 0 else "sharp"),
                "repeatable": repeatable,
                "breath_referenced": breath_referenced,
                "accepted": accepted,
            }
        )

    completed_reports = [report for report in note_reports if report["sample_count"] > 0]
    ready = not any(
        (
            missing_notes,
            insufficient_samples,
            unstable_notes,
            out_of_tolerance_notes,
            missing_breath_reference_notes,
        )
    )

    return {
        "revision": design["revision"],
        "instrument_serial": payload.get("instrument_serial"),
        "captured_at": payload.get("captured_at"),
        "criteria": {
            "tolerance_cents": tolerance_cents,
            "max_std_dev_cents": max_std_dev_cents,
            "min_samples_per_note": min_samples_per_note,
            "require_breath_reference": require_breath_reference,
        },
        "summary": {
            "required_notes": len(targets),
            "measured_notes": len(completed_reports),
            "total_samples": sum(report["sample_count"] for report in completed_reports),
            "missing_notes": missing_notes,
            "insufficient_samples": insufficient_samples,
            "unstable_notes": unstable_notes,
            "out_of_tolerance_notes": out_of_tolerance_notes,
            "missing_breath_reference_notes": missing_breath_reference_notes,
            "max_absolute_mean_cents_error": (
                round(max(abs(report["mean_cents_error"]) for report in completed_reports), 3)
                if completed_reports
                else None
            ),
            "max_std_dev_cents": (
                round(max(report["std_dev_cents"] for report in completed_reports), 3)
                if completed_reports
                else None
            ),
            "ready_for_profile_promotion": ready,
        },
        "notes": note_reports,
        "ignored_rows": ignored_rows,
        "warning": (
            "Hole changes are coupled and irreversible. Use this report to measure direction and repeatability; "
            "do not automatically drill from a single sample."
        ),
    }


def _round_optional(value: float | None) -> float | None:
    return round(value, 3) if value is not None else None


def self_test() -> None:
    design = json.loads(DESIGN_PATH.read_text(encoding="utf-8"))
    targets = target_frequencies(design)
    rows = []
    for note, target in targets.items():
        for trial, cents in enumerate((-1.0, 0.0, 1.0), start=1):
            measured = target * (2.0 ** (cents / 1200.0))
            rows.append(
                {
                    "note": note,
                    "trial": trial,
                    "measured_hz": measured,
                    "breath_level": 0.55,
                    "hole_diameter_mm": 4.0 if note != "C5" else None,
                }
            )

    payload = {
        "revision": design["revision"],
        "criteria": {
            "tolerance_cents": 10.0,
            "max_std_dev_cents": 5.0,
            "min_samples_per_note": 3,
            "require_breath_reference": True,
        },
        "measurements": rows,
    }
    report = analyze(design, payload)
    assert report["summary"]["ready_for_profile_promotion"] is True
    assert report["summary"]["total_samples"] == len(targets) * 3
    print("physical validation self-test: PASS")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "measurements",
        nargs="?",
        type=Path,
        default=DEFAULT_MEASUREMENTS_PATH,
        help=f"measurement JSON (default: {DEFAULT_MEASUREMENTS_PATH.name})",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_REPORT_PATH)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return

    if not args.measurements.exists():
        raise SystemExit(
            f"Missing {args.measurements}. Copy {TEMPLATE_PATH.name} to "
            f"{DEFAULT_MEASUREMENTS_PATH.name} and fill real measurements first."
        )

    design = json.loads(DESIGN_PATH.read_text(encoding="utf-8"))
    payload = json.loads(args.measurements.read_text(encoding="utf-8"))
    report = analyze(design, payload)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    summary = report["summary"]
    print(f"BM-OC-002 samples: {summary['total_samples']}")
    for note in report["notes"]:
        print(
            f"{note['note']}: {note['mean_hz']:.3f} Hz, "
            f"{note['mean_cents_error']:+.2f} cents, "
            f"sigma={note['std_dev_cents']:.2f}, "
            f"{'PASS' if note['accepted'] else 'HOLD'}"
        )
    print(
        "Profile promotion: "
        + ("READY" if summary["ready_for_profile_promotion"] else "HOLD — more tuning/measurement required")
    )
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
