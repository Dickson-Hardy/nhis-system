const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSQL(sql) {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ SQL executed successfully');
  } catch (error) {
    console.error('❌ SQL execution failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function setupDatabase() {
  try {
    console.log('🔄 Setting up NHIS database...\n');

    // 1. Create tables
    console.log('1. Creating database tables...');
    const createTablesSQL = fs.readFileSync(path.join(__dirname, '001-create-tables.sql'), 'utf8');
    await runSQL(createTablesSQL);

    // 2. Seed initial data
    console.log('\n2. Seeding initial data...');
    const seedDataSQL = fs.readFileSync(path.join(__dirname, '002-seed-initial-data.sql'), 'utf8');
    await runSQL(seedDataSQL);

    // 3. Update claim statuses
    console.log('\n3. Updating claim statuses...');
    const updateStatusSQL = fs.readFileSync(path.join(__dirname, '003-update-claim-statuses.sql'), 'utf8');
    await runSQL(updateStatusSQL);

    // 4. Add sample claims data
    console.log('\n4. Adding sample claims data...');
    const sampleClaimsSQL = fs.readFileSync(path.join(__dirname, '004-sample-claims.sql'), 'utf8');
    await runSQL(sampleClaimsSQL);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Start the development server: pnpm dev');
    console.log('2. Login with demo credentials:');
    console.log('   - TPA Admin: tpa@healthcareplus.com / admin@2025');
    console.log('   - Facility Admin: facility@luth.edu.ng / admin@2025');
    console.log('   - NHIS Admin: admin@nhis.gov.ng / admin@2025');

  } catch (error) {
    console.error('\n💥 Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();