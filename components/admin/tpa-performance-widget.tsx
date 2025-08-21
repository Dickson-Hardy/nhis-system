"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react"

interface TPAPerformanceData {
  tpaId: number
  tpaName: string
  totalClaims: number
  totalAmount: number
  approvedAmount: number
  verifiedClaims: number
  rejectedClaims: number
  approvalRate: number
  rejectionRate: number
  avgClaimAmount: number
}

interface TPAPerformanceProps {
  tpaPerformance: TPAPerformanceData[]
}

export function TPAPerformanceWidget({ tpaPerformance }: TPAPerformanceProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  }

  const getPerformanceGrade = (approvalRate: number) => {
    if (approvalRate >= 90) return { grade: 'A+', color: 'bg-green-500' }
    if (approvalRate >= 80) return { grade: 'A', color: 'bg-green-400' }
    if (approvalRate >= 70) return { grade: 'B', color: 'bg-yellow-400' }
    if (approvalRate >= 60) return { grade: 'C', color: 'bg-orange-400' }
    return { grade: 'D', color: 'bg-red-400' }
  }

  const topPerformer = tpaPerformance.reduce((prev, current) => 
    (current.approvalRate > prev.approvalRate) ? current : prev, tpaPerformance[0])

  const highestVolume = tpaPerformance.reduce((prev, current) => 
    (current.totalClaims > prev.totalClaims) ? current : prev, tpaPerformance[0])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPerformer?.tpaName || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {topPerformer?.approvalRate.toFixed(1)}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Volume</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highestVolume?.tpaName || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {highestVolume?.totalClaims.toLocaleString()} claims
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active TPAs</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tpaPerformance.length}</div>
            <p className="text-xs text-muted-foreground">
              Processing claims
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TPA Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>TPA Performance Comparison</span>
          </CardTitle>
          <CardDescription>
            Detailed performance metrics for all Third Party Administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {tpaPerformance.map((tpa) => {
              const performance = getPerformanceGrade(tpa.approvalRate)
              return (
                <div key={tpa.tpaId} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{tpa.tpaName}</h3>
                        <Badge 
                          variant="secondary" 
                          className={`${performance.color} text-white`}
                        >
                          Grade {performance.grade}
                        </Badge>
                      </div>
                      
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{tpa.totalClaims}</div>
                          <p className="text-xs text-gray-600">Total Claims</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(tpa.totalAmount)}
                          </div>
                          <p className="text-xs text-gray-600">Total Value</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(tpa.avgClaimAmount)}
                          </div>
                          <p className="text-xs text-gray-600">Avg Claim</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">{tpa.verifiedClaims}</div>
                          <p className="text-xs text-gray-600">Verified</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{tpa.rejectedClaims}</div>
                          <p className="text-xs text-gray-600">Rejected</p>
                        </div>
                      </div>

                      {/* Performance Bars */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Approval Rate</span>
                            <span className="font-medium">{tpa.approvalRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={tpa.approvalRate} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Rejection Rate</span>
                            <span className="font-medium text-red-600">{tpa.rejectionRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={tpa.rejectionRate} className="h-2 bg-red-100" />
                        </div>
                      </div>
                    </div>

                    {/* Performance Indicator */}
                    <div className="text-right ml-4">
                      <div className="flex items-center space-x-2">
                        {tpa.approvalRate > 80 ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <span className="text-sm text-gray-600">
                          {tpa.approvalRate > 80 ? 'Excellent' : tpa.approvalRate > 60 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}