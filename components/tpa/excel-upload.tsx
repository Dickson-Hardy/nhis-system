"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import FacilitySelector from "@/components/tpa/facility-selector"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Building2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import * as XLSX from 'xlsx'

interface ExcelRow {
  serialNumber?: string
  uniqueBeneficiaryId: string
  uniqueClaimId: string
  tpaName: string
  facilityName: string
  facilityState: string
  facilityCode: string
  batchNumber: string
  hospitalNumber: string
  dateOfAdmission: string
  beneficiaryName: string
  dateOfBirth: string
  age: string
  address: string
  phoneNumber: string
  nin: string
  dateOfTreatment: string
  dateOfDischarge: string
  primaryDiagnosis: string
  secondaryDiagnosis: string
  treatmentProcedure: string
  quantity: string
  cost: string
  dateOfClaimSubmission: string
  monthOfSubmission: string
  costOfInvestigation: string
  costOfProcedure: string
  costOfMedication: string
  costOfOtherServices: string
  totalCostOfCare: string
  approvedCostOfCare: string
  decision: string
  reasonForRejection: string
  dateOfClaimsPayment: string
  tpaRemarks: string
  errors?: string[]
}

interface UploadState {
  file: File | null
  data: ExcelRow[]
  validRows: ExcelRow[]
  invalidRows: ExcelRow[]
  isProcessing: boolean
  uploadProgress: number
  step: "upload" | "preview" | "processing" | "complete"
  successCount?: number
  errorCount?: number
  batchSummary?: {
    totalBatches: number
    newBatches: string[]
    existingBatches: string[]
    totalClaims: number
    batchDetails: Array<{
      batchNumber: string
      batchId: number
      claimCount: number
      totalAmount: number
      isNew: boolean
    }>
  }
}

interface ExcelUploadProps {
  batchId: number
  batchNumber: string
  onComplete?: () => void
}

