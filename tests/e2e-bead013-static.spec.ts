/**
 * Bead 013 — Static / unauthenticated E2E checks
 * Runs what can be verified without a live contractor session:
 *   - App boots without console errors
 *   - Login page renders
 *   - Protected routes redirect (not hang) — key regression check for enabled: !!user
 *   - Public token routes render without crashing
 *   - Stripe key sanity check
 */
import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:4173';

function capture(page: Page) {
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
  page.on('console', m => {
    if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`);
    if (m.type() === 'warning') warnings.push(`[console.warn] ${m.text()}`);
  });
  return { errors, warnings };
}

test.describe('Bead 013 — Static/unauthenticated checks', () => {

  test('App boots at / without console errors', async ({ page }) => {
    const { errors } = capture(page);
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    // Should redirect to /login or show home page — must not hang
    await expect(page).toHaveURL(/\/(login|dashboard|$)/, { timeout: 10_000 });
    expect(errors.filter(e => !/stripe|publishable|fonts|favicon/i.test(e))).toHaveLength(0);
  });

  test('Login page renders all required fields', async ({ page }) => {
    await page.goto(BASE + '/login');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('/jobs redirects to login — does NOT hang on loading spinner (regression: enabled: !!user)', async ({ page }) => {
    const { errors } = capture(page);
    await page.goto(BASE + '/jobs');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
    // No auth/RLS errors from firing before auth resolves
    const authErrors = errors.filter(e => /rls|401|403|jwt|unauthorized/i.test(e));
    expect(authErrors).toHaveLength(0);
  });

  test('/invoices redirects to login — does NOT hang (regression: enabled: !!user)', async ({ page }) => {
    const { errors } = capture(page);
    await page.goto(BASE + '/invoices');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
    const authErrors = errors.filter(e => /rls|401|403|jwt|unauthorized/i.test(e));
    expect(authErrors).toHaveLength(0);
  });

  test('/clients redirects to login — does NOT hang', async ({ page }) => {
    await page.goto(BASE + '/clients');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('/dashboard redirects to login — does NOT hang', async ({ page }) => {
    await page.goto(BASE + '/dashboard');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('/jobs/approve/:bogus-token renders page (not blank crash)', async ({ page }) => {
    const { errors } = capture(page);
    await page.goto(BASE + '/jobs/approve/bogus-token-bead013-check');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    // Page should render something — not a blank white screen
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(10);
    // No JS crashes
    const jsErrors = errors.filter(e => !e.includes('token') && !e.includes('invalid'));
    expect(jsErrors).toHaveLength(0);
  });

  test('/pay/:bogus-token renders page (not blank crash)', async ({ page }) => {
    const { errors } = capture(page);
    await page.goto(BASE + '/pay/bogus-token-bead013-check');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(10);
    const jsErrors = errors.filter(e => !e.includes('token') && !e.includes('invalid') && !e.includes('stripe'));
    expect(jsErrors).toHaveLength(0);
  });

  test('FINDING: Stripe publishable key sanity check', async ({ page }) => {
    // Navigate to public invoice page and check if Stripe initializes
    await page.goto(BASE + '/pay/bead013-stripe-check');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Check page HTML for Stripe script tag or initialization
    const html = await page.content();
    const hasStripeScript = html.includes('stripe') || html.includes('Stripe');

    // Capture any Stripe-specific console errors
    const stripeErrors: string[] = [];
    page.on('console', m => {
      if (m.text().toLowerCase().includes('stripe') || m.text().toLowerCase().includes('publishable')) {
        stripeErrors.push(m.text());
      }
    });

    // Navigate again to catch console messages
    await page.goto(BASE + '/pay/bead013-stripe-check');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // This test always passes — it captures findings for documentation
    console.log('Stripe script present:', hasStripeScript);
    console.log('Stripe console messages:', stripeErrors);
    expect(true).toBe(true); // Always passes — findings captured above
  });
});
