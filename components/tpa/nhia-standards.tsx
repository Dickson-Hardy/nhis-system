"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Calculator } from "lucide-react"

// NHIA Standard Cost Database based on common procedures
const NHIA_STANDARDS = {
  "Delivery": {
    investigation: 15000,
    procedure: 45000,
    medication: 25000,
    otherServices: 15000,
    total: 100000,
    description: "Normal delivery procedure"
  },
  "Emergency CS": {
    investigation: 25000,
    procedure: 120000,
    medication: 35000,
    otherServices: 20000,
    total: 200000,
    description: "Emergency Cesarean Section"
  },
  "EMCS": {
    investigation: 25000,
    procedure: 120000,
    medication: 35000,
    otherServices: 20000,
    total: 200000,
    description: "Emergency Cesarean Section"
  },
  "Caesarean Section": {
    investigation: 30000,
    procedure: 150000,
    medication: 40000,
    otherServices: 30000,
    total: 250000,
    description: "Planned Cesarean Section"
  },
  "CONSULTATION": {
    investigation: 5000,
    procedure: 15000,
    medication: 10000,
    otherServices: 5000,
    total: 35000,
    description: "Medical consultation and examination"
  },
  // Default for unspecified procedures
  "DEFAULT": {
    investigation: 20000,
    procedure: 50000,
    medication: 25000,
    otherServices: 15000,
    total: 110000,
    description: "Standard medical procedure"
  }
}

interface NHIAStandardsProps {
  actualCosts: {
    investigation: number
    procedure: number
    medication: number
    otherServices: number
    total: number
  }
  treatmentProcedure: string
  primaryDiagnosis: string
}

