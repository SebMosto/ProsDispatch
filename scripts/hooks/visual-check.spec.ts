import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Visual Verification of Login/Landing', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', exception => console.log(`PAGE ERROR: ${exception}`));

  // Ensure artifact directory exists
  const artifactDir = path.resolve('.beads/artifacts');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  } catch (e) {
    console.error('Failed to load page:', e);
    throw e;
  }

  // Capture screenshot
  await page.screenshot({ path: path.join(artifactDir, 'verify-ui.png') });

  // 1. Body visible
  const body = page.locator('body');
  await expect(body).toBeVisible();

  // 2. No full screen errors
  const bodyText = await body.innerText();
  const errorKeywords = [
      "Vite error",
      "Cannot read properties",
      "Unhandled Runtime Error",
      "TpError" // unexpected token or similar
  ];

  for (const keyword of errorKeywords) {
      expect(bodyText).not.toContain(keyword);
  }

  // 3. CSS Loaded
  // Check if root element has some styling
  const computedStyle = await body.evaluate((el) => window.getComputedStyle(el).fontFamily);
  expect(computedStyle).toBeTruthy();
});
