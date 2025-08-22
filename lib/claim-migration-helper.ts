/**
 * Migration utility to convert existing claims' treatmentProcedure text
 * into itemized claim_items for facilities that want to upgrade to the new system
 */

import { db } from "@/lib/db"
import { claims, claimItems } from "@/lib/db/schema"
import { parseClaimText } from "@/lib/claim-text-parser"
import { eq, and, isNotNull } from "drizzle-orm"

interface ClaimToMigrate {
  id: number
  treatmentProcedure: string | null
  primaryDiagnosis?: string | null
  dateOfTreatment?: string | null
  facilityId: number
  createdBy?: number | null
}

/**
 * Migrate a single claim's treatment procedure text to itemized format
 */
export async function migrateClaimToItems(claim: ClaimToMigrate): Promise<{
  success: boolean
  itemsCreated: number
  error?: string
}> {
  try {
    if (!claim.treatmentProcedure || claim.treatmentProcedure.trim() === '') {
      return { success: false, itemsCreated: 0, error: 'No treatment procedure text to migrate' }
    }

    // Check if items already exist for this claim
    const existingItems = await db
      .select()
      .from(claimItems)
      .where(eq(claimItems.claimId, claim.id))
      .limit(1)

    if (existingItems.length > 0) {
      return { success: false, itemsCreated: 0, error: 'Claim already has itemized data' }
    }

    // Parse the treatment procedure text
    const serviceDate = claim.dateOfTreatment || new Date().toISOString().split('T')[0]
    const primaryDiagnosis = claim.primaryDiagnosis ?? ''
    const parsedItems = parseClaimText(
      claim.treatmentProcedure, 
      serviceDate, 
      primaryDiagnosis
    )

    if (parsedItems.length === 0) {
      return { success: false, itemsCreated: 0, error: 'No valid items could be parsed from text' }
    }

    // Insert parsed items into database
    const insertedItems = []
    for (const item of parsedItems) {
      try {
        const [insertedItem] = await db.insert(claimItems).values({
          claimId: claim.id,
          itemType: item.itemType,
          itemCategory: item.itemCategory,
          itemName: item.itemName,
          itemDescription: item.itemDescription,
          quantity: item.quantity,
          unit: item.unit,
          dosage: item.dosage,
          duration: item.duration,
          unitCost: item.unitCost.toString(),
          totalCost: item.totalCost.toString(),
          serviceDate: item.serviceDate,
          prescribedBy: undefined, // Will be filled by facility if needed
          indication: item.indication,
          urgency: item.urgency,
          createdBy: claim.createdBy || 1, // Default to system user if not specified
        }).returning()

        insertedItems.push(insertedItem)
      } catch (error) {
        console.error(`Error inserting item for claim ${claim.id}:`, error)
        // Continue with other items
      }
    }

    return { 
      success: true, 
      itemsCreated: insertedItems.length 
    }

  } catch (error) {
    console.error(`Error migrating claim ${claim.id}:`, error)
    return { 
      success: false, 
      itemsCreated: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Batch migrate multiple claims for a facility
 */
export async function migrateFacilityClaims(facilityId: number): Promise<{
  totalClaims: number
  successfulMigrations: number
  failedMigrations: number
  totalItemsCreated: number
  errors: string[]
}> {
  const errors: string[] = []
  let successfulMigrations = 0
  let totalItemsCreated = 0

  try {
    // Get all claims for the facility that have treatment procedure text
    // but no itemized data yet
    const claimsToMigrate = await db
      .select({
        id: claims.id,
        treatmentProcedure: claims.treatmentProcedure,
        primaryDiagnosis: claims.primaryDiagnosis,
        dateOfTreatment: claims.dateOfTreatment,
        facilityId: claims.facilityId,
        createdBy: claims.createdBy
      })
      .from(claims)
      .where(and(
        eq(claims.facilityId, facilityId),
        isNotNull(claims.treatmentProcedure)
      ))

    console.log(`Found ${claimsToMigrate.length} claims to potentially migrate for facility ${facilityId}`)

    for (const claim of claimsToMigrate) {
      const result = await migrateClaimToItems(claim)
      
      if (result.success) {
        successfulMigrations++
        totalItemsCreated += result.itemsCreated
        console.log(`✅ Migrated claim ${claim.id}: ${result.itemsCreated} items created`)
      } else {
        errors.push(`Claim ${claim.id}: ${result.error}`)
        console.log(`❌ Failed to migrate claim ${claim.id}: ${result.error}`)
      }
    }

    return {
      totalClaims: claimsToMigrate.length,
      successfulMigrations,
      failedMigrations: claimsToMigrate.length - successfulMigrations,
      totalItemsCreated,
      errors
    }

  } catch (error) {
    console.error(`Error during batch migration for facility ${facilityId}:`, error)
    return {
      totalClaims: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      totalItemsCreated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Migrate all facilities (use with caution!)
 */
export async function migrateAllFacilities(): Promise<{
  facilitiesProcessed: number
  totalClaimsMigrated: number
  totalItemsCreated: number
  errors: string[]
}> {
  const errors: string[] = []
  let facilitiesProcessed = 0
  let totalClaimsMigrated = 0
  let totalItemsCreated = 0

  try {
    // Get all unique facility IDs that have claims
    const facilitiesWithClaims = await db
      .selectDistinct({ facilityId: claims.facilityId })
      .from(claims)
      .where(isNotNull(claims.facilityId))

    console.log(`Found ${facilitiesWithClaims.length} facilities with claims`)

    for (const facility of facilitiesWithClaims) {
      if (!facility.facilityId) continue

      console.log(`Processing facility ${facility.facilityId}...`)
      
      const result = await migrateFacilityClaims(facility.facilityId)
      
      facilitiesProcessed++
      totalClaimsMigrated += result.successfulMigrations
      totalItemsCreated += result.totalItemsCreated
      
      if (result.errors.length > 0) {
        errors.push(`Facility ${facility.facilityId}: ${result.errors.join(', ')}`)
      }

      console.log(`✅ Facility ${facility.facilityId}: ${result.successfulMigrations}/${result.totalClaims} claims migrated, ${result.totalItemsCreated} items created`)
    }

    return {
      facilitiesProcessed,
      totalClaimsMigrated,
      totalItemsCreated,
      errors
    }

  } catch (error) {
    console.error('Error during global migration:', error)
    return {
      facilitiesProcessed: 0,
      totalClaimsMigrated: 0,
      totalItemsCreated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Test migration on a small sample without actually inserting data
 */
export async function testMigration(facilityId: number, limit: number = 5): Promise<{
  sampleClaims: Array<{
    claimId: number
    originalText: string
    parsedItems: any[]
    estimatedCost: number
  }>
  totalEstimatedItems: number
}> {
  try {
    const sampleClaims = await db
      .select({
        id: claims.id,
        treatmentProcedure: claims.treatmentProcedure,
        primaryDiagnosis: claims.primaryDiagnosis,
        dateOfTreatment: claims.dateOfTreatment,
      })
      .from(claims)
      .where(and(
        eq(claims.facilityId, facilityId),
        isNotNull(claims.treatmentProcedure)
      ))
      .limit(limit)

    const results = sampleClaims.map(claim => {
      const serviceDate = claim.dateOfTreatment || new Date().toISOString().split('T')[0]
      const parsedItems = parseClaimText(
        claim.treatmentProcedure || '', 
        serviceDate, 
        claim.primaryDiagnosis || ''
      )
      const estimatedCost = parsedItems.reduce((sum, item) => sum + item.totalCost, 0)

      return {
        claimId: claim.id,
        originalText: claim.treatmentProcedure || '',
        parsedItems,
        estimatedCost
      }
    })

    const totalEstimatedItems = results.reduce((sum, result) => sum + result.parsedItems.length, 0)

    return {
      sampleClaims: results,
      totalEstimatedItems
    }

  } catch (error) {
    console.error('Error during test migration:', error)
    return {
      sampleClaims: [],
      totalEstimatedItems: 0
    }
  }
}