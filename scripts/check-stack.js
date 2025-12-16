#!/usr/bin/env node

/**
 * Check for forbidden Next.js imports and patterns
 * Enforces Vite + React stack per governance constraints
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const FORBIDDEN_IMPORTS = [
  { pattern: /from\s+['"]next['"]/, message: 'Next.js core import' },
  { pattern: /from\s+['"]next\//, message: 'Next.js module import' },
  { pattern: /import\s+.*\s+from\s+['"]next/, message: 'Next.js import' },
  { pattern: /require\(['"]next['"]/, message: 'Next.js require' },
  { pattern: /require\(['"]next\//, message: 'Next.js module require' },
];

const FORBIDDEN_PATTERNS = [
  { pattern: /getServerSideProps/, message: 'Next.js SSR pattern (getServerSideProps)' },
  { pattern: /getStaticProps/, message: 'Next.js SSG pattern (getStaticProps)' },
  { pattern: /getStaticPaths/, message: 'Next.js SSG pattern (getStaticPaths)' },
  { pattern: /getInitialProps/, message: 'Next.js pattern (getInitialProps)' },
  { pattern: /_app\.tsx/, message: 'Next.js _app.tsx file' },
  { pattern: /_document\.tsx/, message: 'Next.js _document.tsx file' },
];

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other common directories
      if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function checkStack() {
  console.log('🔍 Checking for forbidden Next.js patterns...\n');

  const srcDir = join(process.cwd(), 'src');
  let violations = [];

  try {
    const files = getAllFiles(srcDir);

    files.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const relPath = file.replace(process.cwd() + '/', '');

      // Check for forbidden imports
      FORBIDDEN_IMPORTS.forEach(({ pattern, message }) => {
        const matches = content.match(new RegExp(pattern, 'g'));
        if (matches) {
          violations.push({
            file: relPath,
            type: 'import',
            message,
            count: matches.length
          });
        }
      });

      // Check for forbidden patterns
      FORBIDDEN_PATTERNS.forEach(({ pattern, message }) => {
        if (pattern.test(content) || pattern.test(relPath)) {
          violations.push({
            file: relPath,
            type: 'pattern',
            message
          });
        }
      });
    });

    if (violations.length > 0) {
      console.error('❌ Forbidden Next.js patterns detected!\n');
      
      violations.forEach(({ file, message, count }) => {
        if (count) {
          console.error(`  ${file}:`);
          console.error(`    - ${message} (${count} occurrence${count > 1 ? 's' : ''})`);
        } else {
          console.error(`  ${file}:`);
          console.error(`    - ${message}`);
        }
      });

      console.error('\n❌ Stack validation failed!\n');
      console.error('Per CI Guardrails: Next.js imports and patterns are P0 blockers.\n');
      console.error('Action required:');
      console.error('  1. Remove all Next.js imports and dependencies');
      console.error('  2. Use Vite + React patterns instead');
      console.error('  3. For routing: Use React Router');
      console.error('  4. For SSR: Not needed (SPA + Supabase architecture)');
      console.error('\nAllowed stack:');
      console.error('  ✓ Vite');
      console.error('  ✓ React 18');
      console.error('  ✓ TypeScript');
      console.error('  ✓ Supabase\n');

      process.exit(1);
    } else {
      console.log('✅ Stack validation passed!');
      console.log('   - No Next.js imports detected');
      console.log('   - Using approved Vite + React stack');
      console.log('   - Governance compliance verified\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error checking stack:', error.message);
    process.exit(1);
  }
}

checkStack();
