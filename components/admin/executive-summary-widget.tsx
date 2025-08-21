"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown, 
  Crown,
  Target,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Users,
  Activity,
  Calendar
} from "lucide-react"

interface ExecutiveSummaryProps {
  stats: {
    totalClaims: number
    totalTPAs: number
    totalFacilities: number
    approvalRate: number
    totalSubmittedAmount: number
    totalApprovedAmount: number
    avgClaimAmount: number
  }
  tpaPerformance: any[]
  qualityMetrics: {
    totalDuplicates: number
    duplicateAmount: number
    errorsByType: Record<string, number>
    errorsBySeverity: Record<string, number>
  }
}

export function ExecutiveSummaryWidget({ stats, tpaPerformance, qualityMetrics }: ExecutiveSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  }

  // Calculate key insights
  const processedAmount = stats.totalApprovedAmount || 0
  const pendingAmount = stats.totalSubmittedAmount - processedAmount
  const systemEfficiency = stats.totalSubmittedAmount > 0 ? (processedAmount / stats.totalSubmittedAmount) * 100 : 0
  
  // Quality score calculation
  const duplicateRate = stats.totalClaims > 0 ? (qualityMetrics.totalDuplicates / stats.totalClaims) * 100 : 0
  const qualityScore = Math.max(0, 100 - duplicateRate)
  
  // Top performing TPA
  const topTPA = tpaPerformance.length > 0 
    ? tpaPerformance.reduce((prev, current) => 
        (current.approvalRate > prev.approvalRate) ? current : prev
      ) 
    : null

  // Risk indicators
  const riskIndicators = [
    {
      title: "High Duplicate Rate",
      condition: duplicateRate > 3,
      severity: "medium",
      description: `${duplicateRate.toFixed(1)}% duplicate rate detected`
    },
    {
      title: "Low Approval Rate", 
      condition: stats.approvalRate < 70,
      severity: "high",
      description: `${stats.approvalRate}% approval rate is below target`
    },
    {
      title: "Processing Backlog",
      condition: systemEfficiency < 80,
      severity: "medium", 
      description: `${(100 - systemEfficiency).toFixed(1)}% of claims pending processing`
    }
  ]

  const activeRisks = riskIndicators.filter(risk => risk.condition)

  const getPerformanceGrade = (rate: number) => {
    if (rate >= 90) return { grade: 'A', color: 'bg-green-500', textColor: 'text-green-700' }
    if (rate >= 80) return { grade: 'B', color: 'bg-blue-500', textColor: 'text-blue-700' }
    if (rate >= 70) return { grade: 'C', color: 'bg-yellow-500', textColor: 'text-yellow-700' }
    return { grade: 'D', color: 'bg-red-500', textColor: 'text-red-700' }
  }

  const overallGrade = getPerformanceGrade(stats.approvalRate)

  return (
    <div className="space-y-6">
      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Value Processed</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(stats.totalSubmittedAmount)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Across {stats.totalClaims.toLocaleString()} claims
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-600 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approval Rate</p>
                <div className="flex items-center space-x-2">
                  <p className="text-3xl font-bold text-green-900">{stats.approvalRate}%</p>
                  <Badge className={`${overallGrade.color} text-white`}>
                    {overallGrade.grade}
                  </Badge>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  {stats.approvalRate > 80 ? 'Excellent' : stats.approvalRate > 60 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
              <Target className="h-12 w-12 text-green-600 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Network Coverage</p>
                <p className="text-3xl font-bold text-purple-900">
                  {stats.totalTPAs + stats.totalFacilities}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {stats.totalTPAs} TPAs, {stats.totalFacilities} facilities
                </p>
              </div>
              <Users className="h-12 w-12 text-purple-600 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Quality Score</p>
                <div className="flex items-center space-x-2">
                  <p className="text-3xl font-bold text-orange-900">{qualityScore.toFixed(0)}</p>
                  <Badge variant={qualityScore > 95 ? "default" : "secondary"}>
                    {qualityScore > 95 ? 'Excellent' : qualityScore > 85 ? 'Good' : 'Fair'}
                  </Badge>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  {qualityMetrics.totalDuplicates} duplicates detected
                </p>
              </div>
              <Activity className="h-12 w-12 text-orange-600 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>System Performance</span>
            </CardTitle>
            <CardDescription>
              Key performance indicators and operational metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Claims Processing Efficiency</span>
                  <span className="text-sm text-gray-600">{systemEfficiency.toFixed(1)}%</span>
                </div>
                <Progress value={systemEfficiency} className="h-3" />
                <p className="text-xs text-gray-600 mt-1">
                  {formatCurrency(processedAmount)} processed of {formatCurrency(stats.totalSubmittedAmount)} total
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Data Quality Score</span>
                  <span className="text-sm text-gray-600">{qualityScore.toFixed(1)}%</span>
                </div>
                <Progress value={qualityScore} className="h-3" />
                <p className="text-xs text-gray-600 mt-1">
                  {qualityScore > 95 ? 'Excellent data integrity' : 'Room for improvement in data quality'}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Network Utilization</span>
                  <span className="text-sm text-gray-600">
                    {((stats.totalClaims / (stats.totalFacilities || 1)) * 10).toFixed(0)}%
                  </span>
                </div>
                <Progress value={Math.min(100, (stats.totalClaims / (stats.totalFacilities || 1)) * 10)} className="h-3" />
                <p className="text-xs text-gray-600 mt-1">
                  Average claims per facility utilization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>Risk Assessment</span>
            </CardTitle>
            <CardDescription>
              Potential issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeRisks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">All Systems Green</h3>
                <p className="text-gray-600">No significant risks detected in current operations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRisks.map((risk, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{risk.title}</h4>
                          <Badge 
                            variant={risk.severity === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {risk.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{risk.description}</p>
                      </div>
                      <AlertCircle className={`h-5 w-5 ${risk.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <span>Strategic Insights</span>
          </CardTitle>
          <CardDescription>
            Key findings and recommendations for executive review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">Period Performance</h3>
              <p className="text-sm text-blue-700">
                Processing {formatCurrency(stats.avgClaimAmount)} average per claim with {stats.approvalRate}% approval rate
              </p>
            </div>

            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <Crown className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-900 mb-2">Top Performer</h3>
              <p className="text-sm text-green-700">
                {topTPA ? (
                  <>
                    <strong>{topTPA.tpaName}</strong> leads with {topTPA.approvalRate.toFixed(1)}% approval rate
                  </>
                ) : (
                  'Performance data being analyzed'
                )}
              </p>
            </div>

            <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-900 mb-2">Growth Opportunity</h3>
              <p className="text-sm text-purple-700">
                {systemEfficiency > 90 
                  ? 'Excellent operational efficiency - consider capacity expansion'
                  : 'Focus on improving processing efficiency and reducing bottlenecks'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}