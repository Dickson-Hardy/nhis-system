const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function checkBatches() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    const batches = await sql`SELECT * FROM batches ORDER BY id`;
    console.log('Existing batches:', batches);
    
    const claims = await sql`SELECT * FROM claims ORDER BY id`;
    console.log('Existing claims count:', claims.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkBatches();