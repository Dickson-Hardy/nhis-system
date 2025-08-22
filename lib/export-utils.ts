import { format } from "date-fns"

export interface ExportOptions {
  format?: 'csv' | 'excel' | 'pdf'
  filename?: string
  includeHeaders?: boolean
  dateFormat?: string
}

export interface ExportableData {
  [key: string]: any
}

export class ExportManager {
  private static instance: ExportManager

  private constructor() {}

  static getInstance(): ExportManager {
    if (!ExportManager.instance) {
      ExportManager.instance = new ExportManager()
    }
    return ExportManager.instance
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(data: ExportableData[], options: ExportOptions = { format: 'csv' }): string {
    if (!data || data.length === 0) {
      return ''
    }

    const { includeHeaders = true, dateFormat = 'yyyy-MM-dd' } = options
    const lines: string[] = []

    if (includeHeaders) {
      const headers = Object.keys(data[0])
      lines.push(headers.join(','))
    }

    data.forEach(row => {
      const values = Object.values(row).map(value => {
        if (value === null || value === undefined) {
          return ''
        }
        if (value instanceof Date) {
          return format(value, dateFormat)
        }
        // Escape commas and quotes in CSV
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      lines.push(values.join(','))
    })

    return lines.join('\n')
  }

  /**
   * Export data to Excel format (XLSX)
   * Note: This is a simplified version. For full Excel support, consider using libraries like 'xlsx'
   */
  exportToExcel(data: ExportableData[], options: ExportOptions = { format: 'excel' }): string {
    // For now, return CSV format as Excel
    // In production, you would use a proper Excel library
    return this.exportToCSV(data, { ...options, format: 'csv' })
  }

  /**
   * Generate a downloadable blob for the exported data
   */
  downloadExport(data: string, options: ExportOptions): void {
    const { format: exportFormat, filename } = options
    
    let mimeType: string
    let fileExtension: string
    
    switch (exportFormat) {
      case 'csv':
        mimeType = 'text/csv'
        fileExtension = 'csv'
        break
      case 'excel':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileExtension = 'xlsx'
        break
      case 'pdf':
        mimeType = 'application/pdf'
        fileExtension = 'pdf'
        break
      default:
        mimeType = 'text/plain'
        fileExtension = 'txt'
    }

    const defaultFilename = `export-${format(new Date(), 'yyyy-MM-dd')}.${fileExtension}`
    const finalFilename = filename || defaultFilename

    const blob = new Blob([data], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = finalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
  }

  /**
   * Export facility reports data
   */
  exportFacilityReport(reportData: any, options: ExportOptions): string {
    const { format: exportFormat } = options
    
    switch (exportFormat) {
      case 'csv':
        return this.generateFacilityReportCSV(reportData)
      case 'excel':
        return this.generateFacilityReportCSV(reportData) // Simplified for now
      case 'pdf':
        return this.generateFacilityReportCSV(reportData) // Simplified for now
      default:
        return this.generateFacilityReportCSV(reportData)
    }
  }

  /**
   * Generate CSV content for facility reports
   */
  private generateFacilityReportCSV(reportData: any): string {
    const lines: string[] = []
    
    // Header
    lines.push('Facility Report')
    lines.push(`Period: ${reportData.period?.start || 'N/A'} to ${reportData.period?.end || 'N/A'}`)
    lines.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
    lines.push('')
    
    // KPIs
    if (reportData.kpis) {
      lines.push('Key Performance Indicators')
      lines.push('Metric,Value')
      Object.entries(reportData.kpis).forEach(([key, value]) => {
        lines.push(`${key},${value}`)
      })
      lines.push('')
    }
    
    // Status Distribution
    if (reportData.statusDistribution && reportData.statusDistribution.length > 0) {
      lines.push('Claims Status Distribution')
      lines.push('Status,Count,Amount')
      reportData.statusDistribution.forEach((item: any) => {
        lines.push(`${item.status},${item.count},${item.amount}`)
      })
      lines.push('')
    }
    
    // Monthly Trends
    if (reportData.monthlyTrends && reportData.monthlyTrends.length > 0) {
      lines.push('Monthly Trends')
      lines.push('Month,Count,Amount')
      reportData.monthlyTrends.forEach((item: any) => {
        lines.push(`${item.month},${item.count},${item.amount}`)
      })
      lines.push('')
    }
    
    // TPA Performance
    if (reportData.tpaPerformance && reportData.tpaPerformance.length > 0) {
      lines.push('TPA Performance')
      lines.push('TPA,Total Claims,Approved,Rejected,Total Amount,Avg Processing Time')
      reportData.tpaPerformance.forEach((item: any) => {
        lines.push(`${item.tpaName || 'N/A'},${item.totalClaims},${item.approvedClaims},${item.rejectedClaims},${item.totalAmount},${item.averageProcessingTime}`)
      })
      lines.push('')
    }
    
    // Top Diagnoses
    if (reportData.topDiagnoses && reportData.topDiagnoses.length > 0) {
      lines.push('Top Diagnoses')
      lines.push('Diagnosis,Count,Amount')
      reportData.topDiagnoses.forEach((item: any) => {
        lines.push(`${item.diagnosis},${item.count},${item.amount}`)
      })
      lines.push('')
    }
    
    // Batch Performance
    if (reportData.batchPerformance && reportData.batchPerformance.length > 0) {
      lines.push('Batch Performance')
      lines.push('Batch Number,Status,Total Claims,Completed Claims,Total Amount,Approved Amount,Submission Date')
      reportData.batchPerformance.forEach((item: any) => {
        lines.push(`${item.batchNumber},${item.status},${item.totalClaims},${item.completedClaims},${item.totalAmount},${item.approvedAmount},${item.submissionDate || 'N/A'}`)
      })
      lines.push('')
    }
    
    // Financial Summary
    if (reportData.financialSummary) {
      lines.push('Financial Summary')
      lines.push('Metric,Value')
      Object.entries(reportData.financialSummary).forEach(([key, value]) => {
        lines.push(`${key},${value}`)
      })
    }
    
    return lines.join('\n')
  }

  /**
   * Export claims data
   */
  exportClaimsData(claims: any[], options: ExportOptions): string {
    const { format: exportFormat } = options
    
    switch (exportFormat) {
      case 'csv':
        return this.generateClaimsCSV(claims)
      case 'excel':
        return this.generateClaimsCSV(claims) // Simplified for now
      case 'pdf':
        return this.generateClaimsCSV(claims) // Simplified for now
      default:
        return this.generateClaimsCSV(claims)
    }
  }

  /**
   * Generate CSV content for claims data
   */
  private generateClaimsCSV(claims: any[]): string {
    if (!claims || claims.length === 0) {
      return 'No claims data available'
    }

    const lines: string[] = []
    
    // Header
    lines.push('Claims Export')
    lines.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
    lines.push(`Total Claims: ${claims.length}`)
    lines.push('')
    
    // Column headers
    const headers = [
      'Claim ID',
      'Beneficiary Name',
      'Hospital Number',
      'Date of Admission',
      'Date of Discharge',
      'Primary Diagnosis',
      'Secondary Diagnosis',
      'Treatment Procedure',
      'Treatment Procedures Count',
      'Total Cost of Care',
      'Status',
      'Batch Number',
      'Created Date'
    ]
    lines.push(headers.join(','))

    // Data rows
    claims.forEach(claim => {
      const values = [
        claim.uniqueClaimId || claim.id,
        claim.beneficiaryName || 'N/A',
        claim.hospitalNumber || 'N/A',
        claim.dateOfAdmission || 'N/A',
        claim.dateOfDischarge || 'N/A',
        claim.primaryDiagnosis || 'N/A',
        claim.secondaryDiagnosis || 'N/A',
        claim.treatmentProcedure || 'N/A',
        claim.treatmentProcedures?.length || 0,
        claim.totalCostOfCare || 0,
        claim.status || 'N/A',
        claim.batch?.batchNumber || 'N/A',
        claim.createdAt ? format(new Date(claim.createdAt), 'yyyy-MM-dd') : 'N/A'
      ]
      
      // Escape values for CSV
      const escapedValues = values.map(value => {
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      
      lines.push(escapedValues.join(','))
    })
    
    return lines.join('\n')
  }

  /**
   * Export batches data
   */
  exportBatchesData(batches: any[], options: ExportOptions): string {
    const { format: exportFormat } = options
    
    switch (exportFormat) {
      case 'csv':
        return this.generateBatchesCSV(batches)
      case 'excel':
        return this.generateBatchesCSV(batches) // Simplified for now
      case 'pdf':
        return this.generateBatchesCSV(batches) // Simplified for now
      default:
        return this.generateBatchesCSV(batches)
    }
  }

  /**
   * Generate CSV content for batches data
   */
  private generateBatchesCSV(batches: any[]): string {
    if (!batches || batches.length === 0) {
      return 'No batches data available'
    }

    const lines: string[] = []
    
    // Header
    lines.push('Batches Export')
    lines.push(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
    lines.push(`Total Batches: ${batches.length}`)
    lines.push('')
    
    // Column headers
    const headers = [
      'Batch Number',
      'Batch Type',
      'Week Start Date',
      'Week End Date',
      'Status',
      'Total Claims',
      'Completed Claims',
      'Total Amount',
      'Approved Amount',
      'TPA',
      'Created Date'
    ]
    lines.push(headers.join(','))
    
    // Data rows
    batches.forEach(batch => {
      const values = [
        batch.batchNumber || 'N/A',
        batch.batchType || 'N/A',
        batch.weekStartDate ? format(new Date(batch.weekStartDate), 'yyyy-MM-dd') : 'N/A',
        batch.weekEndDate ? format(new Date(batch.weekEndDate), 'yyyy-MM-dd') : 'N/A',
        batch.status || 'N/A',
        batch.totalClaims || 0,
        batch.completedClaims || 0,
        batch.totalAmount || 0,
        batch.approvedAmount || 0,
        batch.tpa?.name || 'N/A',
        batch.createdAt ? format(new Date(batch.createdAt), 'yyyy-MM-dd') : 'N/A'
      ]
      
      // Escape values for CSV
      const escapedValues = values.map(value => {
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      
      lines.push(escapedValues.join(','))
    })
    
    return lines.join('\n')
  }

  // Export detailed treatment procedures for TPA audit
  exportTreatmentProcedures(claims: any[], options: ExportOptions = {}) {
    const format = options.format || 'csv'
    
    if (format === 'csv') {
      return this.generateTreatmentProceduresCSV(claims)
    }
    
    return this.generateTreatmentProceduresExcel(claims)
  }

  private generateTreatmentProceduresCSV(claims: any[]): string {
    const lines: string[] = []
    
    // Header
    const headers = [
      'Claim ID',
      'Beneficiary Name',
      'Hospital Number',
      'Procedure Name',
      'Procedure Cost',
      'Procedure Description',
      'Total Claim Cost',
      'Status',
      'Batch Number',
      'Created Date'
    ]
    lines.push(headers.join(','))

    // Data rows - one row per procedure
    claims.forEach(claim => {
      if (claim.treatmentProcedures && claim.treatmentProcedures.length > 0) {
        claim.treatmentProcedures.forEach((procedure: any) => {
          const values = [
            claim.uniqueClaimId || claim.id,
            claim.beneficiaryName || 'N/A',
            claim.hospitalNumber || 'N/A',
            procedure.name || 'N/A',
            procedure.cost || 0,
            `"${(procedure.description || 'N/A').replace(/"/g, '""')}"`,
            claim.totalCostOfCare || 0,
            claim.status || 'N/A',
            claim.batch?.batchNumber || 'N/A',
            claim.createdAt ? format(new Date(claim.createdAt), 'yyyy-MM-dd') : 'N/A'
          ]
          lines.push(values.join(','))
        })
      } else {
        // If no detailed procedures, create one row with the general treatment procedure
        const values = [
          claim.uniqueClaimId || claim.id,
          claim.beneficiaryName || 'N/A',
          claim.hospitalNumber || 'N/A',
          claim.treatmentProcedure || 'N/A',
          'N/A',
          'N/A',
          claim.totalCostOfCare || 0,
          claim.status || 'N/A',
          claim.batch?.batchNumber || 'N/A',
          claim.createdAt ? format(new Date(claim.createdAt), 'yyyy-MM-dd') : 'N/A'
        ]
        lines.push(values.join(','))
      }
    })

    return lines.join('\n')
  }

  private generateTreatmentProceduresExcel(claims: any[]): string {
    // Simulated Excel generation for treatment procedures
    return this.generateTreatmentProceduresCSV(claims)
  }
}

// Export singleton instance
export const exportManager = ExportManager.getInstance()