export function NHIAStandardsComparison({ actualCosts, treatmentProcedure, primaryDiagnosis }: NHIAStandardsProps) {
  // Determine the appropriate NHIA standard based on procedure/diagnosis
  const getApplicableStandard = () => {
    const procedure = treatmentProcedure.toUpperCase()
    const diagnosis = primaryDiagnosis.toUpperCase()
    
    // Check for exact matches first
    for (const [key, standard] of Object.entries(NHIA_STANDARDS)) {
      if (key === "DEFAULT") continue
      if (procedure.includes(key) || diagnosis.includes(key)) {
        return { key, ...standard }
      }
    }
    
    // Check for partial matches
    if (procedure.includes("CS") || procedure.includes("CESAREAN") || procedure.includes("CAESAREAN")) {
      return { key: "Emergency CS", ...NHIA_STANDARDS["Emergency CS"] }
    }
    if (procedure.includes("DELIVERY") || diagnosis.includes("DELIVERY")) {
      return { key: "Delivery", ...NHIA_STANDARDS["Delivery"] }
    }
    if (procedure.includes("CONSULTATION") || procedure.includes("CONSULT")) {
      return { key: "CONSULTATION", ...NHIA_STANDARDS["CONSULTATION"] }
    }
    
    // Default fallback
    return { key: "DEFAULT", ...NHIA_STANDARDS["DEFAULT"] }
  }

  const standard = getApplicableStandard()

  // Calculate variances
  const calculateVariance = (actual: number, standard: number) => {
    const variance = actual - standard
    const percentage = standard > 0 ? (variance / standard) * 100 : 0
    return { variance, percentage }
  }

  const investigationVariance = calculateVariance(actualCosts.investigation, standard.investigation)
  const procedureVariance = calculateVariance(actualCosts.procedure, standard.procedure)
  const medicationVariance = calculateVariance(actualCosts.medication, standard.medication)
  const otherServicesVariance = calculateVariance(actualCosts.otherServices, standard.otherServices)
  const totalVariance = calculateVariance(actualCosts.total, standard.total)

  // Risk assessment
  const getRiskLevel = (percentage: number) => {
    if (percentage <= 10) return { level: "low", color: "green", label: "Within Range" }
    if (percentage <= 25) return { level: "medium", color: "yellow", label: "Requires Review" }
    return { level: "high", color: "red", label: "Above Standard" }
  }

  const getComplianceScore = () => {
    const scores = [
      investigationVariance.percentage <= 10 ? 25 : investigationVariance.percentage <= 25 ? 15 : 0,
      procedureVariance.percentage <= 10 ? 25 : procedureVariance.percentage <= 25 ? 15 : 0,
      medicationVariance.percentage <= 10 ? 25 : medicationVariance.percentage <= 25 ? 15 : 0,
      otherServicesVariance.percentage <= 10 ? 25 : otherServicesVariance.percentage <= 25 ? 15 : 0,
    ]
    return scores.reduce((sum, score) => sum + score, 0)
  }

  const complianceScore = getComplianceScore()

  return (
    <div className="space-y-6">
      {/* NHIA Standard Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            NHIA Standards Analysis
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Matched Standard: <strong>{standard.key}</strong> - {standard.description}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Compliance Score:</span>
              <Badge className={`${complianceScore >= 75 ? 'bg-green-100 text-green-800' : 
                                complianceScore >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}>
                {complianceScore}%
              </Badge>
            </div>
          </div>
          <Progress value={complianceScore} className="h-2" />
        </CardHeader>
      </Card>

      {/* Detailed Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Cost Comparison Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Investigation Costs */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Investigation Costs</span>
                <Badge className={`${getRiskLevel(investigationVariance.percentage).color === 'green' ? 'bg-green-100 text-green-800' :
                                  getRiskLevel(investigationVariance.percentage).color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'}`}>
                  {getRiskLevel(investigationVariance.percentage).label}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Actual: ₦{actualCosts.investigation.toLocaleString()}</span>
                <span>Standard: ₦{standard.investigation.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={investigationVariance.variance >= 0 ? 'text-red-600' : 'text-green-600'}>
                  Variance: {investigationVariance.variance >= 0 ? '+' : ''}₦{investigationVariance.variance.toLocaleString()}
                </span>
                <span className={investigationVariance.percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {investigationVariance.percentage >= 0 ? '+' : ''}{investigationVariance.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min((actualCosts.investigation / standard.investigation) * 100, 200)} 
                className="h-2"
              />
            </div>

            {/* Procedure Costs */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Procedure Costs</span>
                <Badge className={`${getRiskLevel(procedureVariance.percentage).color === 'green' ? 'bg-green-100 text-green-800' :
                                  getRiskLevel(procedureVariance.percentage).color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'}`}>
                  {getRiskLevel(procedureVariance.percentage).label}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Actual: ₦{actualCosts.procedure.toLocaleString()}</span>
                <span>Standard: ₦{standard.procedure.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={procedureVariance.variance >= 0 ? 'text-red-600' : 'text-green-600'}>
                  Variance: {procedureVariance.variance >= 0 ? '+' : ''}₦{procedureVariance.variance.toLocaleString()}
                </span>
                <span className={procedureVariance.percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {procedureVariance.percentage >= 0 ? '+' : ''}{procedureVariance.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min((actualCosts.procedure / standard.procedure) * 100, 200)} 
                className="h-2"
              />
            </div>

            {/* Medication Costs */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Medication Costs</span>
                <Badge className={`${getRiskLevel(medicationVariance.percentage).color === 'green' ? 'bg-green-100 text-green-800' :
                                  getRiskLevel(medicationVariance.percentage).color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'}`}>
                  {getRiskLevel(medicationVariance.percentage).label}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Actual: ₦{actualCosts.medication.toLocaleString()}</span>
                <span>Standard: ₦{standard.medication.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={medicationVariance.variance >= 0 ? 'text-red-600' : 'text-green-600'}>
                  Variance: {medicationVariance.variance >= 0 ? '+' : ''}₦{medicationVariance.variance.toLocaleString()}
                </span>
                <span className={medicationVariance.percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {medicationVariance.percentage >= 0 ? '+' : ''}{medicationVariance.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min((actualCosts.medication / standard.medication) * 100, 200)} 
                className="h-2"
              />
            </div>

            {/* Other Services */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Other Services</span>
                <Badge className={`${getRiskLevel(otherServicesVariance.percentage).color === 'green' ? 'bg-green-100 text-green-800' :
                                  getRiskLevel(otherServicesVariance.percentage).color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'}`}>
                  {getRiskLevel(otherServicesVariance.percentage).label}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Actual: ₦{actualCosts.otherServices.toLocaleString()}</span>
                <span>Standard: ₦{standard.otherServices.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={otherServicesVariance.variance >= 0 ? 'text-red-600' : 'text-green-600'}>
                  Variance: {otherServicesVariance.variance >= 0 ? '+' : ''}₦{otherServicesVariance.variance.toLocaleString()}
                </span>
                <span className={otherServicesVariance.percentage >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {otherServicesVariance.percentage >= 0 ? '+' : ''}{otherServicesVariance.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min((actualCosts.otherServices / standard.otherServices) * 100, 200)} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary and Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assessment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Total Cost Analysis</span>
                  <Badge className={`${totalVariance.percentage <= 10 ? 'bg-green-100 text-green-800' :
                                    totalVariance.percentage <= 25 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'}`}>
                    {totalVariance.percentage >= 0 ? '+' : ''}{totalVariance.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Claimed Total:</span>
                    <span className="font-medium">₦{actualCosts.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NHIA Standard:</span>
                    <span className="font-medium">₦{standard.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variance:</span>
                    <span className={`font-medium ${totalVariance.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {totalVariance.variance >= 0 ? '+' : ''}₦{totalVariance.variance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Flags */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Risk Assessment:</h4>
                {totalVariance.percentage > 25 && (
                  <Alert className="border-red-300 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>High Risk:</strong> Total cost exceeds NHIA standard by more than 25%. Manual review required.
                    </AlertDescription>
                  </Alert>
                )}
                
                {totalVariance.percentage > 10 && totalVariance.percentage <= 25 && (
                  <Alert className="border-yellow-300 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Medium Risk:</strong> Cost variance detected. Additional documentation may be required.
                    </AlertDescription>
                  </Alert>
                )}

                {totalVariance.percentage <= 10 && (
                  <Alert className="border-green-300 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Low Risk:</strong> Costs are within acceptable NHIA standards.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recommendations:</h4>
                <div className="text-sm space-y-1">
                  {procedureVariance.percentage > 25 && (
                    <div className="flex items-start gap-2">
                      <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Procedure costs require detailed justification</span>
                    </div>
                  )}
                  {investigationVariance.percentage > 25 && (
                    <div className="flex items-start gap-2">
                      <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Investigation costs need supporting documentation</span>
                    </div>
                  )}
                  {medicationVariance.percentage > 25 && (
                    <div className="flex items-start gap-2">
                      <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Medication costs require prescription review</span>
                    </div>
                  )}
                  {complianceScore >= 75 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Claim meets NHIA compliance standards</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Export the NHIA standards for use in other components
export { NHIA_STANDARDS }
