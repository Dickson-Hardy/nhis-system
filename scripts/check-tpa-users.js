const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { eq } = require('drizzle-orm');

// This script checks and fixes TPA user assignments
async function checkAndFixTpaUsers() {
  try {
    // Check if .env is loaded
    require('dotenv').config({ path: '.env.local' });
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      console.log('Please create a .env.local file with your DATABASE_URL');
      return;
    }

    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔍 Checking current users...');
    
    // Get all users
    const users = await sql`SELECT id, email, role, name, tpa_id, facility_id, is_active FROM users ORDER BY id`;
    console.log('\n📊 Current users in database:');
    console.table(users);
    
    // Get all TPAs
    const tpas = await sql`SELECT id, name, code FROM tpas ORDER BY id`;
    console.log('\n🏢 Current TPAs in database:');
    console.table(tpas);
    
    // Check for TPA users without tpa_id
    const tpaUsersWithoutTpaId = users.filter(user => user.role === 'tpa' && !user.tpa_id);
    
    if (tpaUsersWithoutTpaId.length > 0) {
      console.log('\n⚠️  Found TPA users without tpa_id assignment:');
      console.table(tpaUsersWithoutTpaId);
      
      // Try to fix based on email patterns
      for (const user of tpaUsersWithoutTpaId) {
        let tpaId = null;
        
        // Match based on email domain
        if (user.email.includes('hci-tpa.com')) {
          tpaId = 1; // HealthCare International TPA
        } else if (user.email.includes('medicareplus.com')) {
          tpaId = 2; // MediCare Plus TPA
        } else if (user.email.includes('wellhealth.com')) {
          tpaId = 3; // WellHealth TPA Services
        } else if (user.email.includes('premiumhealth.com')) {
          tpaId = 4; // Premium Health TPA
        }
        
        if (tpaId) {
          console.log(`🔧 Fixing user ${user.email} - assigning tpa_id = ${tpaId}`);
          await sql`UPDATE users SET tpa_id = ${tpaId} WHERE id = ${user.id}`;
        } else {
          console.log(`⚠️  Could not determine TPA for user: ${user.email}`);
        }
      }
    } else {
      console.log('\n✅ All TPA users have proper tpa_id assignments');
    }
    
    // Check for facility users without facility_id
    const facilityUsersWithoutFacilityId = users.filter(user => user.role === 'facility' && !user.facility_id);
    
    if (facilityUsersWithoutFacilityId.length > 0) {
      console.log('\n⚠️  Found facility users without facility_id assignment:');
      console.table(facilityUsersWithoutFacilityId);
      
      // Get facilities for reference
      const facilities = await sql`SELECT id, name, code, contact_email FROM facilities ORDER BY id`;
      
      // Try to fix based on email patterns or prompt for manual assignment
      for (const user of facilityUsersWithoutFacilityId) {
        let facilityId = null;
        
        // Try to match based on email domain to existing facilities
        const emailDomain = user.email.split('@')[1];
        
        // Look for facilities with matching domains in their contact email or name
        const matchingFacility = facilities.find(facility => {
          if (facility.contact_email && facility.contact_email.includes(emailDomain)) {
            return true;
          }
          
          // Check if facility name contains keywords from email domain
          const domainKeywords = emailDomain.split('.').filter(part => part.length > 2);
          return domainKeywords.some(keyword => 
            facility.name.toLowerCase().includes(keyword.toLowerCase())
          );
        });
        
        if (matchingFacility) {
          facilityId = matchingFacility.id;
          console.log(`🔧 Fixing facility user ${user.email} - assigning facility_id = ${facilityId} (${matchingFacility.name})`);
          await sql`UPDATE users SET facility_id = ${facilityId} WHERE id = ${user.id}`;
        } else {
          console.log(`⚠️  Could not determine facility for user: ${user.email}`);
          console.log(`   Available facilities:`);
          facilities.forEach(f => console.log(`     - ID: ${f.id}, Name: ${f.name}, Code: ${f.code}`));
          console.log(`   Please manually assign facility_id for this user or create a new facility`);
        }
      }
    } else {
      console.log('\n✅ All facility users have proper facility_id assignments');
    }
    
    // Final check - show updated users
    const updatedUsers = await sql`SELECT id, email, role, name, tpa_id, facility_id, is_active FROM users ORDER BY id`;
    console.log('\n📊 Updated users in database:');
    console.table(updatedUsers);
    
    console.log('\n✅ Database check and fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('connect')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure your .env file exists with DATABASE_URL');
      console.log('2. Check if your database is running and accessible');
      console.log('3. Verify your database connection string is correct');
    }
  }
}

// Run the check
checkAndFixTpaUsers();