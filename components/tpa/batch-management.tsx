"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Package, Clock, CheckCircle, AlertCircle, Upload, FileText, Loader2, X, FileCheck, DollarSign, XCircle } from "lucide-react"
import { useBatches } from "@/hooks/use-batches"
import { useAuth } from "@/components/auth/auth-provider"
import { ExcelUpload } from "./excel-upload"
import { ManualClaimEntry } from "./manual-claim-entry"
import { BatchClaimsView } from "./batch-claims-view"
import { BatchClosureModal, BatchClosureData } from "./batch-closure-modal"
import FacilitySelector from "./facility-selector"

export default function BatchManagement() {
  const { batches, loading, error, createBatch } = useBatches()
  const { user } = useAuth()
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isSmartUploadOpen, setIsSmartUploadOpen] = useState(false)
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false)
  const [isBatchViewOpen, setIsBatchViewOpen] = useState(false)
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [batchNumber, setBatchNumber] = useState("")
  const [selectedFacility, setSelectedFacility] = useState<number | undefined>()
  const [batchDescription, setBatchDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "submitted":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "closed":
        return "bg-green-100 text-green-800 border-green-300"
      case "under_review":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "verified":
        return "bg-teal-100 text-teal-800 border-teal-300"
      case "verified_awaiting_payment":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "verified_paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Package className="h-3 w-3" />
      case "submitted":
        return <Upload className="h-3 w-3" />
      case "closed":
        return <CheckCircle className="h-3 w-3" />
      case "under_review":
        return <AlertCircle className="h-3 w-3" />
      case "verified":
        return <CheckCircle className="h-3 w-3" />
      case "verified_awaiting_payment":
        return <DollarSign className="h-3 w-3" />
      case "verified_paid":
        return <CheckCircle className="h-3 w-3" />
      case "rejected":
        return <XCircle className="h-3 w-3" />
      default:
        return <Package className="h-3 w-3" />
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft"
      case "submitted":
        return "Submitted to NHIS"
      case "closed":
        return "Closed"
      case "under_review":
        return "Under NHIS Review"
      case "verified":
        return "Verified"
      case "verified_awaiting_payment":
        return "Awaiting Payment"
      case "verified_paid":
        return "Paid"
      case "rejected":
        return "Rejected"
      default:
        return "Unknown"
    }
  }

  const handleCreateBatch = async () => {
    if (!batchNumber.trim() || !selectedFacility) return
    
    setIsCreating(true)
    try {
      await createBatch({
        batchNumber: batchNumber.trim(),
        facilityId: selectedFacility,
        description: batchDescription.trim() || undefined
      })
      
      // Reset form
      setBatchNumber("")
      setSelectedFacility(undefined)
      setBatchDescription("")
      setIsCreateBatchOpen(false)
    } catch (error) {
      console.error("Failed to create batch:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleBatchClosure = async (closureData: BatchClosureData) => {
    if (!selectedBatch) return

    try {
      const formData = new FormData()
      formData.append("reviewSummary", closureData.reviewSummary)
      formData.append("paymentJustification", closureData.paymentJustification)
      formData.append("paidAmount", closureData.paidAmount.toString())
      formData.append("beneficiariesPaid", closureData.beneficiariesPaid.toString())
      formData.append("paymentDate", closureData.paymentDate)
      formData.append("paymentMethod", closureData.paymentMethod)
      formData.append("paymentReference", closureData.paymentReference)
      formData.append("remarks", closureData.remarks || "")
      formData.append("tpaSignature", closureData.tpaSignature)
      formData.append("userId", user?.id?.toString() || "")
      
      if (closureData.forwardingLetterFile) {
        formData.append("forwardingLetter", closureData.forwardingLetterFile)
      }

      const response = await fetch(`/api/batches/${selectedBatch.id}/close`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to close batch")
      }

      const result = await response.json()
      console.log("Batch closed successfully:", result)
      
      // Refresh the batches list
      window.location.reload()
      
    } catch (error) {
      console.error("Error closing batch:", error)
      throw error
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#104D7F]" />
          <span className="ml-2 text-slate-600">Loading batches...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="dashboard-card-header">
              <p className="dashboard-card-title">Total Batches</p>
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="dashboard-card-value">{(batches || []).length}</p>
              <p className="dashboard-card-change">All batches</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="dashboard-card-header">
              <p className="dashboard-card-title">Draft Batches</p>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-1">
              <p className="dashboard-card-value text-blue-600">
                {(batches || []).filter(b => b.status === 'draft').length}
              </p>
              <p className="dashboard-card-change">Pending submission</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="dashboard-card-header">
              <p className="dashboard-card-title">Submitted to NHIS</p>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="dashboard-card-value text-green-600">
                {(batches || []).filter(b => b.status === 'submitted').length}
              </p>
              <p className="dashboard-card-change">Awaiting TPA closure</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="dashboard-card-header">
              <p className="dashboard-card-title">Closed Batches</p>
              <FileCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="dashboard-card-value text-emerald-600">
                {(batches || []).filter(b => b.status === 'closed').length}
              </p>
              <p className="dashboard-card-change">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="p-4">
            <div className="dashboard-card-header">
              <p className="dashboard-card-title">Total Claims</p>
              <FileCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="dashboard-card-value text-primary">
                {(batches || []).reduce((sum, batch) => sum + (batch.totalClaims || 0), 0)}
              </p>
              <p className="dashboard-card-change">Across all batches</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Batches Card */}
      <Card className="healthcare-card">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="text-xl font-semibold">Your Batches</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your claim batches and add claims via upload or manual entry
              </p>
            </div>
            <Dialog open={isCreateBatchOpen} onOpenChange={setIsCreateBatchOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary flex items-center space-x-2 shadow-sm hover:shadow-md transition-shadow">
                  <Plus className="h-4 w-4" />
                  <span>Create New Batch</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Batch</DialogTitle>
                  <DialogDescription>
                    Create a new batch to organize and manage your healthcare claims.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batchNumber">Batch Number *</Label>
                    <Input
                      id="batchNumber"
                      placeholder="Enter batch number (e.g., BATCH-001)"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Healthcare Facility *</Label>
                    <FacilitySelector
                      selectedFacilityId={selectedFacility}
                      onSelect={setSelectedFacility}
                      placeholder="Select a facility for this batch..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Batch Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter batch description..."
                      value={batchDescription}
                      onChange={(e) => setBatchDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateBatchOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      className="bg-[#104D7F] hover:bg-[#0d3f6b]" 
                      onClick={handleCreateBatch}
                      disabled={!batchNumber.trim() || !selectedFacility || isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Batch"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Smart Upload Section */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg text-blue-800">Smart Upload</CardTitle>
              </div>
              <CardDescription className="text-blue-700">
                Upload an Excel file with multiple batch numbers. We'll automatically detect and create batches for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={() => setIsSmartUploadOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Excel with Multiple Batches
              </Button>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            {(batches || []).length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No batches yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Get started by creating your first batch to organize and submit claims efficiently.
                </p>
                <Button 
                  onClick={() => setIsCreateBatchOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Batch
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {(batches || []).map((batch) => (
                  <Card
                    key={batch.id}
                    className="healthcare-card hover:shadow-md transition-all duration-200 border-l-4"
                    style={{
                      borderLeftColor: batch.status === 'draft' ? '#3b82f6' : 
                                     batch.status === 'submitted' ? '#10b981' : 
                                     batch.status === 'approved' ? '#059669' : '#6b7280'
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-semibold text-foreground truncate">
                                {batch.batchNumber}
                              </h3>
                              <p className="text-sm text-muted-foreground">{batch.tpa?.name}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-2xl font-bold text-foreground">{batch.totalClaims}</p>
                              <p className="text-xs text-muted-foreground">Claims</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-lg font-semibold text-green-600">
                                ₦{parseFloat(batch.totalAmount || '0').toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">Total Value</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-sm font-medium text-foreground">
                                {formatDate(batch.createdAt)}
                              </p>
                              <p className="text-xs text-muted-foreground">Created</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <Badge className={`claim-status-badge ${getStatusColor(batch.status)} border`}>
                                {getStatusIcon(batch.status)}
                                <span className="ml-1">{getStatusDisplay(batch.status)}</span>
                              </Badge>
                            </div>
                          </div>

                          {batch.submittedAt && (
                            <div className="text-sm text-muted-foreground mb-4">
                              <strong>Submitted:</strong> {formatDate(batch.submittedAt)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 mt-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            variant="outline" 
                            className="flex-1 justify-center"
                            onClick={() => {
                              setSelectedBatch(batch)
                              setIsBatchViewOpen(true)
                            }}
                          >
                            <FileCheck className="h-4 w-4 mr-2" />
                            View & Review Claims
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex-1 justify-center"
                            onClick={() => {
                              window.open(`/tpa/batches/${batch.id}`, '_blank')
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Full Screen View
                          </Button>
                          
                          {batch.status === "draft" && (
                            <>
                              <Button 
                                variant="outline" 
                                className="flex-1 justify-center"
                                onClick={() => {
                                  setSelectedBatch(batch)
                                  setIsUploadOpen(true)
                                }}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Excel File
                              </Button>
                              <Button 
                                variant="outline"
                                className="flex-1 justify-center"
                                onClick={() => {
                                  setSelectedBatch(batch)
                                  setIsManualEntryOpen(true)
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Add Claim Manually
                              </Button>
                            </>
                          )}
                        </div>

                        {batch.status === "draft" && batch.totalClaims > 0 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="btn-primary flex-1 justify-center mt-3">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Submit Batch
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Submit Batch to NHIS</DialogTitle>
                                <DialogDescription>
                                  Submit this batch to NHIS for oversight and record-keeping.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Alert>
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>
                                    You are about to submit <strong>{batch.batchNumber}</strong> with <strong>{batch.totalClaims} claims</strong> 
                                    for review. Once submitted, you cannot add more claims to this batch.
                                  </AlertDescription>
                                </Alert>
                                
                                <div className="bg-slate-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2">Batch Summary:</h4>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span>Batch Number:</span>
                                      <span className="font-medium">{batch.batchNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Total Claims:</span>
                                      <span className="font-medium">{batch.totalClaims}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Total Value:</span>
                                      <span className="font-medium text-green-600">
                                        ₦{parseFloat(batch.totalAmount || '0').toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline">
                                    Cancel
                                  </Button>
                                  <Button 
                                    className="bg-[#104D7F] hover:bg-[#0d3f6b]"
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`/api/batches/${batch.id}/submit`, {
                                          method: 'POST',
                                          credentials: 'include'
                                        })
                                        
                                        if (response.ok) {
                                          // Refresh batches data
                                          window.location.reload()
                                        } else {
                                          const errorData = await response.json()
                                          console.error('Failed to submit batch:', errorData.error)
                                          alert(`Failed to submit batch: ${errorData.error}`)
                                        }
                                      } catch (error) {
                                        console.error('Failed to submit batch:', error)
                                        alert('Failed to submit batch. Please try again.')
                                      }
                                    }}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Submit Batch
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Close Batch Button - for submitted batches (TPA autonomous closure) */}
                        {batch.status === "submitted" && (
                          <Button 
                            className="btn-primary flex-1 justify-center mt-3 bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedBatch(batch)
                              setIsClosureModalOpen(true)
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Close Batch & Submit Report
                          </Button>
                        )}

                        {batch.status === "draft" && batch.totalClaims === 0 && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 text-center">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              This batch has no claims yet. Use the buttons above to add claims.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Excel Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Upload Claims for {selectedBatch?.batchNumber}</DialogTitle>
              <DialogDescription>
                Upload an Excel file containing claims for this batch.
              </DialogDescription>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsUploadOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedBatch && (
            <ExcelUpload 
              batchId={selectedBatch.id}
              batchNumber={selectedBatch.batchNumber}
              onComplete={() => {
                setIsUploadOpen(false)
                // Refresh batches data
                window.location.reload()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Add Claim to {selectedBatch?.batchNumber}</DialogTitle>
              <DialogDescription>
                Manually enter claim details for this batch.
              </DialogDescription>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsManualEntryOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {selectedBatch && (
            <ManualClaimEntry 
              batchId={selectedBatch.id}
              batchNumber={selectedBatch.batchNumber}
              onComplete={() => {
                setIsManualEntryOpen(false)
                // Refresh batches data
                window.location.reload()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Smart Upload Dialog */}
      <Dialog open={isSmartUploadOpen} onOpenChange={setIsSmartUploadOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Smart Upload - Auto-Create Batches</DialogTitle>
              <DialogDescription>
                Upload claims and automatically create batches based on batch numbers in your data.
              </DialogDescription>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSmartUploadOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="mt-2">
              Upload an Excel file containing claims with different batch numbers. 
              The system will automatically detect unique batch numbers and create batches for them.
            </CardDescription>
          </DialogHeader>
          <ExcelUpload 
            batchId={0} // No specific batch - will auto-create
            batchNumber="AUTO" // Will be overridden by individual claim batch numbers
            onComplete={() => {
              setIsSmartUploadOpen(false)
              // Refresh batches data
              window.location.reload()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Batch Claims View Dialog */}
      <Dialog open={isBatchViewOpen} onOpenChange={setIsBatchViewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
          {selectedBatch && (
            <BatchClaimsView
              batchId={selectedBatch.id}
              batchNumber={selectedBatch.batchNumber}
              onClose={() => setIsBatchViewOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Closure Modal */}
      <BatchClosureModal
        isOpen={isClosureModalOpen}
        onClose={() => setIsClosureModalOpen(false)}
        batch={selectedBatch || {}}
        onClosurSubmit={handleBatchClosure}
      />
    </div>
  )
}

