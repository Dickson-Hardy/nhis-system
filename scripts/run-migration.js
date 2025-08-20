import { Client } from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Connected to database successfully!')

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'lib/db/migrations/0002_fix_claims_status_constraint.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('Running migration: 0002_fix_claims_status_constraint.sql')
    
    // Execute the migration
    await client.query(migrationSQL)
    
    console.log('✅ Migration completed successfully!')

    // Verify the constraint was applied
    const constraintCheck = await client.query(`
      SELECT constraint_name, check_clause 
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'claims_status_check'
    `)
    
    if (constraintCheck.rows.length > 0) {
      console.log('✅ Constraint verified:', constraintCheck.rows[0])
    } else {
      console.log('⚠️  Constraint not found - may need manual verification')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()