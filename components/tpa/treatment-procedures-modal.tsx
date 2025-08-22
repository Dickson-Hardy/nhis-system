"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calculator, FileText, AlertTriangle, CheckCircle, Clock, Download } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface TreatmentProcedure {
  name: string
  cost: string
  description: string
}

interface Claim {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  hospitalNumber: string
  uniqueBeneficiaryId: string
  dateOfAdmission: string
  dateOfTreatment: string
  dateOfDischarge: string
  primaryDiagnosis: string
  treatmentProcedure: string
  treatmentProcedures?: TreatmentProcedure[]
  totalCostOfCare: string
  status: string
  batchId: number | null
  createdAt: string
  updatedAt: string
  batch?: {
    id: number
    batchNumber: string
    status: string
  }
  batchNumber?: string
  tpaName?: string
  rejectionReason?: string
  tpaRemarks?: string
  secondaryDiagnosis?: string
  // New cost category fields
  procedureCost?: number
  treatmentCost?: number
  medicationCost?: number
  otherCost?: number
}

interface TPATreatmentProceduresModalProps {
  claim: Claim | null
  isOpen: boolean
  onClose: () => void
  onApprove?: (claimId: number, approvedAmount: number) => void
  onReject?: (claimId: number, reason: string) => void
}

export function TPATreatmentProceduresModal({
  claim,
  isOpen,
  onClose,
  onApprove,
  onReject
}: TPATreatmentProceduresModalProps) {
  const [rejectionReason, setRejectionReason] = useState("")
  const [approvedAmount, setApprovedAmount] = useState("")

  if (!claim) return null

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(numAmount)
  }

  const totalProceduresCost = (claim.procedureCost || 0) + (claim.treatmentCost || 0) + (claim.medicationCost || 0) + (claim.otherCost || 0)

  const handleApprove = () => {
    if (onApprove) {
      const amount = approvedAmount ? parseFloat(approvedAmount) : parseFloat(claim.totalCostOfCare)
      onApprove(claim.id, amount)
      toast({
        title: "Claim Approved",
        description: `Claim ${claim.uniqueClaimId} has been approved for ₦${amount.toLocaleString()}`,
      })
    }
  }

  const handleReject = () => {
    if (onReject && rejectionReason.trim()) {
      onReject(claim.id, rejectionReason)
      setRejectionReason("")
      toast({
        title: "Claim Rejected",
        description: `Claim ${claim.uniqueClaimId} has been rejected. Reason: ${rejectionReason}`,
        variant: "destructive"
      })
    } else if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection before proceeding.",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = () => {
    switch (claim.status) {
      case 'verified_paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            TPA Audit - Treatment Procedures Analysis
          </DialogTitle>
          <DialogDescription>
            Comprehensive cost breakdown and audit information for claim {claim.uniqueClaimId}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Claim Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">Claim ID:</span>
                    <span className="font-mono text-sm">{claim.uniqueClaimId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon()}
                      <Badge variant={
                        claim.status === 'verified_paid' ? 'default' :
                        claim.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {claim.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Batch:</span>
                    <span className="text-sm">{claim.batch?.batchNumber || claim.batchNumber || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">Name:</span>
                    <span className="text-sm font-medium">{claim.beneficiaryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Hospital No:</span>
                    <span className="text-sm">{claim.hospitalNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Admission:</span>
                    <span className="text-sm">{claim.dateOfAdmission}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Discharge:</span>
                    <span className="text-sm">{claim.dateOfDischarge}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Summary */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Cost Summary</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Procedure Costs:</span>
                      <span className="font-medium">{formatCurrency(claim.procedureCost || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Treatment Costs:</span>
                      <span className="font-medium">{formatCurrency(claim.treatmentCost || 0)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700">Medication Costs:</span>
                      <span className="font-medium">{formatCurrency(claim.medicationCost || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-700">Other Costs:</span>
                      <span className="font-medium">{formatCurrency(claim.otherCost || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Total Treatment Costs:</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(totalProceduresCost)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Sum of all four cost categories
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Total Cost of Care:</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(claim.totalCostOfCare)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Includes all costs: treatment + investigation + other services
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Diagnosis Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Primary Diagnosis</Label>
                  <div className="mt-1 space-y-1">
                    {claim.primaryDiagnosis.split('; ').map((diagnosis, index) => (
                      <div key={index} className="text-sm">
                        • {diagnosis.trim()}
                      </div>
                    ))}
                  </div>
                </div>
                {claim.secondaryDiagnosis && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Secondary Diagnosis</Label>
                    <p className="mt-1 text-sm">{claim.secondaryDiagnosis}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Treatment Procedures Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Treatment Cost Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Procedure Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Medical Procedures:</span>
                      <span className="font-semibold text-blue-800">{formatCurrency(claim.procedureCost || 0)}</span>
                    </div>
                    <div className="text-xs text-blue-600">
                      Surgeries, interventions, and medical procedures
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-green-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Treatment Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Treatment Plans:</span>
                      <span className="font-semibold text-green-800">{formatCurrency(claim.treatmentCost || 0)}</span>
                    </div>
                    <div className="text-xs text-green-600">
                      Treatment plans, therapies, and care protocols
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-purple-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Medication Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-purple-700">Drugs & Prescriptions:</span>
                      <span className="font-semibold text-purple-800">{formatCurrency(claim.medicationCost || 0)}</span>
                    </div>
                    <div className="text-xs text-purple-600">
                      Medications, drugs, and prescription costs
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 bg-orange-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Other Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-orange-700">Additional Services:</span>
                      <span className="font-semibold text-orange-800">{formatCurrency(claim.otherCost || 0)}</span>
                    </div>
                    <div className="text-xs text-orange-600">
                      Lab tests, equipment, and miscellaneous services
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Legacy Treatment Procedures (if available) */}
            {claim.treatmentProcedures && claim.treatmentProcedures.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-muted-foreground">Legacy Treatment Procedures</h4>
                {claim.treatmentProcedures.map((procedure, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Procedure Name</Label>
                        <p className="font-medium">{procedure.name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Cost</Label>
                        <p className="font-medium text-primary">{formatCurrency(procedure.cost)}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Description</Label>
                        <p className="font-medium">{procedure.description || 'No description provided'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TPA Decision Section */}
          {claim.status === 'awaiting_verification' && (
            <Card>
              <CardHeader>
                <CardTitle>TPA Decision</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="approvedAmount">Approved Amount (₦)</Label>
                      <input
                        id="approvedAmount"
                        type="number"
                        step="0.01"
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        placeholder={claim.totalCostOfCare}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <Button 
                      onClick={handleApprove}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Claim
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="rejectionReason">Rejection Reason</Label>
                      <textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        className="w-full p-2 border rounded-md h-20"
                      />
                    </div>
                    <Button 
                      onClick={handleReject}
                      variant="destructive"
                      className="w-full"
                      disabled={!rejectionReason.trim()}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reject Claim
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created Date:</span>
                  <p className="font-medium">{claim.createdAt ? format(new Date(claim.createdAt), 'PPP') : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <p className="font-medium">{claim.updatedAt ? format(new Date(claim.updatedAt), 'PPP') : 'N/A'}</p>
                </div>
                {claim.rejectionReason && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Rejection Reason:</span>
                    <p className="font-medium text-red-600">{claim.rejectionReason}</p>
                  </div>
                )}
                {claim.tpaRemarks && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">TPA Remarks:</span>
                    <p className="font-medium">{claim.tpaRemarks}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
