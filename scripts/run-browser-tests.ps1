$ErrorActionPreference = "Stop"

Write-Host "Installing npm dependencies..."
npm.cmd install

Write-Host "Installing Playwright browser engines..."
npx.cmd playwright install chromium firefox webkit

Write-Host "Running unit tests..."
npm.cmd run test:unit

Write-Host "Building production bundle..."
npm.cmd run build

Write-Host "Running Playwright tests in Chromium, Firefox and WebKit..."
npm.cmd run test:e2e

Write-Host ""
Write-Host "Browser verification complete."
Write-Host "HTML report: playwright-report\index.html"
Write-Host "JSON results: test-results\playwright-results.json"
