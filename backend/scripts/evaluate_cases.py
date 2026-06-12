"""Evaluate classification quality against the sample cases.

Runs every sample case through the analysis function and compares predicted
case type and urgency against the expected values. Works without an API key:
if neither DEMO_MODE nor OPENAI_API_KEY is set, demo mode is enabled
automatically.

Usage:
    python scripts/evaluate_cases.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# Make the backend package importable when run as a script.
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from pydantic import ValidationError  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.sample_cases import SAMPLE_CASES  # noqa: E402


def _ensure_runnable() -> None:
    settings = get_settings()
    if not settings.demo_mode and not settings.openai_api_key:
        os.environ["DEMO_MODE"] = "true"
        get_settings.cache_clear()


def main() -> int:
    _ensure_runnable()
    from app.openai_client import AIAnalysisError, analyze_intake

    settings = get_settings()
    print(f"Evaluating {len(SAMPLE_CASES)} sample cases (demo_mode={settings.demo_mode})\n")

    total = 0
    case_type_correct = 0
    urgency_correct = 0
    validation_expected = 0
    failures: list[dict] = []
    results: list[dict] = []

    for case in SAMPLE_CASES:
        try:
            submission = case.to_submission()
        except ValidationError:
            if case.expects_validation_error:
                validation_expected += 1
                results.append({"name": case.name, "outcome": "validation_error_expected"})
            else:
                failures.append({"name": case.name, "error": "unexpected validation error"})
            continue

        try:
            analysis = analyze_intake(submission)
        except AIAnalysisError as exc:
            failures.append({"name": case.name, "error": f"{exc.code}: {exc.message}"})
            continue

        total += 1
        ct_ok = case.expected_case_type is None or analysis.case_type == case.expected_case_type
        ur_ok = case.expected_urgency is None or analysis.urgency_level == case.expected_urgency
        if ct_ok:
            case_type_correct += 1
        if ur_ok:
            urgency_correct += 1
        if not (ct_ok and ur_ok):
            failures.append(
                {
                    "name": case.name,
                    "expected_case_type": case.expected_case_type,
                    "predicted_case_type": analysis.case_type,
                    "expected_urgency": case.expected_urgency,
                    "predicted_urgency": analysis.urgency_level,
                }
            )
        results.append(
            {
                "name": case.name,
                "predicted_case_type": analysis.case_type,
                "predicted_urgency": analysis.urgency_level,
                "predicted_sol_risk": analysis.statute_of_limitations_risk,
                "case_type_ok": ct_ok,
                "urgency_ok": ur_ok,
            }
        )

    ct_acc = (case_type_correct / total * 100) if total else 0.0
    ur_acc = (urgency_correct / total * 100) if total else 0.0

    print("=" * 48)
    print(f"Total analyzed:        {total}")
    print(f"Validation-error cases: {validation_expected} (expected)")
    print(f"Case type accuracy:    {ct_acc:.1f}%  ({case_type_correct}/{total})")
    print(f"Urgency accuracy:      {ur_acc:.1f}%  ({urgency_correct}/{total})")
    print(f"Failures:              {len(failures)}")
    print("=" * 48)
    for f in failures:
        print("  -", f)

    out_path = settings.database_file.parent / "evaluation_results.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(
            {
                "total": total,
                "case_type_accuracy": ct_acc,
                "urgency_accuracy": ur_acc,
                "validation_expected": validation_expected,
                "failures": failures,
                "results": results,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\nResults written to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
