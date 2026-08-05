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

    await expect(page.getByTestId('candidate-score')).toHaveText('Score: 6');
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

  test('@3.7 the Random button adds a row with a valid option picked for every variable', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);

    await page.getByTestId('add-axis').click();
    await page.locator('input[data-testid="axis-name"]').fill('Niche');
    await page.locator('input[data-testid="axis-name"]').blur();
    await page.locator('input[data-testid="new-axis-option"]').fill('Vintage');
    await page.getByTestId('add-axis-option').click();

    await page.getByTestId('add-random-candidate').click();

    await expect(page.getByTestId('candidate-row')).toHaveCount(1);
    // With only one real option on the axis, any non-empty value here can
    // only be that option ("Vintage") — a <select>'s toHaveText would
    // include the empty placeholder option's text too, so value is the
    // reliable thing to assert on.
    await expect(page.getByTestId('candidate-axis-select')).toHaveValue(/.+/);
  });

  test('@3.7b locking a candidate variable toggles on and off', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);

    await page.getByTestId('add-axis').click();
    await page.locator('input[data-testid="new-axis-option"]').fill('Vintage');
    await page.getByTestId('add-axis-option').click();
    await page.getByTestId('add-candidate').click();

    const lockButton = page.getByTestId('candidate-axis-lock');
    await expect(lockButton).toHaveAttribute('aria-pressed', 'false');

    await lockButton.click();
    await expect(lockButton).toHaveAttribute('aria-pressed', 'true');

    await lockButton.click();
    await expect(lockButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('@3.7c the per-idea Random button re-rolls only the unlocked variables', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);

    await page.getByTestId('add-axis').click();
    await page.locator('input[data-testid="axis-name"]').fill('Niche');
    await page.locator('input[data-testid="axis-name"]').blur();

    await page.getByTestId('add-axis').click();
    await page.locator('input[data-testid="axis-name"]').fill('Mood');
    await page.locator('input[data-testid="axis-name"]').blur();

    const nicheAxis = page.getByTestId('axis').nth(0);
    const moodAxis = page.getByTestId('axis').nth(1);

    await nicheAxis.locator('input[data-testid="new-axis-option"]').fill('Vintage');
    await nicheAxis.getByTestId('add-axis-option').click();

    await moodAxis.locator('input[data-testid="new-axis-option"]').fill('Happy');
    await moodAxis.getByTestId('add-axis-option').click();
    await moodAxis.locator('input[data-testid="new-axis-option"]').fill('Sad');
    await moodAxis.getByTestId('add-axis-option').click();

    await page.getByTestId('add-candidate').click();

    const selects = page.getByTestId('candidate-axis-select');
    await selects.nth(0).selectOption({ label: 'Vintage' });
    const nicheValue = await selects.nth(0).inputValue();

    const lockButtons = page.getByTestId('candidate-axis-lock');
    await lockButtons.nth(0).click();
    await expect(lockButtons.nth(0)).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('candidate-randomize').click();

    // Locked "Niche" keeps its exact value; unlocked "Mood" went from
    // unselected to some real option — the point of the per-idea Random
    // button is exactly this asymmetry.
    await expect(selects.nth(0)).toHaveValue(nicheValue);
    await expect(selects.nth(1)).toHaveValue(/.+/);
  });

  test('@3.8 favoriting an axis option toggles on and off', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);

    await page.getByTestId('add-axis').click();
    await page.locator('input[data-testid="new-axis-option"]').fill('Vintage');
    await page.getByTestId('add-axis-option').click();

    const favoriteButton = page.getByTestId('axis-option-favorite');
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');

    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');

    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('@3.9 all categories are browsable by default, and searching narrows them down', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);

    await expect(page.getByTestId('category-chip')).toHaveCount(17);

    await page.getByTestId('category-search-input').fill('tennis');
    await expect(page.getByTestId('category-chip')).toHaveCount(1);
    await expect(page.getByTestId('category-chip')).toHaveText('Sports');
  });

  test('@3.10 clicking a category chip previews its options without adding anything yet', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);

    await page.getByTestId('category-search-input').fill('Sports');
    await page.getByTestId('category-chip').click();

    await expect(page.getByTestId('category-preview-option')).toHaveCount(15);
    await expect(page.getByTestId('category-add-button')).toHaveText('Add "Sports" (15) to your Categories');
    await expect(page.getByTestId('axis')).toHaveCount(0);

    await page.getByTestId('category-chip').click();
    await expect(page.getByTestId('category-preview')).toBeHidden();
  });

  test('@3.11 adding a category from the preview creates a fully-populated axis', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);

    await page.getByTestId('category-search-input').fill('Sports');
    await page.getByTestId('category-chip').click();
    await page.getByTestId('category-add-button').click();

    await expect(page.getByTestId('axis')).toHaveCount(1);
    await expect(page.getByTestId('axis-name')).toHaveText('Sports');
    await expect(page.getByTestId('axis-option')).toHaveCount(15);
    await expect(page.getByTestId('category-preview')).toBeHidden();
  });

  test('@3.12 adding a category shows a toast that disappears on its own', async ({ page }) => {
    await page.getByTestId('new-project').click();
    await page.waitForURL(/\/jars\/idea-matrix\/.+/);

    await page.getByTestId('category-search-input').fill('Sports');
    await page.getByTestId('category-chip').click();
    await page.getByTestId('category-add-button').click();

    await expect(page.getByTestId('category-added-toast')).toHaveText('"Sports" added');
    await expect(page.getByTestId('category-added-toast')).toBeHidden({ timeout: 3000 });
  });
});
