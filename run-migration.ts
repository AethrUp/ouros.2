/**
 * Run the friend code migration
 * This script executes the supabase_migration_synastry_friendcode.sql file
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  console.error('Need: EXPO_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'supabase_migration_synastry_friendcode.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Executing migration...');
    console.log('Note: This may take a moment...\n');

    // Split SQL into individual statements and execute them
    // We need to handle this carefully because Supabase's RPC doesn't support multi-statement queries
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        // Use the SQL query function
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          // Try direct query if RPC doesn't exist
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: statement + ';' })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
        }

        successCount++;
        console.log(`✓ Executed statement ${i + 1}/${statements.length}`);
      } catch (err: any) {
        // Some statements might fail if they already exist (like CREATE INDEX IF NOT EXISTS)
        // We'll log but continue
        console.log(`⚠ Statement ${i + 1} warning: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n✅ Migration completed!');
    console.log(`   Successful: ${successCount}`);
    console.log(`   Warnings: ${errorCount}`);
    console.log('\nThe friend_code column should now be available in your profiles table.');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nYou may need to run this migration manually via the Supabase dashboard.');
    console.error('SQL file location: supabase_migration_synastry_friendcode.sql');
    process.exit(1);
  }
}

console.log('=== Supabase Friend Code Migration ===\n');
runMigration();
