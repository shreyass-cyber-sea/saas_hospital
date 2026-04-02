import { test, expect } from '@playwright/test';

test.describe('Settings & Tenant Profile', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'karthik5kashyapks@gmail.com');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('can load the clinic settings profile', async ({ page }) => {
    // Navigate dynamically to the settings route
    await page.goto('/settings');

    // Wait for Supabase/Prisma to fetch the tenant profile
    await page.waitForTimeout(2000);

    // Assert the settings management view appears
    await expect(page.getByText('Settings', { exact: false }).first()).toBeVisible();

    // Take screenshot of the clinic settings
    await page.screenshot({ path: 'e2e-results/settings-view.png', fullPage: true });
  });
});
