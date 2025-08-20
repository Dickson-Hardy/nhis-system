"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Edit, 
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

export default function ClaimViewPage() {
  const params = useParams()
  const router = useRouter()
  const claimId = params.id as string
  
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
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
                    onClick={() => router.push(`/tpa/claims/${claim.id}/edit`)}
                    className="bg-white text-[#104D7F] hover:bg-gray-100"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Claim
                  </Button>
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  Claim: {claim.uniqueClaimId}
                </h1>
                <p className="text-lg text-blue-100">
                  Batch: {claim.batchNumber} • Beneficiary: {claim.beneficiaryName}
                </p>
              </div>
              <div className="text-right">
                <Badge className={`px-3 py-1 ${getStatusColor(claim.status)} mb-2`}>
                  {formatStatus(claim.status)}
                </Badge>
                <div className="text-xl font-semibold">
                  ₦{formatCurrency(claim.totalCostOfCare)}
                </div>
                <div className="text-blue-200">Total Cost</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Beneficiary Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Beneficiary Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.beneficiaryName || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Beneficiary ID</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.uniqueBeneficiaryId || 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Age</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {claim.age || 'N/A'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {formatDate(claim.dateOfBirth)}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.phoneNumber || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">NIN</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.nin || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Address</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[80px]">
                  {claim.address || 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Stethoscope className="h-5 w-5 mr-2" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Hospital Number</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.hospitalNumber || 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Admission Date</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {formatDate(claim.dateOfAdmission)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Discharge Date</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {formatDate(claim.dateOfDischarge)}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Treatment Date</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {formatDate(claim.dateOfTreatment)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Primary Diagnosis</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[80px]">
                  {claim.primaryDiagnosis || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Secondary Diagnosis</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[60px]">
                  {claim.secondaryDiagnosis || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Treatment Procedure</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border min-h-[80px]">
                  {claim.treatmentProcedure || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Quantity</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.quantity || 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown & Status */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Cost Breakdown & Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Cost of Investigation</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  ₦{formatCurrency(claim.costOfInvestigation || '0')}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Cost of Procedure</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  ₦{formatCurrency(claim.costOfProcedure || '0')}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Cost of Medication</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  ₦{formatCurrency(claim.costOfMedication || '0')}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Cost of Other Services</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  ₦{formatCurrency(claim.costOfOtherServices || '0')}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-gray-500">Total Cost of Care</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border font-semibold text-lg">
                  ₦{formatCurrency(claim.totalCostOfCare)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Approved Cost of Care</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  ₦{formatCurrency(claim.approvedCostOfCare || '0')}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <div className="mt-1">
                  <Badge className={getStatusColor(claim.status)}>
                    {formatStatus(claim.status)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Decision</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.decision ? formatStatus(claim.decision) : 'N/A'}
                </div>
              </div>

              {claim.reasonForRejection && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Reason for Rejection</Label>
                  <div className="mt-1 p-2 bg-red-50 rounded border border-red-200 min-h-[80px]">
                    {claim.reasonForRejection}
                  </div>
                </div>
              )}

              {claim.tpaRemarks && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">TPA Remarks</Label>
                  <div className="mt-1 p-2 bg-blue-50 rounded border border-blue-200 min-h-[80px]">
                    {claim.tpaRemarks}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submission Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Submission & Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Submission Date</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {formatDate(claim.dateOfClaimSubmission)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Month of Submission</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {claim.monthOfSubmission || 'N/A'}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Payment Date</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {formatDate(claim.dateOfClaimsPayment)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facility Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Facility Information
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
      </div>
    </div>
  )
}