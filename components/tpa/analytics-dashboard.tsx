"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  FileText,
  DollarSign,
  Users,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  Globe
} from "lucide-react"

interface AnalyticsData {
  claimsOverview: {
    totalClaims: number
    approvedClaims: number
    rejectedClaims: number
    pendingClaims: number
    totalValue: number
    approvedValue: number
    rejectedValue: number
    averageClaimValue: number
    averageProcessingTime: number
  }
  
  monthlyTrends: {
    month: string
    claimsSubmitted: number
    claimsApproved: number
    claimsRejected: number
    totalValue: number
    approvedValue: number
  }[]
  
  facilityPerformance: {
    facilityName: string
    state: string
    totalClaims: number
    approvalRate: number
    averageClaimValue: number
    totalValue: number
    riskScore: number
  }[]
  
  diagnosisBreakdown: {
    diagnosis: string
    count: number
    totalValue: number
    averageValue: number
    approvalRate: number
  }[]
  
  tpaPerformance: {
    tpaName: string
    totalClaims: number
    approvedClaims: number
    averageProcessingTime: number
    totalValue: number
    approvedValue: number
    rejectionRate: number
  }[]
  
  costAnalysis: {
    category: string
    nhiaStandard: number
    actualAverage: number
    variance: number
    variancePercentage: number
  }[]
}

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("last_30_days")
  const [selectedMetric, setSelectedMetric] = useState("claims_volume")

  useEffect(() => {
    // Load real analytics data from API
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Fetch real analytics data from API endpoints
      const [overviewResponse, trendsResponse, facilitiesResponse] = await Promise.all([
        fetch(`/api/analytics/overview?period=${selectedPeriod}`, { credentials: 'include' }),
        fetch(`/api/analytics/trends?period=${selectedPeriod}`, { credentials: 'include' }),
        fetch(`/api/analytics/facilities?period=${selectedPeriod}`, { credentials: 'include' })
      ])

      if (overviewResponse.ok && trendsResponse.ok && facilitiesResponse.ok) {
        const [overview, trends, facilities] = await Promise.all([
          overviewResponse.json(),
          trendsResponse.json(),
          facilitiesResponse.json()
        ])

        setAnalyticsData({
          claimsOverview: overview.data || {
            totalClaims: 0,
            approvedClaims: 0,
            rejectedClaims: 0,
            pendingClaims: 0,
            totalValue: 0,
            approvedValue: 0,
            rejectedValue: 0,
            averageClaimValue: 0,
            averageProcessingTime: 0
          },
          monthlyTrends: trends.data || [],
          facilityPerformance: facilities.data || [],
          diagnosisBreakdown: [],
          tpaPerformance: [],
          costAnalysis: []
        })
      } else {
        // If API endpoints are not ready, show empty state
        setAnalyticsData({
          claimsOverview: {
            totalClaims: 0,
            approvedClaims: 0,
            rejectedClaims: 0,
            pendingClaims: 0,
            totalValue: 0,
            approvedValue: 0,
            rejectedValue: 0,
            averageClaimValue: 0,
            averageProcessingTime: 0
          },
          monthlyTrends: [],
          facilityPerformance: [],
          diagnosisBreakdown: [],
          tpaPerformance: [],
          costAnalysis: []
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Show empty state on error
      setAnalyticsData({
        claimsOverview: {
          totalClaims: 0,
          approvedClaims: 0,
          rejectedClaims: 0,
          pendingClaims: 0,
          totalValue: 0,
          approvedValue: 0,
          rejectedValue: 0,
          averageClaimValue: 0,
          averageProcessingTime: 0
        },
        monthlyTrends: [],
        facilityPerformance: [],
        diagnosisBreakdown: [],
        tpaPerformance: [],
        costAnalysis: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Activity className="h-8 w-8 animate-pulse text-blue-600" />
          <span className="ml-2 text-slate-600">Loading analytics data...</span>
        </div>
      </div>
    )
  }

  const { claimsOverview } = analyticsData

  return (
    <div className="space-y-6">
      {/* Analytics Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Claims Analytics Dashboard
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Comprehensive analytics and insights for healthcare claims management
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
                <p className="text-3xl font-bold">{claimsOverview.totalClaims.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">↑ 12%</span> vs last period
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {((claimsOverview.approvedClaims / claimsOverview.totalClaims) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">↑ 2.3%</span> vs last period
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold text-blue-600">
                  ₦{(claimsOverview.totalValue / 1000000).toFixed(0)}M
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">↑ 8.5%</span> vs last period
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Processing Time</p>
                <p className="text-3xl font-bold text-orange-600">
                  {claimsOverview.averageProcessingTime} days
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-red-600">↑ 1.2 days</span> vs last period
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="tpa">TPA Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Claims Trend (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{trend.month}</span>
                          <span>{trend.claimsSubmitted} claims</span>
                        </div>
                        <Progress 
                          value={(trend.claimsApproved / trend.claimsSubmitted) * 100} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Approved: {trend.claimsApproved}</span>
                          <span>₦{(trend.approvedValue / 1000000).toFixed(1)}M</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Claims Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Approved</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{claimsOverview.approvedClaims}</p>
                      <p className="text-xs text-green-600">
                        {((claimsOverview.approvedClaims / claimsOverview.totalClaims) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Rejected</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{claimsOverview.rejectedClaims}</p>
                      <p className="text-xs text-red-600">
                        {((claimsOverview.rejectedClaims / claimsOverview.totalClaims) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{claimsOverview.pendingClaims}</p>
                      <p className="text-xs text-yellow-600">
                        {((claimsOverview.pendingClaims / claimsOverview.totalClaims) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Facility Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.facilityPerformance.map((facility, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-sm">{facility.facilityName}</h3>
                          <p className="text-xs text-muted-foreground">{facility.state} State</p>
                        </div>
                        <Badge className={`${facility.riskScore < 3 ? 'bg-green-100 text-green-800' : 
                                          facility.riskScore < 4 ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-red-100 text-red-800'}`}>
                          Risk: {facility.riskScore}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold">{facility.totalClaims}</div>
                          <div className="text-xs text-muted-foreground">Claims</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">{facility.approvalRate}%</div>
                          <div className="text-xs text-muted-foreground">Approval</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">₦{(facility.averageClaimValue / 1000).toFixed(0)}K</div>
                          <div className="text-xs text-muted-foreground">Avg Value</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">₦{(facility.totalValue / 1000000).toFixed(1)}M</div>
                          <div className="text-xs text-muted-foreground">Total Value</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnoses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Top Diagnoses & Procedures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.diagnosisBreakdown.map((diagnosis, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{diagnosis.diagnosis}</h3>
                      <Badge className="bg-blue-100 text-blue-800">
                        {diagnosis.count} cases
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold">₦{(diagnosis.totalValue / 1000000).toFixed(1)}M</div>
                        <div className="text-xs text-muted-foreground">Total Value</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">₦{(diagnosis.averageValue / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-muted-foreground">Avg Value</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{diagnosis.approvalRate}%</div>
                        <div className="text-xs text-muted-foreground">Approval Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Variance Analysis vs NHIA Standards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.costAnalysis.map((cost, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{cost.category}</h3>
                      <Badge className={`${cost.variancePercentage > 30 ? 'bg-red-100 text-red-800' : 
                                        cost.variancePercentage > 15 ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-green-100 text-green-800'}`}>
                        {cost.variancePercentage > 0 ? '+' : ''}{cost.variancePercentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center mb-3">
                      <div>
                        <div className="text-sm font-medium">NHIA Standard</div>
                        <div className="text-lg font-bold text-green-600">₦{cost.nhiaStandard.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Actual Average</div>
                        <div className="text-lg font-bold text-blue-600">₦{cost.actualAverage.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Variance</div>
                        <div className={`text-lg font-bold ${cost.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {cost.variance > 0 ? '+' : ''}₦{cost.variance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min((cost.actualAverage / cost.nhiaStandard) * 100, 200)} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tpa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                TPA Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.tpaPerformance.map((tpa, index) => (
                  <Card key={index} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{tpa.tpaName}</h3>
                        <Badge className={`${tpa.rejectionRate < 10 ? 'bg-green-100 text-green-800' : 
                                          tpa.rejectionRate < 20 ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-red-100 text-red-800'}`}>
                          {tpa.rejectionRate.toFixed(1)}% rejection rate
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold">{tpa.totalClaims}</div>
                          <div className="text-xs text-muted-foreground">Total Claims</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-green-600">{tpa.approvedClaims}</div>
                          <div className="text-xs text-muted-foreground">Approved</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">{tpa.averageProcessingTime} days</div>
                          <div className="text-xs text-muted-foreground">Avg Processing</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">₦{(tpa.approvedValue / 1000000).toFixed(0)}M</div>
                          <div className="text-xs text-muted-foreground">Approved Value</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
