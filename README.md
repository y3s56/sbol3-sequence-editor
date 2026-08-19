# SBOL3 Sequence Editor

MSc project prototype: **Design and Development of a Standards-Compliant Web-Based Synthetic Biology Sequence Editor Using SBOL3 and SBOL Visual**.

## Verified stack

- React 19.2.8
- React DOM 19.2.8
- SeqViz 3.10.22
- Vite 8.2.0
- JavaScript / JSX
- HTML5 / CSS3

The project intentionally does **not** require `@vitejs/plugin-react`. Current Vite supports `.jsx` files out of the box, so removing that extra dependency avoids the `ENOTCACHED @vitejs/plugin-react` failure seen in restricted/offline environments while keeping the build simple.

## Windows quick start

Open PowerShell in this folder and run:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run dev
```

Or double-click:

```text
start-windows.cmd
```

The local site is normally available at `http://localhost:5173/`.

## Production build

```powershell
npm.cmd run build
```

Or run the full verification sequence:

```powershell
npm.cmd run verify
```

This runs the automated tests first and then creates the production bundle in `dist/`.

## If npm cannot download packages

1. Confirm internet access.
2. Confirm npm sees the registry:

```powershell
npm.cmd config get registry
```

It should display:

```text
https://registry.npmjs.org/
```

3. Clear only the npm metadata/cache if required:

```powershell
npm.cmd cache verify
```

4. Then retry:

```powershell
npm.cmd install
```

The included `.npmrc` explicitly selects the public npm registry and `prefer-online=true`.

## Implemented functionality

- DNA sequence editing and A/C/G/T/N normalisation
- Reverse complement
- Undo and redo
- Annotation manager
- SeqViz linear + circular view (`viewer="both"`)
- Sequence length and nucleotide composition
- GC and AT percentage calculations
- FASTA import/export
- Project JSON import/export
- SBOL3-oriented JSON-LD import/export
- Dark mode
- Tutorial
- Pale-purple, brown and yellow/gold project visual identity

## Automated tests

Tests use Node's built-in test runner, so they do not require an additional test framework:

```powershell
npm.cmd test
```

The test suite covers sequence cleaning, reverse complement, nucleotide counts, GC/AT calculations and empty-sequence behaviour.

## GitHub upload

```powershell
git init
git add .
git commit -m "Initial commit: SBOL3 sequence editor"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

## Standards note

The implementation provides an **SBOL3-oriented supported subset** for the sequence-and-annotation workflow. Do not describe it as complete SBOL3 conformance until exported files have been independently validated against the full specification and tested for interoperability with another SBOL implementation.


## MSc evidence workflow: unit + browser + independent SBOL validation

This repository includes three different evidence layers. Keep them separate in the dissertation:

1. **Node unit tests** — deterministic sequence, annotation and exchange utility tests.
2. **Playwright end-to-end tests** — browser-level workflows executed against Chromium, Firefox and WebKit.
3. **Independent SBOL3 validation** — the application's exported JSON-LD is parsed and validated using the independently maintained pySBOL3 implementation.

### A. Install and run the browser test suite

```powershell
npm.cmd install
npx.cmd playwright install chromium firefox webkit
npm.cmd run test:unit
npm.cmd run build
npm.cmd run test:e2e
```

The Playwright configuration defines three browser projects: Chromium, Firefox and WebKit. The same 12 end-to-end scenarios are therefore executed in each engine, for **36 browser executions** when all projects run.

Artifacts:

```text
playwright-report/index.html
test-results/playwright-results.json
```

On Windows you can instead run:

```powershell
.\scripts\run-browser-tests.ps1
```

### B. Run independent SBOL3 validation

Generate a representative export:

```powershell
npm.cmd run export:sbol:sample
```

Install pySBOL3:

```powershell
python -m pip install -r requirements-sbol.txt
```

Run the independent validator:

```powershell
python scripts\validate_sbol3.py validation-output\example.sbol3.jsonld
```

Or use:

```powershell
.\scripts\run-sbol-validation.ps1
```

**Do not claim independent SBOL3 conformance unless this validator actually parses the file and returns no relevant validation errors.** If it fails, retain the output, correct the exporter and rerun it. That engineering iteration is useful dissertation evidence.

### C. Run all configured evidence workflows

```powershell
.\scripts\run-all-evidence.ps1
```

### D. GitHub Actions

`.github/workflows/verification.yml` runs:

- unit tests and production build;
- Playwright tests on Chromium, Firefox and WebKit;
- independent pySBOL3 parsing/validation.

The SBOL validation job is intentionally strict: if the independently maintained implementation rejects the export, the job fails rather than creating a false compliance claim.

## Evidence to preserve for Chapter 5

After successful local or GitHub Actions runs, preserve:

- terminal output for `npm run test:unit`;
- Playwright HTML/JSON results;
- browser/project pass counts;
- the exported `example.sbol3.jsonld`;
- `pysbol3-validation.json`;
- any validator errors encountered and the source-code correction that resolved them;
- Git commit hashes for the tested version.

These results can then be cited in the dissertation as genuine empirical evidence.
