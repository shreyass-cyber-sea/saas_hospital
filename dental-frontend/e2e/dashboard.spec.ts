import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  // Setup: Log in before each test runs
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'karthik5kashyapks@gmail.com');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('dashboard renders correctly and takes a screenshot', async ({ page }) => {
    // Add a small delay for Prisma data queries to settle
    await page.waitForTimeout(2000);

    // Verify a core element like 'Dashboard' text exists on screen
    await expect(page.getByText('Dashboard', { exact: false }).first()).toBeVisible();

    // Take a full page screenshot to verify visual regressions
    await page.screenshot({ path: 'e2e-results/dashboard-view.png', fullPage: true });
  });
});
