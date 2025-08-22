const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runCompleteSchemaFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read and execute the migration
    const migrationPath = path.join(__dirname, '012-complete-schema-fix.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Running complete schema fix migration...');
    await client.query(migrationSQL);
    console.log('✅ Complete schema fix completed successfully');

    // Verify batches table
    console.log('\n📋 Verifying batches table...');
    const batchesResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'batches' 
      ORDER BY ordinal_position
    `);

    const batchesColumns = batchesResult.rows.map(row => row.column_name);
    const requiredBatchesColumns = [
      'facility_id', 'batch_type', 'week_start_date', 'week_end_date',
      'completed_claims', 'approved_amount', 'admin_fee_percentage',
      'admin_fee_amount', 'net_amount', 'cover_letter_url',
      'cover_letter_file_name', 'forwarding_letter_generated'
    ];

    requiredBatchesColumns.forEach(col => {
      if (batchesColumns.includes(col)) {
        console.log(`  ✅ batches.${col}`);
      } else {
        console.log(`  ❌ batches.${col} - MISSING`);
      }
    });

    // Verify claims table
    console.log('\n📋 Verifying claims table...');
    const claimsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'claims' 
      ORDER BY ordinal_position
    `);

    const claimsColumns = claimsResult.rows.map(row => row.column_name);
    const requiredClaimsColumns = ['batch_id'];

    requiredClaimsColumns.forEach(col => {
      if (claimsColumns.includes(col)) {
        console.log(`  ✅ claims.${col}`);
      } else {
        console.log(`  ❌ claims.${col} - MISSING`);
      }
    });

    console.log('\n🎉 Schema verification completed!');

  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your database is running and DATABASE_URL is set correctly');
      console.log('   You can set it with: export DATABASE_URL="your_connection_string"');
    }
  } finally {
    await client.end();
  }
}

runCompleteSchemaFix();
