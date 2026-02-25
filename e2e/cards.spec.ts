import { expect, test } from '@playwright/test';

test('punched cards page loads soapII deck and renders a card', async ({ page }) => {
  test.setTimeout(120000);

  const firstCardPattern = /0\?0000800\?\s+0001/;

  await page.goto('/cards');

  await page.getByRole('button', { name: 'Browse files' }).click();
  await expect(page.getByRole('dialog', { name: 'Choose card deck' })).toBeVisible();

  await page.getByText('sw', { exact: true }).click();
  await page.getByText('soap', { exact: true }).click();
  await page.getByText('soapII.dck', { exact: true }).click();
  await page.getByRole('button', { name: 'Choose file' }).click();

  await expect(page.getByRole('dialog', { name: 'Choose card deck' })).not.toBeVisible();
  await expect(page.getByText(/File loaded: soapII\.dck/)).toBeVisible();

  const firstCardRow = page.getByRole('button', { name: firstCardPattern }).first();
  await expect(firstCardRow).toBeVisible();
  await firstCardRow.click();

  await expect(page.getByRole('img', { name: /Punched card:\s+0\?0000800\?\s+0001/ })).toBeVisible();
  await expect(page.getByTestId('printed-char-0').first()).toBeVisible();
});
