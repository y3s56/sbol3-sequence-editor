$ErrorActionPreference = "Stop"

Write-Host "Generating a representative SBOL3-oriented export..."
npm.cmd run export:sbol:sample

Write-Host "Installing independent pySBOL3 validator..."
python -m pip install -r requirements-sbol.txt

Write-Host "Running independent pySBOL3 parse + validation..."
python scripts\validate_sbol3.py validation-output\example.sbol3.jsonld

Write-Host ""
Write-Host "Independent validation output: validation-output\pysbol3-validation.json"
