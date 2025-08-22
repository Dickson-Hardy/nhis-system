import { Client } from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function runMigration(migrationFile) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Connected to database successfully!')

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'scripts', migrationFile)
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`)
      process.exit(1)
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log(`Running migration: ${migrationFile}`)
    
    // Execute the migration
    await client.query(migrationSQL)
    
    console.log('✅ Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2]
if (!migrationFile) {
  console.error('❌ Please provide a migration file name')
  console.log('Usage: node run-custom-migration.js <migration-file>')
  process.exit(1)
}

runMigration(migrationFile)