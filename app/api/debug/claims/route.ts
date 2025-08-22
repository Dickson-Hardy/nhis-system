import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { claims } from "@/lib/db/schema"
import { count } from "drizzle-orm"

// GET /api/debug/claims - Simple claims count for debugging (no auth for testing)
export async function GET(request: NextRequest) {
  try {
    console.log("Debug: Starting simple claims query...")
    
    // Test database connection first
    console.log("Debug: Testing database connection...")
    
    // Get total count without any filters
    const totalResult = await db.select({ count: count() }).from(claims)
    const total = totalResult[0]?.count || 0
    
    console.log("Debug: Total claims count:", total)
    
    // Get first few claims if any exist
    const sampleClaims = await db.select().from(claims).limit(3)
    
    console.log("Debug: Sample claims:", sampleClaims.length)
    
    return NextResponse.json({
      success: true,
      totalClaims: total,
      sampleCount: sampleClaims.length,
      sampleClaims: sampleClaims.map(claim => ({
        id: claim.id,
        uniqueClaimId: claim.uniqueClaimId,
        status: claim.status,
        beneficiaryName: claim.beneficiaryName
      }))
    })
  } catch (error) {
    console.error("Debug error:", error)
    console.error("Debug error stack:", error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      success: false,
      error: "Debug error",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 })
  }
}