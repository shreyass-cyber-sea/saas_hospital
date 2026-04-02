import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('successful login', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/auth/login');

    // Wait for the form to appear
    await expect(page.locator('form')).toBeVisible();

    // Fill in the provided test credentials
    await page.fill('input[name="email"]', 'karthik5kashyapks@gmail.com');
    await page.fill('input[name="password"]', '12345678');

    // Click the login button
    await page.click('button[type="submit"]');

    // Wait for the navigation to the dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Assert we landed on dashboard properly
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
