#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const mode = process.argv[2];

if (!mode || !['static', 'full'].includes(mode)) {
  console.log('Usage: node scripts/deploy-mode.js [static|full]');
  console.log('  static: Prepare for GitHub Pages (limited functionality)');
  console.log('  full:   Prepare for Vercel/Netlify (full functionality)');
  process.exit(1);
}

const configPath = path.join(__dirname, '../next.config.js');
let config = fs.readFileSync(configPath, 'utf8');

if (mode === 'static') {
  console.log('🔧 Configuring for static export (GitHub Pages)...');
  // Enable static export
  config = config.replace(
    '...(isStaticExport && { output: \'export\' }),',
    'output: \'export\','
  );
  console.log('✅ Static export enabled');
} else {
  console.log('🔧 Configuring for full deployment (Vercel/Netlify)...');
  // Disable static export
  config = config.replace(
    'output: \'export\',',
    '...(isStaticExport && { output: \'export\' }),'
  );
  console.log('✅ Full functionality enabled');
}

fs.writeFileSync(configPath, config);
console.log(`✅ Configuration updated for ${mode} deployment`);