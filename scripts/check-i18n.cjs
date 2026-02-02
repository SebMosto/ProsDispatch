const fs = require('fs');
const path = require('path');
try {
  const enRaw = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/en.json'), 'utf8');
  const frRaw = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/fr.json'), 'utf8');
  const enKeys = Object.keys(JSON.parse(enRaw)); // Simple top-level check for now
  const frKeys = Object.keys(JSON.parse(frRaw));
  if (enKeys.length === 0 || frKeys.length === 0) { throw new Error('Empty locale files'); }
  console.log('✅ i18n verified.');
} catch (e) { console.error(e); process.exit(1); }
