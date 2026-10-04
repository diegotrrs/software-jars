import { expect, test } from '@playwright/test';

test.describe('@8. timezone converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jars/timezone-converter');
  });

  test('@8.1 shows the local timezone pinned first, with no remove button', async ({ page }) => {
    await expect(page.getByTestId('timezone-row')).toHaveCount(1);
    await expect(page.getByText('You')).toBeVisible();
    await expect(page.getByTestId('remove-zone')).toHaveCount(0);
  });

  test('@8.2 searching and adding a zone shows it as a new row', async ({ page }) => {
    await page.getByTestId('zone-search-input').fill('tokyo');
    await expect(page.getByTestId('zone-search-result')).toHaveCount(1);
    await page.getByTestId('zone-search-result').first().click();

    await expect(page.getByTestId('timezone-row')).toHaveCount(2);
    await expect(page.getByText('Tokyo', { exact: true })).toBeVisible();
  });

  test('@8.3 an already-added zone drops out of future search results', async ({ page }) => {
    await page.getByTestId('zone-search-input').fill('tokyo');
    await page.getByTestId('zone-search-result').first().click();

    await page.getByTestId('zone-search-input').fill('tokyo');
    await expect(page.getByTestId('zone-search-result')).toHaveCount(0);
    await expect(page.getByTestId('zone-search')).toContainText('No matching timezones');
  });

  test('@8.4 removing a zone takes it out of the list', async ({ page }) => {
    await page.getByTestId('zone-search-input').fill('tokyo');
    await page.getByTestId('zone-search-result').first().click();
    await expect(page.getByTestId('timezone-row')).toHaveCount(2);

    await page.getByTestId('remove-zone').click();
    await expect(page.getByTestId('timezone-row')).toHaveCount(1);
  });

  test('@8.5 picking a custom reference time updates every zone and shows "Back to now"', async ({ page }) => {
    await page.getByTestId('zone-search-input').fill('tokyo');
    await page.getByTestId('zone-search-result').first().click();

    await page.getByTestId('reference-time-input').fill('2026-06-15T09:00');

    await expect(page.getByTestId('reset-to-now')).toBeVisible();
    await expect(page.getByTestId('timezone-time').first()).toHaveText('09:00');

    await page.getByTestId('reset-to-now').click();
    await expect(page.getByTestId('reset-to-now')).toHaveCount(0);
  });

  test('@8.6 added zones persist across a reload', async ({ page }) => {
    await page.getByTestId('zone-search-input').fill('tokyo');
    await page.getByTestId('zone-search-result').first().click();
    await expect(page.getByTestId('timezone-row')).toHaveCount(2);

    await page.reload();

    await expect(page.getByTestId('timezone-row')).toHaveCount(2);
    await expect(page.getByText('Tokyo', { exact: true })).toBeVisible();
  });
});
