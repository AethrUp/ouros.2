// Direct migration runner using Supabase REST API
// This reads from web/.env.local and runs the migration

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'web', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in web/.env.local');
  process.exit(1);
}

console.log('📖 Reading migration file...');
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'supabase', 'migrations', '20251026_add_stripe_fields.sql'),
  'utf8'
);

console.log('🚀 Running migration...\n');
console.log('Migration SQL:');
console.log('='.repeat(80));
console.log(migrationSQL);
console.log('='.repeat(80));
console.log('\n✅ Migration script prepared.');
console.log('\nTo run this migration, please:');
console.log('1. Go to: https://supabase.com/dashboard/project/rhchespvbiesrplsdkiz/sql');
console.log('2. Copy the SQL above');
console.log('3. Paste into the SQL Editor');
console.log('4. Click "Run"');
console.log('\nThe migration uses IF NOT EXISTS clauses, so it\'s safe to run multiple times.\n');
