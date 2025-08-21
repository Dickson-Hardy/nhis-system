import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function verifySchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('Verifying database schema...')
    
    // Check all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    console.log('📋 All tables:', tables.rows.map(r => r.table_name))
    
    // Check batch_closure_reports structure
    const bcrColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'batch_closure_reports'
      ORDER BY ordinal_position
    `)
    console.log('📊 batch_closure_reports columns:', bcrColumns.rows.length)
    
    // Check batch_payment_summaries structure  
    const bpsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'batch_payment_summaries'
      ORDER BY ordinal_position
    `)
    console.log('📊 batch_payment_summaries columns:', bpsColumns.rows.length)
    
    console.log('✅ Database schema verification complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.end()
  }
}

verifySchema()