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
  Search, 
  Eye, 
  Flag,
  RefreshCw,
  Users,
  Building,
  TrendingUp,
  AlertCircle,
  Clock,
  Shield,
  BarChart3,
  Filter,
  Download,
  MoreHorizontal,
  ChevronRight,
  Activity
} from "lucide-react"

interface ErrorLog {
  id: number
  batchId: number
  claimId?: number
  tpaId: number
  facilityId: number
  errorType: 'validation' | 'discrepancy' | 'fraud' | 'quality'
  errorCategory: 'missing_data' | 'duplicate' | 'cost_anomaly' | 'decision_mismatch'
  severity: 'low' | 'medium' | 'high' | 'critical'
  errorCode: string
  errorTitle: string
  errorDescription: string
  fieldName?: string
  expectedValue?: string
  actualValue?: string
  expectedAmount?: number
  actualAmount?: number
  amountDeviation?: number
  deviationPercentage?: number
  status: 'open' | 'under_review' | 'resolved' | 'ignored' | 'escalated'
  resolution?: string
  createdAt: string
  updatedAt: string
  batchNumber?: string
  claimNumber?: string
  facilityName?: string
  tpaName?: string
  createdByUser?: string
}

interface ErrorStatistics {
  totalErrors: number
  openErrors: number
  resolvedErrors: number
  escalatedErrors: number
  criticalErrors: number
  highErrors: number
  mediumErrors: number
  lowErrors: number
  errorsByCategory: Record<string, number>
  errorsByType: Record<string, number>
  errorsByTpa: Record<string, number>
}

