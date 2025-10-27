#!/usr/bin/env node

/**
 * Stripe Setup Verification Script
 *
 * This script validates your Stripe configuration to prevent mismatches
 * Run with: node verify-stripe-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying Stripe Setup...\n');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'web', '.env.local') });

let hasErrors = false;
let hasWarnings = false;

// ============================================================================
// 1. Check Required Environment Variables
// ============================================================================

console.log('1️⃣  Checking environment variables...\n');

const requiredEnvVars = {
  'STRIPE_SECRET_KEY': 'Stripe secret key (server-side)',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'Stripe publishable key (client-side)',
  'STRIPE_WEBHOOK_SECRET': 'Stripe webhook secret',
  'STRIPE_PRICE_PREMIUM_MONTHLY': 'Premium monthly price ID',
  'STRIPE_PRICE_PREMIUM_YEARLY': 'Premium yearly price ID',
  'STRIPE_PRICE_PRO_MONTHLY': 'Pro monthly price ID',
  'STRIPE_PRICE_PRO_YEARLY': 'Pro yearly price ID',
  'NEXT_PUBLIC_BASE_URL': 'Base URL for redirects',
};

for (const [varName, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[varName];

  if (!value) {
    console.log(`   ❌ ${varName}`);
    console.log(`      Missing: ${description}`);
    hasErrors = true;
  } else {
    console.log(`   ✅ ${varName}`);

    // Validate format
    if (varName === 'STRIPE_SECRET_KEY') {
      if (!value.startsWith('sk_')) {
        console.log(`      ⚠️  Warning: Should start with 'sk_test_' or 'sk_live_'`);
        hasWarnings = true;
      } else if (value.startsWith('sk_test_')) {
        console.log(`      📝 Test mode (development)`);
      } else if (value.startsWith('sk_live_')) {
        console.log(`      ⚠️  WARNING: Live mode detected! Use test mode for development!`);
        hasWarnings = true;
      }
    }

    if (varName === 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY') {
      if (!value.startsWith('pk_')) {
        console.log(`      ⚠️  Warning: Should start with 'pk_test_' or 'pk_live_'`);
        hasWarnings = true;
      }
    }

    if (varName === 'STRIPE_WEBHOOK_SECRET') {
      if (!value.startsWith('whsec_')) {
        console.log(`      ⚠️  Warning: Should start with 'whsec_'`);
        hasWarnings = true;
      }
    }

    if (varName.startsWith('STRIPE_PRICE_')) {
      if (!value.startsWith('price_')) {
        console.log(`      ⚠️  Warning: Should start with 'price_'`);
        hasWarnings = true;
      }
    }
  }
}

console.log();

// ============================================================================
// 2. Check Key Consistency (Test vs Live)
// ============================================================================

console.log('2️⃣  Checking key consistency...\n');

const secretKey = process.env.STRIPE_SECRET_KEY || '';
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

const secretIsTest = secretKey.startsWith('sk_test_');
const secretIsLive = secretKey.startsWith('sk_live_');
const publishableIsTest = publishableKey.startsWith('pk_test_');
const publishableIsLive = publishableKey.startsWith('pk_live_');

if (secretIsTest && publishableIsTest) {
  console.log('   ✅ Both keys are in TEST mode (correct for development)');
} else if (secretIsLive && publishableIsLive) {
  console.log('   ⚠️  WARNING: Both keys are in LIVE mode');
  console.log('      Make sure you intend to use production Stripe!');
  hasWarnings = true;
} else if (secretKey && publishableKey) {
  console.log('   ❌ KEY MISMATCH: Secret and publishable keys are from different modes!');
  console.log(`      Secret key: ${secretIsTest ? 'TEST' : 'LIVE'}`);
  console.log(`      Publishable key: ${publishableIsTest ? 'TEST' : 'LIVE'}`);
  console.log('      This will cause payment failures!');
  hasErrors = true;
}

console.log();

// ============================================================================
// 3. Check Price ID Format
// ============================================================================

console.log('3️⃣  Checking price ID formats...\n');

const priceIds = {
  'Premium Monthly': process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  'Premium Yearly': process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  'Pro Monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
  'Pro Yearly': process.env.STRIPE_PRICE_PRO_YEARLY,
};

const priceIdPattern = /^price_[a-zA-Z0-9]+$/;

for (const [name, priceId] of Object.entries(priceIds)) {
  if (!priceId) {
    console.log(`   ⏭️  ${name}: Not set (already reported above)`);
  } else if (!priceIdPattern.test(priceId)) {
    console.log(`   ❌ ${name}: Invalid format`);
    console.log(`      Got: ${priceId}`);
    console.log(`      Expected format: price_xxxxx`);
    hasErrors = true;
  } else {
    console.log(`   ✅ ${name}: ${priceId}`);
  }
}

console.log();

// ============================================================================
// 4. Check File Structure
// ============================================================================

console.log('4️⃣  Checking file structure...\n');

const requiredFiles = {
  'web/lib/stripe/index.ts': 'Stripe exports',
  'web/lib/stripe/server.ts': 'Server-side client',
  'web/lib/stripe/client.ts': 'Client-side loader',
  'web/lib/stripe/prices.ts': 'Price configuration',
  'supabase/migrations/20251026_add_stripe_fields.sql': 'Database migration',
};

for (const [filePath, description] of Object.entries(requiredFiles)) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`   ✅ ${filePath}`);
  } else {
    console.log(`   ❌ ${filePath}`);
    console.log(`      Missing: ${description}`);
    hasErrors = true;
  }
}

console.log();

// ============================================================================
// 5. Validate Pricing Amounts
// ============================================================================

console.log('5️⃣  Checking pricing configuration...\n');

try {
  const pricesContent = fs.readFileSync(
    path.join(__dirname, 'web', 'lib', 'stripe', 'prices.ts'),
    'utf8'
  );

  // Check for expected pricing amounts
  const expectedPrices = {
    'Premium Monthly': '999', // $9.99 in cents
    'Premium Yearly': '9900', // $99 in cents
    'Pro Monthly': '1999', // $19.99 in cents
    'Pro Yearly': '19900', // $199 in cents
  };

  let pricingMatches = true;
  for (const [name, amount] of Object.entries(expectedPrices)) {
    if (pricesContent.includes(`amount: ${amount}`)) {
      console.log(`   ✅ ${name}: $${(parseInt(amount) / 100).toFixed(2)}`);
    } else {
      console.log(`   ⚠️  ${name}: Amount not found or different`);
      hasWarnings = true;
      pricingMatches = false;
    }
  }

  if (pricingMatches) {
    console.log('\n   💡 Make sure these amounts match your Stripe Dashboard prices!');
  }

} catch (err) {
  console.log('   ⚠️  Could not validate pricing amounts');
  hasWarnings = true;
}

console.log();

// ============================================================================
// 6. Summary
// ============================================================================

console.log('━'.repeat(70));
console.log('\n📊 Summary\n');

if (!hasErrors && !hasWarnings) {
  console.log('   ✅ All checks passed! Your Stripe setup looks good.\n');
  console.log('   Next steps:');
  console.log('   1. Verify products exist in Stripe Dashboard');
  console.log('   2. Run database migration');
  console.log('   3. Start implementing Phase 2 (Checkout Flow)\n');
} else {
  if (hasErrors) {
    console.log('   ❌ ERRORS FOUND - Please fix the issues above before proceeding.\n');
  }
  if (hasWarnings) {
    console.log('   ⚠️  WARNINGS FOUND - Review the warnings above.\n');
  }
  console.log('   See STRIPE_PRODUCT_SETUP_GUIDE.md for help.\n');
}

// ============================================================================
// 7. Stripe Dashboard Checklist
// ============================================================================

console.log('━'.repeat(70));
console.log('\n📋 Stripe Dashboard Checklist\n');
console.log('Please verify in Stripe Dashboard:\n');
console.log('  [ ] Product "Ouros2 Premium" exists');
console.log('  [ ] Product "Ouros2 Pro" exists');
console.log('  [ ] Premium has monthly price ($9.99)');
console.log('  [ ] Premium has yearly price ($99.00)');
console.log('  [ ] Pro has monthly price ($19.99)');
console.log('  [ ] Pro has yearly price ($199.00)');
console.log('  [ ] All prices are set to "Recurring"');
console.log('  [ ] All prices have correct billing periods');
console.log('  [ ] Products have metadata (tier, app)');
console.log('  [ ] Prices have metadata (interval, tier, app)');
console.log('\n  🔗 https://dashboard.stripe.com/products\n');

console.log('━'.repeat(70));
console.log();

// Exit with error code if there are errors
process.exit(hasErrors ? 1 : 0);
