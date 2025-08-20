"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  AlertCircle,
  DollarSign,
  Loader2,
  Activity,
  Shield,
  Users,
  Building,
  Eye,
  CheckSquare,
  XSquare,
  AlertTriangle,
  Info,
  Calendar,
  MapPin,
  User,
  Stethoscope,
  Calculator,
  MessageSquare,
} from "lucide-react"
import BatchManagement from "@/components/tpa/batch-management"
import { ClaimsAudit } from "@/components/tpa/claims-audit"
import { useClaims } from "@/hooks/use-claims"
import { useState } from "react"

export default function TPADashboard() {
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
        return { variant: "secondary" as const, icon: DollarSign, color: "text-purple-600", bgColor: "bg-purple-50" }
      case "verified_paid":
        return { variant: "default" as const, icon: CheckCircle, color: "text-green-700", bgColor: "bg-green-50" }
      default:
        return { variant: "secondary" as const, icon: AlertCircle, color: "text-gray-500", bgColor: "bg-gray-50" }
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

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch = 
      claim.uniqueClaimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.facility.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = claim.status === selectedTab
    
    return matchesSearch && matchesTab
  })

  const claimsByStatus = {
    submitted: claims.filter(c => c.status === "submitted"),
    awaiting_verification: claims.filter(c => c.status === "awaiting_verification"),
    not_verified: claims.filter(c => c.status === "not_verified"),
    verified: claims.filter(c => c.status === "verified"),
    verified_awaiting_payment: claims.filter(c => c.status === "verified_awaiting_payment"),
    verified_paid: claims.filter(c => c.status === "verified_paid"),
  }

  const recentActivities = [
    { action: "New claim submitted", facility: "Lagos University Teaching Hospital", time: "2 hours ago", icon: FileText, color: "text-blue-600" },
    { action: "Claim verified", claimId: "CLM-HCI-2025-001", time: "4 hours ago", icon: CheckCircle, color: "text-green-600" },
    { action: "Batch uploaded for verification", count: 5, time: "1 day ago", icon: Activity, color: "text-purple-600" },
    { action: "Payment processed", amount: "₦625,000", time: "2 days ago", icon: DollarSign, color: "text-emerald-600" },
  ]

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Enhanced Loading Header */}
        <div className="bg-gradient-to-br from-[#104D7F] to-[#0d3f6b] rounded-2xl h-40 shadow-xl"></div>
        
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
            <div className="w-20 h-20 border-6 border-[#104D7F]/20 border-t-[#104D7F] rounded-full animate-spin shadow-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-[#104D7F] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold drop-shadow-lg">₦</span>
              </div>
            </div>
          </div>
          <div className="ml-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading TPA Dashboard</h3>
            <p className="text-lg text-gray-600">Fetching your latest claims data...</p>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-3 h-3 bg-[#104D7F] rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-[#104D7F] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-[#104D7F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Enhanced Header with NHIA Brand Colors */}
      <div className="bg-gradient-to-br from-[#104D7F] via-[#0d3f6b] to-[#003C06] rounded-2xl border-0 p-8 md:p-10 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-8 lg:space-y-0">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
        <div>
                <h1 className="text-5xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">TPA Dashboard</h1>
                <p className="text-xl text-blue-100 font-medium drop-shadow-md">
              Verify claims and manage healthcare facility partnerships
            </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-white font-semibold drop-shadow-md">System Online</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                <Clock className="h-5 w-5 text-blue-200" />
                <span className="text-white font-medium drop-shadow-md">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span className="text-white font-semibold drop-shadow-md">Performance: Excellent</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-white/30">
                <span className="text-white text-3xl font-bold drop-shadow-lg">₦</span>
              </div>
        </div>
            <div className="flex flex-col space-y-4">
              <Button variant="outline" size="lg" className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm h-12 px-6 drop-shadow-md">
                <Download className="h-5 w-5 mr-3" />
            Export Report
          </Button>
              <Button className="bg-white text-[#104D7F] hover:bg-gray-100 shadow-xl h-12 px-6 font-semibold" onClick={refetch}>
                <FileText className="h-5 w-5 mr-3" />
            Refresh Data
          </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 shadow-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Stats Cards with Better Visibility */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-blue-800">Submitted</CardTitle>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-blue-700">
              <FileText className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-900 mb-2">{stats.submitted}</div>
            <p className="text-sm text-blue-700 font-medium">Claims received</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-orange-800">Awaiting Verification</CardTitle>
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-orange-700">
              <Clock className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-900 mb-2">{stats.awaitingVerification}</div>
            <p className="text-sm text-orange-700 font-medium">Pending review</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-red-800">Not Verified</CardTitle>
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-red-700">
              <XCircle className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-900 mb-2">{stats.notVerified}</div>
            <p className="text-sm text-red-700 font-medium">Rejected claims</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-green-800">Verified</CardTitle>
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-green-700">
              <CheckCircle className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900 mb-2">{stats.verified}</div>
            <p className="text-sm text-green-700 font-medium">Approved claims</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-purple-800">Awaiting Payment</CardTitle>
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-purple-700">
              <DollarSign className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-900 mb-2">{stats.verifiedAwaitingPayment}</div>
            <p className="text-sm text-purple-700 font-medium">Ready for payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-emerald-800">Paid</CardTitle>
            <div className="w-12 h-12 bg-emerald-700 rounded-xl flex items-center justify-center shadow-lg border-2 border-emerald-800">
              <TrendingUp className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-900 mb-2">{stats.verifiedPaid}</div>
            <p className="text-sm text-emerald-700 font-medium">Payments completed</p>
          </CardContent>
        </Card>
      </div>

      <BatchManagement />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-xl border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#104D7F] rounded-xl flex items-center justify-center shadow-lg border-2 border-[#0d3f6b]">
                  <FileText className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Claims by Verification Status</CardTitle>
                  <p className="text-gray-600">Monitor and manage claim verification workflow</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="Search claims..." 
                    className="pl-12 w-72 h-12 text-lg border-2 border-gray-300 focus:border-[#104D7F] focus:ring-[#104D7F]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="lg" className="h-12 px-6 border-2 border-gray-300 hover:border-[#104D7F]">
                  <Filter className="h-5 w-5 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-14 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="submitted" className="text-base font-semibold text-gray-700 data-[state=active]:bg-[#104D7F] data-[state=active]:text-white data-[state=active]:drop-shadow-md rounded-lg transition-all duration-200">
                  Submitted ({stats.submitted})
                </TabsTrigger>
                <TabsTrigger value="awaiting_verification" className="text-base font-semibold text-gray-700 data-[state=active]:bg-[#104D7F] data-[state=active]:text-white data-[state=active]:drop-shadow-md rounded-lg transition-all duration-200">
                  Awaiting ({stats.awaitingVerification})
                </TabsTrigger>
                <TabsTrigger value="verified" className="text-base font-semibold text-gray-700 data-[state=active]:bg-[#104D7F] data-[state=active]:text-white data-[state=active]:drop-shadow-md rounded-lg transition-all duration-200">
                  Verified ({stats.verified})
                </TabsTrigger>
                <TabsTrigger value="verified_awaiting_payment" className="text-base font-semibold text-gray-700 data-[state=active]:bg-[#104D7F] data-[state=active]:text-white data-[state=active]:drop-shadow-md rounded-lg transition-all duration-200">
                  Payment ({stats.verifiedAwaitingPayment})
                </TabsTrigger>
              </TabsList>

              {["submitted", "awaiting_verification", "verified", "verified_awaiting_payment"].map((status) => (
                <TabsContent key={status} value={status} className="space-y-4 mt-6">
                  {claimsByStatus[status as keyof typeof claimsByStatus].length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <FileText className="h-16 w-16 mx-auto mb-6 text-gray-500" />
                      <p className="text-xl font-medium">No {formatStatus(status).toLowerCase()} claims found.</p>
                      <p className="text-gray-500 mt-2">Claims will appear here once they are processed.</p>
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
                          className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-[#104D7F]/10 rounded-xl flex items-center justify-center">
                                <Building className="h-6 w-6 text-[#104D7F]" />
                              </div>
                              <div>
                                <p className="text-xl font-bold text-gray-900">{claim.uniqueClaimId}</p>
                                <p className="text-lg text-gray-700 font-medium">{claim.beneficiaryName}</p>
                              </div>
                            </div>
                            <p className="text-base text-gray-600 mt-2 font-medium">{claim.facility.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Admitted: {formatDate(claim.dateOfAdmission)} • {claim.primaryDiagnosis}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(claim.totalCostOfCare)}</p>
                            <div className="flex items-center space-x-3">
                              <Badge variant={getStatusBadge(claim.status).variant} className="text-sm font-semibold px-4 py-2">
                                {(() => {
                                  const IconComponent = getStatusBadge(claim.status).icon
                                  return <IconComponent className="h-4 w-4 mr-2" />
                                })()}
                                {formatStatus(claim.status)}
                              </Badge>
                              {(status === "submitted" || status === "awaiting_verification") && (
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-10 px-4 border-2 border-gray-300 hover:border-[#104D7F] hover:bg-[#104D7F]/5 transition-all duration-200"
                                    onClick={() => setSelectedClaim(claim)}
                                  >
                                    <Eye className="h-4 w-4 mr-2 text-gray-600" />
                                    View
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="bg-[#104D7F] hover:bg-[#0d3f6b] shadow-lg h-10 px-6 font-semibold transition-all duration-200 transform hover:scale-105"
                                    onClick={() => handleClaimReview(claim)}
                                  >
                                    {status === "submitted" ? (
                                      <>
                                        <CheckSquare className="h-4 w-4 mr-2" />
                                        Verify
                                      </>
                                    ) : (
                                      <>
                                        <AlertTriangle className="h-4 w-4 mr-2" />
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

        <Card className="shadow-xl border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#104D7F] rounded-xl flex items-center justify-center shadow-lg border-2 border-[#0d3f6b]">
                <Activity className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Recent Activity</CardTitle>
                <p className="text-gray-600">Latest system activities and updates</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className={`w-10 h-10 ${activity.color} bg-white rounded-xl flex items-center justify-center shadow-sm border-2 border-gray-200`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600 mt-1 font-medium">
                      {"facility" in activity && activity.facility}
                      {"claimId" in activity && activity.claimId}
                      {"count" in activity && `${activity.count} claims`}
                      {"amount" in activity && activity.amount}
                    </p>
                    <p className="text-xs text-gray-600 mt-2 font-medium">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Claims Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-[#104D7F] to-[#0d3f6b] text-white rounded-t-lg -mt-6 -mx-6 p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">Review Claim</DialogTitle>
                <p className="text-blue-100 mt-1">
                  {selectedClaim?.uniqueClaimId} • {selectedClaim?.beneficiaryName}
                </p>
              </div>
            </div>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-8">
              {/* Claim Summary */}
              <Card className="border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <Info className="h-5 w-5 mr-2 text-[#104D7F]" />
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
                      <p className="text-2xl font-bold text-[#104D7F]">{formatCurrency(selectedClaim.totalCostOfCare)}</p>
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
              <Card className="border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <CheckSquare className="h-5 w-5 mr-2 text-[#104D7F]" />
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
                        <SelectTrigger className="h-12 text-lg border-2 border-gray-300 focus:border-[#104D7F] focus:ring-[#104D7F]">
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
                          className="h-12 text-lg border-2 border-gray-300 focus:border-[#104D7F] focus:ring-[#104D7F]"
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
                          className="min-h-[100px] text-lg border-2 border-gray-300 focus:border-[#104D7F] focus:ring-[#104D7F]"
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
                      className="min-h-[100px] text-lg border-2 border-gray-300 focus:border-[#104D7F] focus:ring-[#104D7F]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t-2 border-gray-200">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsReviewOpen(false)}
                  className="h-12 px-8 border-2 border-gray-300 hover:border-[#104D7F] hover:bg-[#104D7F]/5 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleReviewSubmit}
                  disabled={!reviewData.decision || isProcessing}
                  className="bg-[#104D7F] hover:bg-[#0d3f6b] shadow-lg h-12 px-8 font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
