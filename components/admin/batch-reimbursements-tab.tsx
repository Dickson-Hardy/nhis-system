"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Eye, FileText, DollarSign, Calendar, CheckCircle, Clock, AlertCircle, List } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Batch {
  id: number
  batchNumber: string
  tpaId: number
  status: string
  totalClaims: number
  totalAmount: number
  submittedAt: string
  reviewedAt?: string
  createdAt: string
  reimbursableAmount: number
  isReimbursed: boolean
  eligibleForReimbursement: boolean
  tpa?: {
    id: number
    name: string
    code: string
  }
  createdBy?: {
    id: number
    name: string
    email: string
  }
  claimsSummary?: {
    totalApprovedAmount: number
    totalClaimsAmount: number
    approvedClaims: number
    rejectedClaims: number
    pendingClaims: number
  }
}

interface BatchReimbursementsTabProps {
  initialData?: Batch[]
}

export function BatchReimbursementsTab({ initialData }: BatchReimbursementsTabProps) {
  const [batches, setBatches] = useState<Batch[]>(Array.isArray(initialData) ? initialData : [])
  const [loading, setLoading] = useState(false)
  const [selectedBatches, setSelectedBatches] = useState<number[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [activeTab, setActiveTab] = useState("eligible")
  const [showClaimsModal, setShowClaimsModal] = useState(false)
  const [batchClaims, setBatchClaims] = useState<any[]>([])
  const [loadingClaims, setLoadingClaims] = useState(false)

  // Form state for creating reimbursement
  const [reimbursementForm, setReimbursementForm] = useState({
    purpose: "",
    notes: "",
    adminFeeOverride: "",
  })

  useEffect(() => {
    fetchEligibleBatches()
  }, [])

  const fetchEligibleBatches = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/financial/batch-reimbursements?status=closed")
      const data = await response.json()
      if (response.ok) {
        setBatches(data.batches || [])
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch closed batches",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching batches",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBatchClaims = async (batchNumber: string) => {
    try {
      setLoadingClaims(true)
      const response = await fetch(`/api/admin/claims?batchNumber=${encodeURIComponent(batchNumber)}&status=closed`)
      const data = await response.json()
      if (response.ok) {
        setBatchClaims(data.claims || [])
        setShowClaimsModal(true)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch batch claims",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching batch claims",
        variant: "destructive",
      })
    } finally {
      setLoadingClaims(false)
    }
  }

  const handleCreateReimbursement = async () => {
    if (selectedBatches.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one batch",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/admin/financial/reimbursements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          batchIds: selectedBatches,
          purpose: reimbursementForm.purpose,
          notes: reimbursementForm.notes,
          adminFeeOverride: reimbursementForm.adminFeeOverride 
            ? parseFloat(reimbursementForm.adminFeeOverride) 
            : undefined,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "Reimbursement created successfully",
        })
        setIsCreateModalOpen(false)
        setSelectedBatches([])
        setReimbursementForm({ purpose: "", notes: "", adminFeeOverride: "" })
        fetchEligibleBatches()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create reimbursement",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while creating reimbursement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleBatchSelection = (batchId: number) => {
    setSelectedBatches(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    )
  }

  const selectAllBatches = () => {
    if (selectedBatches.length === (batches || []).length) {
      setSelectedBatches([])
    } else {
      setSelectedBatches((batches || []).map(b => b.id))
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      verified_paid: { label: "Verified & Paid", variant: "success" as const, icon: CheckCircle },
      closed: { label: "Closed", variant: "default" as const, icon: Clock },
      processing: { label: "Processing", variant: "warning" as const, icon: AlertCircle },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: "secondary" as const, 
      icon: Clock 
    }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const calculateSelectedTotal = () => {
    return selectedBatches.reduce((total, batchId) => {
      const batch = (batches || []).find(b => b.id === batchId)
      return total + (batch?.reimbursableAmount || 0)
    }, 0)
  }

  const eligibleBatches = (batches || []).filter(batch => batch.status === "closed")

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Closed Batches Review</h3>
          <p className="text-sm text-muted-foreground">
            Review closed batches and view claims details
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button disabled={selectedBatches.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Reimbursement ({selectedBatches.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Batch Reimbursement</DialogTitle>
              <DialogDescription>
                Create reimbursement for {selectedBatches.length} selected batch(es)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">
                    ₦{calculateSelectedTotal().toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {selectedBatches.length} batch(es) selected
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={reimbursementForm.purpose}
                  onChange={(e) => setReimbursementForm({...reimbursementForm, purpose: e.target.value})}
                  placeholder="Reimbursement purpose"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminFeeOverride">Admin Fee Override (%)</Label>
                <Input
                  id="adminFeeOverride"
                  type="number"
                  step="0.01"
                  value={reimbursementForm.adminFeeOverride}
                  onChange={(e) => setReimbursementForm({...reimbursementForm, adminFeeOverride: e.target.value})}
                  placeholder="Leave empty to use batch settings"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={reimbursementForm.notes}
                  onChange={(e) => setReimbursementForm({...reimbursementForm, notes: e.target.value})}
                  placeholder="Additional notes (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateReimbursement}
                disabled={!reimbursementForm.purpose || loading}
              >
                {loading ? "Creating..." : "Create Reimbursement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selection Summary */}
      {selectedBatches.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {selectedBatches.length} batch(es) selected
                </p>
                <p className="text-sm text-muted-foreground">
                  Total reimbursement amount: ₦{calculateSelectedTotal().toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedBatches([])}>
                  Clear Selection
                </Button>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Create Reimbursement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Closed Batches ({eligibleBatches.length})
              </CardTitle>
              <CardDescription>
                Batches that have been closed by TPAs and ready for admin review
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllBatches}
            >
              {selectedBatches.length === (batches || []).length ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading eligible batches...</div>
          ) : eligibleBatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No closed batches found</p>
              <p className="text-sm">Batches must be closed by TPAs to appear here for admin review</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedBatches.length === eligibleBatches.length}
                      onCheckedChange={selectAllBatches}
                    />
                  </TableHead>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>TPA</TableHead>
                  <TableHead>Claims</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Admin Fee</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closed Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleBatches.map((batch) => (
                  <TableRow 
                    key={batch.id}
                    className={selectedBatches.includes(batch.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedBatches.includes(batch.id)}
                        onCheckedChange={() => toggleBatchSelection(batch.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {batch.batchNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{batch.tpa?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {batch.tpa?.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{batch.claimsSummary?.approvedClaims || 0} approved</div>
                        <div className="text-muted-foreground">
                          of {batch.totalClaims} total
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₦{(batch.claimsSummary?.totalApprovedAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>No admin fee data</div>
                        <div className="text-muted-foreground">
                          No admin fee data
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ₦{batch.reimbursableAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(batch.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {batch.reviewedAt ? new Date(batch.reviewedAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedBatch(batch)}
                          title="View Batch Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchBatchClaims(batch.batchNumber)}
                          title="View Claims"
                          disabled={loadingClaims}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Batch Details Modal */}
      {selectedBatch && (
        <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Batch Details</DialogTitle>
              <DialogDescription>
                Batch ID: {selectedBatch.batchNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">TPA</Label>
                  <p className="text-sm">{selectedBatch.tpa?.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedBatch.tpa?.code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedBatch.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Claims</Label>
                  <p className="text-sm">{selectedBatch.totalClaims}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Approved Claims</Label>
                  <p className="text-sm">{selectedBatch.claimsSummary?.approvedClaims || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-sm font-semibold">₦{(selectedBatch.claimsSummary?.totalApprovedAmount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Admin Fee (No data)</Label>
                  <p className="text-sm">No admin fee data</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Net Reimbursement</Label>
                  <p className="text-sm font-semibold text-green-600">
                    ₦{selectedBatch.reimbursableAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reviewed Date</Label>
                  <p className="text-sm">
                    {selectedBatch.reviewedAt ? new Date(selectedBatch.reviewedAt).toLocaleString() : "Not reviewed"}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <Button 
                  onClick={() => fetchBatchClaims(selectedBatch.batchNumber)}
                  disabled={loadingClaims}
                  className="w-full"
                >
                  <List className="h-4 w-4 mr-2" />
                  {loadingClaims ? "Loading Claims..." : "View All Claims in This Batch"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Claims Modal */}
      {showClaimsModal && (
        <Dialog open={showClaimsModal} onOpenChange={setShowClaimsModal}>
          <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Claims in Batch: {selectedBatch?.batchNumber}</DialogTitle>
              <DialogDescription>
                All claims in this batch ({batchClaims.length} claims)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {loadingClaims ? (
                <div className="text-center py-8">Loading claims...</div>
              ) : batchClaims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No claims found in this batch</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead>Facility</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Approved</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchClaims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-mono text-sm">
                            {claim.uniqueClaimId}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{claim.beneficiaryName}</div>
                              <div className="text-sm text-muted-foreground">
                                Age: {claim.age} | DOB: {claim.dateOfBirth ? new Date(claim.dateOfBirth).toLocaleDateString() : "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{claim.facility?.name}</div>
                              <div className="text-muted-foreground">{claim.facility?.state}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm">
                              <div className="font-medium truncate">{claim.primaryDiagnosis}</div>
                              {claim.secondaryDiagnosis && (
                                <div className="text-muted-foreground truncate text-xs">
                                  {claim.secondaryDiagnosis}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₦{Number(claim.totalCostOfCare || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ₦{Number(claim.approvedCostOfCare || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={claim.decision === 'approved' ? 'default' : claim.decision === 'rejected' ? 'destructive' : 'secondary'}>
                              {claim.decision || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {claim.dateOfClaimSubmission ? new Date(claim.dateOfClaimSubmission).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Here you could open a detailed claim view
                                console.log("View claim details:", claim)
                                toast({
                                  title: "Claim Details",
                                  description: `Viewing details for claim ${claim.uniqueClaimId}`,
                                })
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClaimsModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Claims Modal */}
      {showClaimsModal && (
        <Dialog open={showClaimsModal} onOpenChange={setShowClaimsModal}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Batch Claims Details</DialogTitle>
              <DialogDescription>
                Detailed claims information for the selected batch
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {loadingClaims ? (
                <div className="text-center py-8">Loading claims...</div>
              ) : batchClaims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No claims found for this batch</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Decision</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchClaims.map((claim: any) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-mono text-sm">
                          {claim.uniqueClaimId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{claim.beneficiaryName}</div>
                            <div className="text-sm text-muted-foreground">
                              Age: {claim.age || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{claim.primaryDiagnosis}</div>
                            {claim.secondaryDiagnosis && (
                              <div className="text-muted-foreground text-xs">
                                {claim.secondaryDiagnosis}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₦{Number(claim.totalCostOfCare || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₦{Number(claim.approvedCostOfCare || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={claim.decision === 'approved' ? 'default' : claim.decision === 'rejected' ? 'destructive' : 'secondary'}>
                            {claim.decision || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {claim.dateOfClaimSubmission ? new Date(claim.dateOfClaimSubmission).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClaimsModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}