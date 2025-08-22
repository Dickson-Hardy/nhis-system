"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Eye, Package, Calculator, TrendingUp, 
  TestTube, Stethoscope, Pill, Bed, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Clock, FileText
} from "lucide-react"

interface ClaimItem {
  id: number
  itemType: 'investigation' | 'procedure' | 'medication' | 'other_service'
  itemCategory: string
  itemName: string
  itemDescription?: string
  quantity: number
  unit: string
  dosage?: string
  duration?: string
  unitCost: number
  totalCost: number
  serviceDate: string
  urgency: 'routine' | 'urgent' | 'emergency'
  indication?: string
  
  // Review status (for TPA)
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'needs_clarification'
  reviewNotes?: string
  approvedTotalCost?: number
}

interface TPAClaimItemsViewProps {
  claimId: number
  claimReference: string
  beneficiaryName: string
  treatmentProcedure: string
  totalCostOfCare: number
  items?: ClaimItem[]
  isExpanded?: boolean
  onToggle?: () => void
}

const ITEM_TYPE_CONFIG = {
  investigation: { 
    icon: TestTube, 
    color: 'bg-blue-100 text-blue-800',
    label: 'Investigation'
  },
  procedure: { 
    icon: Stethoscope, 
    color: 'bg-green-100 text-green-800',
    label: 'Procedure'
  },
  medication: { 
    icon: Pill, 
    color: 'bg-purple-100 text-purple-800',
    label: 'Medication'
  },
  other_service: { 
    icon: Bed, 
    color: 'bg-orange-100 text-orange-800',
    label: 'Other Service'
  }
}

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  needs_clarification: { color: 'bg-blue-100 text-blue-800', icon: AlertTriangle }
}

