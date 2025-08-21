const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Running migration: 008-update-batch-status-for-tpa-autonomy');
    
    // Execute migration steps individually
    console.log('Step 1: Updating existing approved/verified_paid batches to closed status...');
    const updateResult = await sql`
      UPDATE batches 
      SET status = 'closed'
      WHERE status IN ('approved', 'verified_paid')
    `;
    
    console.log(`Updated ${updateResult.length} batches to closed status`);
    
    console.log('✅ Migration completed successfully!');
    console.log('Updated batch status system for TPA autonomous workflow');
    
    // Verify the changes
    const batches = await sql`SELECT status, COUNT(*) as count FROM batches GROUP BY status`;
    console.log('\n📊 Current batch status distribution:');
    batches.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();