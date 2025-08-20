"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  MapPin, 
  Phone, 
  Calendar, 
  DollarSign, 
  FileText, 
  Hospital,
  Edit3,
  Save,
  X,
  AlertCircle
} from "lucide-react"

interface Claim {
  id: number
  uniqueClaimId: string
  uniqueBeneficiaryId: string
  batchNumber: string
  hospitalNumber: string
  beneficiaryName: string
  dateOfBirth: string
  age: number
  address: string
  phoneNumber: string
  nin: string
  dateOfAdmission: string
  dateOfTreatment: string
  dateOfDischarge: string
  primaryDiagnosis: string
  secondaryDiagnosis: string
  treatmentProcedure: string
  quantity: number
  cost: number
  totalCostOfCare: number
  approvedCostOfCare: number
  costOfInvestigation: number
  costOfProcedure: number
  costOfMedication: number
  costOfOtherServices: number
  dateOfClaimSubmission: string
  monthOfSubmission: string
  decision: string
  status: string
  reasonForRejection: string
  dateOfClaimsPayment: string
  tpaRemarks: string
  createdAt: string
  facility: {
    id: number
    name: string
    code: string
    state: string
  }
}

interface ClaimDetailModalProps {
  claim: Claim | null
  isOpen: boolean
  onClose: () => void
  onSave?: (updatedClaim: Partial<Claim>) => void
  mode?: 'view' | 'edit'
}

export function ClaimDetailModal({ claim, isOpen, onClose, onSave, mode = 'view' }: ClaimDetailModalProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit')
  const [editedClaim, setEditedClaim] = useState<Partial<Claim>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!claim) return null

  const handleEdit = () => {
    setIsEditing(true)
    setEditedClaim({ ...claim })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedClaim({})
    setError(null)
  }

  const handleSave = async () => {
    if (!onSave) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      await onSave(editedClaim)
      setIsEditing(false)
      setEditedClaim({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof Claim, value: any) => {
    setEditedClaim(prev => ({ ...prev, [field]: value }))
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '₦0.00'
    return `₦${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'submitted': { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      'awaiting_verification': { color: 'bg-yellow-100 text-yellow-800', label: 'Awaiting Verification' },
      'verified': { color: 'bg-green-100 text-green-800', label: 'Verified' },
      'not_verified': { color: 'bg-red-100 text-red-800', label: 'Not Verified' },
      'verified_awaiting_payment': { color: 'bg-purple-100 text-purple-800', label: 'Awaiting Payment' },
      'verified_paid': { color: 'bg-emerald-100 text-emerald-800', label: 'Paid' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', label: status }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? 'Edit Claim' : 'Claim Details'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Claim ID: {claim.uniqueClaimId} • Batch: {claim.batchNumber}
              </p>
            </div>
            <div className="flex gap-2">
              {!isEditing && onSave && (
                <Button onClick={handleEdit} size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button onClick={handleSave} disabled={isSaving} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] px-1">
          <div className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Status and Key Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Claim Status & Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    {isEditing ? (
                      <Select 
                        value={editedClaim.status || claim.status} 
                        onValueChange={(value) => updateField('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="awaiting_verification">Awaiting Verification</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="not_verified">Not Verified</SelectItem>
                          <SelectItem value="verified_awaiting_payment">Awaiting Payment</SelectItem>
                          <SelectItem value="verified_paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1">{getStatusBadge(claim.status)}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Decision</Label>
                    {isEditing ? (
                      <Select 
                        value={editedClaim.decision || claim.decision} 
                        onValueChange={(value) => updateField('decision', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm mt-1">{claim.decision || 'Pending'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Cost</Label>
                    <p className="text-lg font-semibold text-green-600 mt-1">
                      {formatCurrency(claim.totalCostOfCare)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Approved Cost</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedClaim.approvedCostOfCare || claim.approvedCostOfCare || ''}
                        onChange={(e) => updateField('approvedCostOfCare', parseFloat(e.target.value) || null)}
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-blue-600 mt-1">
                        {formatCurrency(claim.approvedCostOfCare)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Beneficiary Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Beneficiary Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedClaim.beneficiaryName || claim.beneficiaryName}
                        onChange={(e) => updateField('beneficiaryName', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm mt-1">{claim.beneficiaryName}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Age</Label>
                    <p className="text-sm mt-1">{claim.age} years</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedClaim.phoneNumber || claim.phoneNumber}
                        onChange={(e) => updateField('phoneNumber', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {claim.phoneNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">NIN</Label>
                    <p className="text-sm mt-1">{claim.nin}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Address</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedClaim.address || claim.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm mt-1 flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-1 flex-shrink-0" />
                        {claim.address}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hospital className="h-5 w-5" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Primary Diagnosis</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedClaim.primaryDiagnosis || claim.primaryDiagnosis}
                        onChange={(e) => updateField('primaryDiagnosis', e.target.value)}
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm mt-1">{claim.primaryDiagnosis}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Secondary Diagnosis</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedClaim.secondaryDiagnosis || claim.secondaryDiagnosis || ''}
                        onChange={(e) => updateField('secondaryDiagnosis', e.target.value)}
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm mt-1">{claim.secondaryDiagnosis || 'None'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Treatment/Procedure</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedClaim.treatmentProcedure || claim.treatmentProcedure}
                        onChange={(e) => updateField('treatmentProcedure', e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm mt-1">{claim.treatmentProcedure}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Admission Date</Label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(claim.dateOfAdmission)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Treatment Date</Label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(claim.dateOfTreatment)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Discharge Date</Label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(claim.dateOfDischarge)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Investigation</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedClaim.costOfInvestigation || claim.costOfInvestigation || ''}
                        onChange={(e) => updateField('costOfInvestigation', parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <p className="text-sm mt-1">{formatCurrency(claim.costOfInvestigation)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Procedure</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedClaim.costOfProcedure || claim.costOfProcedure || ''}
                        onChange={(e) => updateField('costOfProcedure', parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <p className="text-sm mt-1">{formatCurrency(claim.costOfProcedure)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Medication</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedClaim.costOfMedication || claim.costOfMedication || ''}
                        onChange={(e) => updateField('costOfMedication', parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <p className="text-sm mt-1">{formatCurrency(claim.costOfMedication)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Other Services</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedClaim.costOfOtherServices || claim.costOfOtherServices || ''}
                        onChange={(e) => updateField('costOfOtherServices', parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <p className="text-sm mt-1">{formatCurrency(claim.costOfOtherServices)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TPA Review */}
            <Card>
              <CardHeader>
                <CardTitle>TPA Review & Comments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">TPA Remarks</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedClaim.tpaRemarks || claim.tpaRemarks || ''}
                      onChange={(e) => updateField('tpaRemarks', e.target.value)}
                      rows={3}
                      placeholder="Add your remarks or notes about this claim..."
                    />
                  ) : (
                    <p className="text-sm mt-1">{claim.tpaRemarks || 'No remarks'}</p>
                  )}
                </div>
                
                {claim.reasonForRejection && (
                  <div>
                    <Label className="text-sm font-medium">Reason for Rejection</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedClaim.reasonForRejection || claim.reasonForRejection || ''}
                        onChange={(e) => updateField('reasonForRejection', e.target.value)}
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm mt-1 text-red-600">{claim.reasonForRejection}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Facility Information */}
            <Card>
              <CardHeader>
                <CardTitle>Facility Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Facility Name</Label>
                    <p className="text-sm mt-1">{claim.facility.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Facility Code</Label>
                    <p className="text-sm mt-1">{claim.facility.code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Hospital Number</Label>
                    <p className="text-sm mt-1">{claim.hospitalNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}