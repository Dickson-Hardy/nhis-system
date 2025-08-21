"use client"

import { useState, useEffect } from "react"
import { AdminStats } from "@/components/admin/admin-stats"
import { ClaimsReviewTable } from "@/components/admin/claims-review-table"
import { FinancialOverviewWidget } from "@/components/admin/financial-overview-widget"
import { TPAPerformanceWidget } from "@/components/admin/tpa-performance-widget"
import { ClaimsPipelineWidget } from "@/components/admin/claims-pipeline-widget"
import { QualityControlWidget } from "@/components/admin/quality-control-widget"
import { GeographicDistributionWidget } from "@/components/admin/geographic-distribution-widget"
import { RealTimeMonitoringWidget } from "@/components/admin/real-time-monitoring-widget"
import { ExecutiveSummaryWidget } from "@/components/admin/executive-summary-widget"
import { QuickActionsWidget } from "@/components/admin/quick-actions-widget"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download, FileText, TrendingUp, RefreshCw } from "lucide-react"
import { Shield, Users, Building, Clock, Activity, BarChart3, CheckCircle, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface AdminDashboardData {
  stats: {
    totalClaims: number
    totalTPAs: number
    totalFacilities: number
    totalAmount: number
    pendingClaims: number
    approvalRate: number
    totalUsers?: number
    totalSubmittedAmount: number
    totalApprovedAmount: number
    avgClaimAmount: number
  }
  statusBreakdown: Record<string, { count: number; amount: number }>
  financialSummary: {
    totalSubmitted: number
    totalApproved: number
    pendingAmount: number
    avgClaimAmount: number
  }
  tpaPerformance: any[]
  qualityMetrics: {
    totalDuplicates: number
    duplicateAmount: number
    errorsByType: Record<string, number>
    errorsBySeverity: Record<string, number>
  }
  recentClaims: any[]
  geographicData?: any[]
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dashboard', { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        // Show empty state if API not ready
        setDashboardData({
          stats: {
            totalClaims: 0,
            totalTPAs: 0,
            totalFacilities: 0,
            totalAmount: 0,
            pendingClaims: 0,
            approvalRate: 0,
            totalUsers: 0,
            totalSubmittedAmount: 0,
            totalApprovedAmount: 0,
            avgClaimAmount: 0
          },
          statusBreakdown: {},
          financialSummary: {
            totalSubmitted: 0,
            totalApproved: 0,
            pendingAmount: 0,
            avgClaimAmount: 0
          },
          tpaPerformance: [],
          qualityMetrics: {
            totalDuplicates: 0,
            duplicateAmount: 0,
            errorsByType: {},
            errorsBySeverity: {}
          },
          recentClaims: [],
          geographicData: []
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData({
        stats: {
          totalClaims: 0,
          totalTPAs: 0,
          totalFacilities: 0,
          totalAmount: 0,
          pendingClaims: 0,
          approvalRate: 0,
          totalUsers: 0,
          totalSubmittedAmount: 0,
          totalApprovedAmount: 0,
          avgClaimAmount: 0
        },
        statusBreakdown: {},
        financialSummary: {
          totalSubmitted: 0,
          totalApproved: 0,
          pendingAmount: 0,
          avgClaimAmount: 0
        },
        tpaPerformance: [],
        qualityMetrics: {
          totalDuplicates: 0,
          duplicateAmount: 0,
          errorsByType: {},
          errorsBySeverity: {}
        },
        recentClaims: [],
        geographicData: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#088C17] mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading comprehensive dashboard...</p>
        </div>
      </div>
    )
  }

  const defaultStats = {
    totalClaims: 0,
    totalTPAs: 0,
    totalFacilities: 0,
    totalAmount: 0,
    pendingClaims: 0,
    approvalRate: 0,
    totalUsers: 0,
    totalSubmittedAmount: 0,
    totalApprovedAmount: 0,
    avgClaimAmount: 0
  }
  
  const { 
    stats = defaultStats, 
    statusBreakdown = {},
    financialSummary = { totalSubmitted: 0, totalApproved: 0, pendingAmount: 0, avgClaimAmount: 0 },
    tpaPerformance = [],
    qualityMetrics = { totalDuplicates: 0, duplicateAmount: 0, errorsByType: {}, errorsBySeverity: {} },
    recentClaims = [],
    geographicData = []
  } = dashboardData || {}

  return (
    <div className="space-y-8">
      {/* Enhanced Header with NHIA Brand Colors */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#088C17] to-[#003C06] rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">NHIA Admin Dashboard</h1>
                <p className="text-xl text-gray-600">Comprehensive healthcare insurance system oversight</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" size="lg" className="border-gray-300" onClick={fetchDashboardData}>
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline" size="lg" className="border-gray-300">
              <Download className="h-5 w-5 mr-2" />
              Export Report
            </Button>
            <Button size="lg" className="bg-[#088C17] hover:bg-[#003C06] shadow-lg">
              <BarChart3 className="h-5 w-5 mr-2" />
              Advanced Analytics
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClaims.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active TPAs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTPAs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Facilities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFacilities}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingClaims}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvalRate}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-lg font-bold text-gray-900">
                  ₦{(stats.totalSubmittedAmount / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="tpa-performance">TPA Performance</TabsTrigger>
          <TabsTrigger value="pipeline">Claims Pipeline</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions Navigation */}
          <QuickActionsWidget 
            onTabChange={setActiveTab}
            currentTab={activeTab}
          />

          {/* Executive Summary */}
          <ExecutiveSummaryWidget 
            stats={stats}
            tpaPerformance={tpaPerformance}
            qualityMetrics={qualityMetrics}
          />

          {/* Claims Pipeline Overview */}
          <ClaimsPipelineWidget 
            statusBreakdown={statusBreakdown}
            totalClaims={stats.totalClaims}
          />

          {/* Recent Claims Review */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-2xl border-b border-orange-100">
              <CardTitle className="flex items-center space-x-2 text-orange-900">
                <FileText className="h-5 w-5" />
                <span>Recent Claims for Review ({recentClaims.length})</span>
              </CardTitle>
              <CardDescription className="text-orange-700">
                Claims requiring administrative attention
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {recentClaims.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No claims pending review</h3>
                  <p className="text-gray-600">All submitted claims have been processed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentClaims.slice(0, 5).map((claim: any) => (
                    <div
                      key={claim.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                                {claim.status.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {new Date(claim.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              Claim: {claim.uniqueClaimId}
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              <strong>Beneficiary:</strong> {claim.beneficiaryName}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">TPA</p>
                              <p className="font-medium text-gray-900">{claim.tpaName || 'Unknown'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Facility</p>
                              <p className="font-medium text-gray-900">{claim.facilityName || 'Unknown'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                              <p className="font-medium text-gray-900">
                                ₦{claim.totalCostOfCare ? Number(claim.totalCostOfCare).toLocaleString() : '0'}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                              <p className="font-medium text-gray-900 capitalize">{claim.status}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-3 ml-6">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-50 w-32"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-[#088C17] to-[#003C06] hover:from-[#003C06] hover:to-[#088C17] text-white shadow-lg w-32"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <FinancialOverviewWidget 
            financialSummary={financialSummary}
            statusBreakdown={statusBreakdown}
          />
        </TabsContent>

        <TabsContent value="tpa-performance">
          <TPAPerformanceWidget tpaPerformance={tpaPerformance} />
        </TabsContent>

        <TabsContent value="pipeline">
          <ClaimsPipelineWidget 
            statusBreakdown={statusBreakdown}
            totalClaims={stats.totalClaims}
          />
        </TabsContent>

        <TabsContent value="quality">
          <QualityControlWidget 
            qualityMetrics={qualityMetrics}
            totalClaims={stats.totalClaims}
            totalAmount={stats.totalSubmittedAmount}
          />
        </TabsContent>

        <TabsContent value="geographic">
          <GeographicDistributionWidget 
            geographicData={geographicData}
            totalClaims={stats.totalClaims}
            totalAmount={stats.totalSubmittedAmount}
          />
        </TabsContent>

        <TabsContent value="monitoring">
          <RealTimeMonitoringWidget />
        </TabsContent>
      </Tabs>
    </div>
  )
}
