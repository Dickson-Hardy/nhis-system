"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { Search, Filter, Download, Eye, Calculator, RefreshCw, FileText, AlertTriangle, Upload, FileSpreadsheet } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { exportManager } from "@/lib/export-utils"
import { ExcelUpload } from "@/components/shared/excel-upload"
import { downloadTemplate, availableTemplates } from "@/lib/template-downloads"

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
  treatmentProcedures?: Array<{ name: string; cost: string; description: string }>
  totalCostOfCare: string
  status: "submitted" | "awaiting_verification" | "verified" | "verified_awaiting_payment" | "verified_paid" | "rejected"
  batchId: number | null
  createdAt: string
  updatedAt: string
  batch?: {
    id: number
    batchNumber: string
    status: string
  }
  // Additional properties that might be returned by the API
  batchNumber?: string
  tpaName?: string
  rejectionReason?: string
  tpaRemarks?: string
  secondaryDiagnosis?: string
  procedureCost?: number; // Added for new table structure
  treatmentCost?: number; // Added for new table structure
  medicationCost?: number; // Added for new table structure
  otherCost?: number; // Added for new table structure
}

interface ClaimsStats {
  totalClaims: number
  pendingClaims: number
  approvedClaims: number
  rejectedClaims: number
  totalAmount: number
  approvedAmount: number
}

