"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  CheckSquare,
  AlertTriangle,
  Building,
  Calendar,
  Loader2,
  Shield,
} from "lucide-react"
import { useClaims } from "@/hooks/use-claims"
import { useState } from "react"
import { StatusWorkflow } from "@/components/tpa/status-workflow"

export default function ClaimsManagementPage() {
  const { claims, stats, loading, error, refetch } = useClaims()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState("submitted")
  const [selectedClaim, setSelectedClaim] = useState<any>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [reviewData, setReviewData] = useState({
    decision: "",
    reasonForRejection: "",
    approvedAmount: "",
    remarks: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return { variant: "secondary" as const, icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50" }
      case "awaiting_verification":
        return { variant: "secondary" as const, icon: Clock, color: "text-orange-500", bgColor: "bg-orange-50" }
      case "not_verified":
        return { variant: "destructive" as const, icon: XCircle, color: "text-red-500", bgColor: "bg-red-50" }
      case "verified":
        return { variant: "default" as const, icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" }
      case "verified_awaiting_payment":
        return { variant: "secondary" as const, icon: CheckCircle, color: "text-purple-600", bgColor: "bg-purple-50" }
      case "verified_paid":
        return { variant: "default" as const, icon: CheckCircle, color: "text-green-700", bgColor: "bg-green-50" }
      default:
        return { variant: "secondary" as const, icon: FileText, color: "text-gray-500", bgColor: "bg-gray-50" }
    }
  }

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount
    return `₦${numAmount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleClaimReview = (claim: any) => {
    setSelectedClaim(claim)
    setReviewData({
      decision: "",
      reasonForRejection: "",
      approvedAmount: claim.totalCostOfCare || "",
      remarks: "",
    })
    setIsReviewOpen(true)
  }

  const handleReviewSubmit = async () => {
    setIsProcessing(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Handle the review submission here
      console.log("Review submitted:", { claim: selectedClaim, review: reviewData })
      
      // Close dialog and refresh data
      setIsReviewOpen(false)
      setSelectedClaim(null)
      refetch()
    } catch (error) {
      console.error("Error submitting review:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const claimsByStatus = {
    submitted: claims.filter(c => c.status === "submitted"),
    awaiting_verification: claims.filter(c => c.status === "awaiting_verification"),
    not_verified: claims.filter(c => c.status === "not_verified"),
    verified: claims.filter(c => c.status === "verified"),
    verified_awaiting_payment: claims.filter(c => c.status === "verified_awaiting_payment"),
    verified_paid: claims.filter(c => c.status === "verified_paid"),
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading claims data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Professional Header */}
      <div className="bg-gradient-to-br from-[#088C17] via-[#16a085] to-[#003C06] rounded-2xl border-0 p-8 shadow-2xl text-white">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white drop-shadow-lg" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">Claims Management</h1>
            <p className="text-xl text-green-100 font-medium drop-shadow-md">
              Professional claims workflow management and verification
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Claims Management Interface */}
      <Card className="shadow-xl border-2 border-gray-200 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-[#088C17] rounded-2xl flex items-center justify-center shadow-xl border-2 border-[#003C06]">
                <FileText className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-gray-900">Claims by Verification Status</CardTitle>
                <p className="text-gray-600 text-lg mt-2">Monitor and manage claim verification workflow</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                <Input 
                  placeholder="Search claims..." 
                  className="pl-14 w-80 h-14 text-lg border-2 border-gray-300 focus:border-[#088C17] focus:ring-[#088C17] rounded-xl" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="lg" className="h-14 px-8 border-2 border-gray-300 hover:border-[#088C17] hover:bg-[#088C17]/5 rounded-xl text-lg font-semibold">
                <Filter className="h-6 w-6 mr-3" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {/* Status Workflow Visualization */}
          <div className="mb-8">
            <StatusWorkflow 
              currentStatus={selectedTab} 
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200"
            />
          </div>
          
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-16 bg-gray-100 p-2 rounded-2xl mb-8">
              <TabsTrigger value="submitted" className="text-lg font-semibold text-gray-700 data-[state=active]:bg-[#088C17] data-[state=active]:text-white data-[state=active]:drop-shadow-md rounded-xl transition-all duration-200">
                Submitted ({stats.submitted})
              </TabsTrigger>
              <TabsTrigger value="awaiting_verification" className="text-lg font-semibold text-gray-700 data-[state=active]:bg-[#088C17] data-[state=active]:text-white data-[state=active]:drop-shadow-md rounded-xl transition-all duration-200">
                Awaiting ({stats.awaitingVerification})
              </TabsTrigger>
              <TabsTrigger value="verified" className="text-lg font-semibold text-gray-700 data-[state=active]:bg-[#088C17] data-[state=active]:text-white data-[state=active]:drop-shadow-md rounded-xl transition-all duration-200">
                Verified ({stats.verified})
              </TabsTrigger>
              <TabsTrigger value="verified_awaiting_payment" className="text-lg font-semibold text-gray-700 data-[state=active]:bg-[#088C17] data-[state=active]:text-white data-[state=active]:drop-shadow-md rounded-xl transition-all duration-200">
                Payment ({stats.verifiedAwaitingPayment})
              </TabsTrigger>
            </TabsList>

            {["submitted", "awaiting_verification", "verified", "verified_awaiting_payment"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-6">
                {claimsByStatus[status as keyof typeof claimsByStatus].length === 0 ? (
                  <div className="text-center py-16 text-gray-600">
                    <FileText className="h-20 w-20 mx-auto mb-6 text-gray-400" />
                    <p className="text-2xl font-medium">No {formatStatus(status).toLowerCase()} claims found.</p>
                    <p className="text-gray-500 mt-3 text-lg">Claims will appear here once they are processed.</p>
                  </div>
                ) : (
                  claimsByStatus[status as keyof typeof claimsByStatus]
                    .filter((claim) => 
                      claim.uniqueClaimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      claim.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      claim.facility.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-8 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 transition-all duration-200 hover:shadow-xl group"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-[#088C17]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#088C17]/20 transition-colors duration-200">
                              <Building className="h-8 w-8 text-[#088C17]" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-gray-900">{claim.uniqueClaimId}</p>
                              <p className="text-xl text-gray-700 font-semibold">{claim.beneficiaryName}</p>
                            </div>
                          </div>
                          <p className="text-lg text-gray-600 mt-3 font-medium">{claim.facility.name}</p>
                          <p className="text-base text-gray-600 mt-2">
                            <Calendar className="h-4 w-4 inline mr-2" />
                            Admitted: {formatDate(claim.dateOfAdmission)} • {claim.primaryDiagnosis}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900 mb-3">{formatCurrency(claim.totalCostOfCare)}</p>
                          <div className="flex items-center space-x-4">
                            <Badge variant={getStatusBadge(claim.status).variant} className="text-base font-semibold px-6 py-3 rounded-xl">
                              {(() => {
                                const IconComponent = getStatusBadge(claim.status).icon
                                return <IconComponent className="h-5 w-5 mr-2" />
                              })()}
                              {formatStatus(claim.status)}
                            </Badge>
                            {(status === "submitted" || status === "awaiting_verification") && (
                              <div className="flex items-center space-x-3">
                                <Button 
                                  size="lg" 
                                  variant="outline" 
                                  className="h-12 px-6 border-2 border-gray-300 hover:border-[#088C17] hover:bg-[#088C17]/5 transition-all duration-200 rounded-xl"
                                  onClick={() => setSelectedClaim(claim)}
                                >
                                  <Eye className="h-5 w-5 mr-2 text-gray-600" />
                                  View
                                </Button>
                                <Button 
                                  size="lg" 
                                  className="bg-[#088C17] hover:bg-[#003C06] shadow-xl h-12 px-8 font-bold transition-all duration-200 transform hover:scale-105 rounded-xl"
                                  onClick={() => handleClaimReview(claim)}
                                >
                                  {status === "submitted" ? (
                                    <>
                                      <CheckSquare className="h-5 w-5 mr-2" />
                                      Verify
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="h-5 w-5 mr-2" />
                                      Review
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Claims Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-[#088C17] to-[#003C06] text-white rounded-t-2xl -mt-6 -mx-6 p-8 mb-6">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <CheckSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-white">Review Claim</DialogTitle>
                <p className="text-green-100 mt-2 text-lg">
                  {selectedClaim?.uniqueClaimId} • {selectedClaim?.beneficiaryName}
                </p>
              </div>
            </div>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-8">
              {/* Claim Summary */}
              <Card className="border-2 border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200 p-6">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <FileText className="h-6 w-6 mr-3 text-[#088C17]" />
                    Claim Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">Claim ID</Label>
                      <p className="text-lg font-bold text-gray-900">{selectedClaim.uniqueClaimId}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">Beneficiary</Label>
                      <p className="text-lg font-bold text-gray-900">{selectedClaim.beneficiaryName}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">Facility</Label>
                      <p className="text-lg font-bold text-gray-900">{selectedClaim.facility.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">Total Cost</Label>
                      <p className="text-2xl font-bold text-[#088C17]">{formatCurrency(selectedClaim.totalCostOfCare)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">Admission Date</Label>
                      <p className="text-lg font-bold text-gray-900">{formatDate(selectedClaim.dateOfAdmission)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">Primary Diagnosis</Label>
                      <p className="text-lg font-bold text-gray-900">{selectedClaim.primaryDiagnosis}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Review Decision */}
              <Card className="border-2 border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200 p-6">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <CheckSquare className="h-6 w-6 mr-3 text-[#088C17]" />
                    Review Decision
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="decision" className="text-base font-semibold text-gray-700">
                        Decision *
                      </Label>
                      <Select value={reviewData.decision} onValueChange={(value) => setReviewData({...reviewData, decision: value})}>
                        <SelectTrigger className="h-12 text-lg border-2 border-gray-300 focus:border-[#088C17] focus:ring-[#088C17] rounded-xl">
                          <SelectValue placeholder="Select your decision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved" className="text-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span>Approve Claim</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="rejected" className="text-lg">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-5 w-5 text-red-600" />
                              <span>Reject Claim</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="needs_review" className="text-lg">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-5 w-5 text-orange-600" />
                              <span>Needs Review</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {reviewData.decision === "approved" && (
                      <div className="space-y-3">
                        <Label htmlFor="approvedAmount" className="text-base font-semibold text-gray-700">
                          Approved Amount (₦)
                        </Label>
                        <Input
                          id="approvedAmount"
                          type="number"
                          value={reviewData.approvedAmount}
                          onChange={(e) => setReviewData({...reviewData, approvedAmount: e.target.value})}
                          placeholder="Enter approved amount"
                          className="h-12 text-lg border-2 border-gray-300 focus:border-[#088C17] focus:ring-[#088C17] rounded-xl"
                        />
                      </div>
                    )}

                    {reviewData.decision === "rejected" && (
                      <div className="space-y-3">
                        <Label htmlFor="reasonForRejection" className="text-base font-semibold text-gray-700">
                          Reason for Rejection *
                        </Label>
                        <Textarea
                          id="reasonForRejection"
                          value={reviewData.reasonForRejection}
                          onChange={(e) => setReviewData({...reviewData, reasonForRejection: e.target.value})}
                          placeholder="Provide detailed reason for rejection..."
                          className="min-h-[100px] text-lg border-2 border-gray-300 focus:border-[#088C17] focus:ring-[#088C17] rounded-xl"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="remarks" className="text-base font-semibold text-gray-700">
                      Additional Remarks
                    </Label>
                    <Textarea
                      id="remarks"
                      value={reviewData.remarks}
                      onChange={(e) => setReviewData({...reviewData, remarks: e.target.value})}
                      placeholder="Add any additional comments or notes..."
                      className="min-h-[100px] text-lg border-2 border-gray-300 focus:border-[#088C17] focus:ring-[#088C17] rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-6 pt-6 border-t-2 border-gray-200">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsReviewOpen(false)}
                  className="h-12 px-8 border-2 border-gray-300 hover:border-[#088C17] hover:bg-[#088C17]/5 transition-all duration-200 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleReviewSubmit}
                  disabled={!reviewData.decision || isProcessing}
                  className="bg-[#088C17] hover:bg-[#003C06] shadow-lg h-12 px-8 font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-5 w-5 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}