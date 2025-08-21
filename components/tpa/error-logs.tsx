"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  CheckSquare,
  AlertCircle,
  DollarSign,
  FileText,
  TrendingUp,
  Shield,
  RefreshCw,
  Download,
  BarChart3
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

interface ErrorLog {
  id: number
  batchId: number
  claimId?: number
  tpaId: number
  facilityId: number
  
  // Error Classification
  errorType: 'validation' | 'discrepancy' | 'fraud' | 'quality'
  errorCategory: 'missing_data' | 'duplicate' | 'cost_anomaly' | 'decision_mismatch'
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  // Error Details
  errorCode: string
  errorTitle: string
  errorDescription: string
  
  // Data Validation
  fieldName?: string
  expectedValue?: string
  actualValue?: string
  
  // Financial Validation
  expectedAmount?: number
  actualAmount?: number
  amountDeviation?: number
  deviationPercentage?: number
  
  // Status and Resolution
  status: 'open' | 'under_review' | 'resolved' | 'ignored'
  resolution?: string
  resolvedBy?: number
  resolvedAt?: string
  
  // Audit Fields
  createdAt: string
  updatedAt: string
  
  // Related Data
  batchNumber?: string
  claimId?: string
  facilityName?: string
}

interface ErrorStatistics {
  totalErrors: number
  openErrors: number
  resolvedErrors: number
  criticalErrors: number
  highErrors: number
  mediumErrors: number
  lowErrors: number
  errorsByCategory: Record<string, number>
  errorsByType: Record<string, number>
}

