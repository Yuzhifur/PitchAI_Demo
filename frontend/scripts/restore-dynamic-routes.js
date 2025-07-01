#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Restoring dynamic routes after build...');

const dynamicRoutePath = path.join(__dirname, '../src/app/projects/[id]');
const disabledRoutePath = path.join(__dirname, '../src/app/projects/_id_disabled');

if (fs.existsSync(disabledRoutePath)) {
  fs.renameSync(disabledRoutePath, dynamicRoutePath);
  console.log('✅ Dynamic routes restored');
}