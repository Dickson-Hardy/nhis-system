"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, TrendingUp, Building2, DollarSign, BarChart3, Download } from "lucide-react"
import { format } from "date-fns"

interface RejectedClaimAnalysis {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  facilityName: string
  tpaName: string
  totalCostOfCare: number
  rejectionDate: string
  reasonForRejection: string
  tpaRemarks?: string
  batchNumber: string
  rejectionCategory: string
}

interface RejectedClaimsAnalysisWidgetProps {
  rejectedClaims: RejectedClaimAnalysis[]
  onExportData: () => void
}

export function RejectedClaimsAnalysisWidget({ 
  rejectedClaims, 
  onExportData 
}: RejectedClaimsAnalysisWidgetProps) {
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

  // Analysis calculations
  const totalRejectedAmount = rejectedClaims.reduce((sum, claim) => sum + claim.totalCostOfCare, 0)
  const uniqueFacilities = new Set(rejectedClaims.map(c => c.facilityName)).size
  const uniqueTPAs = new Set(rejectedClaims.map(c => c.tpaName)).size
  
  // Rejection reasons analysis
  const rejectionReasons = rejectedClaims.reduce((acc, claim) => {
    acc[claim.reasonForRejection] = (acc[claim.reasonForRejection] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Top rejection reasons
  const topRejectionReasons = Object.entries(rejectionReasons)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  // Facility performance analysis
  const facilityRejections = rejectedClaims.reduce((acc, claim) => {
    if (!acc[claim.facilityName]) {
      acc[claim.facilityName] = { count: 0, amount: 0 }
    }
    acc[claim.facilityName].count++
    acc[claim.facilityName].amount += claim.totalCostOfCare
    return acc
  }, {} as Record<string, { count: number; amount: number }>)

  const topRejectingFacilities = Object.entries(facilityRejections)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5)

  if (rejectedClaims.length === 0) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="bg-green-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Rejection Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">Excellent Performance!</h3>
          <p className="text-green-700">No rejected claims to analyze. System is working efficiently.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
      <CardHeader className="bg-red-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Rejected Claims Analysis</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-white/30 text-white hover:bg-white/20"
            onClick={onExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600">{rejectedClaims.length}</div>
            <div className="text-sm text-red-700">Total Rejected</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalRejectedAmount)}
            </div>
            <div className="text-sm text-red-700">Total Amount</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600">{uniqueFacilities}</div>
            <div className="text-sm text-red-700">Facilities Affected</div>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600">{uniqueTPAs}</div>
            <div className="text-sm text-red-700">TPAs Involved</div>
          </div>
        </div>

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Rejection Reasons */}
          <div className="bg-white/80 rounded-lg p-4 border border-red-200">
            <h4 className="font-semibold text-red-900 mb-3 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Top Rejection Reasons
            </h4>
            <div className="space-y-2">
              {topRejectionReasons.map(([reason, count]) => (
                <div key={reason} className="flex justify-between items-center">
                  <span className="text-sm text-red-800">{reason}</span>
                  <Badge variant="destructive" className="text-xs">
                    {count} claims
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Top Rejecting Facilities */}
          <div className="bg-white/80 rounded-lg p-4 border border-red-200">
            <h4 className="font-semibold text-red-900 mb-3 flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Top Rejecting Facilities
            </h4>
            <div className="space-y-2">
              {topRejectingFacilities.map(([facility, data]) => (
                <div key={facility} className="flex justify-between items-center">
                  <span className="text-sm text-red-800">{facility}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive" className="text-xs">
                      {data.count} claims
                    </Badge>
                    <span className="text-xs text-red-600">
                      {formatCurrency(data.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Rejected Claims Table */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-900">Rejected Claims Details</h3>
          <div className="border border-red-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="bg-red-50 sticky top-0">
                <TableRow>
                  <TableHead className="text-red-900">Claim ID</TableHead>
                  <TableHead className="text-red-900">Beneficiary</TableHead>
                  <TableHead className="text-red-900">Facility</TableHead>
                  <TableHead className="text-red-900">TPA</TableHead>
                  <TableHead className="text-red-900">Amount</TableHead>
                  <TableHead className="text-red-900">Rejection Reason</TableHead>
                  <TableHead className="text-red-900">Date</TableHead>
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
                    <TableCell className="text-red-800">
                      {claim.facilityName}
                    </TableCell>
                    <TableCell className="text-red-800">
                      {claim.tpaName}
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
                      {formatDate(claim.rejectionDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-6 bg-white/80 rounded-lg p-4 border border-red-200">
          <h4 className="font-semibold text-red-900 mb-3">System Recommendations:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-600 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Facility Training</p>
                <p className="text-xs text-red-700">Provide guidance on common rejection reasons</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-600 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Process Review</p>
                <p className="text-xs text-red-700">Analyze TPA rejection patterns</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-600 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Quality Metrics</p>
                <p className="text-xs text-red-700">Track rejection rates by facility/TPA</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
