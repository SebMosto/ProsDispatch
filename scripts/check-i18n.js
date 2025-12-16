#!/usr/bin/env node

/**
 * Check i18n parity between English and French translations
 * Ensures both locale files have matching keys
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function checkI18n() {
  console.log('🌐 Checking i18n translation parity...\n');

  let exitCode = 0;

  try {
    // Read locale files
    const enPath = join(projectRoot, 'src/i18n/locales/en.json');
    const frPath = join(projectRoot, 'src/i18n/locales/fr.json');

    const enContent = JSON.parse(readFileSync(enPath, 'utf-8'));
    const frContent = JSON.parse(readFileSync(frPath, 'utf-8'));

    // Get all keys recursively
    function getKeys(obj, prefix = '') {
      const keys = [];
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          keys.push(...getKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const enKeys = new Set(getKeys(enContent));
    const frKeys = new Set(getKeys(frContent));

    console.log(`📊 English keys: ${enKeys.size}`);
    console.log(`📊 French keys: ${frKeys.size}\n`);

    // Check for missing keys in French
    const missingInFr = [...enKeys].filter(key => !frKeys.has(key));
    if (missingInFr.length > 0) {
      console.error('❌ Keys missing in French translation:');
      missingInFr.forEach(key => console.error(`  - ${key}`));
      console.error('');
      exitCode = 1;
    }

    // Check for missing keys in English
    const missingInEn = [...frKeys].filter(key => !enKeys.has(key));
    if (missingInEn.length > 0) {
      console.error('❌ Keys missing in English translation:');
      missingInEn.forEach(key => console.error(`  - ${key}`));
      console.error('');
      exitCode = 1;
    }

    // Check for empty values
    function findEmptyValues(obj, prefix = '', locale) {
      const empty = [];
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          empty.push(...findEmptyValues(obj[key], fullKey, locale));
        } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
          empty.push(fullKey);
        }
      }
      return empty;
    }

    const emptyEn = findEmptyValues(enContent, '', 'en');
    const emptyFr = findEmptyValues(frContent, '', 'fr');

    if (emptyEn.length > 0) {
      console.error('⚠️  Empty values in English:');
      emptyEn.forEach(key => console.error(`  - ${key}`));
      console.error('');
    }

    if (emptyFr.length > 0) {
      console.error('⚠️  Empty values in French:');
      emptyFr.forEach(key => console.error(`  - ${key}`));
      console.error('');
    }

    if (exitCode === 0) {
      console.log('✅ All i18n checks passed!');
      console.log('   - Key parity maintained between EN and FR');
      console.log('   - No missing translations detected\n');
    } else {
      console.error('❌ i18n check failed!\n');
      console.error('Per CI Guardrails: Missing translations are P0 blockers.\n');
      console.error('Action required:');
      console.error('  1. Add missing keys to the appropriate locale file');
      console.error('  2. Ensure all user-facing text uses t() function');
      console.error('  3. Maintain parity between EN and FR translations\n');
    }

  } catch (error) {
    console.error('❌ Error reading locale files:', error.message);
    console.error('\nExpected location: src/i18n/locales/en.json and fr.json\n');
    exitCode = 1;
  }

  process.exit(exitCode);
}

checkI18n();
