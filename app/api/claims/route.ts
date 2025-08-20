import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { claims, facilities, tpas, batches } from "@/lib/db/schema"
import { eq, and, desc, asc, ilike, or } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"

// Helper function to parse DD/MM/YYYY dates
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString || dateString.trim() === '') return null
  
  const trimmed = dateString.trim()
  
  // If it's already in YYYY-MM-DD format, return as is
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return trimmed
  }
  
  // Parse DD/MM/YYYY format
  const parts = trimmed.split('/')
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    
    // Validate the parsed date
    const date = new Date(`${year}-${month}-${day}`)
    if (date.getFullYear() == parseInt(year) && 
        date.getMonth() == parseInt(month) - 1 && 
        date.getDate() == parseInt(day)) {
      return `${year}-${month}-${day}`
    }
  }
  
  // Try to parse other formats
  try {
    const parsedDate = new Date(trimmed)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0]
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return null
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

    // Ensure we have a valid facility ID
    let facilityId = null
    if (body.facilityId) {
      facilityId = parseInt(body.facilityId)
    } else if (user.facilityId) {
      facilityId = user.facilityId
    } else if (body.facilityName) {
      // Try to find facility by name
      const facility = await db.select().from(facilities).where(eq(facilities.name, body.facilityName)).limit(1)
      if (facility.length > 0) {
        facilityId = facility[0].id
      } else {
        // Create new facility if it doesn't exist
        const newFacility = await db
          .insert(facilities)
          .values({
            name: body.facilityName,
            code: body.facilityCode || `FAC-${Date.now()}`,
            state: body.facilityState || "Unknown",
            address: "",
            tpaId: user.tpaId,
          })
          .returning()
        facilityId = newFacility[0].id
      }
    } else {
      facilityId = 1 // Default facility ID
    }

    if (!facilityId) {
      return NextResponse.json({ error: "Facility ID is required" }, { status: 400 })
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
        age: body.age ? parseInt(body.age) : null,
        address: body.address,
        phoneNumber: body.phoneNumber,
        nin: body.nin,
        
        // Treatment Information
        dateOfTreatment: parseDate(body.dateOfTreatment),
        dateOfDischarge: parseDate(body.dateOfDischarge),
        primaryDiagnosis: body.primaryDiagnosis,
        secondaryDiagnosis: body.secondaryDiagnosis,
        treatmentProcedure: body.treatmentProcedure,
        quantity: body.quantity ? parseInt(body.quantity) : null,
        cost: body.cost ? parseFloat(body.cost) : null,
        
        // Submission Information
        dateOfClaimSubmission: parseDate(body.dateOfClaimSubmission),
        monthOfSubmission: body.monthOfSubmission,
        
        // Cost Breakdown
        costOfInvestigation: body.costOfInvestigation ? parseFloat(body.costOfInvestigation) : null,
        costOfProcedure: body.costOfProcedure ? parseFloat(body.costOfProcedure) : null,
        costOfMedication: body.costOfMedication ? parseFloat(body.costOfMedication) : null,
        costOfOtherServices: body.costOfOtherServices ? parseFloat(body.costOfOtherServices) : null,
        totalCostOfCare: body.totalCostOfCare ? parseFloat(body.totalCostOfCare) : null,
        approvedCostOfCare: body.approvedCostOfCare ? parseFloat(body.approvedCostOfCare) : null,
        
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
