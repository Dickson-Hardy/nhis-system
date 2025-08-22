const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read and execute the migration
    const migrationPath = path.join(__dirname, '010-add-facility-id-to-batches.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('Migration completed successfully');

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'batches' AND column_name = 'facility_id'
    `);

    if (result.rows.length > 0) {
      console.log('✅ facility_id column verified in batches table');
      console.log('Column details:', result.rows[0]);
    } else {
      console.log('❌ facility_id column not found in batches table');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
