import { test, expect } from '@playwright/test';

test.describe('Inventory Display', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'karthik5kashyapks@gmail.com');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('can load the clinical inventory datagrid', async ({ page }) => {
    // Navigate dynamically to the inventory route
    await page.goto('/inventory');

    // Wait for Supabase/Prisma to fetch the inventory metrics
    await page.waitForTimeout(2000);

    await expect(page.getByText('Inventory', { exact: false }).first()).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'e2e-results/inventory-list.png', fullPage: true });
  });
});
