const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');

const SCHEMA = {
  profiles: [
    'id', 'email', 'full_name', 'business_name', 'role',
    'created_at', 'updated_at', 'stripe_customer_id',
    'subscription_status', 'subscription_end_date',
    'preferred_language', 'stripe_connect_id',
    'stripe_connect_onboarded', 'address_line1', 'address_line2',
    'city', 'province', 'postal_code', 'phone'
  ],
  invoice_items: [
    'id', 'invoice_id', 'description', 'quantity', 'unit_price', 'amount'
  ],
};

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

  for (const [table, knownCols] of Object.entries(SCHEMA)) {
    const selectPattern = new RegExp(
      `\\.from\\("${table}"\\)[^;]*\\.select\\(\\s*["'\`]([^"'\`]+)["'\`]`,
      'g'
    );
    const orderPattern = new RegExp(
      `\\.from\\("${table}"\\)[\\s\\S]*?\\.order\\(\\s*["'\`]([^"'\`]+)["'\`]`,
      'g'
    );

    let match;
    while ((match = selectPattern.exec(content)) !== null) {
      const cols = match[1].split(',').map(c => c.trim().split(' ')[0]);
      for (const col of cols) {
        if (col === '*') continue;
        if (!knownCols.includes(col)) {
          console.error(`❌ ${dir}/index.ts: .select() references non-existent ${table} column "${col}"`);
          failed = true;
        }
      }
    }

    while ((match = orderPattern.exec(content)) !== null) {
      const col = match[1].trim();
      if (!knownCols.includes(col)) {
        console.error(`❌ ${dir}/index.ts: .order() references non-existent ${table} column "${col}"`);
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
