"use client"

import { useState, useEffect } from "react"
import { FacilityStats } from "@/components/facility/facility-stats"
import { FacilityBatchDashboard } from "@/components/facility/facility-batch-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Plus, FileText, Send, Package, Calendar } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { StatusWorkflow } from "@/components/tpa/status-workflow"
import { RejectedClaimsWidget } from "@/components/facility/rejected-claims-widget"
import { realTimeSync } from "@/lib/real-time-sync"

interface DashboardStats {
  totalPatients: number
  totalDischarges: number
  pendingClaims: number
  monthlyGrowth: number
  totalBatches: number
}

interface RecentDischarge {
  id: number
  patientName: string
  hospitalNumber: string
  dischargeDate: string
  procedure: string
  status: string
}

export function FacilityDashboardClient() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalDischarges: 0,
    pendingClaims: 0,
    monthlyGrowth: 0,
    totalBatches: 0,
  })
  const [recentDischarges, setRecentDischarges] = useState<RecentDischarge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize real-time sync
    const initRealTimeSync = () => {
      // Subscribe to real-time updates
      realTimeSync.subscribe('claim_updated', (data) => {
        // Refresh dashboard data when claims are updated
        fetchDashboardData()
        toast({
          title: "Claim Updated",
          description: `Claim ${data.id} status updated to ${data.status}`,
        })
      })

      realTimeSync.subscribe('batch_updated', (data) => {
        // Refresh dashboard data when batches are updated
        fetchDashboardData()
        toast({
          title: "Batch Updated",
          description: `Batch ${data.id} status updated to ${data.status}`,
        })
      })

      realTimeSync.subscribe('notification_received', (data) => {
        // Show notification when new notifications arrive
        toast({
          title: data.title,
          description: data.message,
        })
      })

      // For development/testing, simulate real-time updates
      if (process.env.NODE_ENV === 'development') {
        realTimeSync.simulateRealTimeUpdates()
      }
    }

    initRealTimeSync()
    fetchDashboardData()

    // Cleanup subscriptions
    return () => {
      realTimeSync.unsubscribe('claim_updated', () => {})
      realTimeSync.unsubscribe('batch_updated', () => {})
      realTimeSync.unsubscribe('notification_received', () => {})
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/facility/dashboard")
      const data = await response.json()
      
      if (response.ok) {
        setStats(data.stats)
        setRecentDischarges(data.recentDischarges)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch dashboard data",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", className: "bg-yellow-500 text-white" },
      completed: { label: "Completed", className: "bg-blue-500 text-white" },
      submitted: { label: "Submitted", className: "bg-green-500 text-white" },
      approved: { label: "Approved", className: "bg-emerald-500 text-white" },
      rejected: { label: "Rejected", className: "bg-red-500 text-white" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: "bg-gray-500 text-white" 
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header with NHIA Brand Colors */}
      <div className="bg-gradient-to-br from-[#088C17] via-[#16a085] to-[#003C06] rounded-2xl border-0 p-8 shadow-2xl text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">
              Facility Dashboard
            </h1>
            <p className="text-xl text-green-100 font-medium drop-shadow-md">
              Manage patient discharges, claims, and batches
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Link href="/facility/discharge">
                <Plus className="h-4 w-4 mr-2" />
                New Discharge Form
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading dashboard...</div>
      ) : (
        <>
          <FacilityStats {...stats} />

          {/* Status Workflow Visualization */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl p-6">
            <StatusWorkflow 
              currentStatus="submitted" 
              className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200"
            />
          </div>

          {/* Batch-First Workflow Explanation */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-900">Batch-First Workflow</h3>
                <p className="text-blue-700">Claims must be created within batches for organized processing</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <h4 className="font-semibold text-blue-900">Create Batch</h4>
                </div>
                <p className="text-sm text-blue-700">Start by creating a new batch with time period and type</p>
              </div>
              <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">2</span>
                  </div>
                  <h4 className="font-semibold text-green-900">Add Claims</h4>
                </div>
                <p className="text-sm text-green-700">Add discharge forms and claims to the open batch</p>
              </div>
              <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <h4 className="font-semibold text-purple-900">Submit Batch</h4>
                </div>
                <p className="text-sm text-purple-700">Submit complete batch to TPA for review and payment</p>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="batches">Batch Management</TabsTrigger>
            </TabsList>

                         <TabsContent value="overview" className="space-y-6">
               {/* Rejected Claims Widget */}
               <RejectedClaimsWidget 
                 rejectedClaims={[]} // TODO: Fetch from API
                 onViewClaim={(claimId) => {
                   // TODO: Navigate to claim detail
                   console.log('View claim:', claimId)
                 }}
                 onResubmitClaim={(claimId) => {
                   // TODO: Handle resubmission
                   console.log('Resubmit claim:', claimId)
                 }}
               />
               
               <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Recent Discharges
                    </CardTitle>
                    <CardDescription>Latest patient discharge forms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentDischarges.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>No recent discharges</p>
                        <p className="text-sm">Create your first discharge form to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentDischarges.map((discharge) => (
                          <div key={discharge.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium text-card-foreground">{discharge.patientName}</p>
                              <p className="text-sm text-muted-foreground">{discharge.hospitalNumber}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(discharge.dischargeDate), "MMM dd, yyyy")}
                              </div>
                              {discharge.procedure && (
                                <p className="text-xs text-muted-foreground mt-1">{discharge.procedure}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {getStatusBadge(discharge.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4">
                      <Button variant="outline" className="w-full bg-transparent" asChild>
                        <Link href="/facility/claims">View All Claims</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-card-foreground flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start bg-transparent" 
                      variant="outline" 
                      onClick={() => {
                        const batchTab = document.querySelector('[data-value="batches"]') as HTMLElement;
                        batchTab?.click();
                      }}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Create New Batch (Required First)
                    </Button>
                    <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                      <Link href="/facility/discharge">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Claims to Batch
                      </Link>
                    </Button>
                    <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
                      <Link href="/facility/claims">
                        <FileText className="h-4 w-4 mr-2" />
                        View Batch Claims
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="batches">
              <FacilityBatchDashboard />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}