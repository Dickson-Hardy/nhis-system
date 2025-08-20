"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Save, 
  X,
  Eye,
  DollarSign,
  Calendar,
  User,
  FileText,
  Building,
  Stethoscope,
  Calculator,
  MessageSquare,
  Package,
  ChevronDown,
  ChevronRight,
  ChevronUp
} from "lucide-react"

interface BatchClaim {
  id: string
  serialNumber: number
  uniqueBeneficiaryId: string
  uniqueClaimId: string
  tpaName: string
  facilityName: string
  facilityState: string
  facilityCode: string
  batchNumber: string
  hospitalNumber: string
  dateOfAdmission: string
  beneficiaryName: string
  dateOfBirth: string
  age: number
  address: string
  phoneNumber: string
  nin: string
  dateOfTreatment: string
  dateOfDischarge: string
  primaryDiagnosis: string
  secondaryDiagnosis: string
  treatmentProcedure: string
  quantity: number
  dateOfClaimSubmission: string
  monthOfSubmission: string
  costOfInvestigation: number
  costOfProcedure: number
  costOfMedication: number
  costOfOtherServices: number
  totalCostOfCare: number
  approvedCostOfCare: number
  decision: string
  reasonForRejection: string
  dateOfClaimsPayment: string
  tpaRemarks: string
  auditFlags: string[]
  nhiaVariance: number
  riskScore: number
  status: 'pending_review' | 'approved' | 'rejected' | 'needs_clarification'
  facilityDataComplete: boolean
  tpaDataComplete: boolean
  facilityCompletionDate?: string
  tpaCompletionDate?: string
}

interface BatchClaimsViewProps {
  batchId: string
  batchNumber: string
  onClose: () => void
}

export function BatchClaimsView({ batchId, batchNumber, onClose }: BatchClaimsViewProps) {
  const [claims, setClaims] = useState<BatchClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [completionFilter, setCompletionFilter] = useState("all")
  const [selectedClaim, setSelectedClaim] = useState<BatchClaim | null>(null)
  const [editingClaim, setEditingClaim] = useState<string | null>(null)
  const [editedRemarks, setEditedRemarks] = useState("")
  const [claimStats, setClaimStats] = useState({
    total: 0,
    facilityComplete: 0,
    tpaComplete: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  // Fetch batch claims data from API
  useEffect(() => {
    if (batchId) {
      fetchBatchClaims()
    }
  }, [batchId])

  const fetchBatchClaims = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/batches/${batchId}/claims`, { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
        
        // Calculate stats from fetched data
        setClaimStats({
          total: data.claims.length,
          facilityComplete: data.claims.filter((c: any) => c.facilityDataComplete).length,
          tpaComplete: data.claims.filter((c: any) => c.tpaDataComplete).length,
          pending: data.claims.filter((c: any) => c.status === 'pending_review').length,
          approved: data.claims.filter((c: any) => c.status === 'approved').length,
          rejected: data.claims.filter((c: any) => c.status === 'rejected').length
        })
      } else {
        // API not implemented yet, show empty state
        setClaims([])
        setClaimStats({
          total: 0,
          facilityComplete: 0,
          tpaComplete: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        })
      }
    } catch (error) {
      console.error('Error fetching batch claims:', error)
      setClaims([])
      setClaimStats({
        total: 0,
        facilityComplete: 0,
        tpaComplete: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.uniqueClaimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.primaryDiagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter
    
    const matchesCompletion = 
      completionFilter === "all" ||
      (completionFilter === "facility_incomplete" && !claim.facilityDataComplete) ||
      (completionFilter === "tpa_incomplete" && !claim.tpaDataComplete) ||
      (completionFilter === "complete" && claim.facilityDataComplete && claim.tpaDataComplete)

    return matchesSearch && matchesStatus && matchesCompletion
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><AlertTriangle className="h-3 w-3 mr-1" />Pending Review</Badge>
      case 'needs_clarification':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300"><MessageSquare className="h-3 w-3 mr-1" />Needs Clarification</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleSaveRemarks = async (claimId: string, remarks: string) => {
    try {
      // API call to save remarks would go here
      console.log('Saving remarks for claim:', claimId, remarks)
      
      // Update local state
      setClaims(prev => prev.map(claim => 
        claim.id === claimId 
          ? { ...claim, tpaRemarks: remarks, tpaDataComplete: true }
          : claim
      ))
      
      setEditingClaim(null)
      setEditedRemarks("")
    } catch (error) {
      console.error('Error saving remarks:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Loading Batch Claims...</h2>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 animate-pulse h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="bg-gray-100 animate-pulse h-96 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Batch Claims Review</h2>
          <p className="text-gray-600 mt-1">Batch Number: <span className="font-semibold">{batchNumber}</span></p>
        </div>
        <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
          <X className="h-4 w-4" />
          Close
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{claimStats.total}</div>
            <div className="text-sm text-gray-600">Total Claims</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{claimStats.facilityComplete}</div>
            <div className="text-sm text-gray-600">Facility Complete</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{claimStats.tpaComplete}</div>
            <div className="text-sm text-gray-600">TPA Complete</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{claimStats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{claimStats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{claimStats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="needs_clarification">Needs Clarification</SelectItem>
              </SelectContent>
            </Select>
            <Select value={completionFilter} onValueChange={setCompletionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by completion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Completion States</SelectItem>
                <SelectItem value="facility_incomplete">Facility Incomplete</SelectItem>
                <SelectItem value="tpa_incomplete">TPA Incomplete</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claims List ({filteredClaims.length} of {claims.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClaims.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
              <p className="text-gray-600">
                {claims.length === 0 
                  ? "This batch doesn't contain any claims yet." 
                  : "No claims match your current filters."
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-mono text-sm">{claim.uniqueClaimId}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{claim.beneficiaryName}</div>
                        <div className="text-sm text-gray-600">{claim.hospitalNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{claim.facilityName}</div>
                        <div className="text-sm text-gray-600">{claim.facilityState}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{claim.primaryDiagnosis}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">₦{claim.totalCostOfCare.toLocaleString()}</div>
                      {claim.approvedCostOfCare !== claim.totalCostOfCare && (
                        <div className="text-sm text-green-600">
                          Approved: ₦{claim.approvedCostOfCare.toLocaleString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {claim.facilityDataComplete ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span>Facility</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {claim.tpaDataComplete ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span>TPA</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedClaim(claim)}>
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Claim Details - {claim.uniqueClaimId}</DialogTitle>
                            </DialogHeader>
                            {/* Claim detail content would go here */}
                            <div className="space-y-4">
                              <p>Detailed claim information would be displayed here.</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {!claim.tpaDataComplete && (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setEditingClaim(claim.id)
                              setEditedRemarks(claim.tpaRemarks || "")
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Remarks Dialog */}
      <Dialog open={!!editingClaim} onOpenChange={() => setEditingClaim(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add TPA Remarks</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="remarks">TPA Remarks</Label>
            <Textarea
              id="remarks"
              value={editedRemarks}
              onChange={(e) => setEditedRemarks(e.target.value)}
              placeholder="Enter your remarks for this claim..."
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingClaim(null)}>
                Cancel
              </Button>
              <Button onClick={() => editingClaim && handleSaveRemarks(editingClaim, editedRemarks)}>
                <Save className="h-4 w-4 mr-2" />
                Save Remarks
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}