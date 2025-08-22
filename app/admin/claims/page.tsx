"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Loader2,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  AlertCircle
} from "lucide-react"
import { StatusWorkflow } from "@/components/tpa/status-workflow"

interface Claim {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  dateOfBirth: string | null
  age: number | null
  primaryDiagnosis: string | null
  secondaryDiagnosis: string | null
  treatmentProcedure: string | null
  totalCostOfCare: string | null
  approvedCostOfCare: string | null
  status: string
  decision: string | null
  reasonForRejection: string | null
  dateOfAdmission: string | null
  dateOfDischarge: string | null
  dateOfClaimSubmission: string | null
  dateOfClaimsPayment: string | null
  batchNumber: string | null
  tpaRemarks: string | null
  createdAt: string
  tpa: {
    id: number
    name: string
    code: string
  } | null
  facility: {
    id: number
    name: string
    code: string
    state: string
  } | null
}

interface ClaimsStats {
  totalClaims: number
  submittedClaims: number
  awaitingVerification: number
  verifiedClaims: number
  approvedClaims: number
  rejectedClaims: number
  pendingDecision: number
  totalAmount: number
  approvedAmount: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ClaimsManagement() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [statistics, setStatistics] = useState<ClaimsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [decisionFilter, setDecisionFilter] = useState("all")
  const [selectedClaims, setSelectedClaims] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [reviewData, setReviewData] = useState({
    decision: "",
    reasonForRejection: "",
    approvedAmount: "",
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const fetchClaims = async (page = 1, search = "", status = "", decision = "") => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search.trim()) {
        params.append("search", search.trim())
      }
      if (status) {
        params.append("status", status)
      }
      if (decision) {
        params.append("decision", decision)
      }

      const response = await fetch(`/api/admin/claims?${params}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch claims: ${response.statusText}`)
      }

