import { test, expect } from '@playwright/test';

/**
 * Basic smoke test for responsive layout
 * Verifies no horizontal scroll on different viewports
 */

test.describe('Responsive Layout', () => {
  test('should not have horizontal scroll on mobile', async ({ page }) => {
    await page.goto('/');
    
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // Allow 1px tolerance
  });

  test('should load without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    
    expect(errors).toHaveLength(0);
  });
});
