"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Package, 
  FileText, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Download, 
  Edit, 
  Eye,
  Plus,
  Users,
  Calendar,
  DollarSign,
  TrendingUp
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { exportManager } from "@/lib/export-utils"

interface Batch {
  id: number
  batchNumber: string
  name: string
  description: string
  startDate: string
  endDate: string
  status: "draft" | "open" | "submitted" | "under_review" | "approved" | "rejected" | "closed"
  totalClaims: number
  totalAmount: number
  approvedClaims: number
  approvedAmount: number
  rejectedClaims: number
  rejectedAmount: number
  pendingClaims: number
  pendingAmount: number
  tpaName: string
  createdAt: string
  submittedAt?: string
  closedAt?: string
}

interface Claim {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  hospitalNumber: string
  dateOfAdmission: string
  dateOfDischarge: string
  totalCostOfCare: number
  status: "submitted" | "awaiting_verification" | "verified" | "verified_awaiting_payment" | "verified_paid" | "rejected"
  primaryDiagnosis: string
  rejectionReason?: string
  tpaRemarks?: string
}

export default function BatchDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string
  
  const [batch, setBatch] = useState<Batch | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [submitNotes, setSubmitNotes] = useState("")
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [showClaimDetail, setShowClaimDetail] = useState(false)

  useEffect(() => {
    if (batchId) {
      fetchBatchDetails()
    }
  }, [batchId])

  const fetchBatchDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/facility/batches/${batchId}`)
      const data = await response.json()
      
      if (response.ok) {
        setBatch(data.batch)
        setClaims(data.claims)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch batch details",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching batch details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-800 border-gray-200" },
      open: { label: "Open", className: "bg-blue-100 text-blue-800 border-blue-200" },
      submitted: { label: "Submitted", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      under_review: { label: "Under Review", className: "bg-purple-100 text-purple-800 border-purple-200" },
      approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
      closed: { label: "Closed", className: "bg-slate-100 text-slate-800 border-slate-200" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: "bg-gray-100 text-gray-800 border-gray-200" 
    }
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getClaimStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: "Submitted", className: "bg-blue-100 text-blue-800 border-blue-200" },
      awaiting_verification: { label: "Awaiting Verification", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      verified: { label: "Verified & Paid", className: "bg-green-100 text-green-800 border-green-200" },
      verified_awaiting_payment: { label: "Awaiting Reimbursement", className: "bg-purple-100 text-purple-800 border-purple-200" },
      verified_paid: { label: "Reimbursed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: "bg-gray-100 text-gray-800 border-gray-200" 
    }
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  const handleSubmitBatch = async () => {
    try {
      const response = await fetch(`/api/facility/batches/${batchId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: submitNotes }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch submitted successfully",
        })
        setShowSubmitDialog(false)
        fetchBatchDetails() // Refresh data
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to submit batch",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while submitting batch",
        variant: "destructive",
      })
    }
  }

  const handleCloseBatch = async () => {
    try {
      const response = await fetch(`/api/facility/batches/${batchId}/close`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch closed successfully",
        })
        fetchBatchDetails() // Refresh data
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to close batch",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while closing batch",
        variant: "destructive",
      })
    }
  }

  const handleViewClaim = (claim: Claim) => {
    setSelectedClaim(claim)
    setShowClaimDetail(true)
  }

  const handleExportBatch = () => {
    try {
      if (!batch) return
      
      const exportData = claims.map(claim => ({
        'Claim ID': claim.uniqueClaimId,
        'Beneficiary Name': claim.beneficiaryName,
        'Hospital Number': claim.hospitalNumber,
        'Date of Admission': claim.dateOfAdmission,
        'Date of Discharge': claim.dateOfDischarge,
        'Total Cost of Care': claim.totalCostOfCare,
        'Status': claim.status,
        'Primary Diagnosis': claim.primaryDiagnosis,
        'Rejection Reason': claim.rejectionReason || 'N/A',
        'TPA Remarks': claim.tpaRemarks || 'N/A'
      }))
      
      const csvContent = exportManager.exportClaimsData(exportData, { format: 'csv' })
      exportManager.downloadExport(csvContent, { 
        format: 'csv', 
        filename: `batch-${batch.batchNumber}-claims-${format(new Date(), 'yyyy-MM-dd')}` 
      })
      
      toast({
        title: "Export Successful",
        description: "Batch claims exported successfully",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export batch claims. Please try again.",
        variant: "destructive"
      })
    }
  }

  const canSubmit = batch?.status === "open" && claims.length > 0
  const canClose = batch?.status === "approved" || batch?.status === "rejected"

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading batch details...</div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Batch not found</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Batch {batch.batchNumber}</h1>
            <p className="text-muted-foreground">{batch.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canSubmit && (
            <Button onClick={() => setShowSubmitDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              Submit Batch
            </Button>
          )}
          {canClose && (
            <Button variant="outline" onClick={handleCloseBatch}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Close Batch
            </Button>
          )}
          <Button variant="outline" onClick={handleExportBatch}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Batch Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusBadge(batch.status)}</div>
            <p className="text-xs text-muted-foreground">
              {batch.status === "draft" && "Ready for claims"}
              {batch.status === "open" && "Accepting claims"}
              {batch.status === "submitted" && "Under TPA review"}
              {batch.status === "under_review" && "Being processed"}
              {batch.status === "approved" && "Approved by TPA"}
              {batch.status === "rejected" && "Rejected by TPA"}
              {batch.status === "closed" && "Batch completed"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batch.totalClaims}</div>
            <p className="text-xs text-muted-foreground">
              {batch.pendingClaims} pending, {batch.approvedClaims} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(batch.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(batch.approvedAmount)} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TPA</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batch.tpaName}</div>
            <p className="text-xs text-muted-foreground">Processing partner</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Details */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{batch.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                  <p className="text-sm mt-1">{formatDate(batch.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                  <p className="text-sm mt-1">{formatDate(batch.endDate)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                <p className="text-sm mt-1">{formatDate(batch.createdAt)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Progress</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Claims Processed</span>
                    <span>{batch.approvedClaims + batch.rejectedClaims} / {batch.totalClaims}</span>
                  </div>
                  <Progress 
                    value={batch.totalClaims > 0 ? ((batch.approvedClaims + batch.rejectedClaims) / batch.totalClaims) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </div>
              {batch.submittedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Submitted</Label>
                  <p className="text-sm mt-1">{formatDate(batch.submittedAt)}</p>
                </div>
              )}
              {batch.closedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Closed</Label>
                  <p className="text-sm mt-1">{formatDate(batch.closedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Summary</CardTitle>
          <CardDescription>
            Overview of all claims in this batch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{batch.pendingClaims}</div>
              <div className="text-sm text-blue-700">Pending Claims</div>
              <div className="text-xs text-blue-600 mt-1">{formatCurrency(batch.pendingAmount)}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{batch.approvedClaims}</div>
              <div className="text-sm text-green-700">Approved Claims</div>
              <div className="text-xs text-green-600 mt-1">{formatCurrency(batch.approvedAmount)}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{batch.rejectedClaims}</div>
              <div className="text-sm text-red-700">Rejected Claims</div>
              <div className="text-xs text-red-600 mt-1">{formatCurrency(batch.rejectedAmount)}</div>
            </div>
          </div>

          {/* Claims Table */}
          {claims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No claims in this batch yet</p>
              <p className="text-sm">Add claims using the discharge form</p>
              <Button className="mt-4" asChild>
                <Link href="/facility/discharge">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Claim
                </Link>
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {claim.uniqueClaimId}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{claim.beneficiaryName}</div>
                          <div className="text-sm text-muted-foreground">{claim.hospitalNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(claim.totalCostOfCare)}
                      </TableCell>
                      <TableCell>
                        {getClaimStatusBadge(claim.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Admit: {formatDate(claim.dateOfAdmission)}</div>
                          <div>Discharge: {formatDate(claim.dateOfDischarge)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewClaim(claim)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Batch Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Batch {batch.batchNumber}</DialogTitle>
            <DialogDescription>
              Submit this batch to TPA for review and processing. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Submission Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this batch submission..."
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Important</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Once submitted, this batch will be sent to TPA for review. 
                You won't be able to add or modify claims until the review is complete.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitBatch}>
                <Send className="h-4 w-4 mr-2" />
                Submit Batch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Claim Detail Dialog */}
      <Dialog open={showClaimDetail} onOpenChange={setShowClaimDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Claim Details - {selectedClaim?.uniqueClaimId}</DialogTitle>
            <DialogDescription>
              Complete information about this claim
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Beneficiary Name</Label>
                  <div className="text-lg font-medium">{selectedClaim.beneficiaryName}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Hospital Number</Label>
                  <div className="text-lg font-medium">{selectedClaim.hospitalNumber}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Date of Admission</Label>
                  <div className="text-lg font-medium">{formatDate(selectedClaim.dateOfAdmission)}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Date of Discharge</Label>
                  <div className="text-lg font-medium">{formatDate(selectedClaim.dateOfDischarge)}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Total Cost of Care</Label>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedClaim.totalCostOfCare)}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div>{getClaimStatusBadge(selectedClaim.status)}</div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Primary Diagnosis</Label>
                <div className="text-lg font-medium">{selectedClaim.primaryDiagnosis}</div>
              </div>

              {/* Rejection Details */}
              {selectedClaim.status === "rejected" && (
                <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Rejection Details
                  </h4>
                  {selectedClaim.rejectionReason && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-red-700">Reason for Rejection</Label>
                      <div className="text-red-800">{selectedClaim.rejectionReason}</div>
                    </div>
                  )}
                  {selectedClaim.tpaRemarks && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-red-700">TPA Remarks</Label>
                      <div className="text-red-800">{selectedClaim.tpaRemarks}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowClaimDetail(false)}>
                  Close
                </Button>
                {selectedClaim.status === "rejected" && (
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit & Resubmit
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
