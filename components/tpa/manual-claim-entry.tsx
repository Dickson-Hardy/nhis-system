"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Loader2, CheckCircle, Plus, User, FileText, Calculator, AlertCircle, Info } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ManualClaimEntryProps {
  batchId: number
  batchNumber: string
  onComplete: () => void
}

export function ManualClaimEntry({ batchId, batchNumber, onComplete }: ManualClaimEntryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  
  // Form state
  const [formData, setFormData] = useState({
    // Beneficiary Information
    uniqueBeneficiaryId: "",
    uniqueClaimId: "",
    beneficiaryName: "",
    dateOfBirth: undefined as Date | undefined,
    age: "",
    address: "",
    phoneNumber: "",
    nin: "",
    
    // Treatment Information
    hospitalNumber: "",
    dateOfAdmission: undefined as Date | undefined,
    dateOfTreatment: undefined as Date | undefined,
    dateOfDischarge: undefined as Date | undefined,
    primaryDiagnosis: "",
    secondaryDiagnosis: "",
    treatmentProcedure: "",
    quantity: "1",
    
    // Cost Information
    costOfInvestigation: "",
    costOfProcedure: "",
    costOfMedication: "",
    costOfOtherServices: "",
    totalCostOfCare: "",
    
    // Additional Information
    tpaRemarks: "",
  })

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-calculate total cost when individual costs change
    if (['costOfInvestigation', 'costOfProcedure', 'costOfMedication', 'costOfOtherServices'].includes(field)) {
      const investigation = parseFloat(field === 'costOfInvestigation' ? value : formData.costOfInvestigation) || 0
      const procedure = parseFloat(field === 'costOfProcedure' ? value : formData.costOfProcedure) || 0
      const medication = parseFloat(field === 'costOfMedication' ? value : formData.costOfMedication) || 0
      const otherServices = parseFloat(field === 'costOfOtherServices' ? value : formData.costOfOtherServices) || 0
      
      const total = investigation + procedure + medication + otherServices
      setFormData(prev => ({ ...prev, totalCostOfCare: total.toString() }))
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.uniqueBeneficiaryId && formData.beneficiaryName && formData.uniqueClaimId)
      case 2:
        return !!(formData.dateOfAdmission && formData.primaryDiagnosis)
      case 3:
        return !!(formData.costOfInvestigation || formData.costOfProcedure || formData.costOfMedication || formData.costOfOtherServices)
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.uniqueBeneficiaryId || !formData.uniqueClaimId || !formData.beneficiaryName) {
        throw new Error("Please fill in all required fields")
      }

      const claimData = {
        batchId,
        uniqueBeneficiaryId: formData.uniqueBeneficiaryId,
        uniqueClaimId: formData.uniqueClaimId,
        beneficiaryName: formData.beneficiaryName,
        dateOfBirth: formData.dateOfBirth ? format(formData.dateOfBirth, 'yyyy-MM-dd') : null,
        age: formData.age ? parseInt(formData.age) : null,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        nin: formData.nin,
        hospitalNumber: formData.hospitalNumber,
        dateOfAdmission: formData.dateOfAdmission ? format(formData.dateOfAdmission, 'yyyy-MM-dd') : null,
        dateOfTreatment: formData.dateOfTreatment ? format(formData.dateOfTreatment, 'yyyy-MM-dd') : null,
        dateOfDischarge: formData.dateOfDischarge ? format(formData.dateOfDischarge, 'yyyy-MM-dd') : null,
        primaryDiagnosis: formData.primaryDiagnosis,
        secondaryDiagnosis: formData.secondaryDiagnosis,
        treatmentProcedure: formData.treatmentProcedure,
        quantity: parseInt(formData.quantity) || 1,
        costOfInvestigation: parseFloat(formData.costOfInvestigation) || 0,
        costOfProcedure: parseFloat(formData.costOfProcedure) || 0,
        costOfMedication: parseFloat(formData.costOfMedication) || 0,
        costOfOtherServices: parseFloat(formData.costOfOtherServices) || 0,
        totalCostOfCare: parseFloat(formData.totalCostOfCare) || 0,
        tpaRemarks: formData.tpaRemarks,
        dateOfClaimSubmission: new Date().toISOString().split('T')[0],
        monthOfSubmission: format(new Date(), 'MMMM yyyy'),
      }

      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(claimData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create claim: ${response.statusText}`)
      }

      setSuccess(true)
      setTimeout(() => {
        onComplete()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create claim")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      uniqueBeneficiaryId: "",
      uniqueClaimId: "",
      beneficiaryName: "",
      dateOfBirth: null,
      age: "",
      address: "",
      phoneNumber: "",
      nin: "",
      hospitalNumber: "",
      dateOfAdmission: null,
      dateOfTreatment: null,
      dateOfDischarge: null,
      primaryDiagnosis: "",
      secondaryDiagnosis: "",
      treatmentProcedure: "",
      quantity: "1",
      costOfInvestigation: "",
      costOfProcedure: "",
      costOfMedication: "",
      costOfOtherServices: "",
      totalCostOfCare: "",
      tpaRemarks: "",
    })
    setError(null)
    setSuccess(false)
  }

  if (success) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold mb-2">Claim Added Successfully</h3>
          <p className="text-muted-foreground mb-4">
            The claim has been added to batch {batchNumber}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={resetForm} variant="outline">
              Add Another Claim
            </Button>
            <Button onClick={onComplete}>
              View Batch
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Enhanced Step Navigation */}
      <div className="bg-gradient-to-br from-white to-blue-50/50 border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Add New Claim</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-gray-600">Adding to batch: <span className="font-semibold text-blue-600">{batchNumber}</span></p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-sm px-4 py-2 bg-white border-gray-300">
              Step {currentStep} of {totalSteps}
            </Badge>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </p>
          </div>
        </div>
        
        {/* Enhanced Progress Steps */}
        <div className="flex items-center justify-between">
          {[
            { step: 1, title: "Patient Information", subtitle: "Basic details", icon: User },
            { step: 2, title: "Treatment Details", subtitle: "Medical info", icon: FileText },
            { step: 3, title: "Cost Breakdown", subtitle: "Financial data", icon: Calculator },
            { step: 4, title: "Review & Submit", subtitle: "Final check", icon: CheckCircle }
          ].map((item, index) => (
            <div key={item.step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 shadow-sm",
                    item.step < currentStep
                      ? "bg-green-500 text-white shadow-green-200"
                      : item.step === currentStep
                      ? "bg-blue-500 text-white ring-4 ring-blue-200 scale-110"
                      : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                  )}
                >
                  {item.step < currentStep ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <item.icon className="h-6 w-6" />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-sm font-semibold",
                    item.step <= currentStep ? "text-gray-900" : "text-gray-500"
                  )}>
                    {item.title}
                  </p>
                  <p className={cn(
                    "text-xs",
                    item.step <= currentStep ? "text-gray-600" : "text-gray-400"
                  )}>
                    {item.subtitle}
                  </p>
                </div>
              </div>
              {index < 3 && (
                <div className={cn(
                  "flex-1 h-1 mx-4 rounded-full transition-colors duration-300",
                  item.step < currentStep ? "bg-green-400" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Beneficiary Information */}
        {currentStep === 1 && (
        <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Patient Information</CardTitle>
              <CardDescription className="text-gray-600">Enter the patient/beneficiary details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="uniqueBeneficiaryId" className="text-sm font-semibold text-gray-900">
                Unique Beneficiary ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="uniqueBeneficiaryId"
                value={formData.uniqueBeneficiaryId}
                onChange={(e) => updateFormData('uniqueBeneficiaryId', e.target.value)}
                placeholder="e.g., 3356_A"
                required
                className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
              <p className="text-xs text-gray-500">Enter the unique identifier for this beneficiary</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="uniqueClaimId" className="text-sm font-semibold text-gray-900">
                Unique Claim ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="uniqueClaimId"
                value={formData.uniqueClaimId}
                onChange={(e) => updateFormData('uniqueClaimId', e.target.value)}
                placeholder="e.g., 3356AXA_A"
                required
                className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
              <p className="text-xs text-gray-500">Enter the unique claim identifier</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiaryName" className="text-sm font-semibold text-gray-900">
              Beneficiary Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="beneficiaryName"
              value={formData.beneficiaryName}
              onChange={(e) => updateFormData('beneficiaryName', e.target.value)}
              placeholder="e.g., GODSWIL MESHACH"
              required
              className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
            />
            <p className="text-xs text-gray-500">Enter the full name of the beneficiary as it appears on their ID</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dateOfBirth}
                    onSelect={(date) => updateFormData('dateOfBirth', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => updateFormData('age', e.target.value)}
                placeholder="Age"
              />
            </div>
            <div>
              <Label htmlFor="nin">NIN</Label>
              <Input
                id="nin"
                value={formData.nin}
                onChange={(e) => updateFormData('nin', e.target.value)}
                placeholder="National Identification Number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="Enter address"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                placeholder="e.g., 08012345678"
              />
            </div>
          </div>
        </CardContent>
      </Card>
        )}

        {/* Step 2: Treatment Information */}
        {currentStep === 2 && (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Treatment Information</CardTitle>
              <CardDescription className="text-gray-600">Enter treatment and hospital details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div>
            <Label htmlFor="hospitalNumber">Hospital Number</Label>
            <Input
              id="hospitalNumber"
              value={formData.hospitalNumber}
              onChange={(e) => updateFormData('hospitalNumber', e.target.value)}
              placeholder="Hospital record number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Date of Admission</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dateOfAdmission && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateOfAdmission ? format(formData.dateOfAdmission, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dateOfAdmission}
                    onSelect={(date) => updateFormData('dateOfAdmission', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Date of Treatment</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dateOfTreatment && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateOfTreatment ? format(formData.dateOfTreatment, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dateOfTreatment}
                    onSelect={(date) => updateFormData('dateOfTreatment', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Date of Discharge</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dateOfDischarge && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateOfDischarge ? format(formData.dateOfDischarge, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dateOfDischarge}
                    onSelect={(date) => updateFormData('dateOfDischarge', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryDiagnosis">Primary Diagnosis</Label>
              <Input
                id="primaryDiagnosis"
                value={formData.primaryDiagnosis}
                onChange={(e) => updateFormData('primaryDiagnosis', e.target.value)}
                placeholder="Primary diagnosis"
              />
            </div>
            <div>
              <Label htmlFor="secondaryDiagnosis">Secondary Diagnosis</Label>
              <Input
                id="secondaryDiagnosis"
                value={formData.secondaryDiagnosis}
                onChange={(e) => updateFormData('secondaryDiagnosis', e.target.value)}
                placeholder="Secondary diagnosis (if any)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="treatmentProcedure">Treatment/Procedure</Label>
              <Input
                id="treatmentProcedure"
                value={formData.treatmentProcedure}
                onChange={(e) => updateFormData('treatmentProcedure', e.target.value)}
                placeholder="Treatment or procedure performed"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => updateFormData('quantity', e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
        )}

        {/* Step 3: Cost Information */}
        {currentStep === 3 && (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Cost Information</CardTitle>
              <CardDescription className="text-gray-600">Enter cost breakdown (in Naira)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costOfInvestigation">Cost of Investigation</Label>
              <Input
                id="costOfInvestigation"
                type="number"
                value={formData.costOfInvestigation}
                onChange={(e) => updateFormData('costOfInvestigation', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="costOfProcedure">Cost of Procedure</Label>
              <Input
                id="costOfProcedure"
                type="number"
                value={formData.costOfProcedure}
                onChange={(e) => updateFormData('costOfProcedure', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costOfMedication">Cost of Medication</Label>
              <Input
                id="costOfMedication"
                type="number"
                value={formData.costOfMedication}
                onChange={(e) => updateFormData('costOfMedication', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="costOfOtherServices">Cost of Other Services</Label>
              <Input
                id="costOfOtherServices"
                type="number"
                value={formData.costOfOtherServices}
                onChange={(e) => updateFormData('costOfOtherServices', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="totalCostOfCare">Total Cost of Care</Label>
            <Input
              id="totalCostOfCare"
              type="number"
              value={formData.totalCostOfCare}
              onChange={(e) => updateFormData('totalCostOfCare', e.target.value)}
              placeholder="Auto-calculated"
              min="0"
              step="0.01"
              className="font-semibold"
            />
          </div>
        </CardContent>
      </Card>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">Review & Submit</CardTitle>
                  <CardDescription className="text-gray-600">Review all information before submitting</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Review Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-lg border-b border-gray-200 pb-2">Patient Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.beneficiaryName || 'Not specified'}</span></div>
                    <div><span className="text-gray-600">Beneficiary ID:</span> <span className="font-medium">{formData.uniqueBeneficiaryId || 'Not specified'}</span></div>
                    <div><span className="text-gray-600">Claim ID:</span> <span className="font-medium">{formData.uniqueClaimId || 'Not specified'}</span></div>
                    <div><span className="text-gray-600">Age:</span> <span className="font-medium">{formData.age || 'Not specified'}</span></div>
                    <div><span className="text-gray-600">NIN:</span> <span className="font-medium">{formData.nin || 'Not specified'}</span></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-lg border-b border-gray-200 pb-2">Treatment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Primary Diagnosis:</span> <span className="font-medium">{formData.primaryDiagnosis || 'Not specified'}</span></div>
                    <div><span className="text-gray-600">Treatment:</span> <span className="font-medium">{formData.treatmentProcedure || 'Not specified'}</span></div>
                    <div><span className="text-gray-600">Admission:</span> <span className="font-medium">{formData.dateOfAdmission ? format(formData.dateOfAdmission, "PPP") : 'Not specified'}</span></div>
                    <div><span className="text-gray-600">Discharge:</span> <span className="font-medium">{formData.dateOfDischarge ? format(formData.dateOfDischarge, "PPP") : 'Not specified'}</span></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-lg border-b border-gray-200 pb-2">Cost Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Investigation:</span> <span className="font-medium">₦{parseFloat(formData.costOfInvestigation || '0').toLocaleString()}</span></div>
                    <div><span className="text-gray-600">Procedure:</span> <span className="font-medium">₦{parseFloat(formData.costOfProcedure || '0').toLocaleString()}</span></div>
                    <div><span className="text-gray-600">Medication:</span> <span className="font-medium">₦{parseFloat(formData.costOfMedication || '0').toLocaleString()}</span></div>
                    <div><span className="text-gray-600">Other Services:</span> <span className="font-medium">₦{parseFloat(formData.costOfOtherServices || '0').toLocaleString()}</span></div>
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-900 font-semibold">Total Cost:</span> 
                      <span className="font-bold text-lg text-green-600 ml-2">₦{parseFloat(formData.totalCostOfCare || '0').toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Remarks */}
              <div className="space-y-3">
                <Label htmlFor="tpaRemarks" className="text-lg font-semibold">Additional Remarks</Label>
                <Textarea
                  id="tpaRemarks"
                  value={formData.tpaRemarks}
                  onChange={(e) => updateFormData('tpaRemarks', e.target.value)}
                  placeholder="Additional remarks or notes about this claim..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Validation Alert */}
              {(!formData.uniqueBeneficiaryId || !formData.beneficiaryName || !formData.uniqueClaimId) && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Please ensure all required fields are completed before submitting.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3"
          >
            ← Previous
          </Button>
          
          <div className="flex space-x-4">
            <Button type="button" variant="ghost" onClick={resetForm} className="text-gray-600">
              Reset Form
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                type="button" 
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
              >
                Next →
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting || !validateStep(currentStep)}
                className="bg-green-600 hover:bg-green-700 px-6 py-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Claim...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Claim
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
    </form>
    </div>
  )
}