"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

interface Batch {
  id: number
  batchNumber: string
  status: string
  weekStartDate: string
  weekEndDate: string
}

export function DischargeForm() {
  const [formData, setFormData] = useState({
    uniqueBeneficiaryId: "",
    hospitalNumber: "",
    beneficiaryName: "",
    dateOfBirth: "",
    age: "",
    address: "",
    phoneNumber: "",
    nin: "",
    dateOfAdmission: "",
    dateOfDischarge: "",
    primaryDiagnosis: [] as string[],
    secondaryDiagnosis: "",
    procedureCost: "",
    treatmentCost: "",
    medicationCost: "",
    otherCost: "",
    quantity: "",
    costOfInvestigation: "",
    costOfProcedure: "",
    costOfMedication: "",
    costOfOtherServices: "",
    batchId: "",
    status: "submitted",
  })

  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [showBatchRequired, setShowBatchRequired] = useState(false)

  useEffect(() => {
    fetchAvailableBatches()
  }, [])

  useEffect(() => {
    setShowBatchRequired(batches.length === 0)
  }, [batches])

  const fetchAvailableBatches = async () => {
    try {
      const response = await fetch("/api/facility/batches?status=draft")
      const data = await response.json()
      if (response.ok) {
        setBatches(data.batches || [])
      }
    } catch (error) {
      console.error("Error fetching batches:", error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateTotalCost = () => {
    const investigation = Number.parseFloat(formData.costOfInvestigation) || 0
    const procedure = Number.parseFloat(formData.procedureCost) || 0
    const treatment = Number.parseFloat(formData.treatmentCost) || 0
    const medication = Number.parseFloat(formData.medicationCost) || 0
    const other = Number.parseFloat(formData.otherCost) || 0
    const otherServices = Number.parseFloat(formData.costOfOtherServices) || 0
    
    return investigation + procedure + treatment + medication + other + otherServices
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.batchId) {
        toast({
          title: "Batch Required",
          description: "Please select a batch before submitting the form.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (formData.primaryDiagnosis.length === 0) {
        toast({
          title: "Primary Diagnosis Required",
          description: "Please select at least one primary diagnosis.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const finalPrimaryDiagnosis = formData.primaryDiagnosis.join("; ")
      const totalCostOfCare = calculateTotalCost()
      
      // Submission Logic for Treatment Procedures
      const submissionData = {
        uniqueBeneficiaryId: formData.uniqueBeneficiaryId,
        hospitalNumber: formData.hospitalNumber,
        beneficiaryName: formData.beneficiaryName,
        dateOfBirth: formData.dateOfBirth,
        age: formData.age,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        nin: formData.nin,
        dateOfAdmission: formData.dateOfAdmission,
        dateOfDischarge: formData.dateOfDischarge,
        primaryDiagnosis: finalPrimaryDiagnosis,
        secondaryDiagnosis: formData.secondaryDiagnosis,
        procedureCost: formData.procedureCost,
        treatmentCost: formData.treatmentCost,
        medicationCost: formData.medicationCost,
        otherCost: formData.otherCost,
        quantity: formData.quantity,
        costOfInvestigation: formData.costOfInvestigation,
        costOfProcedure: formData.costOfProcedure,
        costOfMedication: formData.costOfMedication,
        costOfOtherServices: formData.costOfOtherServices,
        totalCostOfCare: totalCostOfCare.toString(),
        batchId: parseInt(formData.batchId),
        status: formData.status
      }
      
      const response = await fetch("/api/facility/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Discharge form saved successfully",
        })
        
        // Form Reset
        setFormData({
          uniqueBeneficiaryId: "",
          hospitalNumber: "",
          beneficiaryName: "",
          dateOfBirth: "",
          age: "",
          address: "",
          phoneNumber: "",
          nin: "",
          dateOfAdmission: "",
          dateOfDischarge: "",
          primaryDiagnosis: [],
          secondaryDiagnosis: "",
          procedureCost: "",
          treatmentCost: "",
          medicationCost: "",
          otherCost: "",
          quantity: "",
          costOfInvestigation: "",
          costOfProcedure: "",
          costOfMedication: "",
          costOfOtherServices: "",
          batchId: "",
          status: "submitted"
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save discharge form",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while saving form",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-card-foreground">Patient Discharge Form</CardTitle>
        <CardDescription>Complete the discharge form for cesarean section procedures</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {showBatchRequired && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">!</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 text-lg">Batch Required First</h4>
                  <p className="text-blue-700">
                    You must create a batch before adding claims. Claims can only be created within open batches.
                  </p>
                  <div className="mt-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        const batchTab = document.querySelector('[data-value="batches"]') as HTMLElement;
                        if (batchTab) {
                          batchTab.click();
                        }
                      }}
                    >
                      Create Batch
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="uniqueBeneficiaryId">Unique Beneficiary ID *</Label>
                <Input
                  id="uniqueBeneficiaryId"
                  value={formData.uniqueBeneficiaryId}
                  onChange={(e) => handleInputChange("uniqueBeneficiaryId", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalNumber">Hospital Number *</Label>
                <Input
                  id="hospitalNumber"
                  value={formData.hospitalNumber}
                  onChange={(e) => handleInputChange("hospitalNumber", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiaryName">Beneficiary Name *</Label>
                <Input
                  id="beneficiaryName"
                  value={formData.beneficiaryName}
                  onChange={(e) => handleInputChange("beneficiaryName", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nin">NIN</Label>
                <Input
                  id="nin"
                  value={formData.nin}
                  onChange={(e) => handleInputChange("nin", e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="bg-input border-border"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">Admission & Treatment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfAdmission">Date of Admission *</Label>
                <Input
                  id="dateOfAdmission"
                  type="date"
                  value={formData.dateOfAdmission}
                  onChange={(e) => handleInputChange("dateOfAdmission", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfDischarge">Date of Discharge *</Label>
                <Input
                  id="dateOfDischarge"
                  type="date"
                  value={formData.dateOfDischarge}
                  onChange={(e) => handleInputChange("dateOfDischarge", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">Diagnosis Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Diagnosis *</Label>
                <div className="space-y-3 max-h-48 overflow-y-auto border rounded-lg p-3 bg-input">
                  {[
                    { value: "P/PROM O42", label: "P/PROM O42" },
                    { value: "Preeclampsia O14.9", label: "Preeclampsia O14.9" },
                    { value: "Eclampsia O15", label: "Eclampsia O15" },
                    { value: "Antepartum haemorrhage O46.9", label: "Antepartum haemorrhage O46.9" },
                    { value: "Postpartum haemorrhage O72.0-O72.2", label: "Postpartum haemorrhage O72.0-O72.2" },
                    { value: "Ectopic pregnancy O00.1-O00.9", label: "Ectopic pregnancy O00.1-O00.9" },
                    { value: "Puerperal sepsis O85", label: "Puerperal sepsis O85" },
                    { value: "Post abortion care O03.3-O03.4 O03.8-O03.9", label: "Post abortion care O03.3-O03.4 O03.8-O03.9" },
                    { value: "Obstructed labour O33.3 O65.3", label: "Obstructed labour O33.3 O65.3" }
                  ].map((diagnosis) => (
                    <div key={diagnosis.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={diagnosis.value}
                        value={diagnosis.value}
                        checked={formData.primaryDiagnosis.includes(diagnosis.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              primaryDiagnosis: [...prev.primaryDiagnosis, diagnosis.value]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              primaryDiagnosis: prev.primaryDiagnosis.filter(d => d !== diagnosis.value)
                            }))
                          }
                        }}
                        className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <Label htmlFor={diagnosis.value} className="text-sm font-normal cursor-pointer">
                        {diagnosis.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.primaryDiagnosis.length === 0 && (
                  <p className="text-sm text-red-600">Please select at least one primary diagnosis.</p>
                )}
                {formData.primaryDiagnosis.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {formData.primaryDiagnosis.join(", ")}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryDiagnosis">Secondary Diagnosis</Label>
                <Textarea
                  id="secondaryDiagnosis"
                  value={formData.secondaryDiagnosis}
                  onChange={(e) => handleInputChange("secondaryDiagnosis", e.target.value)}
                  className="bg-input border-border"
                  rows={2}
                  placeholder="Additional diagnosis details, complications, or other conditions"
                />
              </div>
            </div>
          </div>

          {/* UI for Treatment Procedures (replaces old textarea) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">Treatment Cost Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="procedureCost">Procedure Cost (₦)</Label>
                <Input 
                  id="procedureCost" 
                  type="number" 
                  value={formData.procedureCost} 
                  onChange={(e) => handleInputChange("procedureCost", e.target.value)} 
                  className="bg-input border-border" 
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatmentCost">Treatment Cost (₦)</Label>
                <Input 
                  id="treatmentCost" 
                  type="number" 
                  value={formData.treatmentCost} 
                  onChange={(e) => handleInputChange("treatmentCost", e.target.value)} 
                  className="bg-input border-border" 
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicationCost">Medication Cost (₦)</Label>
                <Input 
                  id="medicationCost" 
                  type="number" 
                  value={formData.medicationCost} 
                  onChange={(e) => handleInputChange("medicationCost", e.target.value)} 
                  className="bg-input border-border" 
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherCost">Other Cost (₦)</Label>
                <Input 
                  id="otherCost" 
                  type="number" 
                  value={formData.otherCost} 
                  onChange={(e) => handleInputChange("otherCost", e.target.value)} 
                  className="bg-input border-border" 
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" value={formData.quantity} onChange={(e) => handleInputChange("quantity", e.target.value)} className="bg-input border-border" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">Cost Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costOfInvestigation">Cost of Investigation (₦)</Label>
                <Input
                  id="costOfInvestigation"
                  type="number"
                  step="0.01"
                  value={formData.costOfInvestigation}
                  onChange={(e) => handleInputChange("costOfInvestigation", e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costOfProcedure">Cost of Procedure (₦)</Label>
                <Input
                  id="costOfProcedure"
                  type="number"
                  step="0.01"
                  value={formData.costOfProcedure}
                  onChange={(e) => handleInputChange("costOfProcedure", e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costOfMedication">Cost of Medication (₦)</Label>
                <Input
                  id="costOfMedication"
                  type="number"
                  step="0.01"
                  value={formData.costOfMedication}
                  onChange={(e) => handleInputChange("costOfMedication", e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costOfOtherServices">Cost of Other Services (₦)</Label>
                <Input
                  id="costOfOtherServices"
                  type="number"
                  step="0.01"
                  value={formData.costOfOtherServices}
                  onChange={(e) => handleInputChange("costOfOtherServices", e.target.value)}
                  className="bg-input border-border"
                />
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-card-foreground">Total Cost of Care:</span>
                <span className="text-2xl font-bold text-primary">₦{calculateTotalCost().toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">Batch Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchId" className="text-red-600 font-semibold">
                  Assign to Batch * (Required)
                </Label>
                <Select value={formData.batchId} onValueChange={(value) => handleInputChange("batchId", value)}>
                  <SelectTrigger className="bg-input border-border border-red-300 focus:border-red-500">
                    <SelectValue placeholder="Select a batch (required)" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id.toString()}>
                        {batch.batchNumber} (Week: {new Date(batch.weekStartDate).toLocaleDateString()} - {new Date(batch.weekEndDate).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {batches.length === 0 && (
                  <p className="text-sm text-red-600">
                    No open batches available. Please create a batch first.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This claim will be assigned to the selected batch and included in the batch submission to TPA.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button 
              type="submit" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Discharge Form"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="border-border bg-transparent"
              onClick={() => setFormData({...formData, status: "draft"})}
            >
              Save as Draft
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
