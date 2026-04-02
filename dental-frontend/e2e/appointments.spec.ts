import { test, expect } from '@playwright/test';

test.describe('Appointments Calendar', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'karthik5kashyapks@gmail.com');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('can load the dynamic appointments calendar', async ({ page }) => {
    // Navigate dynamically to the appointments route
    await page.goto('/appointments');

    // Wait for React Big Calendar or custom calendar component to render
    await page.waitForTimeout(2500);

    // Look for typical calendar views
    await expect(page.getByText('Appointments', { exact: false }).first()).toBeVisible();

    // Take screenshot of calendar view
    await page.screenshot({ path: 'e2e-results/appointments-calendar.png', fullPage: true });
  });
});
