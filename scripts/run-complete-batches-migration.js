const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runCompleteMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read and execute the migration
    const migrationPath = path.join(__dirname, '011-update-batches-table-complete.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running complete batches table migration...');
    await client.query(migrationSQL);
    console.log('✅ Complete migration completed successfully');

    // Verify the columns were added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'batches' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Current batches table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check for specific required columns
    const requiredColumns = [
      'facility_id', 'batch_type', 'week_start_date', 'week_end_date',
      'completed_claims', 'approved_amount', 'admin_fee_percentage',
      'admin_fee_amount', 'net_amount', 'cover_letter_url',
      'cover_letter_file_name', 'forwarding_letter_generated'
    ];

    console.log('\n🔍 Checking required columns:');
    const existingColumns = result.rows.map(row => row.column_name);
    
    requiredColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        console.log(`  ✅ ${col}`);
      } else {
        console.log(`  ❌ ${col} - MISSING`);
      }
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your database is running and DATABASE_URL is set correctly');
    }
  } finally {
    await client.end();
  }
}

runCompleteMigration();
