/**
 * Bead 013 — Full 9-Step E2E Flow
 * QA verification after auth-gating regression fix (enabled: !!user)
 * DO NOT modify this test to work around failures — document them.
 */
import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const E2E_EMAIL = process.env.E2E_EMAIL ?? '';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '';

// ── helpers ───────────────────────────────────────────────────────────────────

async function signIn(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('#email', { timeout: 10_000 });
  await page.fill('#email', E2E_EMAIL);
  await page.fill('#password', E2E_PASSWORD);
  await page.click('button[type="submit"]');
  // Accept either /dashboard or any protected route redirect
  await page.waitForURL(/\/(dashboard|jobs|clients|invoices)/, { timeout: 20_000 });
}

// Collect all console errors during the test
function attachConsoleCapture(page: Page): { errors: string[] } {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));
  page.on('console', m => {
    if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`);
  });
  return { errors };
}

// ── test ───────────────────────────────────────────────────────────────────────

test.describe('Bead 013 — Full 9-Step E2E Flow', () => {
  test.setTimeout(240_000);

  test('All 9 steps: client → property → job → approval → invoice → pay', async ({ page }) => {
    const { errors } = attachConsoleCapture(page);

    // ── PRE-CHECK: Credentials ────────────────────────────────────────────────
    if (!E2E_EMAIL || !E2E_PASSWORD) {
      test.fail(true, 'E2E_EMAIL and E2E_PASSWORD env vars are not set — cannot authenticate');
      return;
    }

    // ── STEP 1: Sign in + Create client ───────────────────────────────────────
    await test.step('Step 1 — Sign in and create client: Doris Clement', async () => {
      await signIn(page);

      await page.goto(`${BASE}/clients/new`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });
      await expect(page.locator('#name, input[name="name"]').first()).toBeVisible({ timeout: 10_000 });

      await page.fill('#name', 'Doris Clement');
      await page.fill('#email', 'sebmostovac@hotmail.com');
      await page.selectOption('#preferred_language', 'fr');
      await page.click('button[type="submit"]:has-text("Save client")');

      await page.waitForURL(`${BASE}/clients`, { timeout: 20_000 });
      // URL must not contain a temp- placeholder
      expect(page.url()).not.toContain('temp-');
    });

    // ── Locate client ID from list ─────────────────────────────────────────────
    await page.goto(`${BASE}/clients`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    const clientRow = page.locator('a', { hasText: 'Doris Clement' }).first();
    await expect(clientRow).toBeVisible({ timeout: 15_000 });
    const clientHref = await clientRow.getAttribute('href') ?? '';
    const clientId = clientHref.split('/').pop() ?? '';
    expect(clientId).toBeTruthy();
    expect(clientId).not.toBe('new');

    // ── STEP 2: Add property ──────────────────────────────────────────────────
    await test.step('Step 2 — Add property: 72 Rue de Beauvallon, Gatineau QC J8T 5Z8', async () => {
      await page.goto(`${BASE}/clients/${clientId}/properties/new`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });
      await expect(page.locator('#address_line1, #city').first()).toBeVisible({ timeout: 10_000 });

      // AddressAutocomplete may intercept — fill city/province/postal directly
      await page.fill('#address_line1', '72 Rue de Beauvallon');
      await page.fill('#city', 'Gatineau');
      await page.selectOption('#province', 'QC');
      await page.fill('#postal_code', 'J8T 5Z8');
      await page.click('button[type="submit"]:has-text("Save property")');

      // Should navigate away from the /new form
      await expect(page).not.toHaveURL(/\/properties\/new$/, { timeout: 20_000 });
    });

    // ── STEP 3: Create job ────────────────────────────────────────────────────
    await test.step('Step 3 — Create job linked to Doris + property', async () => {
      await page.goto(`${BASE}/jobs/new`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });
      // Jobs page must not hang (regression check for enabled: !!user)
      await expect(page.locator('#title')).toBeVisible({ timeout: 10_000 });

      await page.fill('#title', 'Bead 013 — Snow Removal');
      await page.selectOption('#client_id', { label: /Doris Clement/ });
      // Wait for property options to populate after client selection
      await page.waitForFunction(
        () => {
          const sel = document.querySelector('#property_id') as HTMLSelectElement | null;
          return sel && sel.options.length > 1;
        },
        { timeout: 10_000 }
      );
      await page.selectOption('#property_id', { index: 1 });
      await page.click('button[type="submit"]:has-text("Create job")');

      await page.waitForURL(`${BASE}/jobs`, { timeout: 20_000 });
      // Jobs list must not hang (regression check)
      await page.waitForLoadState('networkidle', { timeout: 15_000 });
    });

    // ── Locate job ID from list ────────────────────────────────────────────────
    const jobRow = page.locator('a', { hasText: 'Bead 013' }).first();
    await expect(jobRow).toBeVisible({ timeout: 15_000 });
    const jobHref = await jobRow.getAttribute('href') ?? '';
    const jobId = jobHref.split('/').pop() ?? '';
    expect(jobId).toBeTruthy();

    // ── STEP 4: Send job for approval ─────────────────────────────────────────
    await test.step('Step 4 — Send job for approval', async () => {
      await page.goto(`${BASE}/jobs/${jobId}`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      const sendBtn = page.locator('button', { hasText: 'Send to Client' });
      await expect(sendBtn).toBeVisible({ timeout: 10_000 });
      await sendBtn.click();

      // Job status should change to sent (look for badge/text)
      await expect(
        page.locator('[class*="badge"]').filter({ hasText: /sent/i })
          .or(page.locator('span, div').filter({ hasText: /^sent$/i }))
      ).toBeVisible({ timeout: 15_000 });
    });

    // ── STEP 5: Approve job via token URL ─────────────────────────────────────
    let approvalUrl: string | null = null;
    await test.step('Step 5 — Approve job via token URL', async () => {
      await page.goto(`${BASE}/jobs/${jobId}`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      // Look for approval link embedded in the page
      const html = await page.content();
      const tokenMatch = html.match(/\/jobs\/approve\/([a-zA-Z0-9_-]+)/);
      if (tokenMatch) {
        approvalUrl = `${BASE}/jobs/approve/${tokenMatch[1]}`;
      } else {
        const approvalLink = page.locator('a[href*="/jobs/approve/"]').first();
        const href = await approvalLink.getAttribute('href').catch(() => null);
        if (href) approvalUrl = href.startsWith('http') ? href : `${BASE}${href}`;
      }

      if (!approvalUrl) {
        throw new Error(
          'FAIL: Could not find approval token URL on job detail page. ' +
          'The job invite may not have fired, or the token link is not surfaced in the UI.'
        );
      }

      await page.goto(approvalUrl);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      const approveBtn = page.locator('button', { hasText: 'Approve Job' });
      await expect(approveBtn).toBeVisible({ timeout: 15_000 });
      await approveBtn.click();

      await expect(page.locator('text=Job Approved')).toBeVisible({ timeout: 15_000 });
    });

    // ── STEP 6: Mark in_progress → completed ─────────────────────────────────
    await test.step('Step 6 — Mark in progress → completed', async () => {
      await page.goto(`${BASE}/jobs/${jobId}`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      const startBtn = page.locator('button', { hasText: 'Start Job' });
      await expect(startBtn).toBeVisible({ timeout: 10_000 });
      await startBtn.click();

      const completeBtn = page.locator('button', { hasText: 'Complete Job' });
      await expect(completeBtn).toBeVisible({ timeout: 10_000 });
      await completeBtn.click();

      // After completing, the invoice action should appear
      await expect(
        page.locator('button', { hasText: 'Mark as Invoiced' })
      ).toBeVisible({ timeout: 10_000 });
    });

    // ── STEP 7: Create invoice with 2 line items ──────────────────────────────
    let invoiceId = '';
    await test.step('Step 7 — Create invoice with 2 line items', async () => {
      await page.locator('button', { hasText: 'Mark as Invoiced' }).click();
      await page.waitForURL(/\/invoices\/new\//, { timeout: 15_000 });
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      // Invoices list must not hang (regression check for enabled: !!user)
      await expect(page.locator('#items\\.0\\.description, [id="items.0.description"]').first())
        .toBeVisible({ timeout: 10_000 });

      // Line item 1
      await page.fill('[id="items.0.description"]', 'Snow removal — driveway');
      await page.fill('[id="items.0.quantity"]', '2');
      await page.fill('[id="items.0.unitPrice"]', '75.00');

      // Add line item 2
      await page.click('button:has-text("+ Add Item")');
      await expect(page.locator('[id="items.1.description"]')).toBeVisible({ timeout: 5_000 });
      await page.fill('[id="items.1.description"]', 'Salt treatment');
      await page.fill('[id="items.1.quantity"]', '1');
      await page.fill('[id="items.1.unitPrice"]', '25.00');

      // Save draft
      await page.click('button:has-text("Save Draft")');
      await page.waitForURL(new RegExp(`${BASE}/invoices/(?!new/)`), { timeout: 20_000 });

      const url = page.url();
      invoiceId = url.split('/').filter(Boolean).pop() ?? '';
      expect(invoiceId).toBeTruthy();
      expect(invoiceId).not.toContain('temp-');
      expect(invoiceId).not.toBe('new');
    });

    // ── STEP 8: Finalize & Send invoice ──────────────────────────────────────
    await test.step('Step 8 — Finalize and send invoice (confirm email stub fires)', async () => {
      await page.goto(`${BASE}/invoices/${invoiceId}`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      const finalizeBtn = page.locator('button', { hasText: 'Finalize & Send' });
      await expect(finalizeBtn).toBeVisible({ timeout: 10_000 });
      await finalizeBtn.click();

      // Confirmation modal
      const confirmBtn = page.locator('button', { hasText: 'Confirm & Send' });
      await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
      await confirmBtn.click();

      // Invoice should now be in 'sent' state — look for status badge
      await expect(
        page.locator('[class*="badge"]').filter({ hasText: /sent/i })
          .or(page.locator('span, div').filter({ hasText: /^sent$/i }))
          .or(page.locator('[data-status="sent"]'))
      ).toBeVisible({ timeout: 20_000 });
    });

    // ── STEP 9: Public invoice URL — Pay Now renders ──────────────────────────
    await test.step('Step 9 — Open public invoice URL and confirm Pay Now button renders', async () => {
      await page.goto(`${BASE}/invoices/${invoiceId}`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      // Extract /pay/:token from page HTML
      const html = await page.content();
      const payMatch = html.match(/\/pay\/([a-zA-Z0-9_-]+)/);
      let payUrl: string | null = null;

      if (payMatch) {
        payUrl = `${BASE}/pay/${payMatch[1]}`;
      } else {
        const payLink = page.locator('a[href*="/pay/"]').first();
        const href = await payLink.getAttribute('href').catch(() => null);
        if (href) payUrl = href.startsWith('http') ? href : `${BASE}${href}`;
      }

      if (!payUrl) {
        throw new Error(
          'FAIL: Could not find /pay/:token link on invoice detail page. ' +
          'Invoice may not have been finalized or the pay token is not surfaced in the UI.'
        );
      }

      await page.goto(payUrl);
      await page.waitForLoadState('networkidle', { timeout: 20_000 });

      // Pay Now button requires Stripe to load a client secret — give it time
      const payNowBtn = page.locator('button', { hasText: 'Pay Now' });
      await expect(payNowBtn).toBeVisible({ timeout: 30_000 });
    });

    // ── Final: Auth/RLS error audit ────────────────────────────────────────────
    const authErrors = errors.filter(e =>
      /auth|rls|unauthorized|jwt|403|row.level.security/i.test(e)
    );
    if (authErrors.length > 0) {
      throw new Error(
        `FAIL: Auth/RLS console errors detected during flow:\n${authErrors.join('\n')}`
      );
    }
  });
});
