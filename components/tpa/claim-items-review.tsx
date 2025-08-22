"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, XCircle, AlertTriangle, Clock, Calculator, 
  FileText, TrendingUp, TrendingDown, Eye, Edit3, Save
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ClaimItem {
  id: number
  itemType: 'investigation' | 'procedure' | 'medication' | 'other_service'
  itemCategory: string
  itemName: string
  itemDescription: string
  itemCode?: string
  quantity: number
  unit: string
  dosage?: string
  duration?: string
  unitCost: number
  totalCost: number
  serviceDate: string
  prescribedBy?: string
  indication?: string
  urgency: 'routine' | 'urgent' | 'emergency'
  
  // Review fields
  isReviewed: boolean
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_clarification'
  reviewNotes?: string
  approvedQuantity?: number
  approvedUnitCost?: number
  approvedTotalCost?: number
  rejectionReason?: string
  
  // Compliance
  nhiaStandardCost?: number
  costVariancePercentage?: number
  complianceFlag?: 'compliant' | 'needs_review' | 'excessive'
}

interface ClaimItemSummary {
  totalInvestigationCost: number
  totalProcedureCost: number
  totalMedicationCost: number
  totalOtherServicesCost: number
  approvedInvestigationCost: number
  approvedProcedureCost: number
  approvedMedicationCost: number
  approvedOtherServicesCost: number
  totalClaimedAmount: number
  totalApprovedAmount: number
  totalRejectedAmount: number
  totalItemsCount: number
  approvedItemsCount: number
  rejectedItemsCount: number
  pendingItemsCount: number
  nhiaComplianceScore?: number
  averageCostVariance?: number
  highCostItemsCount: number
}

interface TPAClaimReviewProps {
  claimId: number
  items: ClaimItem[]
  summary?: ClaimItemSummary
  onReviewComplete: () => void
  readOnly?: boolean
}

const ITEM_TYPE_COLORS = {
  investigation: 'bg-blue-100 text-blue-800',
  procedure: 'bg-green-100 text-green-800',
  medication: 'bg-purple-100 text-purple-800',
  other_service: 'bg-orange-100 text-orange-800'
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  needs_clarification: 'bg-blue-100 text-blue-800'
}

const COMPLIANCE_COLORS = {
  compliant: 'bg-green-100 text-green-800',
  needs_review: 'bg-yellow-100 text-yellow-800',
  excessive: 'bg-red-100 text-red-800'
}

