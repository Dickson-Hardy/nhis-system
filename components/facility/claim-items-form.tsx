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
import { Trash2, Plus, Upload, Calculator, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ClaimItem {
  id?: number
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
  prescribedDate?: string
  prescribedBy?: string
  indication?: string
  urgency: 'routine' | 'urgent' | 'emergency'
  supportingDocuments?: string[]
  prescriptionUrl?: string
  labResultUrl?: string
}

interface ClaimItemsFormProps {
  claimId?: number
  existingItems?: ClaimItem[]
  onItemsChange?: (items: ClaimItem[]) => void
  readOnly?: boolean
}

const ITEM_TYPES = [
  { value: 'investigation', label: 'Investigation', color: 'bg-blue-100 text-blue-800' },
  { value: 'procedure', label: 'Procedure', color: 'bg-green-100 text-green-800' },
  { value: 'medication', label: 'Medication', color: 'bg-purple-100 text-purple-800' },
  { value: 'other_service', label: 'Other Service', color: 'bg-orange-100 text-orange-800' }
]

const CATEGORIES = {
  investigation: [
    'Laboratory Test', 'Blood Test', 'Urine Test', 'Radiology', 'X-Ray', 'CT Scan', 
    'MRI', 'Ultrasound', 'ECG', 'Echo', 'Biopsy', 'Pathology', 'Microbiology'
  ],
  procedure: [
    'Surgery', 'Minor Surgery', 'Consultation', 'Emergency Treatment', 'Physiotherapy', 
    'Dialysis', 'Chemotherapy', 'Radiotherapy', 'Endoscopy', 'Cardiac Catheterization'
  ],
  medication: [
    'Prescription Drug', 'Injection', 'IV Fluid', 'Vaccine', 'Supplement', 
    'Pain Relief', 'Antibiotic', 'Chronic Medication', 'Emergency Medication'
  ],
  other_service: [
    'Bed Charges', 'Nursing Care', 'ICU Charges', 'Theatre Charges', 'Ambulance', 
    'Medical Equipment', 'Consumables', 'Administrative Fee'
  ]
}

const UNITS = [
  'tablets', 'capsules', 'ml', 'mg', 'sessions', 'days', 'hours', 
  'units', 'vials', 'sachets', 'pieces', 'procedures', 'tests'
]

export function ClaimItemsForm({ claimId, existingItems = [], onItemsChange, readOnly = false }: ClaimItemsFormProps) {
  const [items, setItems] = useState<ClaimItem[]>(existingItems)
  const [currentItem, setCurrentItem] = useState<ClaimItem>({
    itemType: 'investigation',
    itemCategory: '',
    itemName: '',
    itemDescription: '',
    quantity: 1,
    unit: 'units',
    unitCost: 0,
    totalCost: 0,
    serviceDate: new Date().toISOString().split('T')[0],
    urgency: 'routine'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Calculate total cost when quantity or unit cost changes
  useEffect(() => {
    const total = currentItem.quantity * currentItem.unitCost
    setCurrentItem(prev => ({ ...prev, totalCost: total }))
  }, [currentItem.quantity, currentItem.unitCost])

  // Notify parent of items change
  useEffect(() => {
    onItemsChange?.(items)
  }, [items, onItemsChange])

  const addItem = () => {
    if (!currentItem.itemName || !currentItem.itemCategory || currentItem.unitCost <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in item name, category, and unit cost.",
        variant: "destructive"
      })
      return
    }

    setItems(prev => [...prev, { ...currentItem, id: Date.now() }])
    
    // Reset form but keep some common fields
    setCurrentItem({
      itemType: currentItem.itemType,
      itemCategory: '',
      itemName: '',
      itemDescription: '',
      quantity: 1,
      unit: currentItem.unit,
      unitCost: 0,
      totalCost: 0,
      serviceDate: currentItem.serviceDate,
      urgency: 'routine',
      prescribedBy: currentItem.prescribedBy
    })

    toast({
      title: "Item Added",
      description: "Item has been added to the claim.",
    })
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
    toast({
      title: "Item Removed",
      description: "Item has been removed from the claim.",
    })
  }

  const saveItems = async () => {
    if (!claimId || items.length === 0) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/claims/${claimId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })

      if (!response.ok) throw new Error('Failed to save items')

      toast({
        title: "Items Saved",
        description: `Successfully saved ${items.length} items to the claim.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save items. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalClaimAmount = items.reduce((sum, item) => sum + item.totalCost, 0)

  return (
    <div className="space-y-6">
      {/* Add New Item Form */}
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Claim Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Item Type */}
              <div className="space-y-2">
                <Label htmlFor="itemType">Item Type *</Label>
                <Select value={currentItem.itemType} onValueChange={(value: any) => 
                  setCurrentItem(prev => ({ ...prev, itemType: value, itemCategory: '' }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className={`px-2 py-1 rounded text-xs ${type.color}`}>
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Item Category */}
              <div className="space-y-2">
                <Label htmlFor="itemCategory">Category *</Label>
                <Select value={currentItem.itemCategory} onValueChange={(value) => 
                  setCurrentItem(prev => ({ ...prev, itemCategory: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[currentItem.itemType]?.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Date */}
              <div className="space-y-2">
                <Label htmlFor="serviceDate">Service Date *</Label>
                <Input
                  type="date"
                  value={currentItem.serviceDate}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, serviceDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  placeholder="e.g., Full Blood Count, Appendectomy, Paracetamol"
                  value={currentItem.itemName}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, itemName: e.target.value }))}
                />
              </div>

              {/* Item Code */}
              <div className="space-y-2">
                <Label htmlFor="itemCode">Medical Code (Optional)</Label>
                <Input
                  placeholder="ICD-10, CPT, or facility code"
                  value={currentItem.itemCode || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, itemCode: e.target.value }))}
                />
              </div>
            </div>

            {/* Description and Indication */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemDescription">Description</Label>
                <Textarea
                  placeholder="Detailed description of the item/service"
                  value={currentItem.itemDescription}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, itemDescription: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="indication">Medical Indication</Label>
                <Textarea
                  placeholder="Why was this prescribed/performed?"
                  value={currentItem.indication || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, indication: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Quantity and Cost */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={currentItem.unit} onValueChange={(value) => 
                  setCurrentItem(prev => ({ ...prev, unit: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost (₦) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentItem.unitCost}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalCost">Total Cost (₦)</Label>
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold">₦{currentItem.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Medication-specific fields */}
            {currentItem.itemType === 'medication' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    placeholder="e.g., 500mg, 2 tablets"
                    value={currentItem.dosage || ''}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, dosage: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    placeholder="e.g., 7 days, 2 weeks"
                    value={currentItem.duration || ''}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prescribedDate">Prescribed Date</Label>
                  <Input
                    type="date"
                    value={currentItem.prescribedDate || ''}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, prescribedDate: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prescribedBy">Prescribed/Ordered By</Label>
                <Input
                  placeholder="Doctor's name"
                  value={currentItem.prescribedBy || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, prescribedBy: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={currentItem.urgency} onValueChange={(value: any) => 
                  setCurrentItem(prev => ({ ...prev, urgency: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={addItem} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Item to Claim
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Claim Items ({items.length})</CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-lg font-semibold">
                  Total: ₦{totalClaimAmount.toLocaleString()}
                </Badge>
                {!readOnly && claimId && (
                  <Button onClick={saveItems} disabled={isSubmitting}>
                    <Upload className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Items'}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id || index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={ITEM_TYPES.find(t => t.value === item.itemType)?.color}>
                          {ITEM_TYPES.find(t => t.value === item.itemType)?.label}
                        </Badge>
                        <Badge variant="outline">{item.itemCategory}</Badge>
                        {item.urgency !== 'routine' && (
                          <Badge variant="destructive">{item.urgency.toUpperCase()}</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold">{item.itemName}</h4>
                      {item.itemCode && (
                        <p className="text-sm text-gray-600">Code: {item.itemCode}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-semibold">₦{item.totalCost.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} {item.unit} × ₦{item.unitCost.toLocaleString()}
                        </div>
                      </div>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {item.itemDescription && (
                    <p className="text-sm text-gray-700">{item.itemDescription}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Service Date:</span> {item.serviceDate}
                    </div>
                    {item.prescribedBy && (
                      <div>
                        <span className="font-medium">Prescribed By:</span> {item.prescribedBy}
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
                    <div className="text-sm">
                      <span className="font-medium">Indication:</span> {item.indication}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No items have been added to this claim yet. Add individual procedures, medications, investigations, and other services above.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}