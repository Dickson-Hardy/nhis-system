const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Resetting NHIS database...\n');

    // Drop all tables if they exist
    const dropTablesSQL = `
      DROP TABLE IF EXISTS claims CASCADE;
      DROP TABLE IF EXISTS batches CASCADE;
      DROP TABLE IF EXISTS facilities CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS tpas CASCADE;
    `;

    await client.query(dropTablesSQL);
    console.log('✅ All tables dropped successfully');

  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();