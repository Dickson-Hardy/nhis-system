const { Client } = require('pg');

async function checkBatchesDebug() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if batches table exists and has data
    console.log('\n📋 Checking batches table...');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'batches'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ batches table does not exist!');
      return;
    }
    console.log('✅ batches table exists');

    // Check total number of batches
    const totalBatches = await client.query('SELECT COUNT(*) as count FROM batches');
    console.log(`📊 Total batches in database: ${totalBatches.rows[0].count}`);

    // List all batches with their IDs
    const allBatches = await client.query(`
      SELECT id, batch_number, status, facility_id, created_at 
      FROM batches 
      ORDER BY id
    `);

    if (allBatches.rows.length === 0) {
      console.log('❌ No batches found in database');
    } else {
      console.log('\n📋 All batches in database:');
      allBatches.rows.forEach(batch => {
        console.log(`  - ID: ${batch.id}, Number: ${batch.batch_number}, Status: ${batch.status}, Facility: ${batch.facility_id}, Created: ${batch.created_at}`);
      });
    }

    // Check if batch ID 65 exists
    const batch65 = await client.query('SELECT * FROM batches WHERE id = 65');
    if (batch65.rows.length === 0) {
      console.log('\n❌ Batch ID 65 does not exist in database');
    } else {
      console.log('\n✅ Batch ID 65 exists:');
      console.log(JSON.stringify(batch65.rows[0], null, 2));
    }

    // Check facilities table
    console.log('\n📋 Checking facilities table...');
    const facilities = await client.query('SELECT id, name, code FROM facilities ORDER BY id');
    console.log(`📊 Total facilities: ${facilities.rows.length}`);
    facilities.rows.forEach(facility => {
      console.log(`  - ID: ${facility.id}, Name: ${facility.name}, Code: ${facility.code}`);
    });

    // Check if there are any batches for each facility
    console.log('\n📋 Batches per facility:');
    for (const facility of facilities.rows) {
      const facilityBatches = await client.query('SELECT COUNT(*) as count FROM batches WHERE facility_id = $1', [facility.id]);
      console.log(`  - Facility ${facility.id} (${facility.name}): ${facilityBatches.rows[0].count} batches`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your database is running and DATABASE_URL is set correctly');
    }
  } finally {
    await client.end();
  }
}

checkBatchesDebug();