export function ExcelUpload({ batchId, batchNumber, onComplete }: ExcelUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    data: [],
    validRows: [],
    invalidRows: [],
    isProcessing: false,
    uploadProgress: 0,
    step: "upload",
  })

  // Facility management state
  const [defaultFacilityId, setDefaultFacilityId] = useState<number | undefined>()
  const [overrideFacilities, setOverrideFacilities] = useState(false)
  const [useAutoCreateFacilities, setUseAutoCreateFacilities] = useState(true)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadState((prev) => ({ ...prev, file, step: "processing", isProcessing: true }))
      processExcelFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  })

  const processExcelFile = async (file: File) => {
    try {
      // Simulate file processing with progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadState((prev) => ({ ...prev, uploadProgress: i }))
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Real Excel file processing using xlsx library
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          if (!data) {
            throw new Error("Failed to read file")
          }

          // Parse Excel file using xlsx
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Convert to JSON with header row handling
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: ""
          }) as any[][]

          if (jsonData.length < 2) {
            throw new Error("Excel file must contain at least a header row and one data row")
          }

          // Get headers from first row
          const headers = jsonData[0] as string[]
          
          // Map Excel data to our format
          const excelData: ExcelRow[] = []
          const validRows: ExcelRow[] = []
          const invalidRows: ExcelRow[] = []

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i]
            const rowData: ExcelRow = {
              serialNumber: row[0]?.toString() || "",
              uniqueBeneficiaryId: row[1]?.toString() || "",
              uniqueClaimId: row[2]?.toString() || "",
              tpaName: row[3]?.toString() || "",
              facilityName: row[4]?.toString() || "",
              facilityState: row[5]?.toString() || "",
              facilityCode: row[6]?.toString() || "",
              batchNumber: row[7]?.toString() || "",
              hospitalNumber: row[8]?.toString() || "",
              dateOfAdmission: row[9]?.toString() || "",
              beneficiaryName: row[10]?.toString() || "",
              dateOfBirth: row[11]?.toString() || "",
              age: row[12]?.toString() || "",
              address: row[13]?.toString() || "",
              phoneNumber: row[14]?.toString() || "",
              nin: row[15]?.toString() || "",
              dateOfTreatment: row[16]?.toString() || "",
              dateOfDischarge: row[17]?.toString() || "",
              primaryDiagnosis: row[18]?.toString() || "",
              secondaryDiagnosis: row[19]?.toString() || "",
              treatmentProcedure: row[20]?.toString() || "",
              quantity: row[21]?.toString() || "",
              cost: row[22]?.toString() || "",
              dateOfClaimSubmission: row[23]?.toString() || "",
              monthOfSubmission: row[24]?.toString() || "",
              costOfInvestigation: row[25]?.toString() || "",
              costOfProcedure: row[26]?.toString() || "",
              costOfMedication: row[27]?.toString() || "",
              costOfOtherServices: row[28]?.toString() || "",
              totalCostOfCare: row[29]?.toString() || "",
              approvedCostOfCare: row[30]?.toString() || "",
              decision: row[31]?.toString() || "",
              reasonForRejection: row[32]?.toString() || "",
              dateOfClaimsPayment: row[33]?.toString() || "",
              tpaRemarks: row[34]?.toString() || "",
              errors: []
            }

            // Validate required fields
            const errors: string[] = []
            if (!rowData.uniqueClaimId) errors.push("Missing Unique Claim ID")
            if (!rowData.beneficiaryName) errors.push("Missing Beneficiary Name")
            if (!rowData.facilityName) errors.push("Missing Facility Name")
            if (!rowData.totalCostOfCare) errors.push("Missing Total Cost of Care")
            if (!rowData.batchNumber) errors.push("Missing Batch Number")

            rowData.errors = errors
            excelData.push(rowData)

            if (errors.length === 0) {
              validRows.push(rowData)
            } else {
              invalidRows.push(rowData)
            }
          }

          setUploadState((prev) => ({
            ...prev,
            data: excelData,
            validRows,
            invalidRows,
            isProcessing: false,
            step: "preview",
          }))

        } catch (error) {
          console.error("Error parsing Excel file:", error)
          alert("Error parsing Excel file. Please ensure it's a valid Excel file with the correct format.")
          setUploadState((prev) => ({
            ...prev,
            isProcessing: false,
            step: "upload",
          }))
        }
      }

      reader.onerror = () => {
        alert("Error reading file")
        setUploadState((prev) => ({
          ...prev,
          isProcessing: false,
          step: "upload",
        }))
      }

      reader.readAsArrayBuffer(file)

    } catch (error) {
      console.error("Error processing file:", error)
      setUploadState((prev) => ({
        ...prev,
        isProcessing: false,
        step: "upload",
      }))
    }
  }

  const handleImport = async () => {
    setUploadState((prev) => ({ ...prev, isProcessing: true, step: "processing" }))

    try {
      let successCount = 0
      let errorCount = 0
      let batchSummary: any = null
      
      // Prepare claims data with facility options
      const claimsToUpload = uploadState.validRows.map(row => ({
        ...row,
        // Override facility if selected
        facilityId: overrideFacilities ? defaultFacilityId : undefined,
        // Flag to auto-create facilities from Excel data
        autoCreateFacilities: useAutoCreateFacilities,
        // Default facility fallback
        defaultFacilityId: defaultFacilityId
      }))
      
      // First, try bulk upload with automatic batch creation
      try {
        const response = await fetch('/api/claims/bulk-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            claims: claimsToUpload,
            autoCreateBatches: true, // Enable automatic batch creation
            fallbackBatchId: batchId, // Use provided batchId as fallback if no batch numbers
          }),
        })

        const result = await response.json()

        if (response.ok) {
          successCount = result.successCount || uploadState.validRows.length
          errorCount = result.errorCount || 0
          batchSummary = result.batchSummary
          
          setUploadState((prev) => ({
            ...prev,
            isProcessing: false,
            step: "complete",
            uploadProgress: 100,
            successCount,
            errorCount,
            batchSummary,
          }))
          
          if (onComplete && typeof onComplete === 'function') {
            onComplete()
          }
          return
        } else {
          console.warn("Bulk upload failed, falling back to individual creation:", result.error)
        }
      } catch (bulkError) {
        console.warn("Bulk upload endpoint not available, using individual creation:", bulkError)
      }
      
      // Fallback: Process valid rows by submitting them individually
      for (let i = 0; i < uploadState.validRows.length; i++) {
        const row = uploadState.validRows[i]
        
        try {
          const claimData = {
            batchId,
            batchNumber: row.batchNumber || batchNumber, // Use row's batch number or fallback
            serialNumber: row.serialNumber ? parseInt(row.serialNumber) : null,
            uniqueBeneficiaryId: row.uniqueBeneficiaryId,
            uniqueClaimId: row.uniqueClaimId,
            hospitalNumber: row.hospitalNumber,
            // Facility Information
            facilityName: row.facilityName,
            facilityCode: row.facilityCode,
            facilityState: row.facilityState,
            beneficiaryName: row.beneficiaryName,
            dateOfBirth: row.dateOfBirth,
            age: row.age ? parseInt(row.age) : null,
            address: row.address,
            phoneNumber: row.phoneNumber,
            nin: row.nin,
            dateOfAdmission: row.dateOfAdmission,
            dateOfTreatment: row.dateOfTreatment,
            dateOfDischarge: row.dateOfDischarge,
            primaryDiagnosis: row.primaryDiagnosis,
            secondaryDiagnosis: row.secondaryDiagnosis,
            treatmentProcedure: row.treatmentProcedure,
            quantity: row.quantity ? parseInt(row.quantity) : 1,
            cost: row.cost ? parseFloat(row.cost) : null,
            dateOfClaimSubmission: row.dateOfClaimSubmission,
            monthOfSubmission: row.monthOfSubmission,
            costOfInvestigation: row.costOfInvestigation ? parseFloat(row.costOfInvestigation) : 0,
            costOfProcedure: row.costOfProcedure ? parseFloat(row.costOfProcedure) : 0,
            costOfMedication: row.costOfMedication ? parseFloat(row.costOfMedication) : 0,
            costOfOtherServices: row.costOfOtherServices ? parseFloat(row.costOfOtherServices) : 0,
            totalCostOfCare: row.totalCostOfCare ? parseFloat(row.totalCostOfCare) : 0,
            approvedCostOfCare: row.approvedCostOfCare ? parseFloat(row.approvedCostOfCare) : null,
            decision: row.decision,
            reasonForRejection: row.reasonForRejection,
            dateOfClaimsPayment: row.dateOfClaimsPayment,
            tpaRemarks: row.tpaRemarks,
          }

          const response = await fetch('/api/claims', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(claimData),
          })

          if (response.ok) {
            successCount++
          } else {
            const errorText = await response.text()
            if (response.status === 409) {
              console.warn(`Duplicate claim skipped ${row.uniqueClaimId}: ${errorText}`)
              // Don't increment errorCount for duplicates in some cases
            } else {
              errorCount++
              console.error(`Failed to create claim ${row.uniqueClaimId}: ${errorText}`)
            }
          }
        } catch (error) {
          errorCount++
          console.error(`Error creating claim ${row.uniqueClaimId}:`, error)
        }

        // Update progress
        const progress = ((i + 1) / uploadState.validRows.length) * 100
        setUploadState((prev) => ({ ...prev, uploadProgress: progress }))
      }

      setUploadState((prev) => ({ 
        ...prev, 
        isProcessing: false, 
        step: "complete",
        successCount,
        errorCount,
        batchSummary,
      }))
      
      // Call onComplete callback to refresh batch data
      if (onComplete && typeof onComplete === 'function') {
        onComplete()
      }
      
    } catch (error) {
      console.error("Error importing data:", error)
      setUploadState((prev) => ({ ...prev, isProcessing: false, step: "preview" }))
    }
  }

  const resetUpload = () => {
    setUploadState({
      file: null,
      data: [],
      validRows: [],
      invalidRows: [],
      isProcessing: false,
      uploadProgress: 0,
      step: "upload",
    })
  }

  const downloadTemplate = () => {
    // In real implementation, generate and download Excel template
    console.log("Downloading Excel template...")
  }

  if (uploadState.step === "upload") {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Claims Excel File
            </CardTitle>
            <CardDescription>
              Upload your Excel file containing claims data. Make sure it follows the required format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary hover:bg-primary/5"
              }`}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-card-foreground">Drop the Excel file here...</p>
              ) : (
                <div>
                  <p className="text-card-foreground mb-2">Drag and drop your Excel file here, or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports .xlsx, .xls, and .csv files</p>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate} className="bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Download Excel Template
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Facility Configuration
            </CardTitle>
            <CardDescription>
              Configure how facilities should be handled during upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-create-facilities" 
                  checked={useAutoCreateFacilities}
                  onCheckedChange={(checked) => setUseAutoCreateFacilities(checked === true)}
                />
                <Label htmlFor="auto-create-facilities" className="text-sm">
                  Automatically create facilities from Excel data if they don't exist
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="override-facilities" 
                  checked={overrideFacilities}
                  onCheckedChange={(checked) => setOverrideFacilities(checked === true)}
                />
                <Label htmlFor="override-facilities" className="text-sm">
                  Use a single facility for all claims (override Excel facility data)
                </Label>
              </div>

              {(overrideFacilities || !useAutoCreateFacilities) && (
                <div className="ml-6 space-y-2">
                  <Label className="text-sm font-medium">
                    {overrideFacilities ? "Facility for all claims:" : "Default facility for missing data:"}
                  </Label>
                  <FacilitySelector
                    selectedFacilityId={defaultFacilityId}
                    onSelect={setDefaultFacilityId}
                    placeholder="Select a facility..."
                  />
                </div>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {useAutoCreateFacilities 
                  ? "Facilities will be automatically created if they don't exist in the system." 
                  : "Claims with missing or invalid facility data will use the default facility above."
                }
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Required Excel Columns</CardTitle>
            <CardDescription>Your Excel file must contain these columns in the correct order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {[
                "S/N",
                "Unique Beneficiary ID",
                "Unique Claim ID",
                "TPA Name",
                "Facility Name",
                "Facility State Name",
                "Facility Code",
                "Batch Number",
                "Hospital Number",
                "Date of Admission (DD/MM/YYYY)",
                "Name of beneficiary",
                "DOB (DD/MM/YYYY)",
                "Age",
                "Address",
                "Phone Number",
                "NIN",
                "Date of Treatment/Procedure",
                "Date of Discharge",
                "Primary Diagnosis",
                "Secondary Diagnosis",
                "Treatment/ Procedure",
                "Quantity",
                "Cost",
                "Date of claim submission (DD/MM/YY)",
                "Month of Submission (Automatically generated)",
                "Cost of Investigation",
                "Cost of Procedure",
                "Cost of Medication",
                "Cost of other services (e.g., bed)",
                "Total Cost of Care",
                "Approved Cost of Care",
                "Decision",
                "Reason for Rejection (If applicable)",
                "Date of claims payment",
                "TPA Remarks",
              ].map((column, index) => (
                <div key={column} className={`p-2 rounded text-card-foreground text-xs ${
                  index < 3 ? 'bg-blue-100 border border-blue-300' : 
                  index < 9 ? 'bg-green-100 border border-green-300' : 
                  index < 18 ? 'bg-yellow-100 border border-yellow-300' : 
                  index < 25 ? 'bg-purple-100 border border-purple-300' : 
                  'bg-orange-100 border border-orange-300'
                }`}>
                  <span className="font-medium text-xs text-slate-600">
                    {index + 1}.
                  </span> {column}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (uploadState.step === "processing") {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-card-foreground">Processing Excel File</CardTitle>
          <CardDescription>Please wait while we process your file...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={uploadState.uploadProgress} className="w-full" />
          <p className="text-center text-muted-foreground">
            {uploadState.uploadProgress < 100 ? "Reading file..." : "Validating data..."}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (uploadState.step === "preview") {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Data Preview</CardTitle>
            <CardDescription>Review the data before importing to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-1">{uploadState.data.length}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-chart-2">{uploadState.validRows.length}</div>
                <div className="text-sm text-muted-foreground">Valid Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{uploadState.invalidRows.length}</div>
                <div className="text-sm text-muted-foreground">Invalid Rows</div>
              </div>
            </div>

            {uploadState.invalidRows.length > 0 && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {uploadState.invalidRows.length} rows have validation errors and will be skipped during import.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 mb-4">
              <Button
                onClick={handleImport}
                disabled={uploadState.validRows.length === 0 || uploadState.isProcessing}
                className="bg-primary text-primary-foreground"
              >
                Import {uploadState.validRows.length} Valid Rows
              </Button>
              <Button variant="outline" onClick={resetUpload} className="bg-transparent">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground">Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-card-foreground">Status</TableHead>
                    <TableHead className="text-card-foreground">Claim ID</TableHead>
                    <TableHead className="text-card-foreground">Beneficiary</TableHead>
                    <TableHead className="text-card-foreground">Facility</TableHead>
                    <TableHead className="text-card-foreground">Total Cost</TableHead>
                    <TableHead className="text-card-foreground">Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadState.data.map((row, index) => (
                    <TableRow key={index} className="border-border">
                      <TableCell>
                        <Badge
                          className={
                            row.errors ? "bg-red-100 text-red-800 border-red-200" : "bg-green-100 text-green-800 border-green-200"
                          }
                        >
                          {row.errors ? "Invalid" : "Valid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-card-foreground">{row.uniqueClaimId}</TableCell>
                      <TableCell className="text-card-foreground">{row.beneficiaryName}</TableCell>
                      <TableCell className="text-card-foreground">{row.facilityName}</TableCell>
                      <TableCell className="text-card-foreground">
                        ₦{Number(row.totalCostOfCare).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-card-foreground">
                        {row.errors ? (
                          <div className="space-y-1">
                            {row.errors.map((error, errorIndex) => (
                              <div key={errorIndex} className="text-xs text-destructive">
                                {error}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-chart-2">No errors</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (uploadState.step === "complete") {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-chart-2" />
            Import Complete
          </CardTitle>
          <CardDescription>Your claims data has been successfully imported</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-chart-2" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Successfully Imported</h3>
            <p className="text-muted-foreground mb-4">
              {uploadState.successCount || uploadState.validRows.length} claims have been imported
              {uploadState.errorCount && uploadState.errorCount > 0 && ` (${uploadState.errorCount} failed)`}
            </p>
          </div>

          {/* Batch Summary */}
          {uploadState.batchSummary && (
            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground">Batch Summary</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{uploadState.batchSummary.totalBatches}</div>
                  <div className="text-sm text-blue-800">Total Batches</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{uploadState.batchSummary.newBatches.length}</div>
                  <div className="text-sm text-green-800">New Batches</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{uploadState.batchSummary.existingBatches.length}</div>
                  <div className="text-sm text-orange-800">Existing Batches</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{uploadState.batchSummary.totalClaims}</div>
                  <div className="text-sm text-purple-800">Total Claims</div>
                </div>
              </div>

              {/* New Batches Created */}
              {uploadState.batchSummary.newBatches.length > 0 && (
                <div>
                  <h5 className="font-medium text-green-700 mb-2">New Batches Created:</h5>
                  <div className="flex flex-wrap gap-2">
                    {uploadState.batchSummary.newBatches.map((batchNum) => (
                      <Badge key={batchNum} className="bg-green-100 text-green-800 border-green-200">
                        {batchNum}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Batches Updated */}
              {uploadState.batchSummary.existingBatches.length > 0 && (
                <div>
                  <h5 className="font-medium text-orange-700 mb-2">Existing Batches Updated:</h5>
                  <div className="flex flex-wrap gap-2">
                    {uploadState.batchSummary.existingBatches.map((batchNum) => (
                      <Badge key={batchNum} className="bg-orange-100 text-orange-800 border-orange-200">
                        {batchNum}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Batch Information */}
              <div>
                <h5 className="font-medium text-card-foreground mb-3">Batch Details:</h5>
                <div className="space-y-2">
                  {uploadState.batchSummary.batchDetails.map((batch) => (
                    <div key={batch.batchId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={batch.isNew ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                          {batch.isNew ? "NEW" : "EXISTING"}
                        </Badge>
                        <span className="font-medium">{batch.batchNumber}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{batch.claimCount} claims</div>
                        <div className="text-sm text-muted-foreground">
                          ₦{batch.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center pt-4">
            <Button onClick={resetUpload} className="bg-primary text-primary-foreground">
              Upload Another File
            </Button>
            <Button variant="outline" className="bg-transparent">
              View Batches
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
