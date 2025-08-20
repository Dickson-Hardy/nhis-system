import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { claims, facilities, tpas, batches } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import { 
  groupAndCreateBatches, 
  updateBatchTotals, 
  groupRowsByBatch, 
  generateBatchSummary,
  type ExcelRowWithBatch 
} from "@/lib/batch-auto-creator"

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

// POST /api/claims/bulk-upload - Bulk upload claims with automatic batch creation
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

    if (!user.tpaId) {
      return NextResponse.json({ error: "TPA ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { claims: claimsData, autoCreateBatches, fallbackBatchId } = body

    if (!claimsData || !Array.isArray(claimsData)) {
      return NextResponse.json({ error: "Claims data is required" }, { status: 400 })
    }

    let successCount = 0
    let errorCount = 0
    let batchSummary = null

    if (autoCreateBatches) {
      // Group claims by batch number and auto-create batches
      try {
        // First, group the rows by batch number
        const groupedRows = groupRowsByBatch(claimsData as ExcelRowWithBatch[])
        
        // Create/verify batches for all unique batch numbers
        const batchGroups = await groupAndCreateBatches(
          claimsData as ExcelRowWithBatch[],
          user.tpaId,
          user.facilityId || 1, // Default facility if not set
          user.id
        )

        // Process claims for each batch
        for (const [batchNumber, rows] of groupedRows) {
          const batchInfo = batchGroups.get(batchNumber)
          if (!batchInfo) {
            console.error(`No batch info found for batch number: ${batchNumber}`)
            errorCount += rows.length
            continue
          }

          for (const row of rows) {
            try {
              // Check if claim with this unique_claim_id already exists
              const existingClaim = await db
                .select()
                .from(claims)
                .where(eq(claims.uniqueClaimId, row.uniqueClaimId))
                .limit(1)

              if (existingClaim.length > 0) {
                console.warn(`Skipping duplicate claim ID: ${row.uniqueClaimId}`)
                errorCount++ // Count duplicates as errors for reporting
                continue // Skip this claim
              }

              // Ensure we have a valid facility ID
              let facilityId = user.facilityId || null
              if (!facilityId && row.facilityName) {
                // Try to find facility by name
                const facility = await db.select().from(facilities).where(eq(facilities.name, row.facilityName)).limit(1)
                if (facility.length > 0) {
                  facilityId = facility[0].id
                } else {
                  // Create new facility if it doesn't exist
                  const newFacility = await db
                    .insert(facilities)
                    .values({
                      name: row.facilityName,
                      code: row.facilityCode || `FAC-${Date.now()}`,
                      state: row.facilityState || "Unknown",
                      address: "",
                      tpaId: user.tpaId,
                    })
                    .returning()
                  facilityId = newFacility[0].id
                }
              }

              if (!facilityId) {
                facilityId = 1 // Default facility ID
              }

              await db.insert(claims).values({
                uniqueBeneficiaryId: row.uniqueBeneficiaryId,
                uniqueClaimId: row.uniqueClaimId,
                tpaId: user.tpaId!,
                facilityId: facilityId,
                batchNumber: batchNumber,
                hospitalNumber: row.hospitalNumber,
                
                // Patient Information
                dateOfAdmission: parseDate(row.dateOfAdmission),
                beneficiaryName: row.beneficiaryName,
                dateOfBirth: parseDate(row.dateOfBirth),
                age: row.age ? parseInt(row.age) : null,
                address: row.address,
                phoneNumber: row.phoneNumber,
                nin: row.nin,
                
                // Treatment Information
                dateOfTreatment: parseDate(row.dateOfTreatment),
                dateOfDischarge: parseDate(row.dateOfDischarge),
                primaryDiagnosis: row.primaryDiagnosis,
                secondaryDiagnosis: row.secondaryDiagnosis,
                treatmentProcedure: row.treatmentProcedure,
                quantity: row.quantity ? parseInt(row.quantity) : null,
                cost: row.cost ? parseFloat(row.cost) : null,
                
                // Submission Information
                dateOfClaimSubmission: parseDate(row.dateOfClaimSubmission),
                monthOfSubmission: row.monthOfSubmission,
                
                // Cost Breakdown
                costOfInvestigation: row.costOfInvestigation ? parseFloat(row.costOfInvestigation) : null,
                costOfProcedure: row.costOfProcedure ? parseFloat(row.costOfProcedure) : null,
                costOfMedication: row.costOfMedication ? parseFloat(row.costOfMedication) : null,
                costOfOtherServices: row.costOfOtherServices ? parseFloat(row.costOfOtherServices) : null,
                totalCostOfCare: row.totalCostOfCare ? parseFloat(row.totalCostOfCare) : null,
                approvedCostOfCare: row.approvedCostOfCare ? parseFloat(row.approvedCostOfCare) : null,
                
                // Decision and Payment
                decision: "pending",
                reasonForRejection: row.reasonForRejection,
                dateOfClaimsPayment: parseDate(row.dateOfClaimsPayment),
                tpaRemarks: row.tpaRemarks,
                
                // System fields
                status: "submitted",
                createdBy: user.id,
                createdAt: new Date(),
                updatedAt: new Date(),
              })

              successCount++
            } catch (error) {
              console.error(`Error creating claim ${row.uniqueClaimId}:`, error)
              errorCount++
            }
          }

          // Update batch totals
          try {
            await updateBatchTotals(batchNumber)
          } catch (error) {
            console.error(`Error updating batch totals for ${batchNumber}:`, error)
          }
        }

        // Generate batch summary
        batchSummary = generateBatchSummary(batchGroups, groupedRows)

      } catch (error) {
        console.error("Error in auto batch creation:", error)
        return NextResponse.json({ 
          error: `Failed to auto-create batches: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 })
      }

    } else {
      // Original individual processing (fallback)
      for (const row of claimsData) {
        try {
          // Use fallback batch info if provided
          let facilityId = user.facilityId || 1
          
          await db.insert(claims).values({
            uniqueBeneficiaryId: row.uniqueBeneficiaryId,
            uniqueClaimId: row.uniqueClaimId,
            tpaId: user.tpaId!,
            facilityId: facilityId,
            batchNumber: row.batchNumber || `BATCH-${Date.now()}`,
            hospitalNumber: row.hospitalNumber,
            
            // ... other fields similar to above
            beneficiaryName: row.beneficiaryName,
            primaryDiagnosis: row.primaryDiagnosis,
            treatmentProcedure: row.treatmentProcedure,
            totalCostOfCare: row.totalCostOfCare ? parseFloat(row.totalCostOfCare) : null,
            
            status: "submitted",
            createdBy: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })

          successCount++
        } catch (error) {
          console.error(`Error creating claim ${row.uniqueClaimId}:`, error)
          errorCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      errorCount,
      batchSummary,
      message: `Successfully processed ${successCount} claims${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
    }, { status: 201 })

  } catch (error) {
    console.error("Error in bulk upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}