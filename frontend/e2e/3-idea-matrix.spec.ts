import {
  expect,
  test
} from '@playwright/test';

test.describe('@3. idea matrix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jars/idea-matrix');
  });

  test('@3.1 should show an empty state with no projects', async ({ page }) => {
    await expect(page.getByText('No projects yet')).toBeVisible();
  });

  test('@3.2 creating a project navigates into it with the title auto-focused', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);
    await expect(page.locator('input[data-testid="project-name"]')).toBeVisible();
  });

  test('@3.3 renaming a project is reflected on the projects list', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);
    await page.locator('input[data-testid="project-name"]').fill('Etsy AI mugs');
    await page.locator('input[data-testid="project-name"]').blur();

    await page.getByLabel('Projects').click();
    await page.waitForURL('**/jars/idea-matrix');
    await expect(page.getByTestId('project-link')).toHaveText('Etsy AI mugs');
  });

  test('@3.4 adding a variable and options, then scoring a candidate ranks it correctly', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);

    await page.getByTestId('add-axis').click();
    await page.locator('input[data-testid="axis-name"]').fill('Niche');
    await page.locator('input[data-testid="axis-name"]').blur();

    await page.locator('input[data-testid="new-axis-option"]').fill('Vintage');
    await page.getByTestId('add-axis-option').click();
    await expect(page.getByTestId('axis-option')).toHaveCount(1);

    await page.getByTestId('add-candidate').click();
    await page.locator('input[data-testid="candidate-name"]').fill('Vintage mugs');
    await page.locator('input[data-testid="candidate-name"]').blur();

    await page.getByTestId('candidate-axis-select').selectOption({ label: 'Vintage' });
    await page.getByTestId('candidate-score-demand').selectOption('5');
    await page.getByTestId('candidate-score-competition').selectOption('1');
    await page.getByTestId('candidate-score-effort').selectOption('2');
    await page.getByTestId('candidate-score-differentiation').selectOption('4');

    await expect(page.getByTestId('candidate-score')).toHaveText('6');
  });

  test('@3.5 deleting a variable clears it from any candidate row', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);

    await page.getByTestId('add-axis').click();
    await page.locator('input[data-testid="axis-name"]').blur();
    await page.getByTestId('add-candidate').click();
    await page.locator('input[data-testid="candidate-name"]').blur();

    await expect(page.getByTestId('axis')).toHaveCount(1);
    await page.getByTestId('delete-axis').click();
    await expect(page.getByTestId('axis')).toHaveCount(0);
    await expect(page.getByTestId('candidate-axis-select')).toHaveCount(0);
  });

  test('@3.6 deleting a project always asks for confirmation, even when empty', async ({ page }) => {
    let dialogShown = false;
    page.on('dialog', (dialog) => {
      dialogShown = true;
      dialog.accept();
    });

    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);
    await page.getByTestId('delete-project').click();
    await page.waitForURL('**/jars/idea-matrix');

    expect(dialogShown).toBe(true);
    await expect(page.getByText('No projects yet')).toBeVisible();
  });
});