export function AdminErrorLogs() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [statistics, setStatistics] = useState<ErrorStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)
  const [isEscalateDialogOpen, setIsEscalateDialogOpen] = useState(false)
  const [escalationNotes, setEscalationNotes] = useState("")
  const [isEscalating, setIsEscalating] = useState(false)
  const [selectedTab, setSelectedTab] = useState("overview")

  useEffect(() => {
    fetchErrorLogs()
  }, [])

  const fetchErrorLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/error-logs', { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        setErrorLogs(data.errorLogs || [])
        setStatistics(data.statistics || null)
      } else {
        setErrorLogs([])
        setStatistics(null)
      }
    } catch (error) {
      console.error('Error fetching error logs:', error)
      setErrorLogs([])
      setStatistics(null)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-200'
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'ignored': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'escalated': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getErrorTypeIcon = (errorType: string) => {
    switch (errorType) {
      case 'fraud': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'discrepancy': return <XCircle className="h-4 w-4 text-orange-500" />
      case 'validation': return <Shield className="h-4 w-4 text-blue-500" />
      case 'quality': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredErrors = errorLogs.filter(error => {
    const matchesSearch = 
      error.errorTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.errorDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.tpaName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.facilityName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || error.status === statusFilter
    const matchesSeverity = severityFilter === "all" || error.severity === severityFilter
    
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const handleEscalateError = async () => {
    if (!selectedError || !escalationNotes.trim()) return
    
    setIsEscalating(true)
    try {
      const response = await fetch('/api/admin/error-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          errorLogId: selectedError.id,
          action: 'escalate',
          notes: escalationNotes
        })
      })

      if (response.ok) {
        setErrorLogs(prev => prev.map(error => 
          error.id === selectedError.id 
            ? { ...error, status: 'escalated' }
            : error
        ))
        setIsEscalateDialogOpen(false)
        setSelectedError(null)
        setEscalationNotes("")
        fetchErrorLogs()
      }
    } catch (error) {
      console.error('Error escalating issue:', error)
    } finally {
      setIsEscalating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#088C17] mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading error logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Better Visual Hierarchy */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">System Error Logs</h1>
                <p className="text-xl text-gray-600">Comprehensive oversight & quality control</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="lg" className="border-gray-300">
              <Download className="h-5 w-5 mr-2" />
              Export Report
            </Button>
            <Button size="lg" className="bg-[#088C17] hover:bg-[#003C06] shadow-lg" onClick={fetchErrorLogs}>
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Row */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Errors</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalErrors}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Open Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.openErrors}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Flag className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Escalated</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.escalatedErrors}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.resolvedErrors}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Tabs with Better Styling */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tpa-monitoring" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" />
            TPA Monitoring
          </TabsTrigger>
          <TabsTrigger value="error-details" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Activity className="h-4 w-4 mr-2" />
            Error Details
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab with Enhanced Charts */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Error Distribution Chart */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl border-b border-blue-100">
                <CardTitle className="flex items-center space-x-2 text-blue-900">
                  <BarChart3 className="h-5 w-5" />
                  <span>Errors by Category</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {statistics && Object.entries(statistics.errorsByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="capitalize font-medium text-gray-700">{category.replace('_', ' ')}</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      {count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Enhanced TPA Performance Chart */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl border-b border-green-100">
                <CardTitle className="flex items-center space-x-2 text-green-900">
                  <Users className="h-5 w-5" />
                  <span>Errors by TPA</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {statistics && Object.entries(statistics.errorsByTpa).map(([tpa, count]) => (
                  <div key={tpa} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-700">{tpa}</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      {count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced TPA Monitoring Tab */}
        <TabsContent value="tpa-monitoring" className="space-y-6">
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl border-b border-purple-100">
              <CardTitle className="flex items-center space-x-2 text-purple-900">
                <Users className="h-5 w-5" />
                <span>TPA Performance Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {statistics && Object.entries(statistics.errorsByTpa).map(([tpa, count]) => (
                  <div key={tpa} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{tpa}</h3>
                          <p className="text-sm text-gray-600">Total Errors: {count}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                        {count} Issues
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                        <Users className="h-4 w-4 mr-2" />
                        Contact TPA
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Performance
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Error Details Tab */}
        <TabsContent value="error-details" className="space-y-6">
          {/* Enhanced Filters with Better Design */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-2xl border-b border-orange-100">
              <CardTitle className="flex items-center space-x-2 text-orange-900">
                <Filter className="h-5 w-5" />
                <span>Advanced Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search errors, TPAs, facilities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-[#088C17] focus:ring-[#088C17] rounded-xl"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 border-gray-300 focus:border-[#088C17] focus:ring-[#088C17] rounded-xl">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="h-12 border-gray-300 focus:border-[#088C17] focus:ring-[#088C17] rounded-xl">
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
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
                    {filteredErrors.length} results
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Error Logs Display */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-2xl border-b border-gray-200">
              <CardTitle className="flex items-center space-x-2 text-gray-900">
                <Activity className="h-5 w-5" />
                <span>Error Logs ({filteredErrors.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filteredErrors.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No errors found</h3>
                  <p className="text-gray-600">All issues have been resolved or no errors match your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredErrors.map((error) => (
                    <div
                      key={error.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          {/* Header with Icons and Badges */}
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {getErrorTypeIcon(error.errorType)}
                              <Badge className={getSeverityColor(error.severity)}>
                                {error.severity.toUpperCase()}
                              </Badge>
                              <Badge className={getStatusColor(error.status)}>
                                {error.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(error.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {/* Error Title and Description */}
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {error.errorTitle}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              {error.errorDescription}
                            </p>
                          </div>
                          
                          {/* Error Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">TPA</p>
                              <p className="font-medium text-gray-900">{error.tpaName || 'Unknown'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Facility</p>
                              <p className="font-medium text-gray-900">{error.facilityName || 'Unknown'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Category</p>
                              <p className="font-medium text-gray-900 capitalize">{error.errorCategory.replace('_', ' ')}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</p>
                              <p className="font-medium text-gray-900 capitalize">{error.errorType}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-3 ml-6">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-50 w-32"
                            onClick={() => setSelectedError(error)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          
                          {error.status === 'open' && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg w-32"
                              onClick={() => {
                                setSelectedError(error)
                                setIsEscalateDialogOpen(true)
                              }}
                            >
                              <Flag className="h-4 w-4 mr-2" />
                              Escalate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Escalate Error Dialog */}
      <Dialog open={isEscalateDialogOpen} onOpenChange={setIsEscalateDialogOpen}>
        <DialogContent className="max-w-2xl border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl p-6 border-b border-purple-100">
            <DialogTitle className="flex items-center space-x-2 text-purple-900">
              <Flag className="h-5 w-5" />
              <span>Escalate Error</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedError && (
            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <h4 className="font-semibold mb-3 text-purple-900 text-lg">{selectedError.errorTitle}</h4>
                <p className="text-purple-700 mb-4">{selectedError.errorDescription}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-purple-800">TPA:</span> {selectedError.tpaName}
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Facility:</span> {selectedError.facilityName}
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Severity:</span> {selectedError.severity.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-purple-800">Category:</span> {selectedError.errorCategory.replace('_', ' ')}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="escalationNotes" className="text-gray-700 font-medium">Escalation Notes</Label>
                <Textarea
                  id="escalationNotes"
                  placeholder="Describe why this error needs escalation and what actions should be taken..."
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  className="min-h-[120px] border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl resize-none"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEscalateDialogOpen(false)}
                  className="border-gray-300 hover:bg-gray-50 px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEscalateError}
                  disabled={!escalationNotes.trim() || isEscalating}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg px-6"
                >
                  {isEscalating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Escalating...
                    </>
                  ) : (
                    <>
                      <Flag className="h-4 w-4 mr-2" />
                      Escalate Error
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
