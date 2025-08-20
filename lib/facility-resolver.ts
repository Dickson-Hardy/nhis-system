// Utility functions for facility management and resolution

import { db } from "@/lib/db"
import { facilities } from "@/lib/db/schema"
import { eq, and, ilike } from "drizzle-orm"

export interface FacilityResolutionResult {
  facilityId: number
  facility: any
  isNewFacility: boolean
}

/**
 * Intelligently resolves facility ID from various inputs
 * Tries to find existing facility by ID, name, or code before creating new one
 */
export async function resolveFacilityId(
  tpaId: number,
  facilityInput: {
    facilityId?: number
    facilityName?: string
    facilityCode?: string
    facilityState?: string
  },
  userFacilityId?: number | null,
  autoCreateFacility: boolean = true
): Promise<FacilityResolutionResult> {
  
  // First, try using explicit facility ID
  if (facilityInput.facilityId) {
    const facility = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, facilityInput.facilityId))
      .limit(1)
    
    if (facility.length > 0) {
      return {
        facilityId: facility[0].id,
        facility: facility[0],
        isNewFacility: false
      }
    }
  }

  // Second, try using user's default facility ID
  if (userFacilityId) {
    const facility = await db
      .select()
      .from(facilities)
      .where(eq(facilities.id, userFacilityId))
      .limit(1)
    
    if (facility.length > 0) {
      return {
        facilityId: facility[0].id,
        facility: facility[0],
        isNewFacility: false
      }
    }
  }

  // Third, try to find facility by exact name match within the TPA
  if (facilityInput.facilityName) {
    const facilityByName = await db
      .select()
      .from(facilities)
      .where(
        and(
          eq(facilities.name, facilityInput.facilityName),
          eq(facilities.tpaId, tpaId)
        )
      )
      .limit(1)
    
    if (facilityByName.length > 0) {
      return {
        facilityId: facilityByName[0].id,
        facility: facilityByName[0],
        isNewFacility: false
      }
    }
  }

  // Fourth, try to find facility by code within the TPA
  if (facilityInput.facilityCode) {
    const facilityByCode = await db
      .select()
      .from(facilities)
      .where(
        and(
          eq(facilities.code, facilityInput.facilityCode),
          eq(facilities.tpaId, tpaId)
        )
      )
      .limit(1)
    
    if (facilityByCode.length > 0) {
      return {
        facilityId: facilityByCode[0].id,
        facility: facilityByCode[0],
        isNewFacility: false
      }
    }
  }

  // Fifth, try fuzzy search by name within the TPA
  if (facilityInput.facilityName) {
    const similarFacility = await db
      .select()
      .from(facilities)
      .where(
        and(
          ilike(facilities.name, `%${facilityInput.facilityName.split(' ')[0]}%`),
          eq(facilities.tpaId, tpaId)
        )
      )
      .limit(1)
    
    if (similarFacility.length > 0) {
      console.warn(`Using similar facility: ${similarFacility[0].name} for input: ${facilityInput.facilityName}`)
      return {
        facilityId: similarFacility[0].id,
        facility: similarFacility[0],
        isNewFacility: false
      }
    }
  }

  // If auto-create is enabled and we have facility name, create new facility
  if (autoCreateFacility && facilityInput.facilityName) {
    try {
      const newFacility = await db
        .insert(facilities)
        .values({
          name: facilityInput.facilityName,
          code: facilityInput.facilityCode || `FAC-${tpaId}-${Date.now().toString().slice(-6)}`,
          state: facilityInput.facilityState || "Unknown",
          address: "",
          tpaId: tpaId,
          isActive: true,
          createdAt: new Date(),
        })
        .returning()
      
      console.log(`Created new facility: ${newFacility[0].name} for TPA ${tpaId}`)
      return {
        facilityId: newFacility[0].id,
        facility: newFacility[0],
        isNewFacility: true
      }
    } catch (error) {
      console.error(`Error creating facility: ${error}`)
      throw new Error(`Failed to create facility: ${facilityInput.facilityName}`)
    }
  }

  // If we reach here, we couldn't resolve or create a facility
  throw new Error(`Could not resolve facility from inputs: ${JSON.stringify(facilityInput)}`)
}

/**
 * Gets the default facility for a TPA
 * Tries to find a "main" or "primary" facility, otherwise returns the first one
 */
export async function getDefaultFacilityForTpa(tpaId: number): Promise<number | null> {
  // First, try to find facilities with "main", "primary", or "headquarters" in the name
  const primaryFacility = await db
    .select()
    .from(facilities)
    .where(
      and(
        eq(facilities.tpaId, tpaId),
        eq(facilities.isActive, true),
        ilike(facilities.name, '%main%')
      )
    )
    .limit(1)
  
  if (primaryFacility.length > 0) {
    return primaryFacility[0].id
  }

  // Otherwise, get the first active facility for this TPA
  const firstFacility = await db
    .select()
    .from(facilities)
    .where(
      and(
        eq(facilities.tpaId, tpaId),
        eq(facilities.isActive, true)
      )
    )
    .orderBy(facilities.createdAt)
    .limit(1)
  
  if (firstFacility.length > 0) {
    return firstFacility[0].id
  }

  return null
}

/**
 * Validates that a facility belongs to a specific TPA
 */
export async function validateFacilityTpaOwnership(
  facilityId: number,
  tpaId: number
): Promise<boolean> {
  const facility = await db
    .select()
    .from(facilities)
    .where(
      and(
        eq(facilities.id, facilityId),
        eq(facilities.tpaId, tpaId)
      )
    )
    .limit(1)
  
  return facility.length > 0
}

/**
 * Gets facilities for a TPA with optional search
 */
export async function getFacilitiesForTpa(
  tpaId: number,
  searchTerm?: string
): Promise<any[]> {
  const whereConditions = [eq(facilities.tpaId, tpaId)]
  
  if (searchTerm) {
    whereConditions.push(
      ilike(facilities.name, `%${searchTerm}%`)
    )
  }

  return await db
    .select()
    .from(facilities)
    .where(and(...whereConditions))
    .orderBy(facilities.name)
}