"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Edit, 
  FileText,
  Building,
  MessageSquare,
  Package,
  ArrowLeft,
  RefreshCw,
  Plus,
  Eye,
  MoreHorizontal,
  Upload,
  FileCheck,
  Phone,
  Calendar,
  Loader2,
  Send
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Claim {
  id: number
  uniqueClaimId: string
  uniqueBeneficiaryId: string
  beneficiaryName: string
  dateOfAdmission: string
  primaryDiagnosis: string
  totalCostOfCare: string
  status: string
  facility: {
    name: string
    state: string
    code: string
  }
  phoneNumber?: string
  age?: number
  dateOfDischarge?: string
  treatmentProcedure?: string
  hospitalNumber?: string
}

interface BatchDetails {
  id: number
  batchNumber: string
  status: string
  totalClaims: number
  totalAmount: string
  createdAt: string
  submittedAt?: string
  tpa: {
    name: string
    code: string
  }
}

export default function BatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string
  
  const [batch, setBatch] = useState<BatchDetails | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBatchDetails()
    fetchBatchClaims()
  }, [batchId])

  const fetchBatchDetails = async () => {
    try {
      const response = await fetch(`/api/batches/${batchId}`, {
        credentials: 'include'
      })
      
      if (response.status === 404) {
        setError(`Batch with ID ${batchId} not found. This batch may have been deleted or the ID is incorrect.`)
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setBatch(data.batch)
      } else {
        setError('Failed to fetch batch details')
      }
    } catch (err) {
      console.error('Error fetching batch details:', err)
      setError('Error loading batch details')
    }
  }

  const fetchBatchClaims = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/claims?batchId=${batchId}&limit=1000`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
      } else {
        setError('Failed to fetch claims')
      }
    } catch (err) {
      console.error('Error fetching claims:', err)
      setError('Error loading claims')
    } finally {
      setLoading(false)
    }
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

  const getBatchStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "submitted":
      case "submitted_awaiting_verification":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "under_review":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "verified":
        return "bg-green-100 text-green-800 border-green-300"
      case "verified_awaiting_payment":
        return "bg-teal-100 text-teal-800 border-teal-300"
      case "verified_paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const handleViewClaim = (claim: Claim) => {
    router.push(`/tpa/claims/${claim.id}`)
  }

  const handleEditClaim = (claim: Claim) => {
    router.push(`/tpa/claims/${claim.id}/edit`)
  }

  const handleRefresh = () => {
    fetchBatchDetails()
    fetchBatchClaims()
  }

  const handleSubmitBatch = async () => {
    if (!batch || batch.status !== 'draft') {
      return
    }

    if (claims.length === 0) {
      alert('Cannot submit empty batch. Please add claims first.')
      return
    }

    if (!confirm(`Are you sure you want to submit this batch with ${claims.length} claims? Once submitted, you cannot add more claims.`)) {
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/batches/${batchId}/submit`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        alert('Batch submitted successfully!')
        fetchBatchDetails() // Refresh to get updated status
      } else {
        const data = await response.json()
        alert(`Failed to submit batch: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error submitting batch:', err)
      alert('Error submitting batch. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.uniqueClaimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.uniqueBeneficiaryId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading && !batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#104D7F]" />
          <p className="text-gray-600">Loading batch details...</p>
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
          <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-semibold mb-2">Available Options:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Go back to the batches list to see all available batches</li>
              <li>Check the URL for any typos in the batch ID</li>
              <li>The batch may have been deleted or moved</li>
            </ul>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => router.push('/tpa/batches')} className="bg-[#104D7F] hover:bg-[#0d3f6b] text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Batches
            </Button>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
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
                    onClick={() => router.push('/tpa/batches')}
                    className="text-white hover:bg-white/20"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Batches
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleRefresh}
                    className="text-white hover:bg-white/20"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  {batch?.status === 'draft' && (
                    <Button
                      onClick={handleSubmitBatch}
                      disabled={submitting || (claims.length === 0)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Batch
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-2">
                  Batch: {batch?.batchNumber}
                </h1>
                <p className="text-lg text-blue-100">
                  TPA: {batch?.tpa?.name} • Created: {batch?.createdAt ? new Date(batch.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{batch?.totalClaims || 0}</div>
                <div className="text-blue-200">Total Claims</div>
                <div className="text-xl font-semibold mt-2">
                  ₦{parseFloat(batch?.totalAmount || '0').toLocaleString()}
                </div>
                <div className="text-blue-200">Total Amount</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center space-x-4">
              <Badge className={`px-3 py-1 ${getBatchStatusColor(batch?.status || '')}`}>
                {formatStatus(batch?.status || '')}
              </Badge>
              {batch?.submittedAt && (
                <span className="text-blue-200">
                  Submitted: {new Date(batch.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by claim ID, beneficiary name, or beneficiary ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="awaiting_verification">Awaiting Verification</SelectItem>
                    <SelectItem value="not_verified">Not Verified</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="verified_awaiting_payment">Awaiting Payment</SelectItem>
                    <SelectItem value="verified_paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Add Claims
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Claims in this Batch ({filteredClaims.length})</span>
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClaims.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchTerm || statusFilter !== "all" ? "No matching claims" : "No claims in this batch"}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "Claims will appear here once they are added to this batch"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admission Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClaims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell>
                          <div className="font-medium">{claim.uniqueClaimId}</div>
                          <div className="text-sm text-gray-500">{claim.uniqueBeneficiaryId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{claim.beneficiaryName}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            {claim.age && <span>Age: {claim.age}</span>}
                            {claim.phoneNumber && (
                              <>
                                {claim.age && <span className="mx-1">•</span>}
                                <Phone className="h-3 w-3 mr-1" />
                                {claim.phoneNumber}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{claim.facility?.name}</div>
                          <div className="text-sm text-gray-500">
                            {claim.facility?.state} • {claim.facility?.code}
                          </div>
                          {claim.hospitalNumber && (
                            <div className="text-xs text-gray-400">
                              Hospital #: {claim.hospitalNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium truncate" title={claim.primaryDiagnosis}>
                              {claim.primaryDiagnosis}
                            </div>
                            {claim.treatmentProcedure && (
                              <div className="text-sm text-gray-500 truncate" title={claim.treatmentProcedure}>
                                {claim.treatmentProcedure}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-green-600">
                            ₦{parseFloat(claim.totalCostOfCare || '0').toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(claim.status)}>
                            {formatStatus(claim.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(claim.dateOfAdmission).toLocaleDateString()}
                          </div>
                          {claim.dateOfDischarge && (
                            <div className="text-xs text-gray-500">
                              Discharged: {new Date(claim.dateOfDischarge).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewClaim(claim)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClaim(claim)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Claim
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
