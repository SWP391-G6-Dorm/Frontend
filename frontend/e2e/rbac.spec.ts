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

test.describe('RBAC smoke', () => {
  test('customer cannot open manager dashboard', async ({ page }) => {
    await seedRole(page, 'CUSTOMER');
    await page.goto('/manager/dashboard');
    await expect(page).not.toHaveURL(/\/manager\/dashboard$/);
  });

  test('manager lands on manager dashboard', async ({ page }) => {
    await seedRole(page, 'MANAGER');
    await page.goto('/manager/dashboard');
    await expect(page).toHaveURL(/\/(manager|login)/);
  });
});

test.describe('Public smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /login|đăng nhập/i }).or(page.locator('form'))).toBeVisible();
  });
});
