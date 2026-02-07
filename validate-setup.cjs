#!/usr/bin/env node
/**
 * VALIDATION SCRIPT - Pre-Download Health Check
 * 
 * Provjera da li su sve konfiguracije ispravne prije pokretanja downloader-a
 * 
 * Usage: node validate-setup.cjs
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset}  ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset}  ${msg}`),
    title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
    blank: () => console.log(''),
};

let checksPass = true;

log.title('╔════════════════════════════════════════════════════════════════╗');
log.title('║     🔍 SETUP VALIDATION - Pre-Download Health Check           ║');
log.title('╚════════════════════════════════════════════════════════════════╝');

// ============================================================================
// CHECK 1: .env Files Exist
// ============================================================================
log.title('CHECK 1: Environment Files');

const envFiles = {
    '.env': 'Frontend configuration',
    '.env.server': 'Backend configuration (SERVICE_ROLE_KEY)',
};

for (const [file, desc] of Object.entries(envFiles)) {
    if (fs.existsSync(file)) {
        log.success(`${file} - ${desc}`);
    } else {
        log.error(`${file} - ${desc} - NOT FOUND`);
        checksPass = false;
    }
}

// ============================================================================
// CHECK 2: Required Environment Variables
// ============================================================================
log.title('CHECK 2: Environment Variables');

// Load environment files with proper precedence
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.server' });
require('dotenv').config({ path: '.env.server.local' });
require('dotenv').config({ path: '.env.local' });

const requiredEnv = {
    '.env': [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_SOLVEX_LOGIN',
        'VITE_SOLVEX_PASSWORD',
    ],
    '.env.server': [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SOLVEX_LOGIN',
        'SOLVEX_PASSWORD',
    ],
};

// Check .env variables
log.info('.env variables:');
requiredEnv['.env'].forEach((varName) => {
    const value = process.env[varName];
    if (value && value !== 'PLACEHOLDER_SERVICE_ROLE_KEY') {
        const preview = value.substring(0, 30) + (value.length > 30 ? '...' : '');
        log.success(`  ${varName} = ${preview}`);
    } else if (value === 'PLACEHOLDER_SERVICE_ROLE_KEY') {
        log.warning(`  ${varName} - Still placeholder`);
    } else {
        log.error(`  ${varName} - NOT SET`);
        checksPass = false;
    }
});

// Check .env.server variables (OPTIONAL - nur if using SERVICE_ROLE_KEY)
log.blank();
log.info('.env.server variables (Optional - only needed for production):');

// Manually load .env.server since dotenv doesn't rerun
const envServerContent = fs.readFileSync('.env.server', 'utf-8');
const envServer = {};

envServerContent.split('\n').forEach((line) => {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envServer[key] = value;
    }
});

if (envServer.SUPABASE_SERVICE_ROLE_KEY && envServer.SUPABASE_SERVICE_ROLE_KEY !== 'PLACEHOLDER_SERVICE_ROLE_KEY') {
    log.success(`  SUPABASE_SERVICE_ROLE_KEY - Set for production`);
} else {
    log.warning(`  SUPABASE_SERVICE_ROLE_KEY - Not configured (OK for now, will use ANON_KEY)`);
}

// ============================================================================
// CHECK 3: Dependencies
// ============================================================================
log.title('CHECK 3: Node.js Dependencies');

const requiredPackages = ['@supabase/supabase-js', 'dotenv', 'fast-xml-parser'];
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

requiredPackages.forEach((pkg) => {
    if (dependencies[pkg]) {
        log.success(`${pkg} - ${dependencies[pkg]}`);
    } else {
        log.error(`${pkg} - NOT INSTALLED`);
        checksPass = false;
    }
});

// ============================================================================
// CHECK 4: Download Script
// ============================================================================
log.title('CHECK 4: Download Script');

if (fs.existsSync('download_hotel_content.cjs')) {
    log.success('download_hotel_content.cjs - Ready to use');
} else {
    log.error('download_hotel_content.cjs - NOT FOUND');
    checksPass = false;
}

// ============================================================================
// CHECK 5: RLS Policies
// ============================================================================
log.title('CHECK 5: RLS Policies (Manual Check Required)');
log.warning('RLS policies must be manually applied in Supabase SQL Editor:');
log.info('URL: https://app.supabase.com/project/fzupyhunlucpjaaxksoi/sql');
log.info('File: supabase/migrations/20260206_security_rls_improvements.sql');
log.blank();
log.warning('To verify RLS is applied, run this query in Supabase SQL Editor:');
log.info('SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\'');
log.info('Expected: rowsecurity = true for \'properties\' and \'reservations\'');

// ============================================================================
// SUMMARY
// ============================================================================
log.blank();
log.title('╔════════════════════════════════════════════════════════════════╗');

if (checksPass) {
    log.title('║     ✅ ALL CHECKS PASSED - Ready to download!               ║');
    log.title('╚════════════════════════════════════════════════════════════════╝');
    console.log(`\n${colors.green}Next command:${colors.reset}`);
    console.log(`  node download_hotel_content.cjs\n`);
    process.exit(0);
} else {
    log.title('║     ❌ SOME CHECKS FAILED - Fix errors above                 ║');
    log.title('╚════════════════════════════════════════════════════════════════╝');
    console.log(`\n${colors.red}Please fix the errors above and run this script again.${colors.reset}\n`);
    process.exit(1);
}
