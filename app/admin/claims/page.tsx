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
  AlertTriangle
} from "lucide-react"

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
      setClaims(claims.map(c => c.id))
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Claims Management</h1>
          <p className="text-muted-foreground">Review and process healthcare claims</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Claims Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalClaims}</div>
              <p className="text-xs text-muted-foreground">
                {formatAmount(statistics.totalAmount?.toString())}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.awaitingVerification}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.pendingDecision} pending decisions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Claims</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.approvedClaims}</div>
              <p className="text-xs text-muted-foreground">
                {formatAmount(statistics.approvedAmount?.toString())}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected Claims</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.rejectedClaims}</div>
              <p className="text-xs text-muted-foreground">
                {((statistics.rejectedClaims / statistics.totalClaims) * 100).toFixed(1)}% rejection rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4 flex-1">
          <Input
            placeholder="Search by claim ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              fetchClaims(1, e.target.value, statusFilter === "all" ? "" : statusFilter, decisionFilter === "all" ? "" : decisionFilter)
            }}
            className="max-w-sm"
          />
          <Select value={statusFilter || "all"} onValueChange={(value) => {
            const filterValue = value === "all" ? "" : value
            setStatusFilter(filterValue)
            fetchClaims(1, searchTerm, filterValue, decisionFilter === "all" ? "" : decisionFilter)
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="awaiting_verification">Awaiting Verification</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="verified_awaiting_payment">Awaiting Payment</SelectItem>
              <SelectItem value="verified_paid">Paid</SelectItem>
              <SelectItem value="not_verified">Not Verified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={decisionFilter || "all"} onValueChange={(value) => {
            const filterValue = value === "all" ? "" : value
            setDecisionFilter(filterValue)
            fetchClaims(1, searchTerm, statusFilter === "all" ? "" : statusFilter, filterValue)
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Decisions</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {selectedClaims.length > 0 && (
          <div className="flex space-x-2">
            <Button
              onClick={() => processClaims("verify")}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verify ({selectedClaims.length})
            </Button>
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Review ({selectedClaims.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Review Claims</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Decision</Label>
                    <Select value={reviewData.decision} onValueChange={(value) => 
                      setReviewData({...reviewData, decision: value})
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approve</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {reviewData.decision === "approved" && (
                    <div>
                      <Label>Approved Amount (optional)</Label>
                      <Input
                        placeholder="Enter approved amount"
                        value={reviewData.approvedAmount}
                        onChange={(e) => setReviewData({...reviewData, approvedAmount: e.target.value})}
                      />
                    </div>
                  )}
                  {reviewData.decision === "rejected" && (
                    <div>
                      <Label>Reason for Rejection</Label>
                      <Textarea
                        placeholder="Enter reason for rejection"
                        value={reviewData.reasonForRejection}
                        onChange={(e) => setReviewData({...reviewData, reasonForRejection: e.target.value})}
                      />
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => processClaims("approve")}
                      disabled={!reviewData.decision || isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        "Submit Decision"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claims ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClaims.length === claims.length && claims.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Claim Details</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>TPA/Facility</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No claims found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedClaims.includes(claim.id)}
                        onCheckedChange={(checked) => handleSelectClaim(claim.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{claim.uniqueClaimId}</p>
                        {claim.batchNumber && (
                          <p className="text-sm text-muted-foreground">{claim.batchNumber}</p>
                        )}
                        {claim.primaryDiagnosis && (
                          <p className="text-sm text-muted-foreground">{claim.primaryDiagnosis}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{claim.beneficiaryName}</p>
                        {claim.age && (
                          <p className="text-sm text-muted-foreground">Age: {claim.age}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {claim.tpa && (
                          <p className="text-sm flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {claim.tpa.name}
                          </p>
                        )}
                        {claim.facility && (
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {claim.facility.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatAmount(claim.totalCostOfCare)}</p>
                        {claim.approvedCostOfCare && claim.approvedCostOfCare !== claim.totalCostOfCare && (
                          <p className="text-sm text-green-600">
                            Approved: {formatAmount(claim.approvedCostOfCare)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(claim.status)}>
                        {claim.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {claim.decision ? (
                        <Badge className={getDecisionColor(claim.decision)}>
                          {claim.decision.charAt(0).toUpperCase() + claim.decision.slice(1)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(claim.dateOfClaimSubmission)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClaim(claim)
                          setIsDetailOpen(true)
                        }}
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
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchClaims(pagination.page - 1, searchTerm, statusFilter === "all" ? "" : statusFilter, decisionFilter === "all" ? "" : decisionFilter)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchClaims(pagination.page + 1, searchTerm, statusFilter === "all" ? "" : statusFilter, decisionFilter === "all" ? "" : decisionFilter)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                      <Badge className={getStatusColor(selectedClaim.status)} size="sm">
                        {selectedClaim.status.replace(/_/g, " ")}
                      </Badge>
                    </p>
                    <p><strong>Decision:</strong> 
                      {selectedClaim.decision ? (
                        <Badge className={getDecisionColor(selectedClaim.decision)} size="sm">
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