export function TPAClaimItemsView({ 
  claimId, 
  claimReference, 
  beneficiaryName,
  treatmentProcedure,
  totalCostOfCare,
  items = [],
  isExpanded = false,
  onToggle
}: TPAClaimItemsViewProps) {
  const [claimItems, setClaimItems] = useState<ClaimItem[]>(items)
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Fetch items if not provided
  useEffect(() => {
    if (items.length === 0 && isExpanded) {
      fetchClaimItems()
    }
  }, [isExpanded, claimId])

  const fetchClaimItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/claims/${claimId}/items`)
      if (response.ok) {
        const data = await response.json()
        setClaimItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch claim items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate summary stats
  const itemsByType = claimItems.reduce((acc, item) => {
    if (!acc[item.itemType]) {
      acc[item.itemType] = { count: 0, cost: 0, approvedCost: 0 }
    }
    acc[item.itemType].count++
    acc[item.itemType].cost += item.totalCost
    acc[item.itemType].approvedCost += item.approvedTotalCost || item.totalCost
    return acc
  }, {} as Record<string, { count: number; cost: number; approvedCost: number }>)

  const totalItemsCost = claimItems.reduce((sum, item) => sum + item.totalCost, 0)
  const totalApprovedCost = claimItems.reduce((sum, item) => sum + (item.approvedTotalCost || item.totalCost), 0)
  const pendingItems = claimItems.filter(item => !item.reviewStatus || item.reviewStatus === 'pending').length

  // Determine if should show inline or modal
  const shouldUseModal = claimItems.length > 8
  
  const ItemsList = () => (
    <div className="space-y-3">
      {claimItems.map((item) => {
        const TypeIcon = ITEM_TYPE_CONFIG[item.itemType].icon
        const StatusIcon = item.reviewStatus ? STATUS_CONFIG[item.reviewStatus].icon : Clock
        
        return (
          <Card key={item.id} className="border-l-4 border-l-gray-200">
            <CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={ITEM_TYPE_CONFIG[item.itemType].color}>
                      <TypeIcon className="h-3 w-3 mr-1" />
                      {ITEM_TYPE_CONFIG[item.itemType].label}
                    </Badge>
                    <Badge variant="outline">{item.itemCategory}</Badge>
                    {item.reviewStatus && (
                      <Badge className={STATUS_CONFIG[item.reviewStatus].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {item.reviewStatus.replace('_', ' ')}
                      </Badge>
                    )}
                    {item.urgency !== 'routine' && (
                      <Badge variant="destructive" className="text-xs">
                        {item.urgency.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">{item.itemName}</h4>
                    {item.itemDescription && item.itemDescription !== item.itemName && (
                      <p className="text-xs text-gray-600 mt-1">{item.itemDescription}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Qty:</span> {item.quantity} {item.unit}
                    </div>
                    <div>
                      <span className="font-medium">Unit Cost:</span> ₦{item.unitCost.toLocaleString()}
                    </div>
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

                  {item.reviewNotes && (
                    <div className="p-2 bg-blue-50 rounded text-xs">
                      <span className="font-medium">Review Notes:</span> {item.reviewNotes}
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <div className="font-semibold">₦{item.totalCost.toLocaleString()}</div>
                  {item.approvedTotalCost && item.approvedTotalCost !== item.totalCost && (
                    <div className="text-sm text-green-600">
                      Approved: ₦{item.approvedTotalCost.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const SummaryCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {Object.entries(itemsByType).map(([type, stats]) => {
        const TypeIcon = ITEM_TYPE_CONFIG[type as keyof typeof ITEM_TYPE_CONFIG].icon
        return (
          <Card key={type}>
            <CardContent className="p-3 text-center">
              <TypeIcon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
              <div className="text-lg font-bold">{stats.count}</div>
              <div className="text-xs text-gray-600">
                {ITEM_TYPE_CONFIG[type as keyof typeof ITEM_TYPE_CONFIG].label}s
              </div>
              <div className="text-xs font-medium">
                ₦{stats.cost.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  // If no items, show the original treatment procedure text
  if (claimItems.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium">Treatment Details</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="flex items-center gap-1"
          >
            <FileText className="h-4 w-4" />
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {isExpanded && (
          <Card>
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Original Treatment Text:</span>
                  <Badge variant="outline">₦{totalCostOfCare.toLocaleString()}</Badge>
                </div>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {treatmentProcedure || 'No treatment details provided'}
                </p>
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This claim uses the legacy format. No itemized breakdown is available.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-medium">Treatment Details</span>
          <Badge variant="secondary">{claimItems.length} items</Badge>
          {pendingItems > 0 && (
            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
              {pendingItems} pending review
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            ₦{totalItemsCost.toLocaleString()}
            {totalApprovedCost !== totalItemsCost && (
              <span className="text-green-600 ml-1">
                (₦{totalApprovedCost.toLocaleString()} approved)
              </span>
            )}
          </span>
          
          {shouldUseModal ? (
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>
                    Claim Items - {claimReference}
                  </DialogTitle>
                  <p className="text-sm text-gray-600">{beneficiaryName}</p>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <Tabs defaultValue="items" className="w-full">
                    <TabsList>
                      <TabsTrigger value="items">Items ({claimItems.length})</TabsTrigger>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                    </TabsList>
                    <TabsContent value="items" className="mt-4">
                      <ItemsList />
                    </TabsContent>
                    <TabsContent value="summary" className="mt-4">
                      <SummaryCards />
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Cost Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Total Claimed Amount:</span>
                              <span className="font-semibold">₦{totalItemsCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Approved Amount:</span>
                              <span className="font-semibold text-green-600">₦{totalApprovedCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Variance:</span>
                              <span className={`font-semibold ${totalApprovedCost < totalItemsCost ? 'text-red-600' : 'text-green-600'}`}>
                                ₦{Math.abs(totalApprovedCost - totalItemsCost).toLocaleString()}
                                ({totalItemsCost > 0 ? (((totalApprovedCost - totalItemsCost) / totalItemsCost) * 100).toFixed(1) : 0}%)
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="flex items-center gap-1"
            >
              <Package className="h-4 w-4" />
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
      
      {isExpanded && !shouldUseModal && (
        <Card>
          <CardContent className="p-4">
            <SummaryCards />
            <ItemsList />
          </CardContent>
        </Card>
      )}
      
      {isExpanded && shouldUseModal && (
        <Card>
          <CardContent className="p-4">
            <SummaryCards />
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                This claim has {claimItems.length} detailed items. Click "View Details" above to see the full breakdown in a modal window.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}