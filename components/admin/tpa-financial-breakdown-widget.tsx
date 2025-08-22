"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, DollarSign, TrendingUp, Users } from "lucide-react"

interface TPABreakdownData {
  tpaName: string
  tpaId: number
  totalAmount: number
  paidAmount: number // Amount TPA paid to facilities
  totalClaims: number
  breakdown: Record<string, {
    amount: number
    paidAmount: number // Amount TPA paid
    count: number
  }>
}

interface TPAFinancialBreakdownProps {
  tpaFinancialBreakdown: TPABreakdownData[]
  impactMetrics: {
    womenTreated: number
    claimsVerified: number
    totalClaimsReceived: number
    totalBeneficiaries: number
  }
}

export function TPAFinancialBreakdownWidget({ tpaFinancialBreakdown, impactMetrics }: TPAFinancialBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'verified_paid': return 'Verified and Paid'
      case 'verified_awaiting_payment': return 'Verified and Awaiting Payment'
      case 'submitted': return 'Submitted and awaiting payment'
      case 'rejected': return 'Rejected'
      case 'verified': return 'Verified'
      case 'awaiting_verification': return 'Awaiting Verification'
      case 'not_verified': return 'Not Verified'
      default: return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified_paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'verified_awaiting_payment': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'verified': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Calculate totals for "Decision: (All)" section
  const totalByTPA = tpaFinancialBreakdown.reduce((acc, tpa) => {
    acc[tpa.tpaName] = {
      totalAmount: tpa.totalAmount,
      totalClaims: tpa.totalClaims
    }
    return acc
  }, {} as Record<string, { totalAmount: number; totalClaims: number }>)

  // Get verified awaiting payment data
  const verifiedAwaitingPayment = tpaFinancialBreakdown.map(tpa => ({
    tpaName: tpa.tpaName,
    amount: tpa.breakdown['verified_awaiting_payment']?.amount || 0,
    count: tpa.breakdown['verified_awaiting_payment']?.count || 0
  })).filter(item => item.amount > 0)

  return (
    <div className="space-y-6">
      {/* Impact Section - Matching spreadsheet */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Impact</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{impactMetrics.womenTreated.toLocaleString()}</div>
              <p className="text-sm text-blue-700 font-medium">Women treated</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{impactMetrics.claimsVerified.toLocaleString()}</div>
              <p className="text-sm text-blue-700 font-medium">Claims verified</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{impactMetrics.totalClaimsReceived.toLocaleString()}</div>
              <p className="text-sm text-blue-700 font-medium">Total claims received</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">{impactMetrics.totalBeneficiaries.toLocaleString()}</div>
              <p className="text-sm text-blue-700 font-medium">Total beneficiaries</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Value Section - Matching spreadsheet */}
      <Card className="border-2 border-green-200">
        <CardHeader className="bg-green-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Claims Value</span>
          </CardTitle>
          <CardDescription className="text-green-100">
            TPA Payments to Facilities & NHIS Reimbursements by Decision Status
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Decision: Verified and awaiting payment */}
            <div className="space-y-4">
              <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900">Decision: Verified & Paid by TPA - Awaiting NHIS Reimbursement</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">TPA Name</TableHead>
                    <TableHead className="text-xs text-right">Amount TPA Paid to Facility</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiedAwaitingPayment.map((item) => (
                    <TableRow key={item.tpaName}>
                      <TableCell className="font-medium text-sm">{item.tpaName}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50 font-semibold">
                    <TableCell>Total TPA Payments</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(verifiedAwaitingPayment.reduce((sum, item) => sum + item.amount, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Decision: (All) */}
            <div className="space-y-4">
              <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900">Decision: All Statuses - TPA Payments & Reimbursements</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">TPA Name</TableHead>
                    <TableHead className="text-xs text-right">Amount TPA Paid to Facility</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(totalByTPA)
                    .sort(([,a], [,b]) => b.totalAmount - a.totalAmount)
                    .map(([tpaName, data]) => (
                    <TableRow key={tpaName}>
                      <TableCell className="font-medium text-sm">{tpaName}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(data.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-green-50 font-semibold">
                    <TableCell>Total TPA Payments</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(Object.values(totalByTPA).reduce((sum, data) => sum + data.totalAmount, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-4">
              <div className="bg-purple-100 p-3 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900">Detailed Status Breakdown</h3>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tpaFinancialBreakdown.map((tpa) => (
                  <div key={tpa.tpaName} className="border rounded-lg p-3 bg-white">
                    <h4 className="font-semibold text-sm mb-2">{tpa.tpaName}</h4>
                    <div className="space-y-1">
                      {Object.entries(tpa.breakdown).map(([status, data]) => (
                        <div key={status} className="flex justify-between items-center text-xs">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(status)}`}>
                            {getStatusDisplayName(status)}
                          </Badge>
                          <span className="font-mono">
                            {formatCurrency(data.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Management Section - Matching spreadsheet */}
      <Card className="border-2 border-orange-200">
        <CardHeader className="bg-orange-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Claims Management</span>
          </CardTitle>
          <CardDescription className="text-orange-100">
            Claims processing pipeline and status distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TPA Name</TableHead>
                <TableHead className="text-right">Total Submitted</TableHead>
                <TableHead className="text-right">Verified & Paid by TPA</TableHead>
                <TableHead className="text-right">Awaiting NHIS Reimbursement</TableHead>
                <TableHead className="text-right">Awaiting TPA Verification</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tpaFinancialBreakdown.map((tpa) => (
                <TableRow key={tpa.tpaName}>
                  <TableCell className="font-medium">{tpa.tpaName}</TableCell>
                  <TableCell className="text-right">{tpa.totalClaims}</TableCell>
                  <TableCell className="text-right">
                    {tpa.breakdown['verified_paid']?.count || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {tpa.breakdown['verified_awaiting_payment']?.count || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {tpa.breakdown['submitted']?.count || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {tpa.breakdown['rejected']?.count || 0}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(tpa.totalAmount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-orange-50 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">
                  {tpaFinancialBreakdown.reduce((sum, tpa) => sum + tpa.totalClaims, 0)}
                </TableCell>
                <TableCell className="text-right">
                  {tpaFinancialBreakdown.reduce((sum, tpa) => sum + (tpa.breakdown['verified_paid']?.count || 0), 0)}
                </TableCell>
                <TableCell className="text-right">
                  {tpaFinancialBreakdown.reduce((sum, tpa) => sum + (tpa.breakdown['verified_awaiting_payment']?.count || 0), 0)}
                </TableCell>
                <TableCell className="text-right">
                  {tpaFinancialBreakdown.reduce((sum, tpa) => sum + (tpa.breakdown['submitted']?.count || 0), 0)}
                </TableCell>
                <TableCell className="text-right">
                  {tpaFinancialBreakdown.reduce((sum, tpa) => sum + (tpa.breakdown['rejected']?.count || 0), 0)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(tpaFinancialBreakdown.reduce((sum, tpa) => sum + tpa.totalAmount, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
