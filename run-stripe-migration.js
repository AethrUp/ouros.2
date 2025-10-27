// Run Stripe Migration
// This script executes the Stripe fields migration against the Supabase database
// Run with: node run-stripe-migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual configuration - update these with your Supabase credentials
const supabaseUrl = 'https://rhchespvbiesrplsdkiz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseServiceKey) {
  console.log('\n⚠️  SUPABASE_SERVICE_KEY environment variable not set.');
  console.log('Please run the migration manually in the Supabase SQL Editor:');
  console.log('1. Go to https://supabase.com/dashboard/project/rhchespvbiesrplsdkiz/sql');
  console.log('2. Copy and paste the contents of supabase/migrations/20251026_add_stripe_fields.sql');
  console.log('3. Click "Run"\n');

  // Print the migration SQL for easy copy-paste
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'supabase', 'migrations', '20251026_add_stripe_fields.sql'),
    'utf8'
  );
  console.log('Migration SQL to run:\n');
  console.log('='.repeat(80));
  console.log(migrationSQL);
  console.log('='.repeat(80));
  console.log('\nAfter running the migration, you can continue with the Stripe setup.\n');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'supabase', 'migrations', '20251026_add_stripe_fields.sql'),
      'utf8'
    );

    console.log('Executing migration with service role...');
    console.log('This will add Stripe fields to your database.\n');

    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('\nPlease run the migration manually in Supabase SQL Editor.');
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nStripe fields have been added to:');
    console.log('  - subscription_state table');
    console.log('  - subscription_history table');
    console.log('  - Created stripe_webhook_events table\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\nPlease run the migration manually in Supabase SQL Editor.');
    process.exit(1);
  }
}

runMigration();
