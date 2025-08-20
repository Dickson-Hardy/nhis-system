require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkAndUpdateDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database successfully!');

    // Check if tables exist
    const checkTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const { rows: tables } = await client.query(checkTablesQuery);
    console.log('\nExisting tables:', tables.map(t => t.table_name));

    // Check if users table has tpa_id and facility_id columns
    const checkUsersColumns = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const { rows: userColumns } = await client.query(checkUsersColumns);
    console.log('\nUsers table columns:', userColumns);

    const hasTpaId = userColumns.some(col => col.column_name === 'tpa_id');
    const hasFacilityId = userColumns.some(col => col.column_name === 'facility_id');

    // Add missing columns to users table if needed
    if (!hasTpaId) {
      console.log('\nAdding tpa_id column to users table...');
      await client.query('ALTER TABLE users ADD COLUMN tpa_id integer;');
      await client.query('ALTER TABLE users ADD CONSTRAINT users_tpa_id_tpas_id_fk FOREIGN KEY (tpa_id) REFERENCES tpas(id);');
    }

    if (!hasFacilityId) {
      console.log('Adding facility_id column to users table...');
      await client.query('ALTER TABLE users ADD COLUMN facility_id integer;');
      await client.query('ALTER TABLE users ADD CONSTRAINT users_facility_id_facilities_id_fk FOREIGN KEY (facility_id) REFERENCES facilities(id);');
    }

    // Check existing data counts
    const checkDataQuery = `
      SELECT 
        (SELECT COUNT(*) FROM tpas) as tpa_count,
        (SELECT COUNT(*) FROM facilities) as facility_count,
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM claims) as claim_count,
        (SELECT COUNT(*) FROM batches) as batch_count;
    `;
    
    const { rows: dataCounts } = await client.query(checkDataQuery);
    console.log('\nCurrent data counts:', dataCounts[0]);

    // Add sample data only if tables are empty
    const counts = dataCounts[0];

    if (parseInt(counts.tpa_count) === 0) {
      console.log('\nAdding sample TPAs...');
      await client.query(`
        INSERT INTO tpas (name, code, contact_email, contact_phone, address) VALUES
        ('HealthCare Plus TPA Limited', 'HCP001', 'info@healthcareplus.ng', '08012345678', '123 Victoria Island, Lagos, Nigeria'),
        ('MediCare Trust TPA', 'MCT002', 'contact@medicaretrust.ng', '08087654321', '456 Garki District, Abuja, Nigeria'),
        ('WellPoint TPA Services', 'WPS003', 'hello@wellpoint.ng', '08098765432', '789 GRA, Port Harcourt, Nigeria');
      `);
    }

    if (parseInt(counts.facility_count) === 0) {
      console.log('Adding sample facilities...');
      await client.query(`
        INSERT INTO facilities (name, code, state, address, contact_email, contact_phone, tpa_id) VALUES
        ('Lagos University Teaching Hospital', 'LUTH001', 'Lagos', 'Idi-Araba, Surulere, Lagos', 'info@luth.edu.ng', '08011111111', 1),
        ('Ahmadu Bello University Teaching Hospital', 'ABUTH002', 'Kaduna', 'Tudun Wada, Zaria, Kaduna State', 'contact@abuth.org.ng', '08022222222', 1),
        ('University of Nigeria Teaching Hospital', 'UNTH003', 'Enugu', 'Ituku-Ozalla, Enugu State', 'info@unth.edu.ng', '08033333333', 2),
        ('Federal Medical Centre Katsina', 'FMCK004', 'Katsina', 'Katsina, Katsina State', 'contact@fmckatsina.gov.ng', '08044444444', 2),
        ('University College Hospital Ibadan', 'UCH005', 'Oyo', 'Queen Elizabeth Road, Ibadan, Oyo State', 'info@uchng.org', '08055555555', 3);
      `);
    }

    if (parseInt(counts.user_count) === 0) {
      console.log('Adding sample users...');
      // Note: Using the previously hashed password for "admin@2025"
      const hashedPassword = '$2a$12$8GvAi1.sQoC8zDfJ4p2ZMuOx7c9m.Xqf7.4Ib9N.3c6x8YpQ2e9m6u';
      
      await client.query(`
        INSERT INTO users (email, password, role, name, tpa_id, facility_id) VALUES
        ('admin@nhis.gov.ng', '${hashedPassword}', 'nhis_admin', 'NHIS Administrator', NULL, NULL),
        ('tpa1@healthcareplus.ng', '${hashedPassword}', 'tpa', 'Healthcare Plus TPA Manager', 1, NULL),
        ('tpa2@medicaretrust.ng', '${hashedPassword}', 'tpa', 'MediCare Trust Manager', 2, NULL),
        ('facility1@luth.edu.ng', '${hashedPassword}', 'facility', 'LUTH Claims Officer', NULL, 1),
        ('facility2@abuth.org.ng', '${hashedPassword}', 'facility', 'ABUTH Claims Manager', NULL, 2);
      `);
    }

    if (parseInt(counts.batch_count) === 0) {
      console.log('Adding sample batches...');
      await client.query(`
        INSERT INTO batches (batch_number, tpa_id, total_claims, total_amount, status, created_by) VALUES
        ('BATCH-2024-001', 1, 25, 2750000.00, 'submitted', 2),
        ('BATCH-2024-002', 1, 18, 1980000.00, 'verified', 2),
        ('BATCH-2024-003', 2, 32, 3520000.00, 'draft', 3);
      `);
    }

    if (parseInt(counts.claim_count) === 0) {
      console.log('Adding sample claims...');
      await client.query(`
        INSERT INTO claims (
          unique_beneficiary_id, unique_claim_id, tpa_id, facility_id, batch_number,
          hospital_number, date_of_admission, beneficiary_name, date_of_birth, age,
          address, phone_number, nin, date_of_treatment, date_of_discharge,
          primary_diagnosis, treatment_procedure, total_cost_of_care, status, created_by
        ) VALUES
        ('BEN-2024-001', 'CLM-2024-001', 1, 1, 'BATCH-2024-001', 'HSP-001', '2024-01-15', 
         'Adaora Okafor', '1990-05-15', 33, '123 Victoria Island, Lagos', '08012345678', 
         '12345678901', '2024-01-16', '2024-01-18', 'Cesarean Section', 
         'Elective Cesarean Section', 125000.00, 'submitted', 4),
        ('BEN-2024-002', 'CLM-2024-002', 1, 2, 'BATCH-2024-001', 'HSP-002', '2024-01-14', 
         'Fatima Ibrahim', '1985-03-20', 38, '456 Ikeja, Lagos', '08087654321', 
         '98765432109', '2024-01-17', '2024-01-19', 'Cesarean Section', 
         'Emergency Cesarean Section', 98000.00, 'awaiting_verification', 5),
        ('BEN-2024-003', 'CLM-2024-003', 2, 3, 'BATCH-2024-002', 'HSP-003', '2024-01-13', 
         'Grace Eze', '1988-08-10', 35, '789 Enugu, Enugu State', '08098765432', 
         '11223344556', '2024-01-14', '2024-01-16', 'Cesarean Section', 
         'Elective Cesarean Section', 110000.00, 'verified', 4),
        ('BEN-2024-004', 'CLM-2024-004', 2, 4, 'BATCH-2024-002', 'HSP-004', '2024-01-12', 
         'Amina Hassan', '1992-12-25', 31, '321 Katsina, Katsina State', '08011223344', 
         '99887766554', '2024-01-13', '2024-01-15', 'Cesarean Section', 
         'Emergency Cesarean Section', 87000.00, 'verified_awaiting_payment', 5),
        ('BEN-2024-005', 'CLM-2024-005', 3, 5, 'BATCH-2024-003', 'HSP-005', '2024-01-11', 
         'Chioma Okwu', '1987-07-30', 36, '654 Ibadan, Oyo State', '08055667788', 
         '55443322110', '2024-01-12', '2024-01-14', 'Cesarean Section', 
         'Elective Cesarean Section', 135000.00, 'verified_paid', 4);
      `);
    }

    // Update batch totals based on claims
    console.log('\nUpdating batch totals...');
    await client.query(`
      UPDATE batches SET 
        total_claims = (SELECT COUNT(*) FROM claims WHERE claims.batch_number = batches.batch_number),
        total_amount = (SELECT COALESCE(SUM(total_cost_of_care), 0) FROM claims WHERE claims.batch_number = batches.batch_number)
      WHERE id IN (1, 2, 3);
    `);

    console.log('\n✅ Database check and update completed successfully!');
    console.log('\nYou can now log in with:');
    console.log('- Email: admin@nhis.gov.ng (NHIS Admin)');
    console.log('- Email: tpa1@healthcareplus.ng (TPA Manager)');
    console.log('- Email: facility1@luth.edu.ng (Facility Officer)');
    console.log('- Password: admin@2025');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkAndUpdateDatabase();