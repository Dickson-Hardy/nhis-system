"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { Search, Filter, Download, Eye, Calculator, RefreshCw, FileText, AlertTriangle, ToggleLeft, ToggleRight, Clock, XCircle, CheckCircle, FileSpreadsheet } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { exportManager } from "@/lib/export-utils"
import { StatusWorkflow } from "@/components/tpa/status-workflow"
import { TPATreatmentProceduresModal } from "@/components/tpa/treatment-procedures-modal"
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
  status: string
  facilityId: number
  facilityName?: string
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
  originalFormat?: 'legacy' | 'expanded'
  isTransformed?: boolean
  procedureCost?: number
  treatmentCost?: number
  medicationCost?: number
  otherCost?: number
}

export default function ClaimsManagementPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewFormat, setViewFormat] = useState<'legacy' | 'expanded'>('expanded')
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [showTreatmentProcedures, setShowTreatmentProcedures] = useState(false)

  // Fetch claims data
  const fetchClaims = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tpa/claims')
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
      toast({
        title: "Error",
        description: "Failed to fetch claims data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClaims()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge variant="secondary">Submitted</Badge>
      case "awaiting_verification":
        return <Badge variant="secondary">Awaiting Verification</Badge>
      case "verified":
        return <Badge variant="default">Verified</Badge>
      case "verified_paid":
        return <Badge variant="default">Paid</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
    return `₦${numAmount.toLocaleString()}`
  }

  // Filter claims based on search and filters
  const filteredClaims = claims.filter((claim) => {
    const matchesSearch = claim.beneficiaryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.uniqueClaimId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.hospitalNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Get status statistics
  const statusStats = {
    submitted: claims.filter((claim) => claim.status === "submitted").length,
    awaiting_verification: claims.filter((claim) => claim.status === "awaiting_verification").length,
    verified: claims.filter((claim) => claim.status === "verified").length,
    verified_paid: claims.filter((claim) => claim.status === "verified_paid").length,
    rejected: claims.filter((claim) => claim.status === "rejected").length,
  }

  const handleExportClaims = () => {
    try {
      const exportData = filteredClaims.map(claim => ({
        'Claim ID': claim.uniqueClaimId,
        'Beneficiary Name': claim.beneficiaryName,
        'Hospital Number': claim.hospitalNumber,
        'Date of Admission': claim.dateOfAdmission,
        'Date of Discharge': claim.dateOfDischarge,
        'Primary Diagnosis': claim.primaryDiagnosis,
        'Treatment Procedure': claim.treatmentProcedure,
        'Total Cost of Care': formatCurrency(claim.totalCostOfCare),
        'Status': claim.status,
        'Format': claim.originalFormat || 'unknown'
      }))

      const csvContent = exportManager.exportClaimsData(exportData, { format: 'csv' })
      exportManager.downloadExport(csvContent, { 
        format: 'csv', 
        filename: `tpa-claims-${format(new Date(), 'yyyy-MM-dd')}` 
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading claims...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Claims Management</h1>
          <p className="text-muted-foreground">Review and manage facility claims</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportClaims}>
            <Download className="h-4 w-4 mr-2" />
            Export Claims
          </Button>
          <Button 
            variant="outline" 
            onClick={() => downloadTemplate(availableTemplates.find(t => t.format === 'expanded')!)}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Expanded Template
          </Button>
          <Button variant="outline" onClick={fetchClaims}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Workflow */}
      <StatusWorkflow currentStatus="awaiting_verification" />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusStats.submitted}</div>
            <p className="text-sm text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{statusStats.awaiting_verification}</div>
            <p className="text-sm text-muted-foreground">Awaiting Verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusStats.verified}</div>
            <p className="text-sm text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{statusStats.verified_paid}</div>
            <p className="text-sm text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statusStats.rejected}</div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Format Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>View Format</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Legacy</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewFormat(viewFormat === 'legacy' ? 'expanded' : 'legacy')}
                className="flex items-center gap-2"
              >
                {viewFormat === 'legacy' ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                {viewFormat === 'legacy' ? 'Legacy' : 'Expanded'}
              </Button>
              <span className="text-sm text-muted-foreground">Expanded</span>
            </div>
          </CardTitle>
          <CardDescription>
            {viewFormat === 'legacy' 
              ? 'Showing simplified view with basic claim information'
              : 'Showing detailed view with treatment procedures breakdown'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by name, claim ID, or hospital number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="awaiting_verification">Awaiting Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="verified_paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claims ({filteredClaims.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Diagnosis</TableHead>
                {viewFormat === 'expanded' && <TableHead>Treatment Procedures</TableHead>}
                <TableHead>Procedure Cost</TableHead>
                <TableHead>Treatment Cost</TableHead>
                <TableHead>Medication Cost</TableHead>
                <TableHead>Other Cost</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Format</TableHead>
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
                      <div className="text-sm text-muted-foreground">{claim.hospitalNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {claim.primaryDiagnosis?.split('; ').slice(0, 2).join(', ')}
                      {claim.primaryDiagnosis?.split('; ').length > 2 && '...'}
                    </div>
                  </TableCell>
                  {viewFormat === 'expanded' && (
                    <TableCell>
                      {claim.treatmentProcedures && claim.treatmentProcedures.length > 0 ? (
                        <div className="text-sm">
                          {claim.treatmentProcedures.length} procedure(s)
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {claim.treatmentProcedure || 'N/A'}
                        </div>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(claim.procedureCost || 0)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(claim.treatmentCost || 0)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(claim.medicationCost || 0)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(claim.otherCost || 0)}
                  </TableCell>
                  <TableCell className="font-mono font-bold">
                    {formatCurrency(claim.totalCostOfCare)}
                  </TableCell>
                  <TableCell>{getStatusBadge(claim.status)}</TableCell>
                  <TableCell>
                    <Badge variant={claim.originalFormat === 'expanded' ? 'default' : 'secondary'}>
                      {claim.originalFormat || 'unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedClaim(claim)
                          setShowTreatmentProcedures(true)
                          toast({
                            title: "Treatment Procedures",
                            description: `Opening detailed view for claim ${claim.uniqueClaimId}`,
                          })
                        }}
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Treatment Procedures Modal */}
      <TPATreatmentProceduresModal
        claim={selectedClaim}
        isOpen={showTreatmentProcedures}
        onClose={() => setShowTreatmentProcedures(false)}
      />
    </div>
  )
}