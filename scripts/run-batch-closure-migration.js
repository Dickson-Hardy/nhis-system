import { Client } from 'pg'
import fs from 'fs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function runBatchClosureMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Connected to database successfully!')

    // Read the migration file
    const migrationSQL = fs.readFileSync('scripts/007-add-batch-closure-fields.sql', 'utf8')
    
    console.log('Running batch closure migration...')
    
    // Execute the migration
    await client.query(migrationSQL)
    
    console.log('✅ Batch closure migration completed successfully!')

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('batch_closure_reports', 'batch_payment_summaries')
    `)
    
    console.log('✅ New tables created:', result.rows.map(r => r.table_name))

    // Verify columns were added to batches table
    const batchColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'batches' 
      AND column_name IN ('closure_status', 'closure_report_id', 'closure_date', 'closed_by')
    `)
    
    console.log('✅ New batch columns added:', batchColumns.rows.map(r => r.column_name))

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runBatchClosureMigration()