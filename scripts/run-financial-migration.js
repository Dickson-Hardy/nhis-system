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
    console.error('Error details:', error.detail || error);
    throw error;
  } finally {
    client.release();
  }
}

async function addFinancialTables() {
  try {
    console.log('🔄 Adding financial tables to NHIS database...\n');

    // Add financial tables migration
    console.log('Adding financial tables (advance_payments, reimbursements, error_logs)...');
    const financialTablesSQL = fs.readFileSync(path.join(__dirname, '006-add-financial-tables.sql'), 'utf8');
    await runSQL(financialTablesSQL);

    console.log('\n🎉 Financial tables migration completed successfully!');
    console.log('\nThe following tables have been added:');
    console.log('- advance_payments: For tracking NHIS advance payments to TPAs');
    console.log('- reimbursements: For tracking NHIS reimbursements to TPAs');
    console.log('- error_logs: For tracking validation and processing errors');

  } catch (error) {
    console.error('\n💥 Financial tables migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addFinancialTables();