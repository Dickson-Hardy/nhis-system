import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { claims, facilities, tpas, batches } from "@/lib/db/schema"
import { eq, and, desc, asc, ilike, or } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import { resolveFacilityId } from "@/lib/facility-resolver"

// Helper function to parse DD/MM/YYYY dates with better error handling
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString || dateString.trim() === '') return null
  
  const trimmed = dateString.trim()
  
  // If it's already in YYYY-MM-DD format, return as is
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return trimmed
  }
  
  // Handle malformed dates that start with + and have invalid year values
  // These appear to be corrupted Excel date formats
  if (trimmed.match(/^\+0\d{5}-\d{2}-\d{2}$/)) {
    console.warn(`Skipping malformed date: ${trimmed}`)
    return null
  }
  
  // Parse DD/MM/YYYY format
  const parts = trimmed.split('/')
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    
    // Validate year is reasonable (between 1900 and 2100)
    const yearNum = parseInt(year)
    if (yearNum < 1900 || yearNum > 2100) {
      console.warn(`Invalid year in date: ${trimmed}`)
      return null
    }
    
    // Validate the parsed date
    const date = new Date(`${year}-${month}-${day}`)
    if (date.getFullYear() == parseInt(year) && 
        date.getMonth() == parseInt(month) - 1 && 
        date.getDate() == parseInt(day)) {
      return `${year}-${month}-${day}`
    }
  }
  
  // Try to parse other formats, but be more careful
  try {
    // Check if it looks like a reasonable date string
    if (trimmed.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
      const parsedDate = new Date(trimmed)
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear()
        if (year >= 1900 && year <= 2100) {
          return parsedDate.toISOString().split('T')[0]
        }
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  console.warn(`Could not parse date: ${trimmed}`)
  return null
}

// Helper function to safely parse integers
function safeParseInt(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null
  
  const trimmed = value.trim()
  const parsed = parseInt(trimmed)
  
  if (isNaN(parsed)) {
    console.warn(`Could not parse integer: ${trimmed}`)
    return null
  }
  
  return parsed
}

// Helper function to safely parse floats
function safeParseFloat(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null
  
  const trimmed = value.trim()
  const parsed = parseFloat(trimmed)
  
  if (isNaN(parsed)) {
    console.warn(`Could not parse float: ${trimmed}`)
    return null
  }
  
  return parsed.toString()
}

// GET /api/claims - Fetch claims with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const tpaId = searchParams.get("tpaId")
    const facilityId = searchParams.get("facilityId")
    const batchId = searchParams.get("batchId")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const offset = (page - 1) * limit

    // Build where conditions based on user role and filters
    const whereConditions: any[] = []

    // Role-based filtering
    if (user.role === "tpa" && user.tpaId) {
      whereConditions.push(eq(claims.tpaId, user.tpaId))
    } else if (user.role === "facility" && user.facilityId) {
      whereConditions.push(eq(claims.facilityId, user.facilityId))
    }

    // Additional filters
    if (status) {
      whereConditions.push(eq(claims.status, status))
    }
    if (tpaId && user.role === "nhis_admin") {
      const parsedTpaId = Number.parseInt(tpaId)
      if (!isNaN(parsedTpaId)) {
        whereConditions.push(eq(claims.tpaId, parsedTpaId))
      }
    }
    if (facilityId && (user.role === "nhis_admin" || user.role === "tpa")) {
      const parsedFacilityId = Number.parseInt(facilityId)
      if (!isNaN(parsedFacilityId)) {
        whereConditions.push(eq(claims.facilityId, parsedFacilityId))
      }
    }

    // Filter by batch ID
    if (batchId) {
      const parsedBatchId = Number.parseInt(batchId)
      if (!isNaN(parsedBatchId)) {
        // Find the batch number for this batch ID
        const batch = await db.select().from(batches).where(eq(batches.id, parsedBatchId)).limit(1)
        if (batch.length > 0) {
          whereConditions.push(eq(claims.batchNumber, batch[0].batchNumber))
        }
      }
    }

    // Search functionality
    if (search) {
      whereConditions.push(
        or(
          ilike(claims.beneficiaryName, `%${search}%`),
          ilike(claims.uniqueClaimId, `%${search}%`),
          ilike(claims.uniqueBeneficiaryId, `%${search}%`),
        ),
      )
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    const claimsData = await db
      .select({
        id: claims.id,
        serialNumber: claims.serialNumber,
        uniqueBeneficiaryId: claims.uniqueBeneficiaryId,
        uniqueClaimId: claims.uniqueClaimId,
        batchNumber: claims.batchNumber,
        hospitalNumber: claims.hospitalNumber,
        beneficiaryName: claims.beneficiaryName,
        dateOfBirth: claims.dateOfBirth,
        age: claims.age,
        phoneNumber: claims.phoneNumber,
        dateOfAdmission: claims.dateOfAdmission,
        dateOfDischarge: claims.dateOfDischarge,
        primaryDiagnosis: claims.primaryDiagnosis,
        secondaryDiagnosis: claims.secondaryDiagnosis,
        treatmentProcedure: claims.treatmentProcedure,
        totalCostOfCare: claims.totalCostOfCare,
        approvedCostOfCare: claims.approvedCostOfCare,
        status: claims.status,
        decision: claims.decision,
        reasonForRejection: claims.reasonForRejection,
        dateOfClaimsPayment: claims.dateOfClaimsPayment,
        createdAt: claims.createdAt,
        updatedAt: claims.updatedAt,
        facility: {
          id: facilities.id,
          name: facilities.name,
          code: facilities.code,
          state: facilities.state,
        },
        tpa: {
          id: tpas.id,
          name: tpas.name,
          code: tpas.code,
        },
      })
      .from(claims)
      .leftJoin(facilities, eq(claims.facilityId, facilities.id))
      .leftJoin(tpas, eq(claims.tpaId, tpas.id))
      .where(whereClause)
      .orderBy(desc(claims.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalCountResult = await db.select({ count: claims.id }).from(claims).where(whereClause)
    const totalCount = totalCountResult.length

    return NextResponse.json({
      claims: claimsData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching claims:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/claims - Create new claim
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only TPA users can create claims
    if (user.role !== "tpa") {
      return NextResponse.json({ error: "Access denied - TPA role required" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.uniqueBeneficiaryId || !body.uniqueClaimId || !body.beneficiaryName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Ensure we have a valid facility ID using the facility resolver
    try {
      const facilityResult = await resolveFacilityId(
        user.tpaId!,
        {
          facilityId: body.facilityId ? parseInt(body.facilityId) : undefined,
          facilityName: body.facilityName,
          facilityCode: body.facilityCode,
          facilityState: body.facilityState
        },
        user.facilityId,
        true // Auto-create facility if needed
      )
      
      var facilityId = facilityResult.facilityId
      
      if (facilityResult.isNewFacility) {
        console.log(`Created new facility: ${facilityResult.facility.name} for claim`)
      }
    } catch (error) {
      console.error(`Error resolving facility: ${error}`)
      return NextResponse.json({ error: `Failed to resolve facility: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 400 })
    }

    // Get batch information to validate and update
    let batchNumber = body.batchNumber
    if (body.batchId) {
      const batch = await db.select().from(batches).where(eq(batches.id, body.batchId)).limit(1)
      if (batch.length > 0) {
        batchNumber = batch[0].batchNumber
      }
    }

    // Check if claim with this unique_claim_id already exists
    const existingClaim = await db
      .select()
      .from(claims)
      .where(eq(claims.uniqueClaimId, body.uniqueClaimId))
      .limit(1)

    if (existingClaim.length > 0) {
      return NextResponse.json({ 
        error: `Claim with ID ${body.uniqueClaimId} already exists`,
        existingClaim: existingClaim[0]
      }, { status: 409 })
    }

    const newClaim = await db
      .insert(claims)
      .values({
        uniqueBeneficiaryId: body.uniqueBeneficiaryId,
        uniqueClaimId: body.uniqueClaimId,
        tpaId: user.tpaId!,
        facilityId: facilityId,
        batchNumber: batchNumber,
        hospitalNumber: body.hospitalNumber,
        
        // Patient Information
        dateOfAdmission: parseDate(body.dateOfAdmission),
        beneficiaryName: body.beneficiaryName,
        dateOfBirth: parseDate(body.dateOfBirth),
        age: safeParseInt(body.age),
        address: body.address,
        phoneNumber: body.phoneNumber,
        nin: body.nin,
        
        // Treatment Information
        dateOfTreatment: parseDate(body.dateOfTreatment),
        dateOfDischarge: parseDate(body.dateOfDischarge),
        primaryDiagnosis: body.primaryDiagnosis,
        secondaryDiagnosis: body.secondaryDiagnosis,
        treatmentProcedure: body.treatmentProcedure,
        quantity: safeParseInt(body.quantity),
        cost: safeParseFloat(body.cost),
        
        // Submission Information
        dateOfClaimSubmission: parseDate(body.dateOfClaimSubmission),
        monthOfSubmission: body.monthOfSubmission,
        
        // Cost Breakdown
        costOfInvestigation: safeParseFloat(body.costOfInvestigation),
        costOfProcedure: safeParseFloat(body.costOfProcedure),
        costOfMedication: safeParseFloat(body.costOfMedication),
        costOfOtherServices: safeParseFloat(body.costOfOtherServices),
        totalCostOfCare: safeParseFloat(body.totalCostOfCare),
        approvedCostOfCare: safeParseFloat(body.approvedCostOfCare),
        
        // Decision and Payment - decision should be null for new claims, status handles workflow
        decision: "pending", // Default to pending for new claims
        reasonForRejection: body.reasonForRejection,
        dateOfClaimsPayment: parseDate(body.dateOfClaimsPayment),
        tpaRemarks: body.tpaRemarks,
        
        // System fields - use default status for now
        status: "submitted", // Use default status until constraints are applied
        createdBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Update batch totals if batchId is provided
    if (body.batchId) {
      const batchClaims = await db.select().from(claims).where(eq(claims.batchNumber, batchNumber))
      const totalClaims = batchClaims.length
      const totalAmount = batchClaims.reduce((sum, claim) => sum + (parseFloat(claim.totalCostOfCare || "0")), 0)
      
      await db
        .update(batches)
        .set({
          totalClaims,
          totalAmount: totalAmount.toString(),
        })
        .where(eq(batches.id, body.batchId))
    }

    return NextResponse.json({ claim: newClaim[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating claim:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