// TPA Cost Breakdown Modal Component
function TPACostBreakdownModal({ claim, isOpen, onClose }: { 
  claim: Claim | null; 
  isOpen: boolean; 
  onClose: () => void 
}) {
  if (!claim) return null

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(numAmount)
  }

  const totalProceduresCost = claim.treatmentProcedures?.reduce((sum, proc) => 
    sum + (Number.parseFloat(proc.cost) || 0), 0) || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            TPA Cost Breakdown - {claim.uniqueClaimId}
          </DialogTitle>
          <DialogDescription>
            Detailed cost analysis for audit and verification purposes
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Patient Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{claim.beneficiaryName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Hospital No:</span>
                <p className="font-medium">{claim.hospitalNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Admission:</span>
                <p className="font-medium">{claim.dateOfAdmission}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Discharge:</span>
                <p className="font-medium">{claim.dateOfDischarge}</p>
              </div>
            </div>
          </div>

          {/* Treatment Procedures Breakdown */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Treatment Procedures Breakdown</h3>
            {claim.treatmentProcedures && claim.treatmentProcedures.length > 0 ? (
              <div className="space-y-3">
                {claim.treatmentProcedures.map((procedure, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-card">
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
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Procedures Cost:</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(totalProceduresCost)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No detailed treatment procedures available</p>
                <p className="text-sm">This claim may have been created before the detailed breakdown feature</p>
              </div>
            )}
          </div>

          {/* Cost Summary */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Cost Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Treatment Procedures:</span>
                <span>{formatCurrency(totalProceduresCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Costs:</span>
                <span>{formatCurrency(Number.parseFloat(claim.totalCostOfCare) - totalProceduresCost)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total Cost of Care:</span>
                <span className="text-primary">{formatCurrency(claim.totalCostOfCare)}</span>
              </div>
            </div>
          </div>

          {/* Audit Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Audit Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Claim Status:</span>
                <Badge className="ml-2" variant={
                  claim.status === 'verified_paid' ? 'default' :
                  claim.status === 'rejected' ? 'destructive' :
                  'secondary'
                }>
                  {claim.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Batch Number:</span>
                <p className="font-medium">{claim.batch?.batchNumber || claim.batchNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created Date:</span>
                <p className="font-medium">{claim.createdAt ? format(new Date(claim.createdAt), 'PPP') : 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">TPA:</span>
                <p className="font-medium">{claim.tpaName || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([])
  const [stats, setStats] = useState<ClaimsStats>({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalAmount: 0,
    approvedAmount: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [batchFilter, setBatchFilter] = useState<string>("all")
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [showClaimDetail, setShowClaimDetail] = useState(false)
  const [showTpaCostBreakdown, setShowTpaCostBreakdown] = useState(false)
  const [showExcelUpload, setShowExcelUpload] = useState(false)
  const [uploadedClaims, setUploadedClaims] = useState<Claim[]>([])

  useEffect(() => {
    fetchClaims()
  }, [])

  useEffect(() => {
    filterClaims()
  }, [claims, searchTerm, statusFilter, batchFilter])

  const fetchClaims = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/facility/claims")
      const data = await response.json()
      
      if (response.ok) {
        setClaims(data.claims)
        setStats(data.stats)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch claims",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching claims",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterClaims = () => {
    let filtered = claims

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(claim =>
        claim.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.uniqueClaimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.hospitalNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(claim => claim.status === statusFilter)
    }

    // Batch filter
    if (batchFilter !== "all") {
      filtered = filtered.filter(claim => (claim.batch?.batchNumber || claim.batchNumber) === batchFilter)
    }

    setFilteredClaims(filtered)
  }

  const getStatusBadge = (status: string) => {
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

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(numAmount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  const formatDiagnosis = (diagnosis: string) => {
    if (!diagnosis) return 'N/A'
    const diagnoses = diagnosis.split('; ')
    if (diagnoses.length === 1) return diagnosis
    return `${diagnoses[0]} +${diagnoses.length - 1} more`
  }

  const getUniqueBatches = () => {
    return Array.from(new Set(claims.map(claim => claim.batch?.batchNumber || claim.batchNumber || 'N/A')))
  }

  const handleViewClaim = (claim: Claim) => {
    setSelectedClaim(claim)
    setShowClaimDetail(true)
    toast({
      title: "Claim Details",
      description: `Viewing details for claim ${claim.uniqueClaimId}`,
    })
  }

  const handleExportClaims = () => {
    try {
      const exportData = claims.map(claim => ({
        'Claim ID': claim.uniqueClaimId,
        'Beneficiary Name': claim.beneficiaryName,
        'Hospital Number': claim.hospitalNumber,
        'Date of Admission': claim.dateOfAdmission,
        'Date of Discharge': claim.dateOfDischarge,
        'Primary Diagnosis': claim.primaryDiagnosis,
        'Secondary Diagnosis': claim.secondaryDiagnosis || 'N/A',
        'Treatment Procedure': claim.treatmentProcedure,
        'Procedure Cost': formatCurrency(claim.procedureCost || 0),
        'Treatment Cost': formatCurrency(claim.treatmentCost || 0),
        'Medication Cost': formatCurrency(claim.medicationCost || 0),
        'Other Cost': formatCurrency(claim.otherCost || 0),
        'Total Cost of Care': formatCurrency(claim.totalCostOfCare),
        'Status': claim.status,
        'Batch Number': claim.batch?.batchNumber || 'N/A',
        'Created Date': claim.createdAt ? format(new Date(claim.createdAt), 'yyyy-MM-dd') : 'N/A'
      }))
      
      const csvContent = exportManager.exportClaimsData(exportData, { format: 'csv' })
      exportManager.downloadExport(csvContent, { 
        format: 'csv', 
        filename: `facility-claims-${format(new Date(), 'yyyy-MM-dd')}` 
      })
      
      toast({
        title: "Export Successful",
        description: "Claims exported successfully",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export claims. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleExportTreatmentProcedures = () => {
    try {
      const exportData = claims
        .filter(claim => (claim.procedureCost && claim.procedureCost > 0) || 
                         (claim.treatmentCost && claim.treatmentCost > 0) || 
                         (claim.medicationCost && claim.medicationCost > 0) || 
                         (claim.otherCost && claim.otherCost > 0))
        .map(claim => ({
          'Claim ID': claim.uniqueClaimId,
          'Beneficiary Name': claim.beneficiaryName,
          'Hospital Number': claim.hospitalNumber,
          'Date of Admission': claim.dateOfAdmission,
          'Date of Discharge': claim.dateOfDischarge,
          'Primary Diagnosis': claim.primaryDiagnosis,
          'Secondary Diagnosis': claim.secondaryDiagnosis || 'N/A',
          'Treatment Procedure': claim.treatmentProcedure,
          'Procedure Cost': formatCurrency(claim.procedureCost || 0),
          'Treatment Cost': formatCurrency(claim.treatmentCost || 0),
          'Medication Cost': formatCurrency(claim.medicationCost || 0),
          'Other Cost': formatCurrency(claim.otherCost || 0),
          'Total Cost of Care': formatCurrency(claim.totalCostOfCare),
          'Status': claim.status,
          'Batch Number': claim.batch?.batchNumber || 'N/A',
          'Created Date': claim.createdAt ? format(new Date(claim.createdAt), 'yyyy-MM-dd') : 'N/A'
        }))

      const csvContent = exportManager.exportClaimsData(exportData, { format: 'csv' })
      exportManager.downloadExport(csvContent, { 
        format: 'csv', 
        filename: `facility-treatment-procedures-${format(new Date(), 'yyyy-MM-dd')}` 
      })
      
      toast({
        title: "Export Successful",
        description: "Treatment procedures exported successfully",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export treatment procedures. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleExcelUploadComplete = async (result: any) => {
    try {
      // Process the uploaded claims
      const processedClaims = result.claims.map((claim: any) => ({
        ...claim,
        id: Date.now() + Math.random(), // Temporary ID
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      // Add to existing claims
      setClaims(prev => [...processedClaims, ...prev])
      setUploadedClaims(processedClaims)
      setShowExcelUpload(false)

      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${result.validRows} claims from Excel file`,
      })

      // Refresh the claims list
      fetchClaims()
    } catch (error) {
      console.error('Error processing uploaded claims:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to process uploaded claims. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading claims...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#088C17] via-[#16a085] to-[#003C06] rounded-2xl border-0 p-8 shadow-2xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">
              Claims Management
            </h1>
            <p className="text-xl text-green-100 font-medium drop-shadow-md">
              Track and manage all your submitted claims
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportClaims}>
              <Download className="h-4 w-4 mr-2" />
              Export Claims
            </Button>
            <Button variant="outline" onClick={handleExportTreatmentProcedures}>
              <Calculator className="h-4 w-4 mr-2" />
              Export Treatment Procedures
            </Button>
            <Button variant="outline" onClick={() => setShowExcelUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => downloadTemplate(availableTemplates.find(t => t.format === 'legacy')!)}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Legacy Template
            </Button>
            <Button 
              variant="outline" 
              onClick={() => downloadTemplate(availableTemplates.find(t => t.format === 'expanded')!)}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Expanded Template
            </Button>
            <Button 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/20"
              onClick={fetchClaims}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalClaims}</div>
            <div className="text-sm text-blue-700">Total Claims</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingClaims}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approvedClaims}</div>
            <div className="text-sm text-green-700">Approved</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejectedClaims}</div>
            <div className="text-sm text-red-700">Rejected</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalAmount)}</div>
            <div className="text-sm text-purple-700">Total Amount</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.approvedAmount)}</div>
            <div className="text-sm text-emerald-700">Approved Amount</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search claims..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="awaiting_verification">Awaiting Verification</SelectItem>
                  <SelectItem value="verified">Verified & Paid</SelectItem>
                  <SelectItem value="verified_awaiting_payment">Awaiting Reimbursement</SelectItem>
                  <SelectItem value="verified_paid">Reimbursed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {getUniqueBatches().map(batch => (
                    <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Results</Label>
              <div className="text-sm text-muted-foreground pt-2">
                {filteredClaims.length} of {claims.length} claims
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claims Overview</CardTitle>
          <CardDescription>
            Manage and track all your submitted claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClaims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No claims found</p>
              <p className="text-sm">Try adjusting your filters or create a new claim</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Treatment</TableHead>
                    <TableHead>Procedure Cost</TableHead>
                    <TableHead>Treatment Cost</TableHead>
                    <TableHead>Medication Cost</TableHead>
                    <TableHead>Other Cost</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => (
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
                      <TableCell>
                        <div className="text-sm">
                          <div>Primary: {formatDiagnosis(claim.primaryDiagnosis)}</div>
                          {claim.secondaryDiagnosis && (
                            <div>Secondary: {formatDiagnosis(claim.secondaryDiagnosis)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{claim.treatmentProcedure}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(claim.procedureCost || 0)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(claim.treatmentCost || 0)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(claim.medicationCost || 0)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(claim.otherCost || 0)}
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        {formatCurrency(claim.totalCostOfCare)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(claim.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{claim.batchNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewClaim(claim)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setShowTpaCostBreakdown(true);
                              toast({
                                title: "Cost Breakdown",
                                description: `Opening cost breakdown for ${claim.uniqueClaimId}`,
                              });
                            }}
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                          {claim.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <div>{getStatusBadge(selectedClaim.status)}</div>
                </div>
              </div>

              {/* Batch and TPA Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Batch Number</Label>
                  <div className="text-lg font-medium">{selectedClaim.batchNumber}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">TPA</Label>
                  <div className="text-lg font-medium">{selectedClaim.tpaName}</div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Primary Diagnosis</Label>
                  <div className="space-y-1">
                    {selectedClaim.primaryDiagnosis.split('; ').map((diagnosis, index) => (
                      <div key={index} className="text-lg font-medium">
                        • {diagnosis.trim()}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedClaim.secondaryDiagnosis && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Secondary Diagnosis</Label>
                    <div className="text-lg font-medium">{selectedClaim.secondaryDiagnosis}</div>
                  </div>
                )}
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
                  <Button 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      toast({
                        title: "Resubmit Claim",
                        description: `Preparing to resubmit claim ${selectedClaim.uniqueClaimId}`,
                      });
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resubmit Claim
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* TPA Cost Breakdown Modal */}
      <TPACostBreakdownModal
        claim={selectedClaim}
        isOpen={showTpaCostBreakdown}
        onClose={() => setShowTpaCostBreakdown(false)}
      />

      {/* Excel Upload Dialog */}
      <Dialog open={showExcelUpload} onOpenChange={setShowExcelUpload}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Claims from Excel</DialogTitle>
            <DialogDescription>
              Upload a CSV file containing claim data to add multiple claims at once.
            </DialogDescription>
          </DialogHeader>
          <ExcelUpload 
            onUploadComplete={handleExcelUploadComplete}
            onCancel={() => setShowExcelUpload(false)}
            facilityId={1} // This should come from user context
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
