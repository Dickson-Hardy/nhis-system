"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Eye, RefreshCw, FileText, Calendar, CheckCircle } from "lucide-react"
import { format } from "date-fns"

interface RejectedClaim {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  totalCostOfCare: number
  rejectionDate: string
  reasonForRejection: string
  tpaRemarks?: string
  batchNumber: string
  tpaName: string
}

interface RejectedClaimsWidgetProps {
  rejectedClaims: RejectedClaim[]
  onViewClaim: (claimId: number) => void
  onResubmitClaim: (claimId: number) => void
}

export function RejectedClaimsWidget({ 
  rejectedClaims, 
  onViewClaim, 
  onResubmitClaim 
}: RejectedClaimsWidgetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  if (rejectedClaims.length === 0) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="bg-green-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>No Rejected Claims</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">All Claims Approved!</h3>
          <p className="text-green-700">Great work! All your submitted claims have been approved by TPA.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
      <CardHeader className="bg-red-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Rejected Claims ({rejectedClaims.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/80 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600">{rejectedClaims.length}</div>
            <div className="text-sm text-red-700">Total Rejected</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(rejectedClaims.reduce((sum, claim) => sum + claim.totalCostOfCare, 0))}
            </div>
            <div className="text-sm text-red-700">Total Amount</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {new Set(rejectedClaims.map(c => c.tpaName)).size}
            </div>
            <div className="text-sm text-red-700">TPAs Involved</div>
          </div>
        </div>

        {/* Rejected Claims Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-900">Rejection Details</h3>
          <div className="border border-red-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-red-50">
                <TableRow>
                  <TableHead className="text-red-900">Claim ID</TableHead>
                  <TableHead className="text-red-900">Beneficiary</TableHead>
                  <TableHead className="text-red-900">Amount</TableHead>
                  <TableHead className="text-red-900">Rejection Reason</TableHead>
                  <TableHead className="text-red-900">TPA</TableHead>
                  <TableHead className="text-red-900">Date</TableHead>
                  <TableHead className="text-red-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejectedClaims.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-red-50/50">
                    <TableCell className="font-medium text-red-900">
                      {claim.uniqueClaimId}
                    </TableCell>
                    <TableCell className="text-red-800">
                      {claim.beneficiaryName}
                    </TableCell>
                    <TableCell className="font-mono text-red-800">
                      {formatCurrency(claim.totalCostOfCare)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <Badge variant="destructive" className="text-xs">
                          {claim.reasonForRejection}
                        </Badge>
                        {claim.tpaRemarks && (
                          <p className="text-xs text-red-600 bg-red-100 p-2 rounded">
                            {claim.tpaRemarks}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-red-800">
                      {claim.tpaName}
                    </TableCell>
                    <TableCell className="text-red-800">
                      {formatDate(claim.rejectionDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => onViewClaim(claim.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => onResubmitClaim(claim.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Resubmit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Next Steps Guidance */}
        <div className="mt-6 bg-white/80 rounded-lg p-4 border border-red-200">
          <h4 className="font-semibold text-red-900 mb-3">Next Steps for Rejected Claims:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-600 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Review Rejection</p>
                <p className="text-xs text-red-700">Check TPA feedback and rejection reason</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-600 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Correct Issues</p>
                <p className="text-xs text-red-700">Fix documentation or billing problems</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-600 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Resubmit</p>
                <p className="text-xs text-red-700">Submit corrected claim in new batch</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
