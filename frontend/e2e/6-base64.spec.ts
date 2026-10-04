import { expect, test } from '@playwright/test';

test.describe('@6. base64', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jars/base64');
  });

  test('@6.1 encodes text into Base64', async ({ page }) => {
    await page.getByTestId('base64-text').fill('hello world');
    await page.getByTestId('encode-button').click();

    await expect(page.getByTestId('base64-encoded')).toHaveValue('aGVsbG8gd29ybGQ=');
  });

  test('@6.2 decodes Base64 back into the original text', async ({ page }) => {
    await page.getByTestId('base64-encoded').fill('aGVsbG8gd29ybGQ=');
    await page.getByTestId('decode-button').click();

    await expect(page.getByTestId('base64-text')).toHaveValue('hello world');
  });

  test('@6.3 round-trips unicode text through encode then decode', async ({ page }) => {
    const original = 'café ☕️ 日本語';
    await page.getByTestId('base64-text').fill(original);
    await page.getByTestId('encode-button').click();
    await page.getByTestId('base64-text').fill('');
    await page.getByTestId('decode-button').click();

    await expect(page.getByTestId('base64-text')).toHaveValue(original);
  });

  test('@6.4 decoding invalid Base64 shows an error instead of throwing', async ({ page }) => {
    await page.getByTestId('base64-encoded').fill('not valid base64!!!');
    await page.getByTestId('decode-button').click();

    await expect(page.getByTestId('base64-error')).toBeVisible();
  });

  test('@6.5 clear empties both panes', async ({ page }) => {
    await page.getByTestId('base64-text').fill('hello');
    await page.getByTestId('encode-button').click();
    await page.getByTestId('clear-button').click();

    await expect(page.getByTestId('base64-text')).toHaveValue('');
    await expect(page.getByTestId('base64-encoded')).toHaveValue('');
  });
});
