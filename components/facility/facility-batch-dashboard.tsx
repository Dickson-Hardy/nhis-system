"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Eye, 
  Upload, 
  FileText, 
  Send, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Download,
  Mail,
  X
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns"

interface Batch {
  id: number
  batchNumber: string
  batchType: string
  weekStartDate: string
  weekEndDate: string
  status: string
  totalClaims: number
  completedClaims: number
  totalAmount: string
  adminFeePercentage: string
  adminFeeAmount: string
  netAmount: string
  forwardingLetterGenerated: boolean
  coverLetterUrl?: string
  coverLetterFileName?: string
  submissionEmails: string[]
  submissionNotes?: string
  submittedAt?: string
  createdAt: string
  tpa: {
    id: number
    name: string
    code: string
  }
}

interface Claim {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  hospitalNumber: string
  dateOfDischarge: string
  totalCostOfCare: string
  status: string
  batchId?: number
}

export function FacilityBatchDashboard() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("batches")

  // Form states
  const [newBatch, setNewBatch] = useState({
    batchType: "weekly",
    weekStartDate: "",
    weekEndDate: "",
    submissionEmails: [""],
  })

  const [submissionForm, setSubmissionForm] = useState({
    submissionEmails: [""],
    submissionNotes: "",
    forwardingLetterContent: "",
  })

  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null)

  useEffect(() => {
    fetchBatches()
    fetchUnassignedClaims()
  }, [])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/facility/batches")
      const data = await response.json()
      if (response.ok) {
        setBatches(data.batches)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch batches",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching batches",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUnassignedClaims = async () => {
    try {
      const response = await fetch("/api/facility/claims?batchStatus=unassigned")
      if (!response.ok) {
        console.error("Error response:", response.status, response.statusText)
        return
      }
      
      const data = await response.json()
      if (data && data.claims && Array.isArray(data.claims)) {
        setClaims(data.claims)
      } else {
        console.error("Invalid claims data structure:", data)
        setClaims([])
      }
    } catch (error) {
      console.error("Error fetching unassigned claims:", error)
      setClaims([])
    }
  }

  const handleCreateBatch = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/facility/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBatch),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch created successfully",
        })
        setIsCreateModalOpen(false)
        setNewBatch({
          batchType: "weekly",
          weekStartDate: "",
          weekEndDate: "",
          submissionEmails: [""],
        })
        fetchBatches()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create batch",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while creating batch",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBatchAction = async (batchId: number, action: string, data: any = {}) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/facility/batches/${batchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...data }),
      })

      const result = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        })
        fetchBatches()
        
        if (action === "submit") {
          setIsSubmissionModalOpen(false)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update batch",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while updating batch",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCoverLetterUpload = async (batchId: number) => {
    if (!coverLetterFile) {
      toast({
        title: "Error",
        description: "Please select a cover letter file",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("coverLetter", coverLetterFile)

      const response = await fetch(`/api/facility/batches/${batchId}`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "Cover letter uploaded successfully",
        })
        setCoverLetterFile(null)
        fetchBatches()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to upload cover letter",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while uploading cover letter",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const },
      ready_for_submission: { label: "Ready", variant: "warning" as const },
      submitted: { label: "Submitted", variant: "default" as const },
      under_review: { label: "Under Review", variant: "default" as const },
      approved: { label: "Approved", variant: "success" as const },
      rejected: { label: "Rejected", variant: "destructive" as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const }
    return <Badge variant={config.variant as "default" | "destructive" | "outline" | "secondary"}>{config.label}</Badge>
  }

  const generateWeekDates = () => {
    const now = new Date()
    const start = startOfWeek(now, { weekStartsOn: 1 }) // Monday start
    const end = endOfWeek(now, { weekStartsOn: 1 }) // Sunday end
    
    setNewBatch({
      ...newBatch,
      weekStartDate: format(start, "yyyy-MM-dd"),
      weekEndDate: format(end, "yyyy-MM-dd"),
    })
  }

  const addEmailField = (emailList: string[], setEmailList: (emails: string[]) => void) => {
    setEmailList([...emailList, ""])
  }

  const removeEmailField = (index: number, emailList: string[], setEmailList: (emails: string[]) => void) => {
    const newEmails = emailList.filter((_, i) => i !== index)
    setEmailList(newEmails)
  }

  const updateEmail = (index: number, value: string, emailList: string[], setEmailList: (emails: string[]) => void) => {
    const newEmails = [...emailList]
    newEmails[index] = value
    setEmailList(newEmails)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Management</h1>
          <p className="text-muted-foreground">Create and manage weekly claim batches</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Batch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Batches</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batches.filter(b => b.status === "draft").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted Batches</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batches.filter(b => b.status === "submitted").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Claims</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="unassigned-claims">Unassigned Claims ({claims.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Overview</CardTitle>
              <CardDescription>
                Manage your weekly claim batches and track submission status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading batches...</div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No batches found</p>
                  <p className="text-sm">Create your first batch to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Week Period</TableHead>
                      <TableHead>Claims</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cover Letter</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-mono text-sm">
                          {batch.batchNumber}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(batch.weekStartDate), "MMM dd")} - {format(new Date(batch.weekEndDate), "MMM dd, yyyy")}</div>
                            <div className="text-muted-foreground">{batch.batchType}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{batch.totalClaims} total</div>
                            <div className="text-muted-foreground">{batch.completedClaims} completed</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₦{parseFloat(batch.totalAmount || "0").toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(batch.status)}
                        </TableCell>
                        <TableCell>
                          {batch.coverLetterUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(batch.coverLetterUrl, "_blank")}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not uploaded</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBatch(batch)
                                setIsDetailsModalOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {batch.status === "draft" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBatchAction(batch.id, "generate_forwarding_letter")}
                              >
                                Prepare
                              </Button>
                            )}
                            
                            {batch.status === "ready_for_submission" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedBatch(batch)
                                  setSubmissionForm({
                                    submissionEmails: batch.submissionEmails.length > 0 ? batch.submissionEmails : [""],
                                    submissionNotes: batch.submissionNotes || "",
                                    forwardingLetterContent: "",
                                  })
                                  setIsSubmissionModalOpen(true)
                                }}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Submit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unassigned-claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Claims</CardTitle>
              <CardDescription>
                Claims that haven't been added to a batch yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>All claims have been assigned to batches</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Hospital Number</TableHead>
                      <TableHead>Discharge Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {claims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-mono text-sm">
                          {claim.uniqueClaimId}
                        </TableCell>
                        <TableCell>{claim.beneficiaryName}</TableCell>
                        <TableCell>{claim.hospitalNumber}</TableCell>
                        <TableCell>
                          {format(new Date(claim.dateOfDischarge), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₦{parseFloat(claim.totalCostOfCare).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(claim.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Batch Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>
              Create a new weekly batch for claim submissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Batch Type</Label>
              <Select value={newBatch.batchType} onValueChange={(value) => setNewBatch({...newBatch, batchType: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Week Start Date</Label>
                <Input
                  type="date"
                  value={newBatch.weekStartDate}
                  onChange={(e) => setNewBatch({...newBatch, weekStartDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Week End Date</Label>
                <Input
                  type="date"
                  value={newBatch.weekEndDate}
                  onChange={(e) => setNewBatch({...newBatch, weekEndDate: e.target.value})}
                />
              </div>
            </div>
            
            <Button variant="outline" onClick={generateWeekDates} className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Use Current Week
            </Button>
            
            <div className="space-y-2">
              <Label>Submission Email Addresses</Label>
              {newBatch.submissionEmails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value, newBatch.submissionEmails, (emails) => setNewBatch({...newBatch, submissionEmails: emails}))}
                    placeholder="email@tpa.com"
                  />
                  {newBatch.submissionEmails.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeEmailField(index, newBatch.submissionEmails, (emails) => setNewBatch({...newBatch, submissionEmails: emails}))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addEmailField(newBatch.submissionEmails, (emails) => setNewBatch({...newBatch, submissionEmails: emails}))}
              >
                Add Email
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateBatch}
              disabled={!newBatch.weekStartDate || !newBatch.weekEndDate || loading}
            >
              {loading ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Details Modal */}
      {selectedBatch && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Batch Details</DialogTitle>
              <DialogDescription>
                {selectedBatch.batchNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Week Period</Label>
                  <p className="text-sm">
                    {format(new Date(selectedBatch.weekStartDate), "MMM dd")} - {format(new Date(selectedBatch.weekEndDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedBatch.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Claims</Label>
                  <p className="text-sm">{selectedBatch.totalClaims}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-sm font-semibold">₦{parseFloat(selectedBatch.totalAmount || "0").toLocaleString()}</p>
                </div>
              </div>
              
              {selectedBatch.status !== "draft" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cover Letter</Label>
                  {selectedBatch.coverLetterUrl ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{selectedBatch.coverLetterFileName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(selectedBatch.coverLetterUrl, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        onClick={() => handleCoverLetterUpload(selectedBatch.id)}
                        disabled={!coverLetterFile || loading}
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Cover Letter
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {selectedBatch.submissionEmails.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Submission Emails</Label>
                  <div className="text-sm text-muted-foreground">
                    {selectedBatch.submissionEmails.join(", ")}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Submission Modal */}
      {selectedBatch && (
        <Dialog open={isSubmissionModalOpen} onOpenChange={setIsSubmissionModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Submit Batch</DialogTitle>
              <DialogDescription>
                Submit {selectedBatch.batchNumber} for TPA review
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Batch Summary:</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>Claims: {selectedBatch.totalClaims}</div>
                  <div>Amount: ₦{parseFloat(selectedBatch.totalAmount || "0").toLocaleString()}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Submission Email Addresses</Label>
                {submissionForm.submissionEmails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmail(index, e.target.value, submissionForm.submissionEmails, (emails) => setSubmissionForm({...submissionForm, submissionEmails: emails}))}
                      placeholder="email@tpa.com"
                    />
                    {submissionForm.submissionEmails.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmailField(index, submissionForm.submissionEmails, (emails) => setSubmissionForm({...submissionForm, submissionEmails: emails}))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addEmailField(submissionForm.submissionEmails, (emails) => setSubmissionForm({...submissionForm, submissionEmails: emails}))}
                >
                  Add Email
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Submission Notes</Label>
                <Textarea
                  value={submissionForm.submissionNotes}
                  onChange={(e) => setSubmissionForm({...submissionForm, submissionNotes: e.target.value})}
                  placeholder="Additional notes for TPA..."
                  rows={3}
                />
              </div>
              
              {!selectedBatch.coverLetterUrl && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Cover letter required</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please upload a cover letter from CMD before submitting this batch.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => handleBatchAction(selectedBatch.id, "submit", {
                  submissionEmails: submissionForm.submissionEmails.filter(email => email.trim()),
                  submissionNotes: submissionForm.submissionNotes,
                })}
                disabled={!selectedBatch.coverLetterUrl || loading}
              >
                {loading ? "Submitting..." : "Submit Batch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}