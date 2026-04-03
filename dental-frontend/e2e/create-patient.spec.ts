import { test, expect } from '@playwright/test';

test.describe('Create Patient (Write Operation)', () => {
    test.beforeEach(async ({ page }) => {
        // Authenticate
        await page.goto('/auth/login');
        await page.fill('input[name="email"]', 'karthik5kashyapks@gmail.com');
        await page.fill('input[name="password"]', '12345678');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should successfully register a new patient', async ({ page }) => {
        // Navigate to new patient form
        await page.goto('/patients/new');

        // Fill out basic patient info
        const timestamp = Date.now();
        const testName = `Test Patient ${timestamp}`;
        
        await page.getByPlaceholder('e.g. Rahul Sharma').fill(testName);
        await page.getByPlaceholder('+91 98765 43210').fill(`+91999${timestamp.toString().slice(-7)}`);
        await page.getByPlaceholder('patient@example.com').fill(`test_patient_${timestamp}@example.com`);

        // Select Gender and Blood Group (they are the first and second native select inputs)
        await page.locator('select').nth(0).selectOption('Male');
        await page.locator('select').nth(1).selectOption('O+');

        // Address
        await page.getByPlaceholder('123 Main St, Mumbai, MH').fill('123 Automation Lane, Playwright City');

        // Medical History
        await page.getByPlaceholder('e.g. Hypertension, Diabetes').fill('None. Automated Test Record.');

        // Save Patient
        await page.getByRole('button', { name: /Save Patient/i }).first().click();

        // Wait a short duration to let the backend validation return an error banner if any
        await page.waitForTimeout(1500);

        // Check for backend validation error banner
        const errorBanner = page.locator('.bg-red-50');
        if (await errorBanner.isVisible()) {
            const errorText = await errorBanner.innerText();
            throw new Error(`Validation Error on UI: ${errorText}`);
        }

        // Should automatically redirect back to the patient directory on success
        await expect(page).toHaveURL(/.*patients$/);

        // Verify the newly created patient appears in the directory table
        const patientRowLocator = page.locator('table').getByText(testName);
        await expect(patientRowLocator).toBeVisible();
    });
});
