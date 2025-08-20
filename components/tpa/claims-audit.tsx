"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search, 
  Calculator,
  Clock,
  Users,
  FileText,
  TrendingUp,
  Shield,
  RefreshCw
} from "lucide-react"

interface AuditFlag {
  type: 'duplicate' | 'cost_variance' | 'time_variance' | 'frequency' | 'documentation' | 'pattern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: string
  recommendation: string
}

interface ClaimAuditData {
  id: string
  uniqueClaimId: string
  uniqueBeneficiaryId: string
  beneficiaryName: string
  facilityName: string
  primaryDiagnosis: string
  treatmentProcedure: string
  totalCostOfCare: number
  dateOfAdmission: string
  dateOfTreatment: string
  dateOfDischarge: string
  nin: string
  phoneNumber: string
  auditFlags: AuditFlag[]
  riskScore: number
}

interface ClaimsAuditProps {
  claims: ClaimAuditData[]
  onFlagClaim: (claimId: string, flags: AuditFlag[]) => void
}

export function ClaimsAudit({ claims, onFlagClaim }: ClaimsAuditProps) {
  const [auditResults, setAuditResults] = useState<ClaimAuditData[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedAuditType, setSelectedAuditType] = useState("all")

  // Audit Engine Functions
  const detectDuplicates = (claims: ClaimAuditData[]): AuditFlag[] => {
    const flags: AuditFlag[] = []
    const seenBeneficiaries = new Map()
    const seenNINs = new Map()
    const seenPhones = new Map()

    claims.forEach((claim, index) => {
      // Check for duplicate beneficiary within same period
      const beneficiaryKey = `${claim.uniqueBeneficiaryId}_${claim.primaryDiagnosis}`
      if (seenBeneficiaries.has(beneficiaryKey)) {
        const originalClaim = seenBeneficiaries.get(beneficiaryKey)
        const daysDiff = Math.abs(new Date(claim.dateOfAdmission).getTime() - new Date(originalClaim.dateOfAdmission).getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysDiff < 30) {
          flags.push({
            type: 'duplicate',
            severity: 'high',
            message: 'Potential duplicate claim for same beneficiary',
            details: `Similar claim found for ${claim.beneficiaryName} within ${daysDiff.toFixed(0)} days`,
            recommendation: 'Verify if this is a genuine re-admission or duplicate submission'
          })
        }
      } else {
        seenBeneficiaries.set(beneficiaryKey, claim)
      }

      // Check for duplicate NIN with different names
      if (claim.nin && seenNINs.has(claim.nin)) {
        const existingClaim = seenNINs.get(claim.nin)
        if (existingClaim.beneficiaryName !== claim.beneficiaryName) {
          flags.push({
            type: 'duplicate',
            severity: 'critical',
            message: 'NIN used for different beneficiaries',
            details: `NIN ${claim.nin} used for both ${claim.beneficiaryName} and ${existingClaim.beneficiaryName}`,
            recommendation: 'Verify beneficiary identity and NIN authenticity'
          })
        }
      } else if (claim.nin) {
        seenNINs.set(claim.nin, claim)
      }

      // Check for duplicate phone numbers with different beneficiaries
      if (claim.phoneNumber && seenPhones.has(claim.phoneNumber)) {
        const existingClaim = seenPhones.get(claim.phoneNumber)
        if (existingClaim.beneficiaryName !== claim.beneficiaryName) {
          flags.push({
            type: 'duplicate',
            severity: 'medium',
            message: 'Phone number used by multiple beneficiaries',
            details: `Phone ${claim.phoneNumber} used for ${claim.beneficiaryName} and ${existingClaim.beneficiaryName}`,
            recommendation: 'Verify contact information accuracy'
          })
        }
      } else if (claim.phoneNumber) {
        seenPhones.set(claim.phoneNumber, claim)
      }
    })

    return flags
  }

  const detectCostVariances = (claims: ClaimAuditData[]): AuditFlag[] => {
    const flags: AuditFlag[] = []
    
    // Group by similar procedures/diagnoses
    const procedureGroups = claims.reduce((groups, claim) => {
      const key = `${claim.primaryDiagnosis}_${claim.treatmentProcedure}`
      if (!groups[key]) groups[key] = []
      groups[key].push(claim)
      return groups
    }, {} as Record<string, ClaimAuditData[]>)

    Object.entries(procedureGroups).forEach(([key, groupClaims]) => {
      if (groupClaims.length < 2) return

      const costs = groupClaims.map(c => c.totalCostOfCare)
      const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length
      const maxCost = Math.max(...costs)
      const minCost = Math.min(...costs)

      groupClaims.forEach(claim => {
        const variance = ((claim.totalCostOfCare - avgCost) / avgCost) * 100
        
        if (Math.abs(variance) > 50) {
          flags.push({
            type: 'cost_variance',
            severity: variance > 0 ? 'high' : 'medium',
            message: `Significant cost variance for ${claim.primaryDiagnosis}`,
            details: `Cost ₦${claim.totalCostOfCare.toLocaleString()} is ${variance.toFixed(1)}% ${variance > 0 ? 'above' : 'below'} average (₦${avgCost.toLocaleString()})`,
            recommendation: variance > 0 ? 'Justify higher than average costs' : 'Verify if all services were captured'
          })
        }
      })
    })

    return flags
  }

  const detectTimeAnomalies = (claims: ClaimAuditData[]): AuditFlag[] => {
    const flags: AuditFlag[] = []

    claims.forEach(claim => {
      const admission = new Date(claim.dateOfAdmission)
      const treatment = new Date(claim.dateOfTreatment)
      const discharge = new Date(claim.dateOfDischarge)

      // Check for impossible dates
      if (treatment < admission) {
        flags.push({
          type: 'time_variance',
          severity: 'high',
          message: 'Treatment date before admission',
          details: `Treatment on ${claim.dateOfTreatment} but admission on ${claim.dateOfAdmission}`,
          recommendation: 'Verify and correct treatment dates'
        })
      }

      if (discharge < admission) {
        flags.push({
          type: 'time_variance',
          severity: 'high',
          message: 'Discharge date before admission',
          details: `Discharge on ${claim.dateOfDischarge} but admission on ${claim.dateOfAdmission}`,
          recommendation: 'Verify and correct discharge dates'
        })
      }

      // Check for extremely long stays for outpatient procedures
      const stayDuration = (discharge.getTime() - admission.getTime()) / (1000 * 60 * 60 * 24)
      const outpatientProcedures = ['CONSULTATION', 'DELIVERY']
      
      if (outpatientProcedures.some(proc => claim.treatmentProcedure.toUpperCase().includes(proc)) && stayDuration > 7) {
        flags.push({
          type: 'time_variance',
          severity: 'medium',
          message: 'Unusually long stay for outpatient procedure',
          details: `${stayDuration.toFixed(0)} days stay for ${claim.treatmentProcedure}`,
          recommendation: 'Verify if extended stay was medically necessary'
        })
      }
    })

    return flags
  }

  const detectFrequencyAnomalies = (claims: ClaimAuditData[]): AuditFlag[] => {
    const flags: AuditFlag[] = []
    
    // Group by facility
    const facilityGroups = claims.reduce((groups, claim) => {
      if (!groups[claim.facilityName]) groups[claim.facilityName] = []
      groups[claim.facilityName].push(claim)
      return groups
    }, {} as Record<string, ClaimAuditData[]>)

    Object.entries(facilityGroups).forEach(([facility, facilityClaims]) => {
      // Check for unusual submission patterns
      const submissions = facilityClaims.reduce((dates, claim) => {
        const date = new Date(claim.dateOfAdmission).toDateString()
        dates[date] = (dates[date] || 0) + 1
        return dates
      }, {} as Record<string, number>)

      Object.entries(submissions).forEach(([date, count]) => {
        if (count > 10) {
          flags.push({
            type: 'frequency',
            severity: 'medium',
            message: 'High volume of claims on single date',
            details: `${count} claims from ${facility} on ${date}`,
            recommendation: 'Verify if bulk submission is legitimate'
          })
        }
      })

      // Check for repeated procedures on same beneficiary
      const beneficiaryProcedures = facilityClaims.reduce((procedures, claim) => {
        const key = `${claim.uniqueBeneficiaryId}_${claim.primaryDiagnosis}`
        if (!procedures[key]) procedures[key] = []
        procedures[key].push(claim)
        return procedures
      }, {} as Record<string, ClaimAuditData[]>)

      Object.entries(beneficiaryProcedures).forEach(([key, procedureClaims]) => {
        if (procedureClaims.length > 2) {
          flags.push({
            type: 'frequency',
            severity: 'high',
            message: 'Multiple claims for same diagnosis',
            details: `${procedureClaims.length} claims for ${procedureClaims[0].primaryDiagnosis} on ${procedureClaims[0].beneficiaryName}`,
            recommendation: 'Verify medical necessity for repeated treatments'
          })
        }
      })
    })

    return flags
  }

  const calculateRiskScore = (flags: AuditFlag[]): number => {
    const severityWeights = { low: 1, medium: 3, high: 7, critical: 10 }
    const typeWeights = { duplicate: 2, cost_variance: 1.5, time_variance: 1.8, frequency: 1.3, documentation: 1, pattern: 1.2 }
    
    return flags.reduce((score, flag) => {
      return score + (severityWeights[flag.severity] * typeWeights[flag.type])
    }, 0)
  }

  const runAudit = async () => {
    setIsRunning(true)
    setProgress(0)

    try {
      // Simulate progressive audit steps
      const steps = [
        { name: "Duplicate Detection", fn: detectDuplicates },
        { name: "Cost Variance Analysis", fn: detectCostVariances },
        { name: "Time Anomaly Detection", fn: detectTimeAnomalies },
        { name: "Frequency Analysis", fn: detectFrequencyAnomalies },
      ]

      const allFlags: Record<string, AuditFlag[]> = {}

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        setProgress(((i + 1) / steps.length) * 100)
        
        const stepFlags = step.fn(claims)
        stepFlags.forEach(flag => {
          // Associate flags with claims based on the audit logic
          claims.forEach(claim => {
            if (flag.details.includes(claim.beneficiaryName) || 
                flag.details.includes(claim.uniqueClaimId) ||
                flag.details.includes(claim.facilityName)) {
              if (!allFlags[claim.id]) allFlags[claim.id] = []
              allFlags[claim.id].push(flag)
            }
          })
        })

        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Calculate risk scores and update claims
      const auditedClaims = claims.map(claim => ({
        ...claim,
        auditFlags: allFlags[claim.id] || [],
        riskScore: calculateRiskScore(allFlags[claim.id] || [])
      }))

      setAuditResults(auditedClaims)
    } finally {
      setIsRunning(false)
    }
  }

  const filteredResults = auditResults.filter(claim => {
    if (selectedAuditType === "all") return true
    if (selectedAuditType === "flagged") return claim.auditFlags.length > 0
    if (selectedAuditType === "high_risk") return claim.riskScore > 10
    if (selectedAuditType === "duplicates") return claim.auditFlags.some(f => f.type === 'duplicate')
    if (selectedAuditType === "cost_variance") return claim.auditFlags.some(f => f.type === 'cost_variance')
    return true
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (score: number) => {
    if (score === 0) return 'bg-green-100 text-green-800'
    if (score <= 5) return 'bg-blue-100 text-blue-800'
    if (score <= 10) return 'bg-yellow-100 text-yellow-800'
    if (score <= 20) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getRiskLevel = (score: number) => {
    if (score === 0) return 'No Risk'
    if (score <= 5) return 'Low Risk'
    if (score <= 10) return 'Medium Risk'
    if (score <= 20) return 'High Risk'
    return 'Critical Risk'
  }

  const auditStats = {
    totalClaims: auditResults.length,
    flaggedClaims: auditResults.filter(c => c.auditFlags.length > 0).length,
    highRiskClaims: auditResults.filter(c => c.riskScore > 10).length,
    duplicates: auditResults.filter(c => c.auditFlags.some(f => f.type === 'duplicate')).length,
    costVariances: auditResults.filter(c => c.auditFlags.some(f => f.type === 'cost_variance')).length,
    timeAnomalies: auditResults.filter(c => c.auditFlags.some(f => f.type === 'time_variance')).length,
  }

  return (
    <div className="space-y-6">
      {/* Audit Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Claims Audit System
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Automated audit system for detecting anomalies, duplicates, and risk patterns
            </p>
            <Button 
              onClick={runAudit}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Audit...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Run Full Audit
                </>
              )}
            </Button>
          </div>
          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Analyzing {claims.length} claims for anomalies...
              </p>
            </div>
          )}
        </CardHeader>
      </Card>

      {auditResults.length > 0 && (
        <>
          {/* Audit Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{auditStats.totalClaims}</div>
                <div className="text-sm text-muted-foreground">Total Claims</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{auditStats.flaggedClaims}</div>
                <div className="text-sm text-muted-foreground">Flagged</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{auditStats.highRiskClaims}</div>
                <div className="text-sm text-muted-foreground">High Risk</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{auditStats.duplicates}</div>
                <div className="text-sm text-muted-foreground">Duplicates</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{auditStats.costVariances}</div>
                <div className="text-sm text-muted-foreground">Cost Issues</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{auditStats.timeAnomalies}</div>
                <div className="text-sm text-muted-foreground">Time Issues</div>
              </CardContent>
            </Card>
          </div>

          {/* Audit Results */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Results</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={selectedAuditType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAuditType("all")}
                >
                  All Claims
                </Button>
                <Button
                  variant={selectedAuditType === "flagged" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAuditType("flagged")}
                >
                  Flagged Only
                </Button>
                <Button
                  variant={selectedAuditType === "high_risk" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAuditType("high_risk")}
                >
                  High Risk
                </Button>
                <Button
                  variant={selectedAuditType === "duplicates" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAuditType("duplicates")}
                >
                  Duplicates
                </Button>
                <Button
                  variant={selectedAuditType === "cost_variance" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAuditType("cost_variance")}
                >
                  Cost Variance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-medium">{claim.uniqueClaimId}</TableCell>
                        <TableCell>{claim.beneficiaryName}</TableCell>
                        <TableCell>{claim.facilityName}</TableCell>
                        <TableCell>₦{claim.totalCostOfCare.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getRiskLevelColor(claim.riskScore)}>
                            {getRiskLevel(claim.riskScore)} ({claim.riskScore})
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {claim.auditFlags.slice(0, 3).map((flag, index) => (
                              <Badge
                                key={index}
                                className={`${getSeverityColor(flag.severity)} text-xs`}
                                title={flag.message}
                              >
                                {flag.type.replace('_', ' ')}
                              </Badge>
                            ))}
                            {claim.auditFlags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{claim.auditFlags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export type { AuditFlag, ClaimAuditData }
