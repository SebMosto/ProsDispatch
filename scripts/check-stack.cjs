const fs = require('fs');
try {
  const content = fs.readFileSync('package.json', 'utf8');
  const pkg = JSON.parse(content);
  const forbidden = ['next', '@supabase/auth-helpers-nextjs', '@supabase/ssr'];
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const found = forbidden.filter(dep => allDeps[dep]);
  if (found.length > 0) {
    console.error('❌ FORBIDDEN DEPENDENCIES DETECTED:', found);
    process.exit(1);
  }
  console.log('✅ Stack verified.');
} catch (e) { console.error(e); process.exit(1); }
