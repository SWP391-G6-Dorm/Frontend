import { test, expect } from '@playwright/test';

test.describe('Auth smoke', () => {
  test('unauthenticated manager route redirects to login', async ({ page }) => {
    await page.goto('/manager/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
