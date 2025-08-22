"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Eye, Package, Pill, TestTube, Stethoscope, 
  Calendar, User, AlertTriangle, CheckCircle, XCircle, Clock,
  Calculator, TrendingUp, TrendingDown, FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ClaimItem {
  id: number
  itemType: 'investigation' | 'procedure' | 'medication' | 'other_service'
  itemCategory: string
  itemName: string
  itemDescription?: string
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
  approvedTotalCost?: number
  rejectionReason?: string
  
  // Compliance
  costVariancePercentage?: number
  complianceFlag?: 'compliant' | 'needs_review' | 'excessive'
}

interface ClaimItemsModalProps {
  claimId: number
  claimReference: string
  beneficiaryName: string
  treatmentProcedure: string
  totalCostOfCare: number
  children: React.ReactNode
}

const ITEM_TYPE_CONFIG = {
  investigation: {
    icon: TestTube,
    label: 'Investigation',
    color: 'bg-blue-100 text-blue-800',
    bgColor: 'bg-blue-50'
  },
  procedure: {
    icon: Stethoscope,
    label: 'Procedure',
    color: 'bg-green-100 text-green-800',
    bgColor: 'bg-green-50'
  },
  medication: {
    icon: Pill,
    label: 'Medication',
    color: 'bg-purple-100 text-purple-800',
    bgColor: 'bg-purple-50'
  },
  other_service: {
    icon: Package,
    label: 'Other Service',
    color: 'bg-orange-100 text-orange-800',
    bgColor: 'bg-orange-50'
  }
}

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
  needs_clarification: { color: 'bg-blue-100 text-blue-800', icon: AlertTriangle }
}

export function ClaimItemsModal({ 
  claimId, 
  claimReference, 
  beneficiaryName, 
  treatmentProcedure, 
  totalCostOfCare,
  children 
}: ClaimItemsModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<ClaimItem[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchClaimItems = async () => {
    if (!isOpen) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/claims/${claimId}/items`)
      if (!response.ok) throw new Error('Failed to fetch claim items')
      
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load claim items. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClaimItems()
  }, [isOpen])

  // Group items by type
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.itemType]) acc[item.itemType] = []
    acc[item.itemType].push(item)
    return acc
  }, {} as Record<string, ClaimItem[]>)

  // Calculate summary stats
  const totalItems = items.length
  const approvedItems = items.filter(item => item.reviewStatus === 'approved').length
  const rejectedItems = items.filter(item => item.reviewStatus === 'rejected').length
  const pendingItems = items.filter(item => item.reviewStatus === 'pending').length
  
  const totalClaimedAmount = items.reduce((sum, item) => sum + item.totalCost, 0)
  const totalApprovedAmount = items.reduce((sum, item) => {
    if (item.reviewStatus === 'approved') {
      return sum + (item.approvedTotalCost || item.totalCost)
    }
    return sum
  }, 0)

  const getItemsByCategory = (category: keyof typeof ITEM_TYPE_CONFIG) => {
    return groupedItems[category] || []
  }

  const renderItemCard = (item: ClaimItem) => {
    const typeConfig = ITEM_TYPE_CONFIG[item.itemType]
    const statusConfig = STATUS_CONFIG[item.reviewStatus]
    const StatusIcon = statusConfig.icon
    const TypeIcon = typeConfig.icon

    return (
      <Card key={item.id} className={`mb-3 border-l-4 ${item.reviewStatus === 'approved' ? 'border-l-green-500' : 
        item.reviewStatus === 'rejected' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TypeIcon className="h-4 w-4" />
                <span className="font-semibold">{item.itemName}</span>
                {item.itemCode && (
                  <Badge variant="outline" className="text-xs">{item.itemCode}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                <Badge variant="outline">{item.itemCategory}</Badge>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {item.reviewStatus.replace('_', ' ')}
                </Badge>
                {item.urgency !== 'routine' && (
                  <Badge variant="destructive" className="text-xs">
                    {item.urgency.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-semibold text-lg">₦{item.totalCost.toLocaleString()}</div>
              <div className="text-sm text-gray-600">
                {item.quantity} {item.unit} × ₦{item.unitCost.toLocaleString()}
              </div>
              {item.reviewStatus === 'approved' && item.approvedTotalCost && item.approvedTotalCost !== item.totalCost && (
                <div className="text-sm text-green-600">
                  Approved: ₦{item.approvedTotalCost.toLocaleString()}
                </div>
              )}
              {item.costVariancePercentage && (
                <div className={`text-xs ${item.costVariancePercentage > 25 ? 'text-red-600' : 'text-green-600'}`}>
                  {item.costVariancePercentage > 0 ? '+' : ''}{item.costVariancePercentage.toFixed(1)}% vs NHIA
                </div>
              )}
            </div>
          </div>

          {item.itemDescription && (
            <p className="text-sm text-gray-700 mb-2">{item.itemDescription}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(item.serviceDate).toLocaleDateString()}
            </div>
            {item.prescribedBy && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {item.prescribedBy}
              </div>
            )}
            {item.dosage && (
              <div>
                <span className="font-medium">Dosage:</span> {item.dosage}
              </div>
            )}
            {item.duration && (
              <div>
                <span className="font-medium">Duration:</span> {item.duration}
              </div>
            )}
          </div>

          {item.indication && (
            <div className="text-sm mb-2">
              <span className="font-medium">Indication:</span> {item.indication}
            </div>
          )}

          {item.reviewNotes && (
            <div className="p-2 bg-blue-50 rounded text-sm">
              <span className="font-medium">Review Notes:</span> {item.reviewNotes}
            </div>
          )}

          {item.rejectionReason && (
            <div className="p-2 bg-red-50 rounded text-sm">
              <span className="font-medium">Rejection Reason:</span> {item.rejectionReason}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Claim Items Detail - {claimReference}
          </DialogTitle>
          <div className="text-sm text-gray-600">
            <div>Patient: {beneficiaryName}</div>
            <div>Procedure: {treatmentProcedure}</div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold">{totalItems}</div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{approvedItems}</div>
                  <div className="text-sm text-gray-600">Approved</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{rejectedItems}</div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{pendingItems}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600">Total Claimed</div>
                    <div className="text-xl font-bold">₦{totalClaimedAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Approved</div>
                    <div className="text-xl font-bold text-green-600">₦{totalApprovedAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Approval Rate</div>
                    <div className="text-xl font-bold">
                      {totalClaimedAmount > 0 ? ((totalApprovedAmount / totalClaimedAmount) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items by Category */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({totalItems})</TabsTrigger>
                <TabsTrigger value="investigation">
                  Investigations ({getItemsByCategory('investigation').length})
                </TabsTrigger>
                <TabsTrigger value="procedure">
                  Procedures ({getItemsByCategory('procedure').length})
                </TabsTrigger>
                <TabsTrigger value="medication">
                  Medications ({getItemsByCategory('medication').length})
                </TabsTrigger>
                <TabsTrigger value="other_service">
                  Other ({getItemsByCategory('other_service').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {items.map(renderItemCard)}
                  </div>
                </ScrollArea>
              </TabsContent>

              {Object.entries(ITEM_TYPE_CONFIG).map(([type, config]) => (
                <TabsContent key={type} value={type}>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {getItemsByCategory(type as keyof typeof ITEM_TYPE_CONFIG).map(renderItemCard)}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}