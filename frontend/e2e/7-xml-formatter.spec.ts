import { expect, test } from '@playwright/test';

test.describe('@7. xml formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jars/xml-formatter');
  });

  test('@7.1 formats compact XML into an indented, nested form', async ({ page }) => {
    await page.getByTestId('xml-input').fill('<root><a>1</a><b><c>2</c></b></root>');
    await page.getByTestId('format-button').click();

    await expect(page.getByTestId('xml-input')).toHaveValue(
      '<root>\n  <a>1</a>\n  <b>\n    <c>2</c>\n  </b>\n</root>'
    );
  });

  test('@7.2 minifies formatted XML back into a single compact line', async ({ page }) => {
    await page.getByTestId('xml-input').fill('<root>\n  <a>1</a>\n</root>');
    await page.getByTestId('minify-button').click();

    await expect(page.getByTestId('xml-input')).toHaveValue('<root><a>1</a></root>');
  });

  test('@7.3 validating well-formed XML shows a success message', async ({ page }) => {
    await page.getByTestId('xml-input').fill('<root><a>1</a></root>');
    await page.getByTestId('validate-button').click();

    await expect(page.getByTestId('xml-valid')).toBeVisible();
    await expect(page.getByTestId('xml-error')).toHaveCount(0);
  });

  test('@7.4 formatting invalid XML (mismatched tags) shows an error instead of throwing', async ({ page }) => {
    await page.getByTestId('xml-input').fill('<root><a></root>');
    await page.getByTestId('format-button').click();

    await expect(page.getByTestId('xml-error')).toBeVisible();
    await expect(page.getByTestId('xml-input')).toHaveValue('<root><a></root>');
  });

  test('@7.5 clear empties the input', async ({ page }) => {
    await page.getByTestId('xml-input').fill('<root/>');
    await page.getByTestId('clear-button').click();

    await expect(page.getByTestId('xml-input')).toHaveValue('');
  });
});
