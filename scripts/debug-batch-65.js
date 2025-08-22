const { Client } = require('pg');

async function debugBatch65() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check batch ID 65 details
    console.log('\n🔍 Checking batch ID 65...');
    const batch65 = await client.query(`
      SELECT 
        b.id,
        b.batch_number,
        b.status,
        b.facility_id,
        b.tpa_id,
        b.created_at,
        f.name as facility_name,
        f.code as facility_code,
        t.name as tpa_name
      FROM batches b
      LEFT JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN tpas t ON b.tpa_id = t.id
      WHERE b.id = 65
    `);

    if (batch65.rows.length === 0) {
      console.log('❌ Batch ID 65 does not exist');
      return;
    }

    const batch = batch65.rows[0];
    console.log('✅ Batch ID 65 found:');
    console.log(JSON.stringify(batch, null, 2));

    // Check if facility_id is set
    if (!batch.facility_id) {
      console.log('\n❌ Batch has no facility_id - this will cause 404 errors');
    } else {
      console.log(`\n✅ Batch belongs to facility ID: ${batch.facility_id} (${batch.facility_name})`);
    }

    // Check all facilities
    console.log('\n📋 All facilities in database:');
    const facilities = await client.query('SELECT id, name, code FROM facilities ORDER BY id');
    facilities.rows.forEach(facility => {
      console.log(`  - ID: ${facility.id}, Name: ${facility.name}, Code: ${facility.code}`);
    });

    // Check if the batch's facility_id matches any existing facility
    if (batch.facility_id) {
      const facilityExists = facilities.rows.find(f => f.id === batch.facility_id);
      if (!facilityExists) {
        console.log(`\n❌ Batch facility_id (${batch.facility_id}) doesn't match any existing facility`);
      } else {
        console.log(`\n✅ Batch facility_id (${batch.facility_id}) matches facility: ${facilityExists.name}`);
      }
    }

    // Check all batches for this facility
    if (batch.facility_id) {
      console.log(`\n📋 All batches for facility ${batch.facility_id}:`);
      const facilityBatches = await client.query(`
        SELECT id, batch_number, status, created_at 
        FROM batches 
        WHERE facility_id = $1 
        ORDER BY id
      `, [batch.facility_id]);
      
      facilityBatches.rows.forEach(b => {
        console.log(`  - ID: ${b.id}, Number: ${b.batch_number}, Status: ${b.status}, Created: ${b.created_at}`);
      });
    }

    // Check for any batches without facility_id
    console.log('\n🔍 Checking for batches without facility_id...');
    const batchesWithoutFacility = await client.query(`
      SELECT id, batch_number, status, created_at 
      FROM batches 
      WHERE facility_id IS NULL
      ORDER BY id
    `);

    if (batchesWithoutFacility.rows.length > 0) {
      console.log('❌ Found batches without facility_id:');
      batchesWithoutFacility.rows.forEach(b => {
        console.log(`  - ID: ${b.id}, Number: ${b.batch_number}, Status: ${b.status}`);
      });
    } else {
      console.log('✅ All batches have facility_id set');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await client.end();
  }
}

debugBatch65();