      const data = await response.json()
      setClaims(data.claims || [])
      setStatistics(data.statistics)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch claims")
      console.error("Error fetching claims:", err)
    } finally {
      setLoading(false)
    }
  }

  const processClaims = async (action: string) => {
    if (selectedClaims.length === 0) return

    try {
      setIsProcessing(true)
      setError(null)

      const requestBody: any = {
        claimIds: selectedClaims,
        action,
      }

      if (action === "approve" && reviewData.decision) {
        requestBody.decision = reviewData.decision
        if (reviewData.decision === "approved" && reviewData.approvedAmount) {
          requestBody.approvedAmount = reviewData.approvedAmount
        }
        if (reviewData.decision === "rejected" && reviewData.reasonForRejection) {
          requestBody.reasonForRejection = reviewData.reasonForRejection
        }
      }

      const response = await fetch("/api/admin/claims", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to process claims: ${response.statusText}`)
      }

      setSelectedClaims([])
      setIsReviewOpen(false)
      setReviewData({ decision: "", reasonForRejection: "", approvedAmount: "" })
      await fetchClaims(pagination.page, searchTerm, statusFilter === "all" ? "" : statusFilter, decisionFilter === "all" ? "" : decisionFilter)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process claims")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClaims(claims.map(c => c.id))
    } else {
      setSelectedClaims([])
    }
  }

  const handleSelectClaim = (claimId: number, checked: boolean) => {
    if (checked) {
      setSelectedClaims([...selectedClaims, claimId])
    } else {
      setSelectedClaims(selectedClaims.filter(id => id !== claimId))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "awaiting_verification":
        return "bg-yellow-100 text-yellow-800"
      case "verified":
        return "bg-green-100 text-green-800"
      case "verified_awaiting_payment":
        return "bg-purple-100 text-purple-800"
      case "verified_paid":
        return "bg-green-100 text-green-800"
      case "not_verified":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDecisionColor = (decision: string | null) => {
    switch (decision) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatAmount = (amount: string | null) => {
    if (!amount) return "₦0"
    return `₦${parseFloat(amount).toLocaleString()}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  useEffect(() => {
    fetchClaims(1, "", "", "")
  }, [])

  if (loading && claims.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading claims...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Modern Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50"></div>
        <div className="relative rounded-3xl border border-white/20 bg-white/40 backdrop-blur-sm p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
                    Claims Management
                  </h1>
                  <p className="text-xl text-slate-600 font-medium">Review and process healthcare claims efficiently</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="border-slate-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg rounded-xl">
                <Download className="h-5 w-5 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Claims Statistics */}
      {statistics && (
        <div className="grid gap-6 md:grid-cols-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 font-medium">Total Claims</p>
              <p className="text-3xl font-bold text-slate-900">{statistics.totalClaims}</p>
              <p className="text-sm text-slate-500">
                {formatAmount(statistics.totalAmount?.toString())}
              </p>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 font-medium">Awaiting Review</p>
              <p className="text-3xl font-bold text-slate-900">{statistics.awaitingVerification}</p>
              <p className="text-sm text-slate-500">
                {statistics.pendingDecision} pending decisions
              </p>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 font-medium">Approved Claims</p>
              <p className="text-3xl font-bold text-slate-900">{statistics.approvedClaims}</p>
              <p className="text-sm text-slate-500">
                {formatAmount(statistics.approvedAmount?.toString())}
              </p>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 font-medium">Rejected Claims</p>
              <p className="text-3xl font-bold text-slate-900">{statistics.rejectedClaims}</p>
              <p className="text-sm text-slate-500">
                {((statistics.rejectedClaims / statistics.totalClaims) * 100).toFixed(1)}% rejection rate
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Workflow Visualization */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl p-6">
        <StatusWorkflow 
          currentStatus={statusFilter === "all" ? "submitted" : statusFilter} 
          className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200"
        />
      </div>

      {/* Enhanced Filters and Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl p-6">
        <div className="flex items-center justify-between space-x-6">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search by claim ID, beneficiary name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  fetchClaims(1, e.target.value, statusFilter === "all" ? "" : statusFilter, decisionFilter === "all" ? "" : decisionFilter)
                }}
                className="h-12 rounded-xl border-slate-300 bg-white/80 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              fetchClaims(1, searchTerm, value === "all" ? "" : value, decisionFilter === "all" ? "" : decisionFilter)
            }}>
              <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-white/80 backdrop-blur-sm shadow-sm w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="awaiting_verification">Awaiting Verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="not_verified">Not Verified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={decisionFilter} onValueChange={(value) => {
              setDecisionFilter(value)
              fetchClaims(1, searchTerm, statusFilter === "all" ? "" : statusFilter, value === "all" ? "" : value)
            }}>
              <SelectTrigger className="h-12 rounded-xl border-slate-300 bg-white/80 backdrop-blur-sm shadow-sm w-40">
                <SelectValue placeholder="Decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Decisions</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedClaims.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-600 font-medium">
                  {selectedClaims.length} claim{selectedClaims.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setSelectedClaims([])}
                  className="border-slate-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm rounded-xl"
                >
                  Clear Selection
                </Button>
                <Button
                  size="lg"
                  onClick={() => setIsReviewOpen(true)}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg rounded-xl"
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  )}
                  Review Selected
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50/80 backdrop-blur-sm rounded-2xl">
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Modern Claims Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Claims Overview</h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600 font-medium">
                Total: {pagination.total.toLocaleString()}
              </span>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1">
                Page {pagination.page} of {pagination.totalPages}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-100/80">
                <TableHead className="w-16 px-6 py-4 font-semibold text-slate-700">
                  <Checkbox
                    checked={selectedClaims.length === claims.length && claims.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="rounded-lg"
                  />
                </TableHead>
                <TableHead className="px-6 py-4 font-semibold text-slate-700">Claim Details</TableHead>
                <TableHead className="px-6 py-4 font-semibold text-slate-700">Beneficiary</TableHead>
                <TableHead className="px-6 py-4 font-semibold text-slate-700">TPA/Facility</TableHead>
                <TableHead className="px-6 py-4 font-semibold text-slate-700">Amount</TableHead>
                <TableHead className="px-6 py-4 font-semibold text-slate-700">Status</TableHead>
                <TableHead className="px-6 py-4 font-semibold text-slate-700">Decision</TableHead>
                <TableHead className="px-6 py-4 font-semibold text-slate-700">Submitted</TableHead>
                <TableHead className="px-6 py-4 font-semibold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No claims found</h3>
                    <p className="text-slate-500">Try adjusting your search or filter criteria</p>
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-slate-50/80 transition-colors duration-200 border-b border-slate-100/50">
                    <TableCell className="px-6 py-4">
                      <Checkbox
                        checked={selectedClaims.includes(claim.id)}
                        onCheckedChange={(checked) => handleSelectClaim(claim.id, checked as boolean)}
                        className="rounded-lg"
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-900 text-lg">{claim.uniqueClaimId}</p>
                        {claim.batchNumber && (
                          <p className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-lg inline-block">
                            Batch: {claim.batchNumber}
                          </p>
                        )}
                        {claim.primaryDiagnosis && (
                          <p className="text-sm text-slate-500 line-clamp-2">{claim.primaryDiagnosis}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-900 text-lg">{claim.beneficiaryName}</p>
                        {claim.age && (
                          <p className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-lg inline-block">
                            Age: {claim.age}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-2">
                        {claim.tpa && (
                          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">{claim.tpa.name}</span>
                          </div>
                        )}
                        {claim.facility && (
                          <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg">
                            <MapPin className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">{claim.facility.name}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-slate-900 text-lg">{formatAmount(claim.totalCostOfCare)}</p>
                        {claim.approvedCostOfCare && claim.approvedCostOfCare !== claim.totalCostOfCare && (
                          <p className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            Approved: {formatAmount(claim.approvedCostOfCare)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge className={`${getStatusColor(claim.status)} px-3 py-1 text-sm font-medium rounded-lg`}>
                        {claim.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {claim.decision ? (
                        <Badge className={`${getDecisionColor(claim.decision)} px-3 py-1 text-sm font-medium rounded-lg`}>
                          {claim.decision.charAt(0).toUpperCase() + claim.decision.slice(1)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">{formatDate(claim.dateOfClaimSubmission)}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClaim(claim)
                          setIsDetailOpen(true)
                        }}
                        className="rounded-lg border-slate-300 hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-6 border-t border-slate-200/50">
              <div className="text-sm text-slate-600 font-medium">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total.toLocaleString()} total)
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchClaims(pagination.page - 1, searchTerm, statusFilter === "all" ? "" : statusFilter, decisionFilter === "all" ? "" : decisionFilter)}
                  className="rounded-lg border-slate-300 hover:bg-slate-50"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchClaims(pagination.page + 1, searchTerm, statusFilter === "all" ? "" : statusFilter, decisionFilter === "all" ? "" : decisionFilter)}
                  className="rounded-lg border-slate-300 hover:bg-slate-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Claim Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Claim Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Claim ID:</strong> {selectedClaim.uniqueClaimId}</p>
                    <p><strong>Batch:</strong> {selectedClaim.batchNumber || "N/A"}</p>
                    <p><strong>Status:</strong> 
                      <Badge className={`${getStatusColor(selectedClaim.status)} ml-2`}>
                        {selectedClaim.status.replace(/_/g, " ")}
                      </Badge>
                    </p>
                    <p><strong>Decision:</strong> 
                      {selectedClaim.decision ? (
                        <Badge className={`${getDecisionColor(selectedClaim.decision)} ml-2`}>
                          {selectedClaim.decision}
                        </Badge>
                      ) : "Pending"}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Beneficiary Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedClaim.beneficiaryName}</p>
                    <p><strong>Age:</strong> {selectedClaim.age || "N/A"}</p>
                    <p><strong>Date of Birth:</strong> {formatDate(selectedClaim.dateOfBirth)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Medical Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Primary Diagnosis:</strong> {selectedClaim.primaryDiagnosis || "N/A"}</p>
                    <p><strong>Secondary Diagnosis:</strong> {selectedClaim.secondaryDiagnosis || "N/A"}</p>
                    <p><strong>Treatment:</strong> {selectedClaim.treatmentProcedure || "N/A"}</p>
                    <p><strong>Admission:</strong> {formatDate(selectedClaim.dateOfAdmission)}</p>
                    <p><strong>Discharge:</strong> {formatDate(selectedClaim.dateOfDischarge)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Financial Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total Cost:</strong> {formatAmount(selectedClaim.totalCostOfCare)}</p>
                    <p><strong>Approved Cost:</strong> {formatAmount(selectedClaim.approvedCostOfCare)}</p>
                    <p><strong>Submitted:</strong> {formatDate(selectedClaim.dateOfClaimSubmission)}</p>
                    <p><strong>Payment Date:</strong> {formatDate(selectedClaim.dateOfClaimsPayment)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">TPA Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>TPA:</strong> {selectedClaim.tpa?.name || "N/A"}</p>
                    <p><strong>TPA Code:</strong> {selectedClaim.tpa?.code || "N/A"}</p>
                    <p><strong>TPA Remarks:</strong> {selectedClaim.tpaRemarks || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Facility Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Facility:</strong> {selectedClaim.facility?.name || "N/A"}</p>
                    <p><strong>Facility Code:</strong> {selectedClaim.facility?.code || "N/A"}</p>
                    <p><strong>State:</strong> {selectedClaim.facility?.state || "N/A"}</p>
                  </div>
                </div>
              </div>

              {selectedClaim.reasonForRejection && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Rejection Reason</h3>
                  <p className="text-sm bg-red-50 p-3 rounded border">
                    {selectedClaim.reasonForRejection}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}