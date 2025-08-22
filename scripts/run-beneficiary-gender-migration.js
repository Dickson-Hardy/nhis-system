const { db } = require('../lib/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Running beneficiary gender migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../lib/db/migrations/0013_add_beneficiary_gender.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await db.execute(migrationSQL);
    
    console.log('✅ Beneficiary gender migration completed successfully!');
    console.log('Added beneficiary_gender field to claims table');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runMigration();