export function TPAErrorLogs() {
  const { user } = useAuth()
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [statistics, setStatistics] = useState<ErrorStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false)
  const [resolution, setResolution] = useState("")
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    fetchErrorLogs()
  }, [])

  const fetchErrorLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tpa/error-logs', { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        setErrorLogs(data.errorLogs || [])
        setStatistics(data.statistics || null)
      } else {
        // Mock data for demonstration
        setErrorLogs(generateMockErrorLogs())
        setStatistics(generateMockStatistics())
      }
    } catch (error) {
      console.error('Error fetching error logs:', error)
      setErrorLogs(generateMockErrorLogs())
      setStatistics(generateMockStatistics())
    } finally {
      setLoading(false)
    }
  }

  const generateMockErrorLogs = (): ErrorLog[] => [
    {
      id: 1,
      batchId: 1,
      claimId: 101,
      tpaId: 1,
      facilityId: 1,
      errorType: 'discrepancy',
      errorCategory: 'decision_mismatch',
      severity: 'critical',
      errorCode: 'REJECTED_WITH_APPROVED_COST',
      errorTitle: 'Rejected Claim with Approved Cost',
      errorDescription: 'Claim CLM-001 was rejected but has an approved cost of ₦150,000',
      fieldName: 'approvedCostOfCare',
      expectedValue: '0 or null for rejected claims',
      actualValue: '₦150,000',
      expectedAmount: 0,
      actualAmount: 150000,
      amountDeviation: 150000,
      deviationPercentage: 100,
      status: 'open',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      batchNumber: 'BATCH-2024-001',
      claimId: 'CLM-001',
      facilityName: 'Lagos University Teaching Hospital'
    },
    {
      id: 2,
      batchId: 1,
      claimId: 102,
      tpaId: 1,
      facilityId: 1,
      errorType: 'validation',
      errorCategory: 'missing_data',
      severity: 'high',
      errorCode: 'MISSING_DIAGNOSIS',
      errorTitle: 'Missing Primary Diagnosis',
      errorDescription: 'Claim CLM-002 is missing primary diagnosis information',
      fieldName: 'primaryDiagnosis',
      expectedValue: 'Valid diagnosis description',
      actualValue: 'Empty',
      status: 'open',
      createdAt: '2024-01-15T11:15:00Z',
      updatedAt: '2024-01-15T11:15:00Z',
      batchNumber: 'BATCH-2024-001',
      claimId: 'CLM-002',
      facilityName: 'Lagos University Teaching Hospital'
    },
    {
      id: 3,
      batchId: 1,
      claimId: 103,
      tpaId: 1,
      facilityId: 1,
      errorType: 'fraud',
      errorCategory: 'cost_anomaly',
      severity: 'critical',
      errorCode: 'EXCESSIVE_COST',
      errorTitle: 'Excessive Claim Cost',
      errorDescription: 'Claim CLM-003 has an unusually high cost of ₦2,500,000',
      fieldName: 'totalCostOfCare',
      expectedValue: 'Cost within reasonable range',
      actualValue: '₦2,500,000',
      expectedAmount: 1000000,
      actualAmount: 2500000,
      amountDeviation: 1500000,
      deviationPercentage: 150,
      status: 'under_review',
      createdAt: '2024-01-15T12:00:00Z',
      updatedAt: '2024-01-15T12:00:00Z',
      batchNumber: 'BATCH-2024-001',
      claimId: 'CLM-003',
      facilityName: 'Lagos University Teaching Hospital'
    },
    {
      id: 4,
      batchId: 1,
      claimId: 104,
      tpaId: 1,
      facilityId: 1,
      errorType: 'discrepancy',
      errorCategory: 'decision_mismatch',
      severity: 'high',
      errorCode: 'NO_DECISION_WITH_APPROVED_COST',
      errorTitle: 'No Decision with Approved Cost',
      errorDescription: 'Claim CLM-004 has an approved cost but no decision status',
      fieldName: 'decision',
      expectedValue: 'approved, rejected, or pending',
      actualValue: 'Empty',
      expectedAmount: 0,
      actualAmount: 75000,
      amountDeviation: 75000,
      deviationPercentage: 100,
      status: 'open',
      createdAt: '2024-01-15T13:45:00Z',
      updatedAt: '2024-01-15T13:45:00Z',
      batchNumber: 'BATCH-2024-001',
      claimId: 'CLM-004',
      facilityName: 'Lagos University Teaching Hospital'
    }
  ]

  const generateMockStatistics = (): ErrorStatistics => ({
    totalErrors: 4,
    openErrors: 3,
    resolvedErrors: 0,
    criticalErrors: 2,
    highErrors: 2,
    mediumErrors: 0,
    lowErrors: 0,
    errorsByCategory: {
      'decision_mismatch': 2,
      'missing_data': 1,
      'cost_anomaly': 1
    },
    errorsByType: {
      'discrepancy': 2,
      'validation': 1,
      'fraud': 1
    }
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-300'
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300'
      case 'ignored': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getErrorTypeIcon = (errorType: string) => {
    switch (errorType) {
      case 'fraud': return <AlertTriangle className="h-4 w-4" />
      case 'discrepancy': return <XCircle className="h-4 w-4" />
      case 'validation': return <FileText className="h-4 w-4" />
      case 'quality': return <Shield className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const filteredErrors = errorLogs.filter(error => {
    const matchesSearch = 
      error.errorTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.errorDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.errorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.claimId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || error.status === statusFilter
    const matchesSeverity = severityFilter === "all" || error.severity === severityFilter
    const matchesCategory = categoryFilter === "all" || error.errorCategory === categoryFilter
    
    return matchesSearch && matchesStatus && matchesSeverity && matchesCategory
  })

  const handleResolveError = async () => {
    if (!selectedError || !resolution.trim()) return
    
    setIsResolving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state
      setErrorLogs(prev => prev.map(error => 
        error.id === selectedError.id 
          ? { ...error, status: 'resolved', resolution, resolvedAt: new Date().toISOString() }
          : error
      ))
      
      setIsResolveDialogOpen(false)
      setSelectedError(null)
      setResolution("")
      
      // Refresh statistics
      fetchErrorLogs()
    } catch (error) {
      console.error('Error resolving issue:', error)
    } finally {
      setIsResolving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading error logs...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Error Logs & Validation</h1>
          <p className="text-muted-foreground">
            Monitor and resolve data quality issues, discrepancies, and validation errors
          </p>
        </div>
        <Button onClick={fetchErrorLogs} className="bg-[#088C17] hover:bg-[#003C06]">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{statistics.criticalErrors}</div>
              <p className="text-sm text-red-600">Critical</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{statistics.highErrors}</div>
              <p className="text-sm text-orange-600">High</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{statistics.mediumErrors}</div>
              <p className="text-sm text-yellow-600">Medium</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{statistics.lowErrors}</div>
              <p className="text-sm text-blue-600">Low</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{statistics.openErrors}</div>
              <p className="text-sm text-red-600">Open</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{statistics.resolvedErrors}</div>
              <p className="text-sm text-green-600">Resolved</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{statistics.totalErrors}</div>
              <p className="text-sm text-purple-600">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50 border-indigo-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600">
                {statistics.totalErrors > 0 ? Math.round((statistics.resolvedErrors / statistics.totalErrors) * 100) : 0}%
              </div>
              <p className="text-sm text-indigo-600">Resolved</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Error Log Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search errors..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="missing_data">Missing Data</SelectItem>
                <SelectItem value="duplicate">Duplicate</SelectItem>
                <SelectItem value="cost_anomaly">Cost Anomaly</SelectItem>
                <SelectItem value="decision_mismatch">Decision Mismatch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Error Logs ({filteredErrors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredErrors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg">No errors found matching your criteria</p>
                <p className="text-sm">All issues have been resolved or no errors exist</p>
              </div>
            ) : (
              filteredErrors.map((error) => (
                <div
                  key={error.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {getErrorTypeIcon(error.errorType)}
                          <Badge className={getSeverityColor(error.severity)}>
                            {error.severity.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(error.status)}>
                            {error.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(error.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {error.errorTitle}
                      </h3>
                      
                      <p className="text-muted-foreground mb-3">
                        {error.errorDescription}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Error Code:</span> {error.errorCode}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {error.errorCategory.replace('_', ' ')}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {error.errorType}
                        </div>
                        {error.batchNumber && (
                          <div>
                            <span className="font-medium">Batch:</span> {error.batchNumber}
                          </div>
                        )}
                        {error.claimId && (
                          <div>
                            <span className="font-medium">Claim:</span> {error.claimId}
                          </div>
                        )}
                        {error.facilityName && (
                          <div>
                            <span className="font-medium">Facility:</span> {error.facilityName}
                          </div>
                        )}
                      </div>
                      
                      {error.fieldName && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Field:</span> {error.fieldName}
                            </div>
                            <div>
                              <span className="font-medium">Expected:</span> {error.expectedValue}
                            </div>
                            <div>
                              <span className="font-medium">Actual:</span> {error.actualValue}
                            </div>
                            {error.amountDeviation && (
                              <div>
                                <span className="font-medium">Deviation:</span> ₦{error.amountDeviation.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedError(error)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      
                      {error.status === 'open' && (
                        <Button
                          size="sm"
                          className="bg-[#088C17] hover:bg-[#003C06]"
                          onClick={() => {
                            setSelectedError(error)
                            setIsResolveDialogOpen(true)
                          }}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resolve Error Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Error</DialogTitle>
          </DialogHeader>
          
          {selectedError && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">{selectedError.errorTitle}</h4>
                <p className="text-sm text-muted-foreground">{selectedError.errorDescription}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Notes</Label>
                <Textarea
                  id="resolution"
                  placeholder="Describe how this error was resolved..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsResolveDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResolveError}
                  disabled={!resolution.trim() || isResolving}
                  className="bg-[#088C17] hover:bg-[#003C06]"
                >
                  {isResolving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Mark as Resolved
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
