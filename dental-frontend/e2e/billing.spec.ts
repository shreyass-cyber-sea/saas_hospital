import { test, expect } from '@playwright/test';

test.describe('Billing & Financials', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'karthik5kashyapks@gmail.com');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('can load the billing invoices list', async ({ page }) => {
    // Navigate dynamically to the billing route
    await page.goto('/billing');

    // Wait for Supabase/Prisma to fetch the invoices
    await page.waitForTimeout(2000);

    // Assert the billing page header or a table exists
    await expect(page.getByText('Billing', { exact: false }).first()).toBeVisible();

    // Take screenshot of the financial dashboard
    await page.screenshot({ path: 'e2e-results/billing-list.png', fullPage: true });
  });
});
