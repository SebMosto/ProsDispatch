const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');

const REQUIRED_PROFILE_COLUMNS = [
  'id', 'email', 'full_name', 'business_name', 'role',
  'created_at', 'updated_at', 'stripe_customer_id',
  'subscription_status', 'subscription_end_date',
  'preferred_language', 'stripe_connect_id',
  'stripe_connect_onboarded', 'address_line1', 'address_line2',
  'city', 'province', 'postal_code', 'phone'
];

const EDGE_FUNCTION_DIR = 'supabase/functions';

let failed = false;

const dirs = readdirSync(EDGE_FUNCTION_DIR);
for (const dir of dirs) {
  const indexPath = join(EDGE_FUNCTION_DIR, dir, 'index.ts');
  let content;
  try {
    content = readFileSync(indexPath, 'utf-8');
  } catch {
    continue;
  }

  const profileSelects = content.match(
    /\.from\("profiles"\)[^;]*\.select\(\s*["'`]([^"'`]+)["'`]/g
  );
  if (!profileSelects) continue;

  for (const selectCall of profileSelects) {
    const colMatch = selectCall.match(/\.select\(\s*["'`]([^"'`]+)["'`]/);
    if (!colMatch) continue;
    const cols = colMatch[1].split(',').map(c => c.trim().split(' ')[0]);
    for (const col of cols) {
      if (!REQUIRED_PROFILE_COLUMNS.includes(col)) {
        console.error(
          `❌ ${dir}/index.ts: references non-existent profiles column "${col}"`
        );
        failed = true;
      }
    }
  }
}

if (failed) {
  console.error('Schema contract check failed.');
  process.exit(1);
} else {
  console.log('✅ Schema contract check passed.');
}
