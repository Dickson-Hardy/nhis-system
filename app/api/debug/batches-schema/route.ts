import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

// GET /api/debug/batches-schema - Check actual batches table schema
export async function GET(request: NextRequest) {
  try {
    console.log("Debug: Checking batches table schema...")
    
    // Get column information for batches table
    const columns = await db.execute(
      sql`SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'batches' 
          ORDER BY ordinal_position`
    )
    
    console.log("Batches table columns:", columns.rows)
    
    // Also try to get a sample record to see the actual structure
    const sampleBatch = await db.execute(sql`SELECT * FROM batches LIMIT 1`)
    
    console.log("Sample batch record:", sampleBatch.rows[0])
    
    return NextResponse.json({
      success: true,
      columns: columns.rows,
      sampleRecord: sampleBatch.rows[0] || null,
      totalColumns: columns.rows.length
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Debug error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}