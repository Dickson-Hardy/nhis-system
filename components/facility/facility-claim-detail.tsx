"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, Save, Upload, Wand2, Eye, EyeOff, Calculator, 
  FileText, Stethoscope, Pill, TestTube, Bed
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { parseClaimText } from "@/lib/claim-text-parser"

interface ClaimItem {
  id?: number
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
}

interface FacilityClaimDetailProps {
  claimId?: number
  treatmentProcedure?: string
  primaryDiagnosis?: string
  dateOfTreatment?: string
  onItemsChange?: (items: ClaimItem[]) => void
  existingItems?: ClaimItem[]
}

const ITEM_TYPE_CONFIG = {
  investigation: { 
    icon: TestTube, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Investigation'
  },
  procedure: { 
    icon: Stethoscope, 
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Procedure'
  },
  medication: { 
    icon: Pill, 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Medication'
  },
  other_service: { 
    icon: Bed, 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Other Service'
  }
}

export function FacilityClaimDetail({ 
  claimId, 
  treatmentProcedure = '', 
  primaryDiagnosis = '',
  dateOfTreatment,
  onItemsChange,
  existingItems = []
}: FacilityClaimDetailProps) {
  const [items, setItems] = useState<ClaimItem[]>(existingItems)
  const [rawText, setRawText] = useState(treatmentProcedure)
  const [showParsedItems, setShowParsedItems] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Update items when existingItems change
  useEffect(() => {
    setItems(existingItems)
  }, [existingItems])

  // Notify parent of items change
  useEffect(() => {
    onItemsChange?.(items)
  }, [items, onItemsChange])

  const generateItemsFromText = async () => {
    if (!rawText.trim()) {
      toast({
        title: "No text provided",
        description: "Please enter treatment procedures and medications to generate items.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const serviceDate = dateOfTreatment || new Date().toISOString().split('T')[0]
      const parsedItems = parseClaimText(rawText, serviceDate, primaryDiagnosis)
      
      if (parsedItems.length === 0) {
        toast({
          title: "No items found",
          description: "Could not parse any valid items from the text. Please check the format.",
          variant: "destructive"
        })
        return
      }

      setItems(parsedItems)
      setShowParsedItems(true)
      
      toast({
        title: "Items Generated",
        description: `Successfully generated ${parsedItems.length} items from your text.`,
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to parse the text. Please check the format and try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const saveItems = async () => {
    if (!claimId || items.length === 0) {
      toast({
        title: "Nothing to save",
        description: "No items to save or claim ID missing.",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/claims/${claimId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })

      if (!response.ok) {
        throw new Error('Failed to save items')
      }

      const result = await response.json()
      
      toast({
        title: "Items Saved",
        description: `Successfully saved ${result.itemsCreated || items.length} items to the claim.`,
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save items. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateItemCost = (index: number, field: 'quantity' | 'unitCost', value: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value }
        updated.totalCost = updated.quantity * updated.unitCost
        return updated
      }
      return item
    }))
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0)
  const itemsByType = items.reduce((acc, item) => {
    acc[item.itemType] = (acc[item.itemType] || 0) + item.totalCost
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Treatment & Medication Details
            <Badge variant="outline" className="ml-auto">
              {items.length} items • ₦{totalAmount.toLocaleString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="input" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="input">Text Input</TabsTrigger>
              <TabsTrigger value="items">Item Details ({items.length})</TabsTrigger>
              <TabsTrigger value="summary">Cost Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="treatment-text">
                    Treatment Procedures & Medications
                    <span className="text-sm text-gray-500 ml-2">
                      (Enter as comma-separated list - our system will parse and categorize automatically)
                    </span>
                  </Label>
                  <Textarea
                    id="treatment-text"
                    placeholder="e.g., PCV, HBSAG, HCV, IV CEFTRIAXONE 1G 12 HRLY, TAB CEFUROXIME 500MG BD 5/7, CAESAREAN SECTION, BED FEES, NURSING CARE..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={6}
                    className="text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={generateItemsFromText}
                    disabled={isGenerating || !rawText.trim()}
                    className="flex-1"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Parsing...' : 'Generate Items from Text'}
                  </Button>
                  
                  {items.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => setShowParsedItems(!showParsedItems)}
                    >
                      {showParsedItems ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  )}
                </div>

                {items.length > 0 && (
                  <Alert>
                    <Calculator className="h-4 w-4" />
                    <AlertDescription>
                      Generated {items.length} items with total estimated cost of ₦{totalAmount.toLocaleString()}. 
                      Review and adjust costs in the "Item Details" tab before saving.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              {items.length === 0 ? (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    No items have been generated yet. Use the "Text Input" tab to enter your treatment procedures and medications.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const TypeIcon = ITEM_TYPE_CONFIG[item.itemType].icon
                    return (
                      <Card key={index} className="border-l-4 border-l-gray-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className={ITEM_TYPE_CONFIG[item.itemType].color}>
                                  <TypeIcon className="h-3 w-3 mr-1" />
                                  {ITEM_TYPE_CONFIG[item.itemType].label}
                                </Badge>
                                <Badge variant="outline">{item.itemCategory}</Badge>
                                {item.urgency !== 'routine' && (
                                  <Badge variant="destructive" className="text-xs">
                                    {item.urgency.toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold">{item.itemName}</h4>
                              {item.itemDescription && item.itemDescription !== item.itemName && (
                                <p className="text-sm text-gray-600">{item.itemDescription}</p>
                              )}
                              {item.dosage && (
                                <p className="text-sm text-blue-600">Dosage: {item.dosage}</p>
                              )}
                              {item.duration && (
                                <p className="text-sm text-green-600">Duration: {item.duration}</p>
                              )}
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemCost(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Unit</Label>
                              <div className="h-8 px-3 py-1 bg-gray-50 rounded text-sm flex items-center">
                                {item.unit}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Unit Cost (₦)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) => updateItemCost(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Total Cost (₦)</Label>
                              <div className="h-8 px-3 py-1 bg-gray-100 rounded text-sm font-semibold flex items-center">
                                ₦{item.totalCost.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {claimId && (
                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={saveItems} 
                        disabled={isSaving}
                        size="lg"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : `Save ${items.length} Items`}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              {items.length === 0 ? (
                <Alert>
                  <Calculator className="h-4 w-4" />
                  <AlertDescription>
                    No items to summarize. Generate items from your treatment text first.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cost Breakdown by Type</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(itemsByType).map(([type, amount]) => {
                        const config = ITEM_TYPE_CONFIG[type as keyof typeof ITEM_TYPE_CONFIG]
                        const TypeIcon = config.icon
                        return (
                          <div key={type} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4" />
                              <span className="capitalize">{config.label}</span>
                            </div>
                            <span className="font-semibold">₦{amount.toLocaleString()}</span>
                          </div>
                        )
                      })}
                      <Separator />
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total</span>
                        <span>₦{totalAmount.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Item Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        {Object.entries(ITEM_TYPE_CONFIG).map(([type, config]) => {
                          const count = items.filter(item => item.itemType === type).length
                          const TypeIcon = config.icon
                          return (
                            <div key={type} className="space-y-1">
                              <div className="flex items-center justify-center gap-1">
                                <TypeIcon className="h-4 w-4" />
                                <span className="text-2xl font-bold">{count}</span>
                              </div>
                              <p className="text-sm text-gray-600">{config.label}s</p>
                            </div>
                          )
                        })}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Items:</span>
                          <span className="font-semibold">{items.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Cost per Item:</span>
                          <span className="font-semibold">
                            ₦{items.length > 0 ? Math.round(totalAmount / items.length).toLocaleString() : '0'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Urgent/Emergency Items:</span>
                          <span className="font-semibold">
                            {items.filter(item => item.urgency !== 'routine').length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}