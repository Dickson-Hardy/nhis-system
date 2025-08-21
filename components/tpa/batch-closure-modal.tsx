"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertCircle, Signature } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

interface BatchClosureModalProps {
  isOpen: boolean
  onClose: () => void
  batch: {
    id: string
    batchNumber: string
    totalClaims: number
    totalAmount: string
    tpaName?: string
    facilityName?: string
  }
  onClosurSubmit: (closureData: BatchClosureData) => Promise<void>
}

export interface BatchClosureData {
  forwardingLetterFile?: File
  reviewSummary: string
  paymentJustification: string
  paidAmount: number
  beneficiariesPaid: number
  paymentDate: string
  paymentMethod: string
  paymentReference: string
  remarks?: string
  tpaSignature: string
}

export function BatchClosureModal({ 
  isOpen, 
  onClose, 
  batch, 
  onClosurSubmit 
}: BatchClosureModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Step 1: Forwarding Letter Upload
  const [forwardingLetterFile, setForwardingLetterFile] = useState<File | null>(null)
  
  // Step 2: Review and Payment Summary
  const [reviewSummary, setReviewSummary] = useState("")
  const [paymentJustification, setPaymentJustification] = useState("")
  
  // Step 3: Payment Details
  const [paidAmount, setPaidAmount] = useState("")
  const [beneficiariesPaid, setBeneficiariesPaid] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [paymentReference, setPaymentReference] = useState("")
  const [remarks, setRemarks] = useState("")
  
  // Step 4: Digital Signature
  const [tpaSignature, setTpaSignature] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleForwardingLetterUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type (PDF, DOC, DOCX)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a PDF or Word document")
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }
      
      setForwardingLetterFile(file)
      setError("")
    }
  }

  const handleNextStep = () => {
    setError("")
    
    if (step === 1) {
      if (!forwardingLetterFile) {
        setError("Please upload a forwarding letter before proceeding")
        return
      }
    }
    
    if (step === 2) {
      if (!reviewSummary.trim() || !paymentJustification.trim()) {
        setError("Please provide both review summary and payment justification")
        return
      }
    }
    
    if (step === 3) {
      if (!paidAmount || !beneficiariesPaid || !paymentDate || !paymentReference) {
        setError("Please fill in all payment details")
        return
      }
      
      const amount = parseFloat(paidAmount)
      const beneficiaries = parseInt(beneficiariesPaid)
      
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid payment amount")
        return
      }
      
      if (isNaN(beneficiaries) || beneficiaries <= 0) {
        setError("Please enter a valid number of beneficiaries")
        return
      }
    }
    
    setStep(step + 1)
  }

  const handlePreviousStep = () => {
    setStep(step - 1)
  }

  const handleSubmitClosure = async () => {
    if (!tpaSignature.trim()) {
      setError("Please provide your digital signature")
      return
    }
    
    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions")
      return
    }

    setLoading(true)
    setError("")

    try {
      const closureData: BatchClosureData = {
        forwardingLetterFile: forwardingLetterFile || undefined,
        reviewSummary: reviewSummary.trim(),
        paymentJustification: paymentJustification.trim(),
        paidAmount: parseFloat(paidAmount),
        beneficiariesPaid: parseInt(beneficiariesPaid),
        paymentDate,
        paymentMethod,
        paymentReference: paymentReference.trim(),
        remarks: remarks.trim() || undefined,
        tpaSignature: tpaSignature.trim(),
      }

      await onClosurSubmit(closureData)
      
      // Reset form
      setStep(1)
      setForwardingLetterFile(null)
      setReviewSummary("")
      setPaymentJustification("")
      setPaidAmount("")
      setBeneficiariesPaid("")
      setPaymentDate("")
      setPaymentReference("")
      setRemarks("")
      setTpaSignature("")
      setAgreedToTerms(false)
      
      onClose()
    } catch (error) {
      console.error("Error submitting batch closure:", error)
      setError("Failed to submit batch closure. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <Upload className="h-12 w-12 mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Forwarding Letter</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please upload the official forwarding letter for batch {batch.batchNumber}
              </p>
            </div>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
              <div className="text-center">
                <input
                  type="file"
                  id="forwarding-letter"
                  accept=".pdf,.doc,.docx"
                  onChange={handleForwardingLetterUpload}
                  className="hidden"
                />
                <label
                  htmlFor="forwarding-letter"
                  className="cursor-pointer block"
                >
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Click to upload forwarding letter
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, or DOCX files up to 10MB
                    </p>
                  </div>
                </label>
              </div>
              
              {forwardingLetterFile && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {forwardingLetterFile.name}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    File uploaded successfully ({(forwardingLetterFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <FileText className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Review Summary & Payment Justification</h3>
              <p className="text-sm text-muted-foreground">
                Provide detailed explanation of batch processing and payment decisions
              </p>
            </div>
            
            <div>
              <Label htmlFor="review-summary">Review Summary *</Label>
              <Textarea
                id="review-summary"
                placeholder="Provide a comprehensive summary of the batch review process, including any issues identified, claims processing notes, and overall assessment..."
                value={reviewSummary}
                onChange={(e) => setReviewSummary(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This summary will be included in the report sent to facilities and NHIS
              </p>
            </div>
            
            <div>
              <Label htmlFor="payment-justification">Payment Justification *</Label>
              <Textarea
                id="payment-justification"
                placeholder="Explain the rationale for approved payments, rejected claims, duplicates found, ineligible claims, and any other financial decisions made during batch processing..."
                value={paymentJustification}
                onChange={(e) => setPaymentJustification(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Justify why certain amounts were paid and why others were rejected
              </p>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Payment Summary</h3>
              <p className="text-sm text-muted-foreground">
                Enter the final payment details for this batch
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paid-amount">Total Amount Paid (₦) *</Label>
                <Input
                  id="paid-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="beneficiaries-paid">Number of Beneficiaries *</Label>
                <Input
                  id="beneficiaries-paid"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={beneficiariesPaid}
                  onChange={(e) => setBeneficiariesPaid(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-date">Payment Date *</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="payment-method">Payment Method *</Label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online_payment">Online Payment</option>
                  <option value="electronic_transfer">Electronic Transfer</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="payment-reference">Payment Reference/Transaction ID *</Label>
              <Input
                id="payment-reference"
                placeholder="Enter payment reference or transaction ID"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="remarks">Additional Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                placeholder="Any additional notes or remarks about the payment..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Signature className="h-12 w-12 mx-auto text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Digital Signature & Confirmation</h3>
              <p className="text-sm text-muted-foreground">
                Provide your digital signature to complete the batch closure
              </p>
            </div>
            
            {/* Batch Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Batch Closure Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Batch Number:</span>
                <span className="font-medium">{batch.batchNumber}</span>
                
                <span className="text-muted-foreground">Total Claims:</span>
                <span className="font-medium">{batch.totalClaims}</span>
                
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-medium text-green-600">₦{parseFloat(paidAmount || "0").toLocaleString()}</span>
                
                <span className="text-muted-foreground">Beneficiaries:</span>
                <span className="font-medium">{beneficiariesPaid}</span>
                
                <span className="text-muted-foreground">Payment Date:</span>
                <span className="font-medium">{paymentDate}</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="signature">Digital Signature *</Label>
              <Input
                id="signature"
                placeholder="Type your full name as digital signature"
                value={tpaSignature}
                onChange={(e) => setTpaSignature(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                By typing your name, you confirm the accuracy of all information provided
              </p>
            </div>
            
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5"
              />
              <label htmlFor="agree-terms" className="text-sm text-muted-foreground leading-relaxed">
                I confirm that all information provided is accurate and complete. I understand that this
                digital signature has the same legal effect as a handwritten signature and that submitting
                this form will finalize the batch closure process.
              </label>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Step 1: Upload Forwarding Letter"
      case 2: return "Step 2: Review Summary"
      case 3: return "Step 3: Payment Details"
      case 4: return "Step 4: Digital Signature"
      default: return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Close Batch: {batch.batchNumber}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {getStepTitle()} ({step} of 4)
          </p>
        </DialogHeader>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mb-6">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    stepNumber < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={step === 1 ? onClose : handlePreviousStep}
            disabled={loading}
          >
            {step === 1 ? "Cancel" : "Previous"}
          </Button>
          
          {step < 4 ? (
            <Button onClick={handleNextStep} disabled={loading}>
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmitClosure} 
              disabled={loading || !tpaSignature.trim() || !agreedToTerms}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Submitting..." : "Complete Batch Closure"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}