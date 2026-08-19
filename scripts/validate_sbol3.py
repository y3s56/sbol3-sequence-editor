"""Independent SBOL3 validation using pySBOL3."""

from __future__ import annotations

import json
import pathlib
import sys

try:
    import sbol3
except ImportError:
    print("ERROR: pySBOL3 is not installed.")
    sys.exit(2)

path = pathlib.Path(
    sys.argv[1]
    if len(sys.argv) > 1
    else "validation-output/example.sbol3.jsonld"
)

if not path.exists():
    print(f"ERROR: file not found: {path}")
    sys.exit(2)

doc = sbol3.Document()

try:
    doc.read(str(path))
except Exception as exc:
    print("PY-SBOL3 PARSE: FAIL")
    print(f"{type(exc).__name__}: {exc}")
    sys.exit(2)

print("PY-SBOL3 PARSE: PASS")
print(f"Top-level objects parsed: {len(doc)}")

report = doc.validate()

errors = list(report.errors)
warnings = list(report.warnings)

summary = {
    "validator": "pySBOL3",
    "file": str(path),
    "objects": len(doc),
    "errors": len(errors),
    "warnings": len(warnings),
}

output_directory = pathlib.Path("validation-output")
output_directory.mkdir(exist_ok=True)

(output_directory / "pysbol3-validation.json").write_text(
    json.dumps(summary, indent=2),
    encoding="utf-8",
)

print(f"Validation errors: {len(errors)}")
print(f"Validation warnings: {len(warnings)}")

for issue in errors:
    print(f"ERROR: {issue}")

for issue in warnings:
    print(f"WARNING: {issue}")

if errors:
    print("PY-SBOL3 VALIDATION: FAIL")
    sys.exit(1)

print("PY-SBOL3 VALIDATION: PASS")
sys.exit(0)