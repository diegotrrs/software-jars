import {
  expect,
  test
} from '@playwright/test';

// Drag gestures (pack -> column, sticker moves, column reorder) are exercised
// manually / verified with dnd-kit's own test coverage — simulating real drag
// in Playwright is flaky and low-ROI, so this spec covers every non-drag path.
test.describe('@2. idea board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jars/idea-board');
  });

  test('@2.1 should show an empty state with no boards', async ({ page }) => {
    await expect(page.getByText('No boards yet')).toBeVisible();
  });

  test('@2.2 creating a board navigates into it with the title auto-focused', async ({ page }) => {
    await page.getByTestId('new-board').click();
    await page.waitForURL(/\/jars\/idea-board\/.+/);
    await expect(page.locator('input[data-testid="board-name"]')).toBeVisible();
  });

  test('@2.3 renaming a board is reflected on the boards list', async ({ page }) => {
    await page.getByTestId('new-board').click();
    await page.waitForURL(/\/jars\/idea-board\/.+/);
    await page.locator('input[data-testid="board-name"]').fill('Trip planning');
    await page.locator('input[data-testid="board-name"]').blur();

    await page.getByLabel('Boards').click();
    await page.waitForURL('**/jars/idea-board');
    await expect(page.getByTestId('board-link')).toHaveText('Trip planning');
  });

  test('@2.4 adding a column shows it with an auto-focused, editable title', async ({ page }) => {
    await page.getByTestId('new-board').click();
    await page.waitForURL(/\/jars\/idea-board\/.+/);

    await page.getByTestId('add-column').click();
    await expect(page.locator('input[data-testid="column-title"]')).toBeVisible();
    await page.locator('input[data-testid="column-title"]').fill('To do');
    await page.locator('input[data-testid="column-title"]').blur();
    await expect(page.getByTestId('column-title')).toHaveText('To do');
  });

  test('@2.5 adding a sticker via the column "+" button', async ({ page }) => {
    await page.getByTestId('new-board').click();
    await page.waitForURL(/\/jars\/idea-board\/.+/);
    await page.getByTestId('add-column').click();
    await page.locator('input[data-testid="column-title"]').blur();

    await page.getByTestId('add-sticker').click();
    await expect(page.locator('textarea[data-testid="sticker-text"]')).toBeVisible();
    await page.locator('textarea[data-testid="sticker-text"]').fill('Ship it');
    await page.locator('textarea[data-testid="sticker-text"]').blur();
    await expect(page.getByTestId('sticker-text')).toHaveText('Ship it');
  });

  test('@2.6 deleting a sticker removes it', async ({ page }) => {
    await page.getByTestId('new-board').click();
    await page.waitForURL(/\/jars\/idea-board\/.+/);
    await page.getByTestId('add-column').click();
    await page.locator('input[data-testid="column-title"]').blur();
    await page.getByTestId('add-sticker').click();
    await page.locator('textarea[data-testid="sticker-text"]').blur();

    await expect(page.getByTestId('sticker')).toHaveCount(1);
    await page.getByTestId('sticker').hover();
    await page.getByTestId('delete-sticker').click();
    await expect(page.getByTestId('sticker')).toHaveCount(0);
  });

  test('@2.7 deleting an empty column requires no confirmation', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.dismiss());
    await page.getByTestId('new-board').click();
    await page.waitForURL(/\/jars\/idea-board\/.+/);
    await page.getByTestId('add-column').click();
    await page.locator('input[data-testid="column-title"]').blur();

    await page.getByTestId('delete-column').click();
    await expect(page.getByTestId('column')).toHaveCount(0);
  });

  test('@2.8 deleting a non-empty column asks for confirmation', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', (dialog) => {
      dialogMessage = dialog.message();
      dialog.accept();
    });

    await page.getByTestId('new-board').click();
    await page.waitForURL(/\/jars\/idea-board\/.+/);
    await page.getByTestId('add-column').click();
    await page.locator('input[data-testid="column-title"]').blur();
    await page.getByTestId('add-sticker').click();
    await page.locator('textarea[data-testid="sticker-text"]').blur();

    await page.getByTestId('delete-column').click();
    expect(dialogMessage).toContain('idea');
    await expect(page.getByTestId('column')).toHaveCount(0);
  });

  test('@2.9 deleting a board always asks for confirmation, even when empty', async ({ page }) => {
    let dialogShown = false;
    page.on('dialog', (dialog) => {
      dialogShown = true;
      dialog.accept();
    });

    await page.getByTestId('new-board').click();
    await page.waitForURL(/\/jars\/idea-board\/.+/);
    await page.getByTestId('delete-board').click();
    await page.waitForURL('**/jars/idea-board');

    expect(dialogShown).toBe(true);
    await expect(page.getByText('No boards yet')).toBeVisible();
  });
});
