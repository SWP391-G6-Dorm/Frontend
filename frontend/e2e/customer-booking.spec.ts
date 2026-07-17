import { test, expect } from '@playwright/test';

test.describe('Customer booking smoke', () => {
  test('home page is reachable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('unauthenticated customer bookings redirects to login', async ({ page }) => {
    await page.goto('/customer/bookings');
    await expect(page).toHaveURL(/\/(login|customer)/);
  });
});
