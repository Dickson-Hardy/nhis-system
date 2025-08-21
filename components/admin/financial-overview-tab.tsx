"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2
} from "lucide-react"

interface FinancialOverviewTabProps {
  initialData?: any
}

interface FinancialStats {
  totalAdvancePayments: number
  totalAdvanceAmount: number
  pendingReimbursements: number
  pendingAmount: number
  completedReimbursements: number
  completedAmount: number
  eligibleBatches: number
  eligibleAmount: number
  monthlyTotal: number
  yearlyTotal: number
}

export function FinancialOverviewTab({ initialData }: FinancialOverviewTabProps) {
  const [stats, setStats] = useState<FinancialStats>({
    totalAdvancePayments: 0,
    totalAdvanceAmount: 0,
    pendingReimbursements: 0,
    pendingAmount: 0,
    completedReimbursements: 0,
    completedAmount: 0,
    eligibleBatches: 0,
    eligibleAmount: 0,
    monthlyTotal: 0,
    yearlyTotal: 0,
  })
  const [loading, setLoading] = useState(false)

  // Sample data for charts
  const monthlyData = [
    { month: "Jan", advances: 2500000, reimbursements: 1800000 },
    { month: "Feb", advances: 3200000, reimbursements: 2400000 },
    { month: "Mar", advances: 2800000, reimbursements: 3100000 },
    { month: "Apr", advances: 3500000, reimbursements: 2700000 },
    { month: "May", advances: 4100000, reimbursements: 3800000 },
    { month: "Jun", advances: 3700000, reimbursements: 3400000 },
  ]

  const statusDistribution = [
    { name: "Completed", value: 45, color: "#22c55e" },
    { name: "Pending", value: 30, color: "#f59e0b" },
    { name: "Processing", value: 20, color: "#3b82f6" },
    { name: "Disputed", value: 5, color: "#ef4444" },
  ]

  const tpaPerformance = [
    { tpa: "TPA Alpha", advances: 1500000, reimbursements: 1200000, batches: 8 },
    { tpa: "TPA Beta", advances: 2200000, reimbursements: 1800000, batches: 12 },
    { tpa: "TPA Gamma", advances: 1800000, reimbursements: 1600000, batches: 10 },
    { tpa: "TPA Delta", advances: 2500000, reimbursements: 2100000, batches: 15 },
    { tpa: "TPA Epsilon", advances: 1900000, reimbursements: 1700000, batches: 9 },
  ]

  useEffect(() => {
    fetchFinancialStats()
  }, [])

  const fetchFinancialStats = async () => {
    try {
      setLoading(true)
      // This would be a real API call to get financial statistics
      // For now, using sample data
      setStats({
        totalAdvancePayments: 25,
        totalAdvanceAmount: 12500000,
        pendingReimbursements: 8,
        pendingAmount: 4200000,
        completedReimbursements: 17,
        completedAmount: 8300000,
        eligibleBatches: 12,
        eligibleAmount: 5600000,
        monthlyTotal: 3700000,
        yearlyTotal: 45200000,
      })
    } catch (error) {
      console.error("Error fetching financial stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}K`
    }
    return `₦${amount}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Advances</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompactCurrency(stats.totalAdvanceAmount)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">+12.5%</span>
              <span className="ml-1">from last month</span>
            </div>
            <div className="mt-2">
              <Badge variant="secondary">{stats.totalAdvancePayments} payments</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reimbursements</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompactCurrency(stats.pendingAmount)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-orange-500" />
              <span className="text-orange-500">-5.2%</span>
              <span className="ml-1">from last month</span>
            </div>
            <div className="mt-2">
              <Badge variant="warning">{stats.pendingReimbursements} pending</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompactCurrency(stats.monthlyTotal)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">+8.1%</span>
              <span className="ml-1">from last month</span>
            </div>
            <div className="mt-2">
              <Badge variant="success">{stats.completedReimbursements} completed</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eligible for Reimbursement</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCompactCurrency(stats.eligibleAmount)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 mr-1 text-blue-500" />
              <span className="text-blue-500">Ready to process</span>
            </div>
            <div className="mt-2">
              <Badge variant="outline">{stats.eligibleBatches} batches</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Financial Trends</CardTitle>
            <CardDescription>
              Advances vs Reimbursements over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCompactCurrency} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area 
                  type="monotone" 
                  dataKey="advances" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Advances"
                />
                <Area 
                  type="monotone" 
                  dataKey="reimbursements" 
                  stackId="2"
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.6}
                  name="Reimbursements"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Reimbursement Status Distribution</CardTitle>
            <CardDescription>
              Current status breakdown of all reimbursements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TPA Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            TPA Financial Performance
          </CardTitle>
          <CardDescription>
            Advance payments and reimbursements by TPA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={tpaPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tpa" />
              <YAxis tickFormatter={formatCompactCurrency} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="advances" fill="#3b82f6" name="Advance Payments" />
              <Bar dataKey="reimbursements" fill="#22c55e" name="Reimbursements" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Health */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Health Indicators</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Reimbursement Processing Rate</span>
                <span className="font-medium">85%</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-muted-foreground">
                85% of reimbursements processed within 5 business days
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Advance Payment Utilization</span>
                <span className="font-medium">72%</span>
              </div>
              <Progress value={72} className="h-2" />
              <p className="text-xs text-muted-foreground">
                72% of advance payments have been claimed
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Document Compliance</span>
                <span className="font-medium">91%</span>
              </div>
              <Progress value={91} className="h-2" />
              <p className="text-xs text-muted-foreground">
                91% of reimbursements have complete documentation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Important notifications requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Pending Reimbursements</p>
                <p className="text-xs text-yellow-700">
                  8 reimbursements have been pending for more than 5 days
                </p>
                <Button variant="link" size="sm" className="h-auto p-0 text-yellow-800">
                  Review now →
                </Button>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">New Eligible Batches</p>
                <p className="text-xs text-blue-700">
                  3 new batches are ready for reimbursement processing
                </p>
                <Button variant="link" size="sm" className="h-auto p-0 text-blue-800">
                  Process now →
                </Button>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Monthly Target</p>
                <p className="text-xs text-green-700">
                  92% of monthly reimbursement target achieved
                </p>
                <Button variant="link" size="sm" className="h-auto p-0 text-green-800">
                  View details →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}