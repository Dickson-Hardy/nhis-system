"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  TrendingUp,
  Clock,
  Activity,
  Shield,
  Users,
  BarChart3,
  Settings,
  Upload,
} from "lucide-react"
import BatchManagement from "@/components/tpa/batch-management"
import { useClaims } from "@/hooks/use-claims"
import { useState } from "react"

export default function TPADashboard() {
  const { claims, stats, loading, error, refetch } = useClaims()

  const recentActivities = [
    { action: "New claim submitted", facility: "Lagos University Teaching Hospital", time: "2 hours ago", icon: FileText, color: "text-blue-600" },
    { action: "Claim verified", claimId: "CLM-HCI-2025-001", time: "4 hours ago", icon: FileText, color: "text-green-600" },
    { action: "Batch uploaded for verification", count: 5, time: "1 day ago", icon: Activity, color: "text-purple-600" },
    { action: "Payment processed", amount: "₦625,000", time: "2 days ago", icon: FileText, color: "text-emerald-600" },
  ]

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Enhanced Loading Header */}
        <div className="bg-gradient-to-br from-[#088C17] to-[#003C06] rounded-2xl h-40 shadow-xl"></div>
        
        {/* Enhanced Loading Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-32 shadow-md"></div>
          ))}
        </div>
        
        {/* Enhanced Loading Content */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-96 shadow-md"></div>
        
        {/* Enhanced Loading Indicator */}
        <div className="flex items-center justify-center py-16">
          <div className="relative">
            <div className="w-20 h-20 border-6 border-[#088C17]/20 border-t-[#088C17] rounded-full animate-spin shadow-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-[#088C17] rounded-full flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="ml-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading TPA Dashboard</h3>
            <p className="text-lg text-gray-600">Fetching your latest claims data...</p>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#088C17] rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-[#088C17] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-[#088C17] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Enhanced Professional Header with NHIA Brand Colors */}
      <div className="bg-gradient-to-br from-[#088C17] via-[#16a085] to-[#003C06] rounded-3xl border-0 p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-8 lg:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
                <Shield className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-6xl font-bold tracking-tight text-white mb-3 drop-shadow-lg">TPA Dashboard</h1>
                <p className="text-2xl text-green-100 font-medium drop-shadow-md max-w-2xl">
                  Professional claims verification and healthcare facility partnership management
                </p>
              </div>
            </div>
            
            {/* Enhanced Status Indicators */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/30 shadow-lg">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-white font-semibold text-lg drop-shadow-md">System Online</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/30 shadow-lg">
                <Clock className="h-6 w-6 text-blue-200" />
                <span className="text-white font-medium text-lg drop-shadow-md">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/30 shadow-lg">
                <TrendingUp className="h-6 w-6 text-green-400" />
                <span className="text-white font-semibold text-lg drop-shadow-md">Performance: Excellent</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Action Buttons */}
          <div className="flex flex-col space-y-4 lg:items-end">
            <div className="hidden md:block mb-4">
              <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
                <Shield className="h-12 w-12 text-white drop-shadow-lg" />
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <Button variant="outline" size="lg" className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm h-14 px-8 drop-shadow-md text-lg font-semibold">
                <FileText className="h-6 w-6 mr-3" />
                Export Report
              </Button>
              <Button className="bg-white text-[#088C17] hover:bg-gray-100 shadow-2xl h-14 px-8 font-bold text-lg" onClick={refetch}>
                <Activity className="h-6 w-6 mr-3" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Enhanced Professional Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-blue-800">Submitted</CardTitle>
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-blue-700 group-hover:bg-blue-700 transition-colors duration-300">
              <FileText className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-900 mb-2">{stats.submitted}</div>
            <p className="text-sm text-blue-700 font-medium">Claims received</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-orange-800">Awaiting Verification</CardTitle>
            <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-orange-700 group-hover:bg-orange-700 transition-colors duration-300">
              <Clock className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-900 mb-2">{stats.awaitingVerification}</div>
            <p className="text-sm text-orange-700 font-medium">Pending review</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-red-800">Not Verified</CardTitle>
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-red-700 group-hover:bg-red-700 transition-colors duration-300">
              <FileText className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-900 mb-2">{stats.notVerified}</div>
            <p className="text-sm text-red-700 font-medium">Rejected claims</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-green-800">Verified</CardTitle>
            <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-green-700 group-hover:bg-green-700 transition-colors duration-300">
              <FileText className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900 mb-2">{stats.verified}</div>
            <p className="text-sm text-green-700 font-medium">Approved claims</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-purple-800">Awaiting Payment</CardTitle>
            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-purple-700 group-hover:bg-purple-700 transition-colors duration-300">
              <FileText className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-900 mb-2">{stats.verifiedAwaitingPayment}</div>
            <p className="text-sm text-purple-700 font-medium">Ready for payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-emerald-800">Paid</CardTitle>
            <div className="w-14 h-14 bg-emerald-700 rounded-2xl flex items-center justify-center shadow-lg border-2 border-emerald-800 group-hover:bg-emerald-800 transition-colors duration-300">
              <TrendingUp className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-900 mb-2">{stats.verifiedPaid}</div>
            <p className="text-sm text-emerald-700 font-medium">Payments completed</p>
          </CardContent>
        </Card>
      </div>

      <BatchManagement />

      {/* Clean Dashboard Overview - Claims Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions Card */}
        <Card className="shadow-xl border-2 border-gray-200 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#088C17] rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Quick Actions</CardTitle>
                <p className="text-gray-600">Essential TPA operations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-16 bg-[#088C17] hover:bg-[#003C06] text-white shadow-lg font-semibold text-lg rounded-xl">
                <FileText className="h-6 w-6 mr-3" />
                Process Claims
              </Button>
              <Button className="h-16 bg-[#104D7F] hover:bg-[#0d3f6b] text-white shadow-lg font-semibold text-lg rounded-xl">
                <Upload className="h-6 w-6 mr-3" />
                Upload Batch
              </Button>
              <Button className="h-16 bg-[#16a085] hover:bg-[#138d76] text-white shadow-lg font-semibold text-lg rounded-xl">
                <BarChart3 className="h-6 w-6 mr-3" />
                View Reports
              </Button>
              <Button className="h-16 bg-[#f39c12] hover:bg-[#e67e22] text-white shadow-lg font-semibold text-lg rounded-xl">
                <Settings className="h-6 w-6 mr-3" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card className="shadow-xl border-2 border-gray-200 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#088C17] rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Recent Activity</CardTitle>
                <p className="text-gray-600">Latest system updates</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentActivities.slice(0, 4).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className={`w-8 h-8 ${activity.color} bg-white rounded-lg flex items-center justify-center shadow-sm`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {"facility" in activity && activity.facility}
                      {"claimId" in activity && activity.claimId}
                      {"count" in activity && `${activity.count} claims`}
                      {"amount" in activity && activity.amount}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Summary Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-gray-200 p-8 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">TPA Dashboard Overview</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Welcome to your TPA management console. Access detailed features through the sidebar menu.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#088C17] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Claims Management</h3>
            <p className="text-gray-600">Access detailed claims processing and verification tools</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-[#104D7F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics & Reports</h3>
            <p className="text-gray-600">Comprehensive performance metrics and insights</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-[#16a085] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">System Settings</h3>
            <p className="text-gray-600">Configure TPA preferences and user management</p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t-2 border-gray-200 text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Last Updated: {new Date().toLocaleDateString()}</p>
          <p className="text-gray-600">Data refreshed every 15 minutes</p>
        </div>
      </div>
    </div>
  )
}
