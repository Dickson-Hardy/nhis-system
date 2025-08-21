import { claims, batches, errorLogs, errorRules } from "@/lib/db/schema"
import { eq, and, gt, lt, isNull, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"

export interface ValidationError {
  errorCode: string
  errorTitle: string
  errorDescription: string
  errorType: 'validation' | 'discrepancy' | 'fraud' | 'quality'
  errorCategory: 'missing_data' | 'duplicate' | 'cost_anomaly' | 'decision_mismatch'
  severity: 'low' | 'medium' | 'high' | 'critical'
  fieldName?: string
  expectedValue?: string
  actualValue?: string
  expectedAmount?: number
  actualAmount?: number
  amountDeviation?: number
  deviationPercentage?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  totalErrors: number
  criticalErrors: number
  highErrors: number
  mediumErrors: number
  lowErrors: number
}

export class ErrorValidationService {
  
  // Validate individual claim for data quality
  static async validateClaim(claim: any): Promise<ValidationError[]> {
    const errors: ValidationError[] = []
    
    // 1. Required Field Validation
    if (!claim.primaryDiagnosis || claim.primaryDiagnosis.trim() === '') {
      errors.push({
        errorCode: 'MISSING_DIAGNOSIS',
        errorTitle: 'Missing Primary Diagnosis',
        errorDescription: 'Primary diagnosis is required for all claims',
        errorType: 'validation',
        errorCategory: 'missing_data',
        severity: 'high',
        fieldName: 'primaryDiagnosis',
        expectedValue: 'Valid diagnosis description',
        actualValue: claim.primaryDiagnosis || 'Empty'
      })
    }
    
    if (!claim.dateOfClaimSubmission) {
      errors.push({
        errorCode: 'MISSING_SUBMISSION_DATE',
        errorTitle: 'Missing Date of Submission',
        errorDescription: 'Date of claim submission is required',
        errorType: 'validation',
        errorCategory: 'missing_data',
        severity: 'high',
        fieldName: 'dateOfClaimSubmission',
        expectedValue: 'Valid date',
        actualValue: claim.dateOfClaimSubmission || 'Empty'
      })
    }
    
    if (!claim.treatmentProcedure || claim.treatmentProcedure.trim() === '') {
      errors.push({
        errorCode: 'MISSING_TREATMENT',
        errorTitle: 'Missing Treatment Procedure',
        errorDescription: 'Treatment procedure is required for all claims',
        errorType: 'validation',
        errorCategory: 'missing_data',
        severity: 'medium',
        fieldName: 'treatmentProcedure',
        expectedValue: 'Valid treatment description',
        actualValue: claim.treatmentProcedure || 'Empty'
      })
    }
    
    // 2. Decision Mismatch Validation
    if (claim.decision === 'rejected' && claim.approvedCostOfCare && claim.approvedCostOfCare > 0) {
      errors.push({
        errorCode: 'REJECTED_WITH_APPROVED_COST',
        errorTitle: 'Rejected Claim with Approved Cost',
        errorDescription: 'Rejected claims should not have approved costs',
        errorType: 'discrepancy',
        errorCategory: 'decision_mismatch',
        severity: 'critical',
        fieldName: 'approvedCostOfCare',
        expectedValue: '0 or null for rejected claims',
        actualValue: claim.approvedCostOfCare?.toString() || 'Empty',
        expectedAmount: 0,
        actualAmount: claim.approvedCostOfCare || 0,
        amountDeviation: claim.approvedCostOfCare || 0,
        deviationPercentage: 100
      })
    }
    
    if (!claim.decision && claim.approvedCostOfCare && claim.approvedCostOfCare > 0) {
      errors.push({
        errorCode: 'NO_DECISION_WITH_APPROVED_COST',
        errorTitle: 'No Decision with Approved Cost',
        errorDescription: 'Claims with approved costs must have a decision',
        errorType: 'discrepancy',
        errorCategory: 'decision_mismatch',
        severity: 'high',
        fieldName: 'decision',
        expectedValue: 'approved, rejected, or pending',
        actualValue: claim.decision || 'Empty',
        expectedAmount: 0,
        actualAmount: claim.approvedCostOfCare || 0,
        amountDeviation: claim.approvedCostOfCare || 0,
        deviationPercentage: 100
      })
    }
    
    // 3. Cost Anomaly Validation
    if (claim.totalCostOfCare) {
      const totalCost = parseFloat(claim.totalCostOfCare)
      
      // Check for unreasonably high costs
      if (totalCost > 1000000) { // 1 million naira threshold
        errors.push({
          errorCode: 'EXCESSIVE_COST',
          errorTitle: 'Excessive Claim Cost',
          errorDescription: 'Claim cost exceeds reasonable threshold',
          errorType: 'fraud',
          errorCategory: 'cost_anomaly',
          severity: 'critical',
          fieldName: 'totalCostOfCare',
          expectedValue: 'Cost within reasonable range',
          actualValue: totalCost.toString(),
          expectedAmount: 1000000,
          actualAmount: totalCost,
          amountDeviation: totalCost - 1000000,
          deviationPercentage: ((totalCost - 1000000) / 1000000) * 100
        })
      }
      
      // Check for zero or negative costs
      if (totalCost <= 0) {
        errors.push({
          errorCode: 'INVALID_COST',
          errorTitle: 'Invalid Claim Cost',
          errorDescription: 'Claim cost must be greater than zero',
          errorType: 'validation',
          errorCategory: 'cost_anomaly',
          severity: 'high',
          fieldName: 'totalCostOfCare',
          expectedValue: 'Cost greater than 0',
          actualValue: totalCost.toString(),
          expectedAmount: 1,
          actualAmount: totalCost,
          amountDeviation: 1 - totalCost,
          deviationPercentage: 100
        })
      }
    }
    
    // 4. Date Validation
    if (claim.dateOfAdmission && claim.dateOfDischarge) {
      const admissionDate = new Date(claim.dateOfAdmission)
      const dischargeDate = new Date(claim.dateOfDischarge)
      
      if (dischargeDate < admissionDate) {
        errors.push({
          errorCode: 'INVALID_DATE_RANGE',
          errorTitle: 'Invalid Date Range',
          errorDescription: 'Discharge date cannot be before admission date',
          errorType: 'validation',
          errorCategory: 'missing_data',
          severity: 'high',
          fieldName: 'dateOfDischarge',
          expectedValue: 'Date after admission date',
          actualValue: claim.dateOfDischarge,
          expectedValue: claim.dateOfAdmission
        })
      }
    }
    
    return errors
  }
  
  // Validate batch for overall quality and consistency
  static async validateBatch(batchId: number): Promise<ValidationError[]> {
    const errors: ValidationError[] = []
    
    // Get batch claims
    const batchClaims = await db.select().from(claims).where(eq(claims.batchNumber, batchId.toString()))
    
    if (batchClaims.length === 0) {
      errors.push({
        errorCode: 'EMPTY_BATCH',
        errorTitle: 'Empty Batch',
        errorDescription: 'Batch contains no claims',
        errorType: 'validation',
        errorCategory: 'missing_data',
        severity: 'medium'
      })
      return errors
    }
    
    // 1. Duplicate Claims Check
    const claimIds = batchClaims.map(c => c.uniqueClaimId)
    const duplicateIds = claimIds.filter((id, index) => claimIds.indexOf(id) !== index)
    
    if (duplicateIds.length > 0) {
      errors.push({
        errorCode: 'DUPLICATE_CLAIMS',
        errorTitle: 'Duplicate Claims Found',
        errorDescription: `Batch contains ${duplicateIds.length} duplicate claims`,
        errorType: 'fraud',
        errorCategory: 'duplicate',
        severity: 'critical',
        fieldName: 'uniqueClaimId',
        expectedValue: 'Unique claim IDs',
        actualValue: `Found ${duplicateIds.length} duplicates`
      })
    }
    
    // 2. Cost Distribution Analysis
    const costs = batchClaims
      .filter(c => c.totalCostOfCare)
      .map(c => parseFloat(c.totalCostOfCare))
    
    if (costs.length > 0) {
      const totalCost = costs.reduce((sum, cost) => sum + cost, 0)
      const averageCost = totalCost / costs.length
      const maxCost = Math.max(...costs)
      const minCost = Math.min(...costs)
      
      // Check for cost outliers
      const costThreshold = averageCost * 3 // 3x average as outlier threshold
      const outliers = costs.filter(cost => cost > costThreshold)
      
      if (outliers.length > 0) {
        errors.push({
          errorCode: 'COST_OUTLIERS',
          errorTitle: 'Cost Outliers Detected',
          errorDescription: `Batch contains ${outliers.length} claims with unusually high costs`,
          errorType: 'fraud',
          errorCategory: 'cost_anomaly',
          severity: 'high',
          fieldName: 'totalCostOfCare',
          expectedValue: `Costs within ${costThreshold.toLocaleString()} range`,
          actualValue: `Found ${outliers.length} outliers above threshold`,
          expectedAmount: costThreshold,
          actualAmount: maxCost,
          amountDeviation: maxCost - costThreshold,
          deviationPercentage: ((maxCost - costThreshold) / costThreshold) * 100
        })
      }
      
      // Check batch total against facility average
      const facilityId = batchClaims[0]?.facilityId
      if (facilityId) {
        const facilityClaims = await db.select().from(claims).where(eq(claims.facilityId, facilityId))
        const facilityCosts = facilityClaims
          .filter(c => c.totalCostOfCare)
          .map(c => parseFloat(c.totalCostOfCare))
        
        if (facilityCosts.length > 0) {
          const facilityAverage = facilityCosts.reduce((sum, cost) => sum + cost, 0) / facilityCosts.length
          const batchDeviation = Math.abs(averageCost - facilityAverage) / facilityAverage * 100
          
          if (batchDeviation > 50) { // 50% deviation threshold
            errors.push({
              errorCode: 'BATCH_COST_DEVIATION',
              errorTitle: 'Batch Cost Deviation',
              errorDescription: `Batch average cost deviates ${batchDeviation.toFixed(1)}% from facility average`,
              errorType: 'discrepancy',
              errorCategory: 'cost_anomaly',
              severity: 'medium',
              fieldName: 'batch_cost_average',
              expectedValue: `Within ${facilityAverage.toLocaleString()} range`,
              actualValue: `Batch average: ${averageCost.toLocaleString()}`,
              expectedAmount: facilityAverage,
              actualAmount: averageCost,
              amountDeviation: Math.abs(averageCost - facilityAverage),
              deviationPercentage: batchDeviation
            })
          }
        }
      }
    }
    
    // 3. Decision Consistency Check
    const decisions = batchClaims.map(c => c.decision).filter(Boolean)
    const hasRejectedWithCost = batchClaims.some(c => 
      c.decision === 'rejected' && c.approvedCostOfCare && c.approvedCostOfCare > 0
    )
    
    if (hasRejectedWithCost) {
      errors.push({
        errorCode: 'BATCH_DECISION_INCONSISTENCY',
        errorTitle: 'Batch Decision Inconsistency',
        errorDescription: 'Batch contains rejected claims with approved costs',
        errorType: 'discrepancy',
        errorCategory: 'decision_mismatch',
        severity: 'high',
        fieldName: 'decision',
        expectedValue: 'Consistent decision logic',
        actualValue: 'Mixed decision logic found'
      })
    }
    
    // 4. Missing Data Analysis
    const missingDataCount = batchClaims.filter(c => 
      !c.primaryDiagnosis || !c.treatmentProcedure || !c.dateOfClaimSubmission
    ).length
    
    if (missingDataCount > 0) {
      const missingPercentage = (missingDataCount / batchClaims.length) * 100
      const severity = missingPercentage > 20 ? 'high' : missingPercentage > 10 ? 'medium' : 'low'
      
      errors.push({
        errorCode: 'BATCH_MISSING_DATA',
        errorTitle: 'Batch Missing Data',
        errorDescription: `${missingDataCount} claims (${missingPercentage.toFixed(1)}%) are missing required data`,
        errorType: 'quality',
        errorCategory: 'missing_data',
        severity: severity as any,
        fieldName: 'required_fields',
        expectedValue: 'All required fields populated',
        actualValue: `${missingDataCount} claims with missing data`
      })
    }
    
    return errors
  }
  
  // Generate comprehensive validation report
  static async generateValidationReport(batchId: number): Promise<ValidationResult> {
    const batchErrors = await this.validateBatch(batchId)
    const claimErrors: ValidationError[] = []
    
    // Validate individual claims
    const batchClaims = await db.select().from(claims).where(eq(claims.batchNumber, batchId.toString()))
    
    for (const claim of batchClaims) {
      const claimErrors = await this.validateClaim(claim)
      claimErrors.forEach(error => {
        error.fieldName = `${error.fieldName} (Claim: ${claim.uniqueClaimId})`
      })
      claimErrors.push(...claimErrors)
    }
    
    const allErrors = [...batchErrors, ...claimErrors]
    
    return {
      isValid: allErrors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      errors: allErrors,
      totalErrors: allErrors.length,
      criticalErrors: allErrors.filter(e => e.severity === 'critical').length,
      highErrors: allErrors.filter(e => e.severity === 'high').length,
      mediumErrors: allErrors.filter(e => e.severity === 'medium').length,
      lowErrors: allErrors.filter(e => e.severity === 'low').length
    }
  }
  
  // Save validation errors to database
  static async saveValidationErrors(
    batchId: number,
    errors: ValidationError[],
    createdBy: number
  ): Promise<void> {
    for (const error of errors) {
      await db.insert(errorLogs).values({
        batchId,
        errorType: error.errorType,
        errorCategory: error.errorCategory,
        severity: error.severity,
        errorCode: error.errorCode,
        errorTitle: error.errorTitle,
        errorDescription: error.errorDescription,
        fieldName: error.fieldName,
        expectedValue: error.expectedValue,
        actualValue: error.actualValue,
        expectedAmount: error.expectedAmount,
        actualAmount: error.actualAmount,
        amountDeviation: error.amountDeviation,
        deviationPercentage: error.deviationPercentage,
        createdBy,
        status: 'open'
      })
    }
  }
  
  // Get error statistics for dashboard
  static async getErrorStatistics(tpaId?: number): Promise<{
    totalErrors: number
    openErrors: number
    resolvedErrors: number
    criticalErrors: number
    highErrors: number
    mediumErrors: number
    lowErrors: number
    errorsByCategory: Record<string, number>
    errorsByType: Record<string, number>
  }> {
    let query = db.select().from(errorLogs)
    
    if (tpaId) {
      query = query.where(eq(errorLogs.tpaId, tpaId))
    }
    
    const allErrors = await query
    
    const errorsByCategory: Record<string, number> = {}
    const errorsByType: Record<string, number> = {}
    
    allErrors.forEach(error => {
      errorsByCategory[error.errorCategory] = (errorsByCategory[error.errorCategory] || 0) + 1
      errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1
    })
    
    return {
      totalErrors: allErrors.length,
      openErrors: allErrors.filter(e => e.status === 'open').length,
      resolvedErrors: allErrors.filter(e => e.status === 'resolved').length,
      criticalErrors: allErrors.filter(e => e.severity === 'critical').length,
      highErrors: allErrors.filter(e => e.severity === 'high').length,
      mediumErrors: allErrors.filter(e => e.severity === 'medium').length,
      lowErrors: allErrors.filter(e => e.severity === 'low').length,
      errorsByCategory,
      errorsByType
    }
  }
}
