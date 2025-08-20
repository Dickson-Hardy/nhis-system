const { Pool } = require('pg')
require('dotenv').config()

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('Running password management migration...')
    
    // Add new columns to users table
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT false;
    `)
    console.log('✓ Added is_temporary_password column')

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
    `)
    console.log('✓ Added password_reset_token column')

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
    `)
    console.log('✓ Added password_reset_expires column')

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;
    `)
    console.log('✓ Added last_password_change column')

    // Update existing users
    await pool.query(`
      UPDATE users 
      SET last_password_change = created_at 
      WHERE last_password_change IS NULL AND is_temporary_password = false;
    `)
    console.log('✓ Updated existing users with last_password_change')

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
    `)
    console.log('✓ Created password_reset_token index')

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_password_reset_expires ON users(password_reset_expires);
    `)
    console.log('✓ Created password_reset_expires index')

    console.log('\n✅ Password management migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()