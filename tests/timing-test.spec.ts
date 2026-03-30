import { test } from '@playwright/test';

const BASE = 'http://localhost:4173';
const E2E_EMAIL = 'sebmostovac@gmail.com';
const E2E_PASSWORD = 'LavaLamp';

test('Timing: sign in + create client with network tracing', async ({ page }) => {
  test.setTimeout(60_000);

  const errors: string[] = [];
  const requests: string[] = [];
  const responses: string[] = [];

  page.on('console', m => {
    if (m.type() === 'error') errors.push(`[${m.type()}] ${m.text()}`);
    else if (m.type() === 'warn') errors.push(`[warn] ${m.text()}`);
  });
  page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));

  page.on('request', req => {
    const url = req.url();
    if (url.includes('supabase')) {
      requests.push(`→ ${req.method()} ${url.replace(/https:\/\/[^/]+/, '')}`);
    }
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('supabase')) {
      responses.push(`← ${res.status()} ${url.replace(/https:\/\/[^/]+/, '')}`);
    }
  });

  page.on('requestfailed', req => {
    const url = req.url();
    if (url.includes('supabase')) {
      responses.push(`✗ FAILED ${req.method()} ${url.replace(/https:\/\/[^/]+/, '')} — ${req.failure()?.errorText}`);
    }
  });

  // Sign in
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('#login-email', { timeout: 10_000 });
  await page.fill('#login-email', E2E_EMAIL);
  await page.fill('#login-password', E2E_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|jobs|clients|invoices)/, { timeout: 20_000 });
  console.log('Signed in, URL:', page.url());

  // Navigate to /clients/new
  await page.goto(`${BASE}/clients/new`);
  await page.waitForLoadState('networkidle', { timeout: 15_000 });

  // Clear captured requests from page load
  requests.length = 0;
  responses.length = 0;

  // Fill form
  await page.fill('#name', 'Timing Test Client 2');
  await page.fill('#email', 'timing2@test.com');

  // Test direct Supabase fetch from browser context
  const directFetchResult = await page.evaluate(async () => {
    try {
      const supabaseUrl = (window as any).__SUPABASE_URL__
        || document.querySelector('meta[name="supabase-url"]')?.getAttribute('content')
        || 'https://nctjhybvdkmyxanqiphi.supabase.co';

      // Just test basic connectivity - unauthenticated health check
      const r = await fetch(`${supabaseUrl}/rest/v1/`, { method: 'GET' });
      return { ok: r.ok, status: r.status, statusText: r.statusText };
    } catch (e: unknown) {
      return { error: String(e) };
    }
  });
  console.log('Direct Supabase fetch test:', JSON.stringify(directFetchResult));

  const t0 = Date.now();
  await page.click('button[type="submit"]:has-text("Save client")');
  console.log('Clicked submit at t=0');

  // Wait and log intermediate state at 5s
  await page.waitForTimeout(5_000);
  console.log(`After 5s (${Date.now()-t0}ms) — requests:`, JSON.stringify(requests));
  console.log(`After 5s — responses:`, JSON.stringify(responses));

  // Wait and log at 10s
  await page.waitForTimeout(5_000);
  console.log(`After 10s (${Date.now()-t0}ms) — requests:`, JSON.stringify(requests));
  console.log(`After 10s — responses:`, JSON.stringify(responses));

  // Wait and log at 20s
  await page.waitForTimeout(10_000);
  console.log(`After 20s (${Date.now()-t0}ms) — requests:`, JSON.stringify(requests));
  console.log(`After 20s — responses:`, JSON.stringify(responses));
  console.log(`After 20s — errors:`, JSON.stringify(errors));

  const btn = page.locator('button[type="submit"]');
  const btnText = await btn.textContent().catch(() => 'gone');
  console.log(`After 20s — submit button text: "${btnText}"`);

  const url = page.url();
  console.log(`After 20s — current URL: ${url}`);
});
