import { test, expect } from '@playwright/test';

async function goTo(page, name) {
  await page.getByRole('button', { name, exact: true }).click();
}

test('01 application loads with project dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SBOL3 Sequence Editor' })).toBeVisible();
  await expect(page.getByText('Standards-aware synthetic biology workspace')).toBeVisible();
  await expect(page.getByText('Project status')).toBeVisible();
  await expect(page.getByText('Ready', { exact: true })).toBeVisible();
});

test('02 Load Example creates expected project and annotations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load Example', exact: true }).click();
  await expect(page.locator('input').filter({ has: page.locator('') }).first()).toHaveValue('Example Genetic Construct');
  await expect(page.getByText('Example loaded', { exact: true })).toBeVisible();
  await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
});

test('03 DNA edit updates statistics and undo/redo restores states', async ({ page }) => {
  await page.goto('/');
  await goTo(page, 'DNA Editor');
  const editor = page.getByPlaceholder('Enter A, C, G, T or N');
  const original = await editor.inputValue();

  await editor.fill('ACGTACGT');
  await expect(editor).toHaveValue('ACGTACGT');
  await expect(page.getByText('8', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(editor).toHaveValue(original);

  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(editor).toHaveValue('ACGTACGT');
});

test('04 reverse complement executes from DNA Editor', async ({ page }) => {
  await page.goto('/');
  await goTo(page, 'DNA Editor');
  const editor = page.getByPlaceholder('Enter A, C, G, T or N');
  await editor.fill('AAGCT');
  await page.getByRole('button', { name: 'Reverse complement', exact: true }).click();
  await expect(editor).toHaveValue('AGCTT');
});

test('05 valid annotation can be added and deleted', async ({ page }) => {
  await page.goto('/');
  await goTo(page, 'Annotation Manager');

  await page.getByLabel('Name').fill('Test promoter');
  await page.getByLabel('Type').selectOption({ label: 'Promoter' });
  await page.getByLabel('Start').fill('2');
  await page.getByLabel('End').fill('8');
  await page.getByLabel('Strand').selectOption('+');
  await page.getByLabel('Notes').fill('Playwright annotation');
  await page.getByRole('button', { name: 'Add annotation', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Test promoter' })).toBeVisible();
  await expect(page.getByText('Annotation added', { exact: true })).toBeVisible();

  const card = page.getByRole('heading', { name: 'Test promoter' }).locator('..').locator('..');
  await card.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test promoter' })).toHaveCount(0);
});

test('06 out-of-range annotation is rejected', async ({ page }) => {
  await page.goto('/');
  await goTo(page, 'DNA Editor');
  const editor = page.getByPlaceholder('Enter A, C, G, T or N');
  await editor.fill('ACGTACGT');

  await goTo(page, 'Annotation Manager');
  await page.getByLabel('Name').fill('Invalid feature');
  await page.getByLabel('Start').fill('2');
  await page.getByLabel('End').fill('99');
  await page.getByRole('button', { name: 'Add annotation', exact: true }).click();

  await expect(page.getByText('Annotation exceeds sequence length', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Invalid feature' })).toHaveCount(0);
});

test('07 dark mode and tutorial work without changing project data', async ({ page }) => {
  await page.goto('/');
  const projectName = page.locator('main .hero input');
  const originalName = await projectName.inputValue();

  await page.getByRole('button', { name: 'Dark Mode', exact: true }).click();
  await expect(page.locator('.app')).toHaveClass(/dark/);
  await expect(projectName).toHaveValue(originalName);

  await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build your first DNA construct' })).toBeVisible();
  await page.getByRole('button', { name: 'Start editing', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build your first DNA construct' })).toHaveCount(0);
});

test('08 FASTA export downloads and re-import preserves sequence', async ({ page }) => {
  await page.goto('/');
  await goTo(page, 'DNA Editor');
  const editor = page.getByPlaceholder('Enter A, C, G, T or N');
  await editor.fill('AACCGGTT');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export FASTA', exact: true }).click();
  const download = await downloadPromise;
  const fastaPath = await download.path();
  expect(download.suggestedFilename()).toMatch(/\.fasta$/);

  await page.getByRole('button', { name: 'New Project', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(fastaPath);
  await expect(page.getByText('FASTA imported', { exact: true })).toBeVisible();

  await goTo(page, 'DNA Editor');
  await expect(editor).toHaveValue('AACCGGTT');
});

test('09 Project JSON export/re-import preserves sequence and annotations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load Example', exact: true }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Project', exact: true }).click();
  const download = await downloadPromise;
  const projectPath = await download.path();

  await page.getByRole('button', { name: 'New Project', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(projectPath);
  await expect(page.getByText('Project imported', { exact: true })).toBeVisible();

  await goTo(page, 'Annotation Manager');
  await expect(page.getByRole('heading', { name: 'Promoter' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Coding sequence' })).toBeVisible();
});

test('10 SBOL3-oriented export/re-import preserves supported subset', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load Example', exact: true }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export SBOL3', exact: true }).click();
  const download = await downloadPromise;
  const sbolPath = await download.path();
  expect(download.suggestedFilename()).toMatch(/\.sbol3\.jsonld$/);

  await page.getByRole('button', { name: 'New Project', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles(sbolPath);
  await expect(page.getByText('SBOL3 imported', { exact: true })).toBeVisible();

  await goTo(page, 'Annotation Manager');
  await expect(page.getByRole('heading', { name: 'Promoter' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Coding sequence' })).toBeVisible();
});

test('11 visualisation view loads for a non-empty sequence', async ({ page }) => {
  await page.goto('/');
  await goTo(page, 'Visualisation');
  await expect(page.getByRole('heading', { name: 'SeqViz Visualisation' })).toBeVisible();
  await expect(page.getByText(/SeqViz renders the active sequence/)).toBeVisible();
  await expect(page.locator('.seqvizShell')).toBeVisible();
});

test('12 malformed imported project reports an error without crashing', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"not":"supported"}')
  });
  await expect(page.getByText(/Import failed:/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'SBOL3 Sequence Editor' })).toBeVisible();
});
