"""Independent SBOL3 validation using pySBOL3.

Usage:
    python scripts/validate_sbol3.py validation-output/example.sbol3.jsonld

Exit codes:
    0 = parsed and pySBOL3 reported no validation issues
    1 = parsed but validation issues were reported
    2 = file could not be parsed/read by pySBOL3
"""
from __future__ import annotations
import json
import pathlib
import sys

try:
    import sbol3
except ImportError:
    print("ERROR: pySBOL3 is not installed. Run: python -m pip install -r requirements-sbol.txt")
    sys.exit(2)

path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "validation-output/example.sbol3.jsonld")
if not path.exists():
    print(f"ERROR: file not found: {path}")
    sys.exit(2)

doc = sbol3.Document()
try:
    # Let pySBOL3 infer the RDF serialization from the .jsonld suffix.
    doc.read(path)
except Exception as exc:
    print("PY-SBOL3 PARSE: FAIL")
    print(f"{type(exc).__name__}: {exc}")
    sys.exit(2)

report = doc.validate()
summary = {
    "validator": "pySBOL3",
    "file": str(path),
    "objects": len(doc),
    "errors": len(report.errors),
    "warnings": len(report.warnings),
}
pathlib.Path("validation-output").mkdir(exist_ok=True)
pathlib.Path("validation-output/pysbol3-validation.json").write_text(
    json.dumps(summary, indent=2), encoding="utf-8"
)

print("PY-SBOL3 PARSE: PASS")
print(f"Top-level objects parsed: {len(doc)}")
print(f"Validation errors: {len(report.errors)}")
print(f"Validation warnings: {len(report.warnings)}")

if report.errors or report.warnings:
    for issue in report.errors:
        print(f"ERROR: {issue.message}")
    for issue in report.warnings:
        print(f"WARNING: {issue.message}")
    print("PY-SBOL3 VALIDATION: ISSUES FOUND")
    sys.exit(1)

print("PY-SBOL3 VALIDATION: PASS")
sys.exit(0)
