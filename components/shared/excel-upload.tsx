"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Download,
  RefreshCw,
  Settings,
  FileText,
  Calculator
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ExcelUploadResult {
  format: 'expanded' | 'legacy' | 'mixed'
  claims: ProcessedClaim[]
  validationErrors: ValidationError[]
  suggestedActions: string[]
  totalRows: number
  validRows: number
  errorRows: number
}

interface ProcessedClaim {
  id?: string
  uniqueClaimId?: string
  beneficiaryName?: string
  hospitalNumber?: string
  dateOfAdmission?: string
  dateOfDischarge?: string
  primaryDiagnosis?: string
  secondaryDiagnosis?: string
  treatmentProcedure?: string
  treatmentProcedures?: TreatmentProcedure[]
  totalCostOfCare?: string
  status?: string
  batchNumber?: string
  originalFormat: 'legacy' | 'expanded'
  isTransformed?: boolean
  transformationNotes?: string
}

interface TreatmentProcedure {
  name: string
  cost: string
  description: string
}

interface ValidationError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface ExcelUploadProps {
  onUploadComplete: (result: ExcelUploadResult) => void
  onCancel: () => void
  facilityId?: number
}

export function ExcelUpload({ onUploadComplete, onCancel, facilityId }: ExcelUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ExcelUploadResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [transformOptions, setTransformOptions] = useState({
    autoTransform: true,
    createMissingProcedures: true,
    validateData: true
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      toast({
        title: "File Uploaded",
        description: `Processing ${file.name}...`,
      })
      processFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  })

  const processFile = async (file: File) => {
    setProcessing(true)
    setProgress(0)
    
    try {
      // Simulate processing steps
      setProgress(20)
      await new Promise(resolve => setTimeout(resolve, 500))

      setProgress(40)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('facilityId', facilityId?.toString() || '')
      formData.append('transformOptions', JSON.stringify(transformOptions))

      setProgress(60)
      const response = await fetch('/api/facility/excel-upload', {
        method: 'POST',
        body: formData
      })

      setProgress(80)
      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const uploadResult: ExcelUploadResult = await response.json()
      setResult(uploadResult)
      setProgress(100)
      
      toast({
        title: "Processing Complete",
        description: `File processed successfully. Found ${uploadResult.totalRows} rows with ${uploadResult.validRows} valid claims.`,
      })
      
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Processing Failed",
        description: "Failed to process the uploaded file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirmUpload = () => {
    if (result) {
      onUploadComplete(result)
    }
  }

  const handleRetry = () => {
    if (uploadedFile) {
      setResult(null)
      processFile(uploadedFile)
    }
  }

  const getFormatBadge = (format: string) => {
    const variants = {
      expanded: 'default',
      legacy: 'secondary',
      mixed: 'outline'
    } as const

    return (
      <Badge variant={variants[format as keyof typeof variants] || 'outline'}>
        {format.toUpperCase()}
      </Badge>
    )
  }

  const getValidationIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <FileText className="h-4 w-4 text-blue-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel File Upload
          </CardTitle>
          <CardDescription>
            Upload your claims Excel file. We'll automatically detect the format and process your data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop your Excel file here' : 'Drag & drop your Excel file here'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse files
              </p>
              <p className="text-xs text-muted-foreground">
                Supports .xlsx, .xls, and .csv files
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setUploadedFile(null)}>
                  Remove
                </Button>
              </div>

              {processing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing file...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Processing Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoTransform"
                checked={transformOptions.autoTransform}
                onChange={(e) => setTransformOptions(prev => ({
                  ...prev,
                  autoTransform: e.target.checked
                }))}
                className="rounded"
              />
              <label htmlFor="autoTransform" className="text-sm">
                Auto-transform legacy format
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createMissing"
                checked={transformOptions.createMissingProcedures}
                onChange={(e) => setTransformOptions(prev => ({
                  ...prev,
                  createMissingProcedures: e.target.checked
                }))}
                className="rounded"
              />
              <label htmlFor="createMissing" className="text-sm">
                Create missing procedures
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="validateData"
                checked={transformOptions.validateData}
                onChange={(e) => setTransformOptions(prev => ({
                  ...prev,
                  validateData: e.target.checked
                }))}
                className="rounded"
              />
              <label htmlFor="validateData" className="text-sm">
                Validate data integrity
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Processing Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">{result.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{result.validRows}</p>
                  <p className="text-sm text-muted-foreground">Valid Claims</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{result.errorRows}</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="flex justify-center mb-2">
                    {getFormatBadge(result.format)}
                  </div>
                  <p className="text-sm text-muted-foreground">Detected Format</p>
                </div>
              </div>

              {/* Actions */}
              {result.suggestedActions.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Suggested Actions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.suggestedActions.map((action, index) => (
                          <li key={index} className="text-sm">{action}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Validation Errors */}
              {result.validationErrors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Validation Issues</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {result.validationErrors.slice(0, 10).map((error, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border-b last:border-b-0">
                        {getValidationIcon(error.severity)}
                        <span className="text-sm">
                          Row {error.row}, {error.column}: {error.message}
                        </span>
                      </div>
                    ))}
                    {result.validationErrors.length > 10 && (
                      <div className="p-2 text-sm text-muted-foreground">
                        ... and {result.validationErrors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Data Preview</DialogTitle>
                      <DialogDescription>
                        Preview of processed claims data
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="claims" className="w-full">
                      <TabsList>
                        <TabsTrigger value="claims">Claims ({result.claims.length})</TabsTrigger>
                        <TabsTrigger value="errors">Errors ({result.validationErrors.length})</TabsTrigger>
                      </TabsList>
                      <TabsContent value="claims" className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Claim ID</TableHead>
                              <TableHead>Beneficiary</TableHead>
                              <TableHead>Format</TableHead>
                              <TableHead>Cost</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.claims.slice(0, 10).map((claim, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono text-sm">
                                  {claim.uniqueClaimId || 'N/A'}
                                </TableCell>
                                <TableCell>{claim.beneficiaryName || 'N/A'}</TableCell>
                                <TableCell>
                                  <Badge variant={claim.originalFormat === 'expanded' ? 'default' : 'secondary'}>
                                    {claim.originalFormat}
                                  </Badge>
                                </TableCell>
                                <TableCell>{claim.totalCostOfCare || 'N/A'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {claim.isTransformed ? 'Transformed' : 'Original'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {result.claims.length > 10 && (
                          <p className="text-sm text-muted-foreground text-center">
                            Showing first 10 of {result.claims.length} claims
                          </p>
                        )}
                      </TabsContent>
                      <TabsContent value="errors" className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Column</TableHead>
                              <TableHead>Message</TableHead>
                              <TableHead>Severity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.validationErrors.map((error, index) => (
                              <TableRow key={index}>
                                <TableCell>{error.row}</TableCell>
                                <TableCell>{error.column}</TableCell>
                                <TableCell>{error.message}</TableCell>
                                <TableCell>
                                  <Badge variant={
                                    error.severity === 'error' ? 'destructive' :
                                    error.severity === 'warning' ? 'secondary' : 'outline'
                                  }>
                                    {error.severity}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>

                <Button onClick={handleConfirmUpload} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Upload ({result.validRows} claims)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
