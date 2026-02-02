const fs = require('fs');
const path = require('path');

function getKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((res, el) => {
    if (Array.isArray(obj[el])) {
      return [...res, prefix + el];
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
}

function checkTypes(obj1, obj2, prefix = '') {
  for (const key of Object.keys(obj1)) {
    const val1 = obj1[key];
    const val2 = obj2[key];
    const fullKey = prefix + key;

    // Skip if key doesn't exist in obj2 (handled by key check)
    if (val2 === undefined) continue;

    const type1 = Array.isArray(val1) ? 'array' : typeof val1;
    const type2 = Array.isArray(val2) ? 'array' : typeof val2;

    if (type1 !== type2) {
      throw new Error(`Type mismatch for key: ${fullKey}. EN: ${type1}, FR: ${type2}`);
    }

    if (type1 === 'object' && val1 !== null) {
      checkTypes(val1, val2, fullKey + '.');
    }
  }
}

try {
  const enRaw = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/en.json'), 'utf8');
  const frRaw = fs.readFileSync(path.join(__dirname, '../src/i18n/locales/fr.json'), 'utf8');

  const enObj = JSON.parse(enRaw);
  const frObj = JSON.parse(frRaw);

  const enKeys = getKeys(enObj);
  const frKeys = getKeys(frObj);

  const missingInFr = enKeys.filter(key => !frKeys.includes(key));
  const missingInEn = frKeys.filter(key => !enKeys.includes(key));

  if (missingInFr.length > 0) {
    console.error('❌ Missing keys in FR:', missingInFr);
    process.exit(1);
  }

  if (missingInEn.length > 0) {
    console.error('❌ Missing keys in EN:', missingInEn);
    process.exit(1);
  }

  checkTypes(enObj, frObj);

  console.log('✅ i18n verified: All keys present and types match.');
} catch (e) {
  console.error('❌ i18n verification failed:', e.message || e);
  process.exit(1);
}
