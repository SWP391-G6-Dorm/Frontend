import { test, expect } from '@playwright/test';

async function seedRole(page: import('@playwright/test').Page, role: string) {
  await page.addInitScript((r) => {
    sessionStorage.setItem('accessToken', 'e2e-access');
    sessionStorage.setItem('refreshToken', 'e2e-refresh');
    sessionStorage.setItem('userRole', r);
    sessionStorage.setItem('userId', '00000000-0000-0000-0000-0000000000e2');
    sessionStorage.setItem('fullName', `${r} E2E`);
    sessionStorage.setItem('userEmail', `${r.toLowerCase()}@e2e.local`);
  }, role);
}

test.describe('Manager ops smoke', () => {
  test('manager bookings route stays in manager portal', async ({ page }) => {
    await seedRole(page, 'MANAGER');
    await page.goto('/manager/bookings');
    await expect(page).toHaveURL(/\/(manager|login)/);
  });

  test('employee cannot open manager damage reports', async ({ page }) => {
    await seedRole(page, 'EMPLOYEE');
    await page.goto('/manager/damage-reports');
    await expect(page).not.toHaveURL(/\/manager\/damage-reports$/);
  });
});
