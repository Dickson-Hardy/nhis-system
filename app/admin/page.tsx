"use client"

import { useState, useEffect } from "react"
import { AdminStats } from "@/components/admin/admin-stats"
import { ClaimsReviewTable } from "@/components/admin/claims-review-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, TrendingUp } from "lucide-react"

interface AdminDashboardData {
  stats: {
    totalClaims: number
    totalTPAs: number
    totalFacilities: number
    totalAmount: number
    pendingClaims: number
    approvalRate: number
  }
  recentClaims: any[]
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

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
            approvalRate: 0
          },
          recentClaims: []
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
          approvalRate: 0
        },
        recentClaims: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading dashboard...</div>
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
    approvalRate: 0
  }
  
  const { stats = defaultStats, recentClaims = [] } = dashboardData || {}
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">NHIS Admin Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive overview of the healthcare insurance system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-primary text-primary-foreground">
            <FileText className="h-4 w-4 mr-2" />
            Generate Analytics
          </Button>
        </div>
      </div>

      <AdminStats {...stats} />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-2" />
              Monthly Trends
            </CardTitle>
            <CardDescription>Claims processing trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground">
                Trend data will be available after claims are processed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Top Performing TPAs</CardTitle>
            <CardDescription>Based on approval rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground">
                TPA performance data will be available after claims are processed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">System Alerts</CardTitle>
            <CardDescription>Important notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center text-sm text-muted-foreground">
                No alerts at this time
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ClaimsReviewTable claims={recentClaims} />
    </div>
  )
}
