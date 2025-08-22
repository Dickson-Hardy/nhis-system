"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Calendar, 
  Download, 
  BarChart3, 
  PieChart, 
  Activity,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { exportManager } from "@/lib/export-utils"

interface PerformanceMetrics {
  totalClaims: number
  approvedClaims: number
  rejectedClaims: number
  pendingClaims: number
  totalAmount: number
  approvedAmount: number
  rejectedAmount: number
  pendingAmount: number
  approvalRate: number
  rejectionRate: number
  averageProcessingTime: number
  monthlyGrowth: number
}

interface MonthlyData {
  month: string
  claims: number
  amount: number
  approved: number
  rejected: number
}

interface TPAPerformance {
  tpaName: string
  totalClaims: number
  approvedClaims: number
  rejectedClaims: number
  approvalRate: number
  averageProcessingTime: number
}

interface TopDiagnoses {
  diagnosis: string
  count: number
  percentage: number
  totalAmount: number
}

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    pendingClaims: 0,
    totalAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
    pendingAmount: 0,
    approvalRate: 0,
    rejectionRate: 0,
    averageProcessingTime: 0,
    monthlyGrowth: 0
  })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [tpaPerformance, setTpaPerformance] = useState<TPAPerformance[]>([])
  const [topDiagnoses, setTopDiagnoses] = useState<TopDiagnoses[]>([])

  useEffect(() => {
    fetchReportsData()
  }, [timeRange])

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/facility/reports?timeRange=${timeRange}`)
      const data = await response.json()
      
      if (response.ok) {
        setMetrics(data.metrics)
        setMonthlyData(data.monthlyData)
        setTpaPerformance(data.tpaPerformance)
        setTopDiagnoses(data.topDiagnoses)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch reports data",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching reports data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-NG').format(num)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getGrowthIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (value < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const getGrowthColor = (value: number) => {
    if (value > 0) return "text-green-600"
    if (value < 0) return "text-red-600"
    return "text-gray-600"
  }

  const handleExportReport = async (type: string) => {
    try {
      let exportData: any[] = []
      let filename = ''
      
      switch (type) {
        case 'overview':
          exportData = [
            { metric: 'Total Claims', value: metrics.totalClaims },
            { metric: 'Approval Rate', value: `${metrics.approvalRate}%` },
            { metric: 'Total Amount', value: formatCurrency(metrics.totalAmount) },
            { metric: 'Average Processing Time', value: `${metrics.averageProcessingTime} days` }
          ]
          filename = 'facility-overview-report'
          break
          
        case 'tpa-performance':
          exportData = tpaPerformance.map(tpa => ({
            'TPA Name': tpa.tpaName,
            'Total Claims': tpa.totalClaims,
            'Approved Claims': tpa.approvedClaims,
            'Rejected Claims': tpa.rejectedClaims,
            'Approval Rate': `${tpa.approvalRate}%`,
            'Average Processing Time': `${tpa.averageProcessingTime} days`
          }))
          filename = 'tpa-performance-report'
          break
          
        case 'diagnoses':
          exportData = topDiagnoses.map(diagnosis => ({
            'Diagnosis': diagnosis.diagnosis,
            'Count': diagnosis.count,
            'Percentage': `${diagnosis.percentage}%`,
            'Total Amount': formatCurrency(diagnosis.totalAmount)
          }))
          filename = 'top-diagnoses-report'
          break
          
        case 'monthly-trends':
          exportData = monthlyData.map(month => ({
            'Month': month.month,
            'Claims Count': month.claims,
            'Total Amount': formatCurrency(month.amount),
            'Growth Rate': 'N/A' // MonthlyData doesn't have growthRate property
          }))
          filename = 'monthly-trends-report'
          break
          
        case 'all':
          // Export comprehensive report
          const response = await fetch(`/api/facility/reports?timeRange=${timeRange}`)
          if (response.ok) {
            const reportData = await response.json()
            const csvContent = exportManager.exportFacilityReport(reportData, { format: 'csv' })
            exportManager.downloadExport(csvContent, { 
              format: 'csv', 
              filename: `facility-comprehensive-report-${format(new Date(), 'yyyy-MM-dd')}` 
            })
            return
          }
          break
          
        default:
          exportData = []
          filename = 'facility-report'
      }
      
      if (exportData.length > 0) {
        const csvContent = exportManager.exportToCSV(exportData, { format: 'csv' })
        exportManager.downloadExport(csvContent, { 
          format: 'csv', 
          filename: `${filename}-${format(new Date(), 'yyyy-MM-dd')}` 
        })
        
        toast({
          title: "Export Successful",
          description: `${type} report exported successfully`,
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading reports...</div>
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
              Reports & Analytics
            </h1>
            <p className="text-xl text-green-100 font-medium drop-shadow-md">
              Track your facility's performance and insights
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/20">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(metrics.totalClaims)}</div>
            <div className="flex items-center space-x-2 text-xs text-blue-600">
              {getGrowthIcon(metrics.monthlyGrowth)}
              <span className={getGrowthColor(metrics.monthlyGrowth)}>
                {metrics.monthlyGrowth > 0 ? '+' : ''}{formatPercentage(metrics.monthlyGrowth)}
              </span>
              <span>vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPercentage(metrics.approvalRate)}</div>
            <div className="text-xs text-green-600 mt-1">
              {metrics.approvedClaims} of {metrics.totalClaims} claims approved
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.totalAmount)}</div>
            <div className="text-xs text-purple-600 mt-1">
              {formatCurrency(metrics.approvedAmount)} approved
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.averageProcessingTime} days</div>
            <div className="text-xs text-orange-600 mt-1">
              Time from submission to decision
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
            Performance
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
            Trends
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Claims Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Claims Status Distribution
                </CardTitle>
                <CardDescription>Breakdown of claims by current status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <div className="text-sm font-medium">
                      {formatNumber(metrics.pendingClaims)} ({formatPercentage((metrics.pendingClaims / metrics.totalClaims) * 100)})
                    </div>
                  </div>
                  <Progress value={(metrics.pendingClaims / metrics.totalClaims) * 100} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Approved</span>
                    </div>
                    <div className="text-sm font-medium">
                      {formatNumber(metrics.approvedClaims)} ({formatPercentage(metrics.approvalRate)})
                    </div>
                  </div>
                  <Progress value={metrics.approvalRate} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Rejected</span>
                    </div>
                    <div className="text-sm font-medium">
                      {formatNumber(metrics.rejectedClaims)} ({formatPercentage(metrics.rejectionRate)})
                    </div>
                  </div>
                  <Progress value={metrics.rejectionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
                <CardDescription>Amount breakdown by status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-700">Approved Amount</span>
                    <span className="text-lg font-bold text-green-700">{formatCurrency(metrics.approvedAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-700">Pending Amount</span>
                    <span className="text-lg font-bold text-blue-700">{formatCurrency(metrics.pendingAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-red-700">Rejected Amount</span>
                    <span className="text-lg font-bold text-red-700">{formatCurrency(metrics.rejectedAmount)}</span>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Value</span>
                    <span className="text-xl font-bold text-emerald-600">{formatCurrency(metrics.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* TPA Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    TPA Performance Analysis
                  </CardTitle>
                  <CardDescription>How different TPAs are performing with your claims</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExportReport('tpa-performance')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tpaPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No TPA performance data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tpaPerformance.map((tpa, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{tpa.tpaName}</h4>
                        <Badge variant={tpa.approvalRate >= 80 ? "default" : tpa.approvalRate >= 60 ? "secondary" : "destructive"}>
                          {formatPercentage(tpa.approvalRate)} Approval Rate
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Claims:</span>
                          <span className="ml-2 font-medium">{formatNumber(tpa.totalClaims)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Approved:</span>
                          <span className="ml-2 font-medium text-green-600">{formatNumber(tpa.approvedClaims)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Time:</span>
                          <span className="ml-2 font-medium">{tpa.averageProcessingTime} days</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Diagnoses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Diagnoses
                  </CardTitle>
                  <CardDescription>Most common diagnoses and their financial impact</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExportReport('diagnoses')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topDiagnoses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No diagnosis data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topDiagnoses.map((diagnosis, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium">{diagnosis.diagnosis}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(diagnosis.count)} claims ({formatPercentage(diagnosis.percentage)})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(diagnosis.totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">
                          Avg: {formatCurrency(diagnosis.totalAmount / diagnosis.count)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Trends
              </CardTitle>
              <CardDescription>Claims and amounts over time</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No trend data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monthlyData.map((month, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{month.month}</h4>
                        <Badge variant="outline">{formatNumber(month.claims)} claims</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="ml-2 font-medium">{formatCurrency(month.amount)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Approved:</span>
                          <span className="ml-2 font-medium text-green-600">{formatNumber(month.approved)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rejected:</span>
                          <span className="ml-2 font-medium text-red-600">{formatNumber(month.rejected)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Key Insights
              </CardTitle>
              <CardDescription>Actionable recommendations based on your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.approvalRate < 70 && (
                  <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900">Low Approval Rate</h4>
                      <p className="text-sm text-red-700">
                        Your approval rate of {formatPercentage(metrics.approvalRate)} is below the recommended 70%. 
                        Consider reviewing common rejection reasons and improving documentation quality.
                      </p>
                    </div>
                  </div>
                )}

                {metrics.averageProcessingTime > 14 && (
                  <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900">Slow Processing Time</h4>
                      <p className="text-sm text-yellow-700">
                        Average processing time of {metrics.averageProcessingTime} days is above the target of 14 days. 
                        Consider following up with TPAs on pending claims.
                      </p>
                    </div>
                  </div>
                )}

                {metrics.monthlyGrowth > 0 && (
                  <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900">Positive Growth Trend</h4>
                      <p className="text-sm text-green-700">
                        Great job! Your claims volume has increased by {formatPercentage(metrics.monthlyGrowth)} compared to last period. 
                        Keep up the momentum while maintaining quality standards.
                      </p>
                    </div>
                  </div>
                )}

                {metrics.rejectedAmount > metrics.totalAmount * 0.3 && (
                  <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <XCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-900">High Rejection Value</h4>
                      <p className="text-sm text-orange-700">
                        Rejected claims represent {formatPercentage((metrics.rejectedAmount / metrics.totalAmount) * 100)} of your total claim value. 
                        Focus on improving claim quality to reduce financial impact.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
