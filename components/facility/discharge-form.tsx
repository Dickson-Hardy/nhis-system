"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
    dateOfTreatment: "",
    dateOfDischarge: "",
    primaryDiagnosis: "",
    secondaryDiagnosis: "",
    treatmentProcedure: "",
    quantity: "",
    costOfInvestigation: "",
    costOfProcedure: "",
    costOfMedication: "",
    costOfOtherServices: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateTotalCost = () => {
    const investigation = Number.parseFloat(formData.costOfInvestigation) || 0
    const procedure = Number.parseFloat(formData.costOfProcedure) || 0
    const medication = Number.parseFloat(formData.costOfMedication) || 0
    const otherServices = Number.parseFloat(formData.costOfOtherServices) || 0
    return investigation + procedure + medication + otherServices
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Discharge form submitted:", formData)
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-card-foreground">Patient Discharge Form</CardTitle>
        <CardDescription>Complete the discharge form for cesarean section procedures</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">
              Patient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="uniqueBeneficiaryId">Unique Beneficiary ID</Label>
                <Input
                  id="uniqueBeneficiaryId"
                  value={formData.uniqueBeneficiaryId}
                  onChange={(e) => handleInputChange("uniqueBeneficiaryId", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalNumber">Hospital Number</Label>
                <Input
                  id="hospitalNumber"
                  value={formData.hospitalNumber}
                  onChange={(e) => handleInputChange("hospitalNumber", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
                <Input
                  id="beneficiaryName"
                  value={formData.beneficiaryName}
                  onChange={(e) => handleInputChange("beneficiaryName", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  className="bg-input border-border"
                  required
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

          {/* Treatment Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-2">
              Treatment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfAdmission">Date of Admission</Label>
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
                <Label htmlFor="dateOfTreatment">Date of Treatment</Label>
                <Input
                  id="dateOfTreatment"
                  type="date"
                  value={formData.dateOfTreatment}
                  onChange={(e) => handleInputChange("dateOfTreatment", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfDischarge">Date of Discharge</Label>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryDiagnosis">Primary Diagnosis</Label>
                <Textarea
                  id="primaryDiagnosis"
                  value={formData.primaryDiagnosis}
                  onChange={(e) => handleInputChange("primaryDiagnosis", e.target.value)}
                  className="bg-input border-border"
                  rows={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryDiagnosis">Secondary Diagnosis</Label>
                <Textarea
                  id="secondaryDiagnosis"
                  value={formData.secondaryDiagnosis}
                  onChange={(e) => handleInputChange("secondaryDiagnosis", e.target.value)}
                  className="bg-input border-border"
                  rows={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="treatmentProcedure">Treatment/Procedure</Label>
                <Textarea
                  id="treatmentProcedure"
                  value={formData.treatmentProcedure}
                  onChange={(e) => handleInputChange("treatmentProcedure", e.target.value)}
                  className="bg-input border-border"
                  rows={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>

          {/* Cost Information Section */}
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

          <div className="flex gap-4 pt-6">
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Discharge Form
            </Button>
            <Button type="button" variant="outline" className="border-border bg-transparent">
              Save as Draft
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
