import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { claims, facilities, tpas, batches } from "@/lib/db/schema"
import { eq, and, ilike } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import { 
  groupAndCreateBatches, 
  updateBatchTotals, 
  groupRowsByBatch, 
  generateBatchSummary,
  type ExcelRowWithBatch 
} from "@/lib/batch-auto-creator"
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
          user.facilityId, // Pass user's facility ID, function will handle null case
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

              // Resolve facility ID using the intelligent facility resolver
              let facilityId: number
              try {
                const facilityResult = await resolveFacilityId(
                  user.tpaId!,
                  {
                    facilityName: row.facilityName,
                    facilityCode: row.facilityCode,
                    facilityState: row.facilityState
                  },
                  user.facilityId,
                  true // Auto-create facility if needed
                )
                
                facilityId = facilityResult.facilityId
                
                if (facilityResult.isNewFacility) {
                  console.log(`Created new facility: ${facilityResult.facility.name} for bulk upload`)
                }
              } catch (error) {
                console.error(`Error resolving facility for claim ${row.uniqueClaimId}: ${error}`)
                errorCount++
                continue // Skip this claim
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
                age: safeParseInt(row.age),
                address: row.address,
                phoneNumber: row.phoneNumber,
                nin: row.nin,
                
                // Treatment Information
                dateOfTreatment: parseDate(row.dateOfTreatment),
                dateOfDischarge: parseDate(row.dateOfDischarge),
                primaryDiagnosis: row.primaryDiagnosis,
                secondaryDiagnosis: row.secondaryDiagnosis,
                treatmentProcedure: row.treatmentProcedure,
                quantity: safeParseInt(row.quantity),
                cost: safeParseFloat(row.cost),
                
                // Submission Information
                dateOfClaimSubmission: parseDate(row.dateOfClaimSubmission),
                monthOfSubmission: row.monthOfSubmission,
                
                // Cost Breakdown
                costOfInvestigation: safeParseFloat(row.costOfInvestigation),
                costOfProcedure: safeParseFloat(row.costOfProcedure),
                costOfMedication: safeParseFloat(row.costOfMedication),
                costOfOtherServices: safeParseFloat(row.costOfOtherServices),
                totalCostOfCare: safeParseFloat(row.totalCostOfCare),
                approvedCostOfCare: safeParseFloat(row.approvedCostOfCare),
                
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
          // Use facility resolver for individual claims too
          let facilityId: number
          try {
            const facilityResult = await resolveFacilityId(
              user.tpaId!,
              {
                facilityName: row.facilityName,
                facilityCode: row.facilityCode,
                facilityState: row.facilityState
              },
              user.facilityId,
              true // Auto-create facility if needed
            )
            
            facilityId = facilityResult.facilityId
          } catch (error) {
            console.error(`Error resolving facility for claim ${row.uniqueClaimId}: ${error}`)
            errorCount++
            continue // Skip this claim
          }
          
          await db.insert(claims).values({
            uniqueBeneficiaryId: row.uniqueBeneficiaryId,
            uniqueClaimId: row.uniqueClaimId,
            tpaId: user.tpaId!,
            facilityId: facilityId,
            batchNumber: row.batchNumber || `BATCH-${Date.now()}`,
            hospitalNumber: row.hospitalNumber,
            
            // Patient Information
            dateOfAdmission: parseDate(row.dateOfAdmission),
            beneficiaryName: row.beneficiaryName,
            dateOfBirth: parseDate(row.dateOfBirth),
            age: safeParseInt(row.age),
            address: row.address,
            phoneNumber: row.phoneNumber,
            nin: row.nin,
            
            // Treatment Information
            dateOfTreatment: parseDate(row.dateOfTreatment),
            dateOfDischarge: parseDate(row.dateOfDischarge),
            primaryDiagnosis: row.primaryDiagnosis,
            secondaryDiagnosis: row.secondaryDiagnosis,
            treatmentProcedure: row.treatmentProcedure,
            quantity: safeParseInt(row.quantity),
            cost: safeParseFloat(row.cost),
            
            // Submission Information
            dateOfClaimSubmission: parseDate(row.dateOfClaimSubmission),
            monthOfSubmission: row.monthOfSubmission,
            
            // Cost Breakdown
            costOfInvestigation: safeParseFloat(row.costOfInvestigation),
            costOfProcedure: safeParseFloat(row.costOfProcedure),
            costOfMedication: safeParseFloat(row.costOfMedication),
            costOfOtherServices: safeParseFloat(row.costOfOtherServices),
            totalCostOfCare: safeParseFloat(row.totalCostOfCare),
            approvedCostOfCare: safeParseFloat(row.approvedCostOfCare),
            
            // Decision and Payment
            decision: "pending",
            reasonForRejection: row.reasonForRejection,
            dateOfClaimsPayment: parseDate(row.dateOfClaimsPayment),
            tpaRemarks: row.tpaRemarks,
            
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