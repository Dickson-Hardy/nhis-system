"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Shield, Copy, Bug, TrendingDown, Eye, FileX } from "lucide-react"

interface QualityMetrics {
  totalDuplicates: number
  duplicateAmount: number
  errorsByType: Record<string, number>
  errorsBySeverity: Record<string, number>
}

interface QualityControlProps {
  qualityMetrics: QualityMetrics
  totalClaims: number
  totalAmount: number
}

export function QualityControlWidget({ qualityMetrics, totalClaims, totalAmount }: QualityControlProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  }

  // Calculate quality scores
  const duplicateRate = totalClaims > 0 ? (qualityMetrics.totalDuplicates / totalClaims) * 100 : 0
  const errorRate = totalClaims > 0 ? (Object.values(qualityMetrics.errorsByType).reduce((sum, count) => sum + count, 0) / totalClaims) * 100 : 0
  const qualityScore = Math.max(0, 100 - duplicateRate - errorRate)

  const getQualityGrade = (score: number) => {
    if (score >= 95) return { grade: 'A+', color: 'bg-green-500', textColor: 'text-green-700' }
    if (score >= 90) return { grade: 'A', color: 'bg-green-400', textColor: 'text-green-600' }
    if (score >= 80) return { grade: 'B', color: 'bg-yellow-400', textColor: 'text-yellow-600' }
    if (score >= 70) return { grade: 'C', color: 'bg-orange-400', textColor: 'text-orange-600' }
    return { grade: 'D', color: 'bg-red-400', textColor: 'text-red-600' }
  }

  const qualityGrade = getQualityGrade(qualityScore)

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getErrorTypeIcon = (errorType: string) => {
    switch (errorType.toLowerCase()) {
      case 'validation': return <FileX className="h-4 w-4" />
      case 'discrepancy': return <AlertTriangle className="h-4 w-4" />
      case 'fraud': return <Shield className="h-4 w-4" />
      case 'duplicate': return <Copy className="h-4 w-4" />
      default: return <Bug className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Quality Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{qualityScore.toFixed(1)}</div>
              <Badge className={`${qualityGrade.color} text-white`}>
                {qualityGrade.grade}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Overall data quality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicate Claims</CardTitle>
            <Copy className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{qualityMetrics.totalDuplicates}</div>
            <p className="text-xs text-muted-foreground">
              {duplicateRate.toFixed(2)}% of total claims
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {Object.values(qualityMetrics.errorsByType).reduce((sum, count) => sum + count, 0)} total errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Impact</CardTitle>
            <TrendingDown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(qualityMetrics.duplicateAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Duplicate claim amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Claims Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Copy className="h-5 w-5 text-orange-600" />
            <span>Duplicate Claims Detection</span>
          </CardTitle>
          <CardDescription>
            Identify and manage duplicate claim submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Duplicate Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-700">{qualityMetrics.totalDuplicates}</div>
                <p className="text-sm text-orange-600">Duplicate Groups</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-700">
                  {formatCurrency(qualityMetrics.duplicateAmount)}
                </div>
                <p className="text-sm text-orange-600">Total Value</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-700">{duplicateRate.toFixed(2)}%</div>
                <p className="text-sm text-orange-600">Duplicate Rate</p>
              </div>
            </div>

            {/* Duplicate Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Duplicate Detection Rate</span>
                <span className="font-medium">{duplicateRate.toFixed(2)}%</span>
              </div>
              <Progress value={duplicateRate} className="h-2" />
              <p className="text-xs text-gray-600">
                {duplicateRate < 1 ? 'Excellent' : duplicateRate < 3 ? 'Good' : 'Needs Attention'}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Review Duplicates
              </Button>
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Auto-Resolve
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Errors by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bug className="h-5 w-5 text-red-600" />
              <span>Errors by Type</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(qualityMetrics.errorsByType).map(([errorType, count]) => {
                const percentage = totalClaims > 0 ? (count / totalClaims) * 100 : 0
                return (
                  <div key={errorType} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getErrorTypeIcon(errorType)}
                      <span className="font-medium capitalize">{errorType.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{count}</div>
                      <div className="text-xs text-gray-600">{percentage.toFixed(2)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Errors by Severity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>Errors by Severity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(qualityMetrics.errorsBySeverity)
                .sort(([,a], [,b]) => b - a)
                .map(([severity, count]) => {
                  const percentage = totalClaims > 0 ? (count / totalClaims) * 100 : 0
                  return (
                    <div key={severity} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSeverityColor(severity)}>
                          {severity.toUpperCase()}
                        </Badge>
                        <span className="font-medium">Severity</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{count}</div>
                        <div className="text-xs text-gray-600">{percentage.toFixed(2)}%</div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Improvement Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Quality Improvement Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {duplicateRate > 2 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">High Duplicate Rate</h4>
                <p className="text-sm text-orange-700">
                  Consider implementing stronger duplicate detection during submission
                </p>
              </div>
            )}
            
            {errorRate > 5 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">High Error Rate</h4>
                <p className="text-sm text-red-700">
                  Review data validation rules and provide better guidance to TPAs
                </p>
              </div>
            )}
            
            {qualityScore > 90 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Excellent Quality</h4>
                <p className="text-sm text-green-700">
                  Your system is maintaining high data quality standards
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}