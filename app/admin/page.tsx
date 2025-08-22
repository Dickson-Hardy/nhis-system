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
import { Download, FileText, TrendingUp, RefreshCw, BarChart3, Activity, Users, Building2, Clock, CheckCircle, Eye, AlertCircle } from "lucide-react"
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
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-600 mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-emerald-400"></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-slate-700">Loading Dashboard</p>
            <p className="text-slate-500">Preparing your comprehensive overview...</p>
          </div>
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
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="relative rounded-3xl border border-white/20 bg-white/40 backdrop-blur-sm p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
                    NHIA Admin Dashboard
                  </h1>
                  <p className="text-xl text-slate-600 font-medium">Comprehensive healthcare insurance system oversight</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" size="lg" className="border-slate-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg" onClick={fetchDashboardData}>
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh Data
              </Button>
              <Button variant="outline" size="lg" className="border-slate-300 bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg">
                <Download className="h-5 w-5 mr-2" />
                Export Report
              </Button>
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-xl">
                <BarChart3 className="h-5 w-5 mr-2" />
                Advanced Analytics
              </Button>
            </div>
          </div>
          
          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Claims</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalClaims.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Active TPAs</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalTPAs}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Facilities</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.totalFacilities}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.pendingClaims}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Approval Rate</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.approvalRate}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ₦{(stats.totalSubmittedAmount / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl p-2">
          <TabsList className="grid w-full grid-cols-7 h-16 bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
              Overview
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
              Financial
            </TabsTrigger>
            <TabsTrigger value="tpa-performance" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
              TPA Performance
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
              Claims Pipeline
            </TabsTrigger>
            <TabsTrigger value="quality" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
              Quality Control
            </TabsTrigger>
            <TabsTrigger value="geographic" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
              Geographic
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 rounded-xl transition-all duration-200">
              Live Monitoring
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-8">
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

          {/* Enhanced Recent Claims Review */}
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 border-b border-orange-100/50 p-8">
              <CardTitle className="flex items-center space-x-3 text-2xl font-bold text-orange-900">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span>Recent Claims for Review ({recentClaims.length})</span>
              </CardTitle>
              <CardDescription className="text-lg text-orange-700 font-medium">
                Claims requiring administrative attention and processing
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {recentClaims.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircle className="h-12 w-12 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">No claims pending review</h3>
                  <p className="text-slate-600 text-lg">All submitted claims have been processed successfully</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {recentClaims.slice(0, 5).map((claim: any) => (
                    <div
                      key={claim.id}
                      className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:border-emerald-300 hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-6">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1 text-sm font-medium">
                                {claim.status.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-slate-500 font-medium">
                                {new Date(claim.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">
                              Claim: {claim.uniqueClaimId}
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-lg">
                              <strong>Beneficiary:</strong> {claim.beneficiaryName}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">TPA</p>
                              <p className="font-semibold text-slate-900">{claim.tpaName || 'Unknown'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Facility</p>
                              <p className="font-semibold text-slate-900">{claim.facilityName || 'Unknown'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Amount</p>
                              <p className="font-semibold text-slate-900">
                                ₦{claim.totalCostOfCare ? Number(claim.totalCostOfCare).toLocaleString() : '0'}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Status</p>
                              <p className="font-semibold text-slate-900 capitalize">{claim.status}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-4 ml-8">
                          <Button
                            size="lg"
                            variant="outline"
                            className="border-slate-300 hover:bg-slate-50 w-40 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Eye className="h-5 w-5 mr-2" />
                            View Details
                          </Button>
                          
                          <Button
                            size="lg"
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-xl w-40 h-12 rounded-xl transition-all duration-200 hover:shadow-2xl"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Review Claim
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
