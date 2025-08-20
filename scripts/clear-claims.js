const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function clearClaimsData() {
  try {
    // Use direct database connection
    const { neon } = require('@neondatabase/serverless')
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    
    const sql = neon(process.env.DATABASE_URL)
    
    console.log('Clearing existing claims and batches...')
    
    // Clear claims first (due to foreign key constraints)
    await sql`DELETE FROM claims`
    console.log('✅ Claims cleared')
    
    // Clear batches
    await sql`DELETE FROM batches`
    console.log('✅ Batches cleared')
    
    console.log('✅ Database cleared successfully! You can now test the upload functionality.')
    
  } catch (error) {
    console.error('❌ Error clearing data:', error)
  }
  
  process.exit(0)
}

clearClaimsData()