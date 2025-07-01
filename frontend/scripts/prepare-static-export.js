#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const isStaticExport = process.env.NEXT_EXPORT === 'true';

if (isStaticExport) {
  console.log('🔧 Preparing for static export - disabling dynamic routes...');
  
  const dynamicRoutePath = path.join(__dirname, '../src/app/projects/[id]');
  const disabledRoutePath = path.join(__dirname, '../src/app/projects/_id_disabled');
  
  if (fs.existsSync(dynamicRoutePath)) {
    fs.renameSync(dynamicRoutePath, disabledRoutePath);
    console.log('✅ Dynamic routes disabled for static export');
  }
} else {
  console.log('🔧 Regular build - ensuring dynamic routes are enabled...');
  
  const dynamicRoutePath = path.join(__dirname, '../src/app/projects/[id]');
  const disabledRoutePath = path.join(__dirname, '../src/app/projects/_id_disabled');
  
  if (fs.existsSync(disabledRoutePath)) {
    fs.renameSync(disabledRoutePath, dynamicRoutePath);
    console.log('✅ Dynamic routes enabled for regular build');
  }
}