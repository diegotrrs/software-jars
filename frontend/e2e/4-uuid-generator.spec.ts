import { expect, test } from '@playwright/test';

test.describe('@4. uuid generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jars/uuid-generator');
  });

  test('@4.1 generates the requested number of v4 UUIDs', async ({ page }) => {
    await page.getByTestId('count-increment').click();
    await page.getByTestId('count-increment').click();
    await page.getByTestId('generate-button').click();

    await expect(page.getByTestId('uuid-row')).toHaveCount(3);
    const text = await page.getByTestId('uuid-row').first().textContent();
    expect(text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('@4.2 switching to v1 generates UUIDs with the version 1 marker', async ({ page }) => {
    await page.getByTestId('version-select').click();
    await page.getByRole('option', { name: 'v1 (timestamp)' }).click();
    await page.getByTestId('generate-button').click();

    const text = await page.getByTestId('uuid-row').first().textContent();
    expect(text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('@4.3 clear empties the results list', async ({ page }) => {
    await page.getByTestId('generate-button').click();
    await expect(page.getByTestId('uuid-row')).toHaveCount(1);

    await page.getByTestId('clear-results').click();
    await expect(page.getByTestId('uuid-row')).toHaveCount(0);
  });

  test('@4.4 copy-one copies that UUID to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByTestId('generate-button').click();

    const uuid = await page.getByTestId('uuid-row').first().textContent();
    await page.getByTestId('copy-uuid').click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText.trim()).toBe(uuid?.trim());
  });
});
