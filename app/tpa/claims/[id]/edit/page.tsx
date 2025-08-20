"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  User, 
  FileText, 
  Calculator, 
  Building,
  Calendar,
  Phone,
  MapPin,
  Stethoscope,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Claim {
  id: number
  serialNumber?: string
  uniqueBeneficiaryId: string
  uniqueClaimId: string
  batchNumber: string
  hospitalNumber?: string
  dateOfAdmission: string
  beneficiaryName: string
  dateOfBirth?: string
  age?: number
  address?: string
  phoneNumber?: string
  nin?: string
  dateOfTreatment?: string
  dateOfDischarge?: string
  primaryDiagnosis: string
  secondaryDiagnosis?: string
  treatmentProcedure?: string
  quantity?: number
  cost?: string
  dateOfClaimSubmission?: string
  monthOfSubmission?: string
  costOfInvestigation?: string
  costOfProcedure?: string
  costOfMedication?: string
  costOfOtherServices?: string
  totalCostOfCare: string
  approvedCostOfCare?: string
  decision?: string
  reasonForRejection?: string
  dateOfClaimsPayment?: string
  tpaRemarks?: string
  status: string
  createdAt: string
  updatedAt: string
  facility: {
    id: number
    name: string
    code: string
    state: string
    address?: string
    contactEmail?: string
    contactPhone?: string
  }
  tpa: {
    id: number
    name: string
    code: string
    contactEmail?: string
    contactPhone?: string
  }
}

