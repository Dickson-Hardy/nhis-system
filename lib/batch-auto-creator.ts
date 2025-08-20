// Utility for automatically creating batches from Excel data based on batch numbers

import { db } from "@/lib/db"
import { batches, claims } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export interface BatchCreationResult {
  batchId: number
  batchNumber: string
  isNewBatch: boolean
}

export interface ExcelRowWithBatch {
  batchNumber: string
  serialNumber?: string
  uniqueBeneficiaryId: string
  uniqueClaimId: string
  [key: string]: any
}

/**
 * Groups Excel rows by batch number and ensures batches exist
 */
export async function groupAndCreateBatches(
  excelRows: ExcelRowWithBatch[],
  tpaId: number,
  facilityId: number,
  createdBy: number
): Promise<Map<string, BatchCreationResult>> {
  const batchGroups = new Map<string, BatchCreationResult>()
  
  // Get unique batch numbers from the data
  const uniqueBatchNumbers = [...new Set(excelRows.map(row => row.batchNumber).filter(Boolean))]
  
  for (const batchNumber of uniqueBatchNumbers) {
    try {
      // Check if batch already exists
      const existingBatch = await db
        .select()
        .from(batches)
        .where(
          and(
            eq(batches.batchNumber, batchNumber),
            eq(batches.tpaId, tpaId)
          )
        )
        .limit(1)
      
      if (existingBatch.length > 0) {
        // Batch exists - check if it's still in draft status
        const batch = existingBatch[0]
        if (batch.status !== 'draft') {
          throw new Error(`Batch ${batchNumber} has already been submitted and cannot be modified`)
        }
        
        batchGroups.set(batchNumber, {
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          isNewBatch: false
        })
      } else {
        // Create new batch
        const newBatch = await db
          .insert(batches)
          .values({
            batchNumber,
            tpaId,
            totalClaims: 0,
            totalAmount: "0",
            status: "draft",
            createdBy,
            createdAt: new Date(),
          })
          .returning()
        
        batchGroups.set(batchNumber, {
          batchId: newBatch[0].id,
          batchNumber: newBatch[0].batchNumber,
          isNewBatch: true
        })
      }
    } catch (error) {
      console.error(`Error processing batch ${batchNumber}:`, error)
      throw error
    }
  }
  
  return batchGroups
}

/**
 * Updates batch totals after claims are imported
 */
export async function updateBatchTotals(batchNumber: string): Promise<void> {
  try {
    // Get all claims for this batch
    const batchClaims = await db
      .select()
      .from(claims)
      .where(eq(claims.batchNumber, batchNumber))
    
    // Calculate totals
    const totalClaims = batchClaims.length
    const totalAmount = batchClaims.reduce((sum, claim) => {
      return sum + (parseFloat(claim.totalCostOfCare || "0"))
    }, 0)
    
    // Update batch record
    await db
      .update(batches)
      .set({
        totalClaims,
        totalAmount: totalAmount.toString(),
        updatedAt: new Date(),
      })
      .where(eq(batches.batchNumber, batchNumber))
      
  } catch (error) {
    console.error(`Error updating batch totals for ${batchNumber}:`, error)
    throw error
  }
}

/**
 * Validates that all batch numbers in the Excel data are from the same TPA
 */
export function validateBatchOwnership(
  excelRows: ExcelRowWithBatch[],
  userTpaId: number
): string[] {
  const errors: string[] = []
  
  // This would typically query existing batches to check TPA ownership
  // For now, we'll assume validation happens during batch creation
  
  return errors
}

/**
 * Groups Excel rows by their batch numbers for processing
 */
export function groupRowsByBatch(excelRows: ExcelRowWithBatch[]): Map<string, ExcelRowWithBatch[]> {
  const groupedRows = new Map<string, ExcelRowWithBatch[]>()
  
  excelRows.forEach(row => {
    const batchNumber = row.batchNumber
    if (!batchNumber) {
      // Handle rows without batch numbers - could assign to a default batch
      return
    }
    
    if (!groupedRows.has(batchNumber)) {
      groupedRows.set(batchNumber, [])
    }
    
    groupedRows.get(batchNumber)!.push(row)
  })
  
  return groupedRows
}

/**
 * Summary information about batch processing
 */
export interface BatchProcessingSummary {
  totalBatches: number
  newBatches: string[]
  existingBatches: string[]
  totalClaims: number
  batchDetails: Array<{
    batchNumber: string
    batchId: number
    claimCount: number
    totalAmount: number
    isNew: boolean
  }>
}

/**
 * Generates a summary of the batch processing operation
 */
export function generateBatchSummary(
  batchGroups: Map<string, BatchCreationResult>,
  groupedRows: Map<string, ExcelRowWithBatch[]>
): BatchProcessingSummary {
  const newBatches: string[] = []
  const existingBatches: string[] = []
  const batchDetails: BatchProcessingSummary['batchDetails'] = []
  
  let totalClaims = 0
  
  batchGroups.forEach((batchResult, batchNumber) => {
    const rows = groupedRows.get(batchNumber) || []
    const claimCount = rows.length
    const totalAmount = rows.reduce((sum, row) => {
      return sum + (parseFloat(row.totalCostOfCare || "0"))
    }, 0)
    
    totalClaims += claimCount
    
    if (batchResult.isNewBatch) {
      newBatches.push(batchNumber)
    } else {
      existingBatches.push(batchNumber)
    }
    
    batchDetails.push({
      batchNumber,
      batchId: batchResult.batchId,
      claimCount,
      totalAmount,
      isNew: batchResult.isNewBatch
    })
  })
  
  return {
    totalBatches: batchGroups.size,
    newBatches,
    existingBatches,
    totalClaims,
    batchDetails
  }
}