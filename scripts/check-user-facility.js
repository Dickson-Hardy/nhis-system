const { Client } = require('pg');

async function checkUserFacility() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check all users with facility_id
    console.log('\n👥 Users with facility_id:');
    const users = await client.query(`
      SELECT id, name, email, role, facility_id, tpa_id
      FROM users 
      WHERE facility_id IS NOT NULL
      ORDER BY id
    `);

    users.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}, Facility: ${user.facility_id}, TPA: ${user.tpa_id}`);
    });

    // Check batch 65
    console.log('\n📦 Batch 65 details:');
    const batch65 = await client.query(`
      SELECT id, batch_number, facility_id, tpa_id, status
      FROM batches 
      WHERE id = 65
    `);

    if (batch65.rows.length === 0) {
      console.log('❌ Batch 65 does not exist');
    } else {
      const batch = batch65.rows[0];
      console.log(`  - ID: ${batch.id}, Number: ${batch.batch_number}, Facility: ${batch.facility_id}, TPA: ${batch.tpa_id}, Status: ${batch.status}`);
    }

    // Check if any users can access batch 65
    if (batch65.rows.length > 0) {
      const batch = batch65.rows[0];
      console.log('\n🔍 Users who can access batch 65:');
      const accessibleUsers = users.rows.filter(user => user.facility_id === batch.facility_id);
      
      if (accessibleUsers.length === 0) {
        console.log('❌ No users can access batch 65 (facility mismatch)');
      } else {
        accessibleUsers.forEach(user => {
          console.log(`  ✅ ${user.name} (${user.email}) - Facility: ${user.facility_id}`);
        });
      }
    }

    // Check all batches and their facilities
    console.log('\n📋 All batches with their facilities:');
    const allBatches = await client.query(`
      SELECT b.id, b.batch_number, b.facility_id, f.name as facility_name
      FROM batches b
      LEFT JOIN facilities f ON b.facility_id = f.id
      ORDER BY b.id
    `);

    allBatches.rows.forEach(batch => {
      console.log(`  - Batch ${batch.id}: ${batch.batch_number} (Facility: ${batch.facility_id} - ${batch.facility_name})`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await client.end();
  }
}

checkUserFacility();
