"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { NHIAStandardsComparison } from "./nhia-standards"
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calculator,
  FileText,
  DollarSign,
  Clock,
  Users,
  Building,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  X,
  User,
  MessageSquare,
  Stethoscope,
  Calendar,
  CheckSquare,
  Info,
  MapPin,
  Phone,
  Shield,
  Activity,
  Loader2,
  ArrowRight,
  AlertCircle,
} from "lucide-react"

interface ClaimData {
  id: string
  serialNumber: number
  uniqueBeneficiaryId: string
  uniqueClaimId: string
  tpaName: string
  facilityName: string
  facilityState: string
  facilityCode: string
  batchNumber: string
  hospitalNumber: string
  dateOfAdmission: string
  beneficiaryName: string
  dateOfBirth: string
  age: number
  address: string
  phoneNumber: string
  nin: string
  dateOfTreatment: string
  dateOfDischarge: string
  primaryDiagnosis: string
  secondaryDiagnosis: string
  treatmentProcedure: string
  procedureCodes: string
  investigation: string
  treatment: string
  quantity: number
  cost: number
  
  // TPA Processing Fields
  dateOfClaimSubmission: string
  monthOfSubmission: string
  costOfInvestigation: number
  costOfProcedure: number
  costOfMedication: number
  costOfOtherServices: number
  totalCostOfCare: number
  approvedCostOfCare: number
  decision: 'pending' | 'approved' | 'rejected' | 'needs_review'
  reasonForRejection: string
  dateOfClaimsPayment: string
  tpaRemarks: string
  
  // Status and flags
  status: 'received' | 'processing' | 'audited' | 'approved' | 'rejected'
  isDuplicate: boolean
  costVariance: number
  auditFlags: string[]
}

interface ClaimDetailsDialogProps {
  claim: ClaimData
  isOpen: boolean
  onClose: () => void
  auditMode: boolean
}