export function TPAClaimReview({ claimId, items: initialItems, summary, onReviewComplete, readOnly = false }: TPAClaimReviewProps) {
  const [items, setItems] = useState<ClaimItem[]>(initialItems)
  const [selectedItem, setSelectedItem] = useState<ClaimItem | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve_all' | 'reject_all' | ''>('')
  const [summaryNotes, setSummaryNotes] = useState({
    tpaRemarks: '',
    clinicalJustification: '',
    costJustification: ''
  })
  const { toast } = useToast()

  // Calculate real-time summary
  const calculateSummary = (): ClaimItemSummary => {
    const summary: ClaimItemSummary = {
      totalInvestigationCost: 0,
      totalProcedureCost: 0,
      totalMedicationCost: 0,
      totalOtherServicesCost: 0,
      approvedInvestigationCost: 0,
      approvedProcedureCost: 0,
      approvedMedicationCost: 0,
      approvedOtherServicesCost: 0,
      totalClaimedAmount: 0,
      totalApprovedAmount: 0,
      totalRejectedAmount: 0,
      totalItemsCount: items.length,
      approvedItemsCount: 0,
      rejectedItemsCount: 0,
      pendingItemsCount: 0,
      highCostItemsCount: 0
    }

    items.forEach(item => {
      // Claimed amounts by type
      switch (item.itemType) {
        case 'investigation':
          summary.totalInvestigationCost += item.totalCost
          if (item.reviewStatus === 'approved') {
            summary.approvedInvestigationCost += item.approvedTotalCost || item.totalCost
          }
          break
        case 'procedure':
          summary.totalProcedureCost += item.totalCost
          if (item.reviewStatus === 'approved') {
            summary.approvedProcedureCost += item.approvedTotalCost || item.totalCost
          }
          break
        case 'medication':
          summary.totalMedicationCost += item.totalCost
          if (item.reviewStatus === 'approved') {
            summary.approvedMedicationCost += item.approvedTotalCost || item.totalCost
          }
          break
        case 'other_service':
          summary.totalOtherServicesCost += item.totalCost
          if (item.reviewStatus === 'approved') {
            summary.approvedOtherServicesCost += item.approvedTotalCost || item.totalCost
          }
          break
      }

      // Totals
      summary.totalClaimedAmount += item.totalCost
      
      if (item.reviewStatus === 'approved') {
        summary.approvedItemsCount++
        summary.totalApprovedAmount += item.approvedTotalCost || item.totalCost
      } else if (item.reviewStatus === 'rejected') {
        summary.rejectedItemsCount++
        summary.totalRejectedAmount += item.totalCost
      } else {
        summary.pendingItemsCount++
      }

      // High cost items (variance > 25%)
      if (item.costVariancePercentage && item.costVariancePercentage > 25) {
        summary.highCostItemsCount++
      }
    })

    return summary
  }

  const currentSummary = calculateSummary()

  const reviewItem = async (itemId: number, reviewData: {
    reviewStatus: string
    reviewNotes?: string
    approvedQuantity?: number
    approvedUnitCost?: number
    rejectionReason?: string
  }) => {
    try {
      const response = await fetch(`/api/claims/${claimId}/items/${itemId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      })

      if (!response.ok) throw new Error('Failed to review item')

      // Update local state
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          const approvedTotalCost = reviewData.approvedQuantity && reviewData.approvedUnitCost 
            ? reviewData.approvedQuantity * reviewData.approvedUnitCost
            : undefined

          return {
            ...item,
            isReviewed: true,
            reviewStatus: reviewData.reviewStatus as any,
            reviewNotes: reviewData.reviewNotes,
            approvedQuantity: reviewData.approvedQuantity,
            approvedUnitCost: reviewData.approvedUnitCost,
            approvedTotalCost,
            rejectionReason: reviewData.rejectionReason
          }
        }
        return item
      }))

      toast({
        title: "Item Reviewed",
        description: `Item has been ${reviewData.reviewStatus}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to review item. Please try again.",
        variant: "destructive"
      })
    }
  }

  const finalizeSummary = async () => {
    setIsReviewing(true)
    try {
      const response = await fetch(`/api/claims/${claimId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentSummary,
          ...summaryNotes,
          isFinalized: true
        })
      })

      if (!response.ok) throw new Error('Failed to finalize summary')

      toast({
        title: "Review Complete",
        description: "Claim items review has been finalized.",
      })

      onReviewComplete()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to finalize review. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsReviewing(false)
    }
  }

  const getComplianceScore = () => {
    const totalVariance = items.reduce((sum, item) => {
      return sum + (item.costVariancePercentage || 0)
    }, 0) / items.length || 0

    if (totalVariance <= 10) return { score: 100, level: 'Excellent' }
    if (totalVariance <= 25) return { score: 80, level: 'Good' }
    if (totalVariance <= 50) return { score: 60, level: 'Fair' }
    return { score: 40, level: 'Poor' }
  }

  const compliance = getComplianceScore()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{currentSummary.totalItemsCount}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Claimed Amount</p>
                <p className="text-2xl font-bold">₦{currentSummary.totalClaimedAmount.toLocaleString()}</p>
              </div>
              <Calculator className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Approved Amount</p>
                <p className="text-2xl font-bold text-green-600">₦{currentSummary.totalApprovedAmount.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Compliance</p>
                <p className="text-2xl font-bold">{compliance.score}%</p>
                <p className="text-xs text-gray-500">{compliance.level}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="review">Item Review</TabsTrigger>
          <TabsTrigger value="summary">Cost Summary</TabsTrigger>
          <TabsTrigger value="finalize">Finalize</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Item Review ({currentSummary.pendingItemsCount} pending)</CardTitle>
                {!readOnly && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      items.forEach(item => {
                        if (item.reviewStatus === 'pending') {
                          reviewItem(item.id, { reviewStatus: 'approved' })
                        }
                      })
                    }}>
                      Approve All Pending
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={ITEM_TYPE_COLORS[item.itemType]}>
                            {item.itemType.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{item.itemCategory}</Badge>
                          <Badge className={STATUS_COLORS[item.reviewStatus]}>
                            {item.reviewStatus.replace('_', ' ')}
                          </Badge>
                          {item.complianceFlag && (
                            <Badge className={COMPLIANCE_COLORS[item.complianceFlag]}>
                              {item.complianceFlag}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold">{item.itemName}</h4>
                        <p className="text-sm text-gray-600">{item.itemDescription}</p>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="font-semibold">₦{item.totalCost.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} {item.unit} × ₦{item.unitCost.toLocaleString()}
                        </div>
                        {item.costVariancePercentage && (
                          <div className={`text-xs ${item.costVariancePercentage > 25 ? 'text-red-600' : 'text-green-600'}`}>
                            {item.costVariancePercentage > 0 ? '+' : ''}{item.costVariancePercentage.toFixed(1)}% vs NHIA
                          </div>
                        )}
                      </div>
                    </div>

                    {item.reviewStatus === 'approved' && item.approvedTotalCost && (
                      <Alert className="mb-3">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Approved: ₦{item.approvedTotalCost.toLocaleString()} 
                          ({item.approvedQuantity} {item.unit} × ₦{item.approvedUnitCost?.toLocaleString()})
                        </AlertDescription>
                      </Alert>
                    )}

                    {item.reviewStatus === 'rejected' && item.rejectionReason && (
                      <Alert variant="destructive" className="mb-3">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          Rejected: {item.rejectionReason}
                        </AlertDescription>
                      </Alert>
                    )}

                    {!readOnly && item.reviewStatus === 'pending' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded">
                        <div className="space-y-2">
                          <Label>Approved Quantity</Label>
                          <Input
                            type="number"
                            defaultValue={item.quantity}
                            id={`approved-qty-${item.id}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Approved Unit Cost (₦)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            defaultValue={item.unitCost}
                            id={`approved-cost-${item.id}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Action</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const qty = parseInt((document.getElementById(`approved-qty-${item.id}`) as HTMLInputElement).value)
                                const cost = parseFloat((document.getElementById(`approved-cost-${item.id}`) as HTMLInputElement).value)
                                reviewItem(item.id, {
                                  reviewStatus: 'approved',
                                  approvedQuantity: qty,
                                  approvedUnitCost: cost
                                })
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const reason = prompt('Rejection reason:')
                                if (reason) {
                                  reviewItem(item.id, {
                                    reviewStatus: 'rejected',
                                    rejectionReason: reason
                                  })
                                }
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {item.reviewNotes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm"><strong>Review Notes:</strong> {item.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Investigations:</span>
                    <div className="text-right">
                      <div>₦{currentSummary.totalInvestigationCost.toLocaleString()}</div>
                      <div className="text-sm text-green-600">
                        Approved: ₦{currentSummary.approvedInvestigationCost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Procedures:</span>
                    <div className="text-right">
                      <div>₦{currentSummary.totalProcedureCost.toLocaleString()}</div>
                      <div className="text-sm text-green-600">
                        Approved: ₦{currentSummary.approvedProcedureCost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Medications:</span>
                    <div className="text-right">
                      <div>₦{currentSummary.totalMedicationCost.toLocaleString()}</div>
                      <div className="text-sm text-green-600">
                        Approved: ₦{currentSummary.approvedMedicationCost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Services:</span>
                    <div className="text-right">
                      <div>₦{currentSummary.totalOtherServicesCost.toLocaleString()}</div>
                      <div className="text-sm text-green-600">
                        Approved: ₦{currentSummary.approvedOtherServicesCost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <div className="text-right">
                    <div>₦{currentSummary.totalClaimedAmount.toLocaleString()}</div>
                    <div className="text-green-600">
                      Approved: ₦{currentSummary.totalApprovedAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Approved Items</span>
                      <span>{currentSummary.approvedItemsCount}/{currentSummary.totalItemsCount}</span>
                    </div>
                    <Progress value={(currentSummary.approvedItemsCount / currentSummary.totalItemsCount) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Amount Approved</span>
                      <span>{((currentSummary.totalApprovedAmount / currentSummary.totalClaimedAmount) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(currentSummary.totalApprovedAmount / currentSummary.totalClaimedAmount) * 100} className="h-2" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{currentSummary.approvedItemsCount}</div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{currentSummary.rejectedItemsCount}</div>
                    <div className="text-sm text-gray-600">Rejected</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{currentSummary.pendingItemsCount}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finalize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Finalize Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentSummary.pendingItemsCount > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    There are still {currentSummary.pendingItemsCount} pending items. Please review all items before finalizing.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>TPA Remarks</Label>
                  <Textarea
                    placeholder="Overall remarks about this claim..."
                    value={summaryNotes.tpaRemarks}
                    onChange={(e) => setSummaryNotes(prev => ({ ...prev, tpaRemarks: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Clinical Justification</Label>
                  <Textarea
                    placeholder="Medical justification for the approved treatments..."
                    value={summaryNotes.clinicalJustification}
                    onChange={(e) => setSummaryNotes(prev => ({ ...prev, clinicalJustification: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cost Justification</Label>
                  <Textarea
                    placeholder="Justification for the approved costs..."
                    value={summaryNotes.costJustification}
                    onChange={(e) => setSummaryNotes(prev => ({ ...prev, costJustification: e.target.value }))}
                    rows={3}
                  />
                </div>

                {!readOnly && (
                  <Button
                    onClick={finalizeSummary}
                    disabled={currentSummary.pendingItemsCount > 0 || isReviewing}
                    className="w-full"
                    size="lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isReviewing ? 'Finalizing...' : 'Finalize Review'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}