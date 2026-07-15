import {
  expect,
  test
} from '@playwright/test';

test.describe('@1. home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('@1.1 should display the Jars section with the Dice Roller jar', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /jars/i })).toBeVisible();
    await expect(page.getByTestId('jar-dice-roller')).toBeVisible();
  });

  test('@1.2 should navigate to the Dice Roller jar on click', async ({ page }) => {
    await page.getByTestId('jar-dice-roller').click();
    await page.waitForURL('/jars/dice-roller');
    await expect(page.getByRole('heading', { name: /dice roller/i })).toBeVisible();
  });

  test('@1.3 sidebar should show Home and Settings', async ({ page }) => {
    // Desktop sidebar and mobile bottom nav both render every nav item (visibility
    // toggled by CSS breakpoint, not conditional mounting), so testids resolve twice.
    await expect(page.getByTestId('nav-home').first()).toBeVisible();
    await expect(page.getByTestId('nav-settings').first()).toBeVisible();
  });

  test('@1.4 settings nav link should go to an empty Settings page', async ({ page }) => {
    await page.getByTestId('nav-settings').first().click();
    await page.waitForURL('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('@1.5 switching language to Spanish translates the page and persists across navigation', async ({ page }) => {
    await page.getByTestId('language-switcher').click();
    await page.getByRole('option', { name: 'Español' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tarros');

    await page.getByTestId('jar-dice-roller').click();
    await page.waitForURL('/jars/dice-roller');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lanzador de Dados');
  });
});
