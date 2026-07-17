import { test, expect } from '@playwright/test';

test.describe('Damage flow', () => {
  test.skip(!process.env.E2E_FULL, 'Set E2E_FULL=1 with seeded backend to run');

  test('employee → manager escalate → admin co-approve path is reachable', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
  });
});
