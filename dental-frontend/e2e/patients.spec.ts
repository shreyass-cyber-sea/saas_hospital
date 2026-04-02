import { test, expect } from '@playwright/test';

test.describe('Patients Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'karthik5kashyapks@gmail.com');
    await page.fill('input[name="password"]', '12345678');
    await page.click('button[type="submit"]');
    
    // Wait for the dashboard to load to ensure auth state is settled
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('can navigate to patient directory and view UI', async ({ page }) => {
    // Navigate using the sidebar link (or direct URL to be deterministic)
    await page.goto('/patients');

    // Add a small delay for Prisma queries to fetch the patients list
    await page.waitForTimeout(2000);

    // Verify a core element like 'Patients' text exists
    await expect(page.getByText('Patients', { exact: false }).first()).toBeVisible();

    // Verify there is a table or patient cards rendered
    // (We use a broad locator that should match standard Tailwind/lucide layouts)
    await expect(page.locator('tbody, .grid').first()).toBeVisible();

    // Take screenshot of patient directory
    await page.screenshot({ path: 'e2e-results/patients-directory.png', fullPage: true });
  });
});
