"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, AlertTriangle } from "lucide-react"

interface FinancialOverviewProps {
  financialSummary: {
    totalSubmitted: number
    totalApproved: number
    pendingAmount: number
    avgClaimAmount: number
  }
  statusBreakdown: Record<string, { count: number; amount: number }>
}

export function FinancialOverviewWidget({ financialSummary, statusBreakdown }: FinancialOverviewProps) {
  const approvalRate = financialSummary.totalSubmitted > 0 
    ? (financialSummary.totalApproved / financialSummary.totalSubmitted) * 100 
    : 0

  const pendingPercentage = financialSummary.totalSubmitted > 0
    ? (financialSummary.pendingAmount / financialSummary.totalSubmitted) * 100
    : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500'
      case 'submitted': return 'bg-yellow-500'
      case 'rejected': return 'bg-red-500'
      case 'verified_awaiting_payment': return 'bg-blue-500'
      case 'verified_paid': return 'bg-emerald-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'verified_paid':
        return <CheckCircle className="h-4 w-4" />
      case 'submitted':
      case 'verified_awaiting_payment':
        return <Clock className="h-4 w-4" />
      case 'rejected':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Financial Overview */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Financial Overview</span>
          </CardTitle>
          <CardDescription>
            Comprehensive view of claims financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(financialSummary.totalSubmitted)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Submitted</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(financialSummary.totalApproved)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Approved</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {formatCurrency(financialSummary.pendingAmount)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Pending Payment</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(financialSummary.avgClaimAmount)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Avg Claim Amount</p>
            </div>
          </div>
          
          {/* Approval Progress */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Approval Rate</span>
              <span className="text-sm text-gray-600">{approvalRate.toFixed(1)}%</span>
            </div>
            <Progress value={approvalRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Claims by Status */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Claims by Status</CardTitle>
          <CardDescription>
            Financial breakdown by claim status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(statusBreakdown).map(([status, data]) => (
              <div key={status} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span className="font-medium capitalize">
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(data.amount)}</div>
                  <div className="text-sm text-gray-600">{data.count} claims</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Financial Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Processing Efficiency</span>
              <Badge variant={approvalRate > 80 ? "default" : "secondary"}>
                {approvalRate > 80 ? "Excellent" : approvalRate > 60 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment Pipeline</span>
              <Badge variant={pendingPercentage < 20 ? "default" : "secondary"}>
                {pendingPercentage < 20 ? "Healthy" : "Congested"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg Processing Value</span>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(financialSummary.avgClaimAmount)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}