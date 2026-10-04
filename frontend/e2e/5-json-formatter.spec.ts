import { expect, test } from '@playwright/test';

test.describe('@5. json formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jars/json-formatter');
  });

  test('@5.1 formats compact JSON into a pretty-printed, indented form', async ({ page }) => {
    await page.getByTestId('json-input').fill('{"a":1,"b":[1,2]}');
    await page.getByTestId('format-button').click();

    await expect(page.getByTestId('json-input')).toHaveValue('{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}');
  });

  test('@5.2 minifies pretty-printed JSON into a single compact line', async ({ page }) => {
    await page.getByTestId('json-input').fill('{\n  "a": 1\n}');
    await page.getByTestId('minify-button').click();

    await expect(page.getByTestId('json-input')).toHaveValue('{"a":1}');
  });

  test('@5.3 validating well-formed JSON shows a success message', async ({ page }) => {
    await page.getByTestId('json-input').fill('{"ok": true}');
    await page.getByTestId('validate-button').click();

    await expect(page.getByTestId('json-valid')).toBeVisible();
    await expect(page.getByTestId('json-error')).toHaveCount(0);
  });

  test('@5.4 formatting invalid JSON shows an error instead of throwing', async ({ page }) => {
    await page.getByTestId('json-input').fill('{bad json}');
    await page.getByTestId('format-button').click();

    await expect(page.getByTestId('json-error')).toBeVisible();
    // The input is left untouched on error — it must still be editable, not clobbered.
    await expect(page.getByTestId('json-input')).toHaveValue('{bad json}');
  });

  test('@5.5 clear empties the input', async ({ page }) => {
    await page.getByTestId('json-input').fill('{"a":1}');
    await page.getByTestId('clear-button').click();

    await expect(page.getByTestId('json-input')).toHaveValue('');
  });
});
