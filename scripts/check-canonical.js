import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let hasError = false;

function fail(msg) {
  console.error(`❌ ${msg}`);
  hasError = true;
}

function pass(msg) {
  console.log(`✅ ${msg}`);
}

// Helper to walk dir
function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else {
      callback(filepath);
    }
  }
}

// 1. Stripe Checks
function checkStripeUsage() {
  console.log('--- Checking Stripe Constraints ---');

  // Frontend
  const frontendDir = path.join(ROOT, 'src');
  const allowedFrontend = path.join(frontendDir, 'services', 'billing.ts');

  walk(frontendDir, (filepath) => {
    if (filepath === allowedFrontend) return;
    if (filepath.endsWith('.test.ts') || filepath.endsWith('.test.tsx')) return;

    const content = fs.readFileSync(filepath, 'utf8');

    // Check for backend 'stripe' package import in frontend
    if (content.match(/from ['"]stripe['"]/)) {
       fail(`Illegal Stripe backend import in frontend: ${path.relative(ROOT, filepath)}`);
    }
  });

  // Backend
  const functionsDir = path.join(ROOT, 'supabase', 'functions');
  const sharedStripe = path.join(functionsDir, '_shared', 'stripe.ts');

  if (fs.existsSync(functionsDir)) {
      walk(functionsDir, (filepath) => {
        // Skip hidden files/dirs except _shared
        if (filepath.includes('/.')) return;

        if (filepath === sharedStripe) return;
        if (path.basename(filepath) === 'stripe.ts' && filepath.includes('_shared')) return;

        const content = fs.readFileSync(filepath, 'utf8');
        if (content.match(/from ['"]stripe['"]/)) {
             fail(`Illegal Stripe import in Edge Function: ${path.relative(ROOT, filepath)}. Use _shared/stripe.ts instead.`);
        }
        if (content.match(/new Stripe\(/)) {
             fail(`Illegal Stripe instantiation in Edge Function: ${path.relative(ROOT, filepath)}. Use _shared/stripe.ts helper.`);
        }
      });
  }
}

// 2. Route Checks
function checkRoutes() {
  console.log('--- Checking Route Structure ---');
  const routesDir = path.join(ROOT, 'src', 'routes');
  const requiredFiles = ['PublicRouter.tsx', 'ProviderRouter.tsx', 'ClientRouter.tsx', 'AppRouter.tsx'];

  if (!fs.existsSync(routesDir)) {
      fail(`Missing routes directory: ${routesDir}`);
      return;
  }

  for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(routesDir, file))) {
          fail(`Missing required router file: ${file}`);
      }
  }

  // Check App.tsx imports AppRouter
  const appTsx = path.join(ROOT, 'src', 'App.tsx');
  if (fs.existsSync(appTsx)) {
      const content = fs.readFileSync(appTsx, 'utf8');
      if (!content.includes('AppRouter')) {
          fail(`App.tsx must import AppRouter`);
      }
  }
}

// 3. Schema Checks
function checkSchemas() {
  console.log('--- Checking Schema Separation ---');
  const srcDir = path.join(ROOT, 'src');

  walk(srcDir, (filepath) => {
      // Skip the future folder itself
      if (filepath.includes('src/schemas/future')) return;

      const content = fs.readFileSync(filepath, 'utf8');
      if (content.match(/from ['"].*\/schemas\/future['"]/)) {
          fail(`Illegal import from "schemas/future" in MVP1 code: ${path.relative(ROOT, filepath)}`);
      }
  });
}

// 4. Migration Checks
function checkMigrations() {
  console.log('--- Checking Migrations ---');
  const migrationsDir = path.join(ROOT, 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir);
  for (const file of files) {
      if (file.endsWith('.sql')) {
          // Check if it starts with timestamp
          const match = file.match(/^(\d{14})_(.*)\.sql$/);
          if (match) {
             const name = match[2];

             // Check content for denied tables in NON-future migrations
             if (!name.startsWith('future__')) {
                 const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                 const deniedTables = ['materials', 'messages', 'reviews', 'inventory'];
                 for (const table of deniedTables) {
                     if (content.match(new RegExp(`create table .*${table}`, 'i'))) {
                         fail(`MVP1 migration '${file}' cannot create future table '${table}'. Use 'future__' prefix.`);
                     }
                 }
             }
          }
      }
  }
}

checkStripeUsage();
checkRoutes();
checkSchemas();
checkMigrations();

if (hasError) {
    console.error('\n❌ Canonical constraints check FAILED.');
    process.exit(1);
} else {
    console.log('\n✅ All canonical constraints passed.');
}