function ClaimDetailsDialog({ claim, isOpen, onClose, auditMode }: ClaimDetailsDialogProps) {
  const [decision, setDecision] = useState(claim.decision)
  const [approvedCost, setApprovedCost] = useState(claim.approvedCostOfCare.toString())
  const [remarks, setRemarks] = useState(claim.tpaRemarks)
  const [rejectionReason, setRejectionReason] = useState(claim.reasonForRejection)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'medical' | 'financial'>('overview')

  const handleDecisionChange = (value: string) => {
    setDecision(value as 'pending' | 'approved' | 'rejected' | 'needs_review')
  }

  const handleSubmit = async () => {
    setIsProcessing(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log('Decision submitted:', { decision, approvedCost, remarks, rejectionReason })
      onClose()
    } catch (error) {
      console.error('Error submitting decision:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'needs_review': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'audited': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-[#104D7F] to-[#0d3f6b] text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold text-white">Claim Review</DialogTitle>
                <div className="flex items-center space-x-4 mt-2">
                  <p className="text-xl text-blue-100 font-medium">{claim.uniqueClaimId}</p>
                  <span className="text-blue-200">•</span>
                  <p className="text-lg text-blue-100">{claim.beneficiaryName}</p>
                  <span className="text-blue-200">•</span>
                  <p className="text-lg text-blue-100">{claim.facilityName}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={`${getDecisionColor(claim.decision)} text-lg font-semibold px-4 py-2 border-2`}>
                {claim.decision.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button
                variant="ghost"
                size="lg"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-12 w-12 p-0"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(95vh-140px)]">
          {/* Left Sidebar - Quick Actions & Summary */}
          <div className="w-96 bg-gray-50 border-r overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Quick Decision Section */}
              {!auditMode && claim.decision === 'pending' && (
                <Card className="border-2 border-[#104D7F] shadow-lg">
                  <CardHeader className="bg-[#104D7F] text-white rounded-t-lg -mx-3 -mt-3 mb-4">
                    <CardTitle className="text-xl font-bold flex items-center">
                      <CheckSquare className="h-5 w-5 mr-2" />
                      Quick Decision
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-gray-700">Decision</Label>
                      <Select value={decision} onValueChange={handleDecisionChange}>
                        <SelectTrigger className="h-12 text-lg border-2 border-gray-300 focus:border-[#104D7F]">
                          <SelectValue placeholder="Select decision" />
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

                    {decision === 'approved' && (
                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-700">Approved Amount (₦)</Label>
                        <Input
                          type="number"
                          value={approvedCost}
                          onChange={(e) => setApprovedCost(e.target.value)}
                          placeholder="Enter approved amount"
                          className="h-12 text-lg border-2 border-gray-300 focus:border-[#104D7F]"
                        />
                      </div>
                    )}

                    {decision === 'rejected' && (
                      <div className="space-y-3">
                        <Label className="text-base font-semibold text-gray-700">Rejection Reason</Label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide reason for rejection..."
                          className="min-h-[80px] text-lg border-2 border-gray-300 focus:border-[#104D7F]"
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-gray-700">Remarks</Label>
                      <Textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add any additional comments..."
                        className="min-h-[80px] text-lg border-2 border-gray-300 focus:border-[#104D7F]"
                      />
                    </div>

                    <Button 
                      className="w-full bg-[#104D7F] hover:bg-[#0d3f6b] h-12 text-lg font-semibold"
                      onClick={handleSubmit}
                      disabled={!decision || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-5 w-5 mr-2" />
                          Submit Decision
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Cost Summary */}
              <Card className="shadow-lg border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <DollarSign className="h-6 w-6 mr-2 text-[#104D7F]" />
                    Cost Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                    <p className="text-sm font-semibold text-blue-700 mb-1">Total Claimed</p>
                    <p className="text-2xl font-bold text-blue-900">₦{claim.totalCostOfCare.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                    <p className="text-sm font-semibold text-green-700 mb-1">Approved Amount</p>
                    <p className="text-2xl font-bold text-green-900">₦{claim.approvedCostOfCare.toLocaleString()}</p>
                  </div>
                  {claim.totalCostOfCare !== claim.approvedCostOfCare && (
                    <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
                      <p className="text-sm font-semibold text-orange-700 mb-1">Cost Variance</p>
                      <p className="text-xl font-bold text-orange-900">
                        ₦{(claim.totalCostOfCare - claim.approvedCostOfCare).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Patient Quick Info */}
              <Card className="shadow-lg border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <User className="h-6 w-6 mr-2 text-[#104D7F]" />
                    Patient Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#104D7F]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="h-8 w-8 text-[#104D7F]" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{claim.beneficiaryName}</p>
                    <p className="text-sm text-gray-600">Age {claim.age} • {claim.dateOfBirth}</p>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-mono">{claim.uniqueBeneficiaryId}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-mono">{claim.hospitalNumber}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{claim.phoneNumber}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-lg border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <Activity className="h-6 w-6 mr-2 text-[#104D7F]" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <Button variant="outline" className="w-full h-12 justify-start">
                    <Download className="h-5 w-5 mr-3" />
                    Export Details
                  </Button>
                  <Button variant="outline" className="w-full h-12 justify-start">
                    <MessageSquare className="h-5 w-5 mr-3" />
                    Add Note
                  </Button>
                  <Button variant="outline" className="w-full h-12 justify-start">
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    Flag for Review
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Section Navigation */}
              <div className="flex items-center space-x-1 mb-6 bg-gray-100 p-1 rounded-xl">
                <Button
                  variant={activeSection === 'overview' ? 'default' : 'ghost'}
                  size="lg"
                  onClick={() => setActiveSection('overview')}
                  className="flex-1 h-12 data-[state=active]:bg-[#104D7F] data-[state=active]:text-white"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Overview
                </Button>
                <Button
                  variant={activeSection === 'medical' ? 'default' : 'ghost'}
                  size="lg"
                  onClick={() => setActiveSection('medical')}
                  className="flex-1 h-12 data-[state=active]:bg-[#104D7F] data-[state=active]:text-white"
                >
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Medical Details
                </Button>
                <Button
                  variant={activeSection === 'financial' ? 'default' : 'ghost'}
                  size="lg"
                  onClick={() => setActiveSection('financial')}
                  className="flex-1 h-12 data-[state=active]:bg-[#104D7F] data-[state=active]:text-white"
                >
                  <Calculator className="h-5 w-5 mr-2" />
                  Financial Analysis
                </Button>
              </div>

              {/* Content Sections */}
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  {/* Claim Timeline */}
                  <Card className="shadow-lg border-2 border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                        <Calendar className="h-6 w-6 mr-2 text-[#104D7F]" />
                        Claim Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div>
                              <p className="font-semibold text-gray-900">Admission Date</p>
                              <p className="text-gray-600">{claim.dateOfAdmission}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-2 border-green-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="font-semibold text-gray-900">Treatment Date</p>
                              <p className="text-gray-600">{claim.dateOfTreatment}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <div>
                              <p className="font-semibold text-gray-900">Discharge Date</p>
                              <p className="text-gray-600">{claim.dateOfDischarge}</p>
                            </div>
                          </div>
                          <CheckCircle className="h-5 w-5 text-purple-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Basic Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="shadow-lg border-2 border-gray-200">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <CardTitle className="text-xl font-bold text-gray-900">Patient Information</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Full Name</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.beneficiaryName}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Date of Birth</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.dateOfBirth}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Age</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.age} years</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Phone Number</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.phoneNumber}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">NIN</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.nin}</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <Label className="text-sm font-semibold text-gray-600">Address</Label>
                          <p className="text-lg font-medium text-gray-900">{claim.address}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-2 border-gray-200">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <CardTitle className="text-xl font-bold text-gray-900">Facility Information</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Facility Name</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.facilityName}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Facility Code</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.facilityCode}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">State</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.facilityState}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Batch Number</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.batchNumber}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeSection === 'medical' && (
                <div className="space-y-6">
                  <Card className="shadow-lg border-2 border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <CardTitle className="text-xl font-bold text-gray-900">Treatment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Primary Diagnosis</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.primaryDiagnosis}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Secondary Diagnosis</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.secondaryDiagnosis || "None"}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Procedure Codes</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.procedureCodes}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-600">Treatment Procedure</Label>
                            <p className="text-lg font-medium text-gray-900">{claim.treatmentProcedure}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-2 border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <CardTitle className="text-xl font-bold text-gray-900">Clinical Standards Compliance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <NHIAStandardsComparison 
                        actualCosts={{
                          investigation: claim.costOfInvestigation,
                          procedure: claim.costOfProcedure,
                          medication: claim.costOfMedication,
                          otherServices: claim.costOfOtherServices,
                          total: claim.totalCostOfCare
                        }}
                        treatmentProcedure={claim.treatmentProcedure}
                        primaryDiagnosis={claim.primaryDiagnosis}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === 'financial' && (
                <div className="space-y-6">
                  <Card className="shadow-lg border-2 border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <CardTitle className="text-xl font-bold text-gray-900">Cost Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                          <p className="text-sm font-semibold text-blue-700 mb-2">Investigation</p>
                          <p className="text-xl font-bold text-blue-900">₦{claim.costOfInvestigation.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                          <p className="text-sm font-semibold text-green-700 mb-2">Procedure</p>
                          <p className="text-xl font-bold text-green-900">₦{claim.costOfProcedure.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                          <p className="text-sm font-semibold text-purple-700 mb-2">Medication</p>
                          <p className="text-xl font-bold text-purple-900">₦{claim.costOfMedication.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                          <p className="text-sm font-semibold text-orange-700 mb-2">Other Services</p>
                          <p className="text-xl font-bold text-orange-900">₦{claim.costOfOtherServices.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Audit Flags */}
                  {claim.auditFlags.length > 0 && (
                    <Card className="shadow-lg border-2 border-red-200">
                      <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b-2 border-red-200">
                        <CardTitle className="text-xl font-bold text-red-900 flex items-center">
                          <AlertTriangle className="h-6 w-6 mr-2" />
                          Audit Flags
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex flex-wrap gap-2">
                          {claim.auditFlags.map((flag, index) => (
                            <Badge key={index} variant="destructive" className="text-sm px-3 py-1">
                              {flag.replace('_', ' ').toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ClaimsProcessor() {
  const [claims, setClaims] = useState<ClaimData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClaim, setSelectedClaim] = useState<ClaimData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [auditMode, setAuditMode] = useState(false)

  // Fetch claims data from API
  useEffect(() => {
    fetchClaims()
  }, [])

  const fetchClaims = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/claims', { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
      } else {
        // API not implemented yet, show empty state
        setClaims([])
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'needs_review': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.uniqueClaimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.uniqueBeneficiaryId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const dashboardStats = {
    totalClaims: claims.length,
    pendingReview: claims.filter(c => c.decision === 'needs_review').length,
    approved: claims.filter(c => c.decision === 'approved').length,
    rejected: claims.filter(c => c.decision === 'rejected').length,
    totalValue: claims.reduce((sum, c) => sum + c.totalCostOfCare, 0),
    approvedValue: claims.reduce((sum, c) => sum + (c.approvedCostOfCare || 0), 0),
    duplicates: claims.filter(c => c.isDuplicate).length,
    auditFlags: claims.reduce((sum, c) => sum + c.auditFlags.length, 0)
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Claims Processing Dashboard</h1>
          <p className="text-muted-foreground">Review, audit, and approve healthcare facility claims</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Claims
          </Button>
          <Button 
            variant={auditMode ? "default" : "outline"} 
            size="sm"
            onClick={() => setAuditMode(!auditMode)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {auditMode ? "Exit Audit" : "Audit Mode"}
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalClaims}</div>
            <p className="text-xs text-muted-foreground">
              Active claims in system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dashboardStats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting TPA decision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{dashboardStats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ₦{dashboardStats.approvedValue.toLocaleString()} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Flags</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardStats.auditFlags}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.duplicates} duplicates detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Claims</CardTitle>
          <CardDescription>Find and filter claims by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by beneficiary name, claim ID, or beneficiary ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="audited">Audited</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Claims List</CardTitle>
          <CardDescription>
            {filteredClaims.length} of {claims.length} claims shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading claims...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.uniqueClaimId}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{claim.beneficiaryName}</p>
                        <p className="text-sm text-muted-foreground">{claim.uniqueBeneficiaryId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{claim.facilityName}</p>
                        <p className="text-sm text-muted-foreground">{claim.facilityState}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">₦{claim.totalCostOfCare.toLocaleString()}</p>
                        <p className="text-sm text-green-600">₦{claim.approvedCostOfCare.toLocaleString()} approved</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(claim.status)}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDecisionColor(claim.decision)}>
                        {claim.decision.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedClaim(claim)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!auditMode && claim.decision === 'pending' && (
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Claim Details Dialog */}
      {selectedClaim && (
        <ClaimDetailsDialog 
          claim={selectedClaim} 
          isOpen={!!selectedClaim} 
          onClose={() => setSelectedClaim(null)}
          auditMode={auditMode}
        />
      )}
    </div>
  )
}

function getDecisionColor(decision: string) {
  switch (decision) {
    case 'approved': return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
    case 'needs_review': return 'bg-orange-100 text-orange-800 border-orange-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}