export default function ClaimEditPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const claimId = params.id as string
  
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Claim>>({})

  useEffect(() => {
    fetchClaim()
  }, [claimId])

  const fetchClaim = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/claims/${claimId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setClaim(data.claim)
        setFormData(data.claim)
      } else {
        setError('Failed to fetch claim details')
      }
    } catch (err) {
      console.error('Error fetching claim:', err)
      setError('Error loading claim')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Prepare the data for submission
      const updateData = {
        ...formData,
        // Auto-generate month of submission from submission date
        monthOfSubmission: formData.dateOfClaimSubmission ? 
          new Date(formData.dateOfClaimSubmission).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
          formData.monthOfSubmission,
        // Auto-update status based on decision
        status: formData.decision === 'approved' ? 'verified' :
                formData.decision === 'rejected' ? 'not_verified' :
                formData.decision === 'partially_approved' ? 'verified' :
                formData.decision === 'pending' ? 'awaiting_verification' :
                formData.status || claim?.status
      }

      const response = await fetch(`/api/claims/${claimId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Claim updated successfully",
        })
        // Go back to the batch or claims list
        router.back()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update claim')
      }
    } catch (error) {
      console.error('Error updating claim:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update claim",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) ? '0' : num.toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "awaiting_verification":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "not_verified":
        return "bg-red-100 text-red-800 border-red-300"
      case "verified":
        return "bg-green-100 text-green-800 border-green-300"
      case "verified_awaiting_payment":
        return "bg-teal-100 text-teal-800 border-teal-300"
      case "verified_paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#104D7F]" />
          <p className="text-gray-600">Loading claim details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.back()} className="bg-[#104D7F] hover:bg-[#0d3f6b] text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!claim) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[100vw] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-[#104D7F] to-[#0d3f6b] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="text-white hover:bg-white/20"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-white text-[#104D7F] hover:bg-gray-100"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  TPA Review: {claim.uniqueClaimId}
                </h1>
                <p className="text-lg text-blue-100">
                  Batch: {claim.batchNumber} • Beneficiary: {claim.beneficiaryName} • Facility: {claim.facility.name}
                </p>
              </div>
              <div className="text-right">
                <Badge className={`px-3 py-1 ${getStatusColor(claim.status)} mb-2`}>
                  {formatStatus(claim.status)}
                </Badge>
                <div className="text-xl font-semibold">
                  ₦{formatCurrency(formData.totalCostOfCare || claim.totalCostOfCare)}
                </div>
                <div className="text-blue-200">Total Cost</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Beneficiary Information - READ ONLY */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Beneficiary Information
                <Badge variant="secondary" className="ml-2 text-xs">Read Only</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim?.beneficiaryName || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Beneficiary ID</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim?.uniqueBeneficiaryId || 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Age</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {claim?.age || 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {claim?.dateOfBirth ? new Date(claim.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim?.phoneNumber || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">NIN</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim?.nin || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Address</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[80px]">
                  {claim?.address || 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information - READ ONLY */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Stethoscope className="h-5 w-5 mr-2" />
                Medical Information
                <Badge variant="secondary" className="ml-2 text-xs">Read Only</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Hospital Number</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim?.hospitalNumber || 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Admission Date</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {claim?.dateOfAdmission ? new Date(claim.dateOfAdmission).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Discharge Date</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {claim?.dateOfDischarge ? new Date(claim.dateOfDischarge).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Treatment Date</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim?.dateOfTreatment ? new Date(claim.dateOfTreatment).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Primary Diagnosis</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[80px]">
                  {claim?.primaryDiagnosis || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Secondary Diagnosis</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[60px]">
                  {claim?.secondaryDiagnosis || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Treatment Procedure</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[80px]">
                  {claim?.treatmentProcedure || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim?.quantity || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Total Cost of Care (Facility)</Label>
                <div className="mt-1 p-2 bg-blue-50 rounded border border-blue-200 font-semibold text-lg">
                  ₦{formatCurrency(claim?.totalCostOfCare || '0')}
                </div>
                <p className="text-xs text-gray-500 mt-1">Amount claimed by facility</p>
              </div>
            </CardContent>
          </Card>

          {/* TPA Cost Review & Decision - EDITABLE */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                TPA Cost Review & Decision
                <Badge variant="default" className="ml-2 text-xs bg-green-600">Editable</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dateOfClaimSubmission">Date of Claim Submission</Label>
                <Input
                  id="dateOfClaimSubmission"
                  type="date"
                  value={formData.dateOfClaimSubmission ? new Date(formData.dateOfClaimSubmission).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('dateOfClaimSubmission', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Month of Submission</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {formData.dateOfClaimSubmission ? 
                    new Date(formData.dateOfClaimSubmission).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
                    'Auto-generated from submission date'
                  }
                </div>
                <p className="text-xs text-gray-500 mt-1">Automatically generated from submission date</p>
              </div>

              <Separator />
              <div className="text-sm font-semibold text-gray-700 mb-2">Cost Breakdown Review</div>

              <div>
                <Label htmlFor="costOfInvestigation">Cost of Investigation</Label>
                <Input
                  id="costOfInvestigation"
                  type="number"
                  step="0.01"
                  value={formData.costOfInvestigation || ''}
                  onChange={(e) => handleInputChange('costOfInvestigation', e.target.value)}
                  className="mt-1"
                  placeholder="Enter investigation costs"
                />
              </div>

              <div>
                <Label htmlFor="costOfProcedure">Cost of Procedure</Label>
                <Input
                  id="costOfProcedure"
                  type="number"
                  step="0.01"
                  value={formData.costOfProcedure || ''}
                  onChange={(e) => handleInputChange('costOfProcedure', e.target.value)}
                  className="mt-1"
                  placeholder="Enter procedure costs"
                />
              </div>

              <div>
                <Label htmlFor="costOfMedication">Cost of Medication</Label>
                <Input
                  id="costOfMedication"
                  type="number"
                  step="0.01"
                  value={formData.costOfMedication || ''}
                  onChange={(e) => handleInputChange('costOfMedication', e.target.value)}
                  className="mt-1"
                  placeholder="Enter medication costs"
                />
              </div>

              <div>
                <Label htmlFor="costOfOtherServices">Cost of Other Services (e.g., bed)</Label>
                <Input
                  id="costOfOtherServices"
                  type="number"
                  step="0.01"
                  value={formData.costOfOtherServices || ''}
                  onChange={(e) => handleInputChange('costOfOtherServices', e.target.value)}
                  className="mt-1"
                  placeholder="Enter other service costs"
                />
              </div>

              <Separator />

              <div>
                <Label htmlFor="approvedCostOfCare">Approved Cost of Care</Label>
                <Input
                  id="approvedCostOfCare"
                  type="number"
                  step="0.01"
                  value={formData.approvedCostOfCare || ''}
                  onChange={(e) => handleInputChange('approvedCostOfCare', e.target.value)}
                  className="mt-1 font-semibold"
                  placeholder="Enter approved amount"
                />
                
                {/* Cost Variance Indicator */}
                {formData.approvedCostOfCare && claim?.totalCostOfCare && (
                  <div className="mt-2">
                    {(() => {
                      const approved = parseFloat(formData.approvedCostOfCare);
                      const claimed = parseFloat(claim.totalCostOfCare);
                      const variance = approved - claimed;
                      const isVariance = Math.abs(variance) > 0.01;
                      
                      return isVariance ? (
                        <div className={`p-2 rounded border ${variance < 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                            <span className="text-sm font-medium">
                              Variance: {variance < 0 ? '-' : '+'}₦{Math.abs(variance).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {variance < 0 ? 'Approved amount is less than claimed amount' : 'Approved amount is more than claimed amount'}
                          </p>
                        </div>
                      ) : (
                        <div className="p-2 rounded border bg-green-50 border-green-200">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            <span className="text-sm font-medium text-green-700">No variance</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label htmlFor="decision">Decision</Label>
                <Select value={formData.decision || ''} onValueChange={(value) => handleInputChange('decision', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="requires_review">Requires Review</SelectItem>
                    <SelectItem value="partially_approved">Partially Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.decision === 'rejected' || formData.decision === 'partially_approved') && (
                <div>
                  <Label htmlFor="reasonForRejection">Reason for Rejection/Partial Approval</Label>
                  <Textarea
                    id="reasonForRejection"
                    value={formData.reasonForRejection || ''}
                    onChange={(e) => handleInputChange('reasonForRejection', e.target.value)}
                    className="mt-1"
                    rows={3}
                    placeholder="Explain why the claim was rejected or partially approved..."
                  />
                </div>
              )}

              <div>
                <Label htmlFor="dateOfClaimsPayment">Date of Claims Payment</Label>
                <Input
                  id="dateOfClaimsPayment"
                  type="date"
                  value={formData.dateOfClaimsPayment ? new Date(formData.dateOfClaimsPayment).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('dateOfClaimsPayment', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tpaRemarks">TPA Remarks</Label>
                <Textarea
                  id="tpaRemarks"
                  value={formData.tpaRemarks || ''}
                  onChange={(e) => handleInputChange('tpaRemarks', e.target.value)}
                  className="mt-1"
                  rows={4}
                  placeholder="Add your remarks about this claim..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Facility Information (Read-only) */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Facility Information
              <Badge variant="secondary" className="ml-2 text-xs">Read Only</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Facility Name</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.facility.name}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Facility Code</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.facility.code}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">State</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.facility.state}
                </div>
              </div>
              {claim.facility.address && (
                <div className="md:col-span-2 lg:col-span-3">
                  <Label className="text-sm font-medium text-gray-500">Address</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {claim.facility.address}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#104D7F] hover:bg-[#0d3f6b] text-white"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}