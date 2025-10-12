// Quick migration runner for Supabase
// Run this with: node run-migration.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Make sure you have:');
  console.error('  - EXPO_PUBLIC_SUPABASE_URL in your .env');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY in your .env (from Supabase Dashboard > Settings > API)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  try {
    console.log('📦 Reading migration file...');
    const migrationPath = path.join(__dirname, 'supabase_migration_subscription_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, we need to run it manually
      console.log('⚠️  exec_sql function not available. Please run migration manually:');
      console.log('\n1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy the contents of: supabase_migration_subscription_system.sql');
      console.log('5. Paste and run it\n');
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart your app');
    console.log('2. Triple-tap Profile screen to open Debug Panel');
    console.log('3. Test subscription tiers!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Manual migration steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy the contents of: supabase_migration_subscription_system.sql');
    console.log('5. Paste and run it');
  }
}

runMigration();
