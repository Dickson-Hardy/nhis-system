"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Calendar, 
  FileText, 
  Upload, 
  Send, 
  Eye, 
  Edit, 
  Trash2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download
} from "lucide-react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Batch {
  id: number
  batchNumber: string
  facilityId: number
  tpaId: number
  batchType: string
  weekStartDate: string
  weekEndDate: string
  status: string
  totalClaims: number
  completedClaims: number
  totalAmount: string
  submittedAt: string | null
  closedAt: string | null
  forwardingLetterContent: string | null
  coverLetterUrl: string | null
  coverLetterFileName: string | null
  recipientEmails: string | null
  submissionNotes: string | null
  createdAt: string
  updatedAt: string
}

interface Claim {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  hospitalNumber: string
  dateOfAdmission: string
  dateOfDischarge: string
  primaryDiagnosis: string
  totalCostOfCare: string
  status: string
  batchId: number | null
  batch?: {
    id: number
    batchNumber: string
    status: string
  }
}

export default function FacilityBatchDashboard() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("batches")
  const [claimFilter, setClaimFilter] = useState("unassigned")
  const { toast } = useToast()

  // Form states
  const [createForm, setCreateForm] = useState({
    weekStartDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    batchType: "weekly",
    notes: ""
  })

  const [submitForm, setSubmitForm] = useState({
    recipientEmails: "",
    submissionNotes: "",
    coverLetter: null as File | null
  })

  useEffect(() => {
    fetchBatches()
    fetchClaims()
  }, [])

  const fetchBatches = async () => {
    try {
      const response = await fetch("/api/facility/batches")
      if (response.ok) {
        const data = await response.json()
        setBatches(data.batches)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch batches",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching batches:", error)
      toast({
        title: "Error",
        description: "Failed to fetch batches",
        variant: "destructive",
      })
    }
  }

  const fetchClaims = async () => {
    try {
      const response = await fetch(`/api/facility/claims?batchStatus=${claimFilter}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch claims",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching claims:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClaims()
  }, [claimFilter])

  const createBatch = async () => {
    try {
      const response = await fetch("/api/facility/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: "Batch created successfully",
        })
        setShowCreateDialog(false)
        setCreateForm({
          weekStartDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
          batchType: "weekly",
          notes: ""
        })
        fetchBatches()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create batch",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating batch:", error)
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive",
      })
    }
  }

  const addClaimToBatch = async (claimId: number, batchId: number) => {
    try {
      const response = await fetch(`/api/facility/batches/${batchId}/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimId }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Claim added to batch",
        })
        fetchBatches()
        fetchClaims()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to add claim to batch",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding claim to batch:", error)
      toast({
        title: "Error",
        description: "Failed to add claim to batch",
        variant: "destructive",
      })
    }
  }

  const removeClaimFromBatch = async (claimId: number, batchId: number) => {
    try {
      const response = await fetch(`/api/facility/batches/${batchId}/claims`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimId }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Claim removed from batch",
        })
        fetchBatches()
        fetchClaims()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to remove claim from batch",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing claim from batch:", error)
    }
  }

  const submitBatch = async () => {
    if (!selectedBatch) return

    try {
      const formData = new FormData()
      formData.append("action", "submit")
      formData.append("recipientEmails", submitForm.recipientEmails)
      formData.append("submissionNotes", submitForm.submissionNotes)
      
      if (submitForm.coverLetter) {
        formData.append("coverLetter", submitForm.coverLetter)
      }

      const response = await fetch(`/api/facility/batches/${selectedBatch.id}`, {
        method: "PUT",
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch submitted successfully",
        })
        setShowSubmitDialog(false)
        setSelectedBatch(null)
        setSubmitForm({
          recipientEmails: "",
          submissionNotes: "",
          coverLetter: null
        })
        fetchBatches()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to submit batch",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting batch:", error)
      toast({
        title: "Error",
        description: "Failed to submit batch",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-500", icon: Clock },
      submitted: { color: "bg-blue-500", icon: Send },
      processing: { color: "bg-yellow-500", icon: AlertCircle },
      completed: { color: "bg-green-500", icon: CheckCircle },
      rejected: { color: "bg-red-500", icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getWeekDates = (startDate: string) => {
    const start = new Date(startDate)
    const end = endOfWeek(start, { weekStartsOn: 1 })
    return `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`
  }

  const adjustWeek = (weeks: number) => {
    const currentDate = new Date(createForm.weekStartDate)
    const newDate = weeks > 0 ? addWeeks(currentDate, weeks) : subWeeks(currentDate, Math.abs(weeks))
    setCreateForm({
      ...createForm,
      weekStartDate: format(startOfWeek(newDate, { weekStartsOn: 1 }), "yyyy-MM-dd")
    })
  }

  const completedClaims = claims.filter(claim => claim.status === "completed")
  const unassignedClaims = claims.filter(claim => !claim.batchId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-600">Manage weekly claim batches and submissions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>
                Create a new weekly batch for claim submissions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="weekStart">Week Starting</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeek(-1)}
                  >
                    Previous
                  </Button>
                  <Input
                    id="weekStart"
                    type="date"
                    value={createForm.weekStartDate}
                    onChange={(e) => setCreateForm({ ...createForm, weekStartDate: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWeek(1)}
                  >
                    Next
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Week: {getWeekDates(createForm.weekStartDate)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="batchType">Batch Type</Label>
                <Select
                  value={createForm.batchType}
                  onValueChange={(value) => setCreateForm({ ...createForm, batchType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="supplementary">Supplementary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="Any additional notes for this batch..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createBatch}>Create Batch</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Batches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batches.filter(b => b.status === "draft").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Claims</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedClaims.length}</div>
            <p className="text-xs text-muted-foreground">
              {unassignedClaims.length} unassigned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{batches.reduce((sum, batch) => sum + parseFloat(batch.totalAmount || "0"), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
        </TabsList>
        
        <TabsContent value="batches" className="space-y-4">
          {batches.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No batches found</h3>
                <p className="text-gray-500 text-center mb-4">
                  Create your first batch to start managing claims
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Batch
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {batches.map((batch) => (
                <Card key={batch.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {batch.batchNumber}
                          {getStatusBadge(batch.status)}
                        </CardTitle>
                        <CardDescription>
                          {getWeekDates(batch.weekStartDate)} • {batch.batchType}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        {batch.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBatch(batch)
                              setShowSubmitDialog(true)
                            }}
                            disabled={batch.completedClaims === 0}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Submit
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium">Total Claims</p>
                        <p className="text-2xl font-bold">{batch.totalClaims}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Completed</p>
                        <p className="text-2xl font-bold text-green-600">{batch.completedClaims}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Amount</p>
                        <p className="text-2xl font-bold">₦{parseFloat(batch.totalAmount || "0").toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Progress</p>
                        <Progress 
                          value={batch.totalClaims > 0 ? (batch.completedClaims / batch.totalClaims) * 100 : 0} 
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    {batch.status === "draft" && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Add completed claims to this batch and submit when ready. 
                          You need at least 1 completed claim to submit.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="claims" className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={claimFilter} onValueChange={setClaimFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned Claims</SelectItem>
                <SelectItem value="assigned">Assigned Claims</SelectItem>
                <SelectItem value="">All Claims</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {claims.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
                <p className="text-gray-500 text-center">
                  {claimFilter === "unassigned" ? "No unassigned claims available" : "No claims match your filter"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.uniqueClaimId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{claim.beneficiaryName}</p>
                          <p className="text-sm text-gray-500">{claim.hospitalNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{claim.primaryDiagnosis}</TableCell>
                      <TableCell>₦{parseFloat(claim.totalCostOfCare).toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell>
                        {claim.batch ? (
                          <div>
                            <p className="font-medium">{claim.batch.batchNumber}</p>
                            <p className="text-sm text-gray-500">{claim.batch.status}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {claim.status === "completed" && !claim.batchId && (
                            <Select
                              onValueChange={(batchId) => addClaimToBatch(claim.id, parseInt(batchId))}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Add to batch" />
                              </SelectTrigger>
                              <SelectContent>
                                {batches
                                  .filter(batch => batch.status === "draft")
                                  .map(batch => (
                                    <SelectItem key={batch.id} value={batch.id.toString()}>
                                      {batch.batchNumber}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                          {claim.batchId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeClaimFromBatch(claim.id, claim.batchId!)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Batch Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Batch</DialogTitle>
            <DialogDescription>
              Submit batch {selectedBatch?.batchNumber} for processing
            </DialogDescription>
          </DialogHeader>
          
          {selectedBatch && (
            <div className="space-y-4">
              {/* Batch Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Batch Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Claims</p>
                    <p className="font-medium">{selectedBatch.totalClaims}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Completed Claims</p>
                    <p className="font-medium">{selectedBatch.completedClaims}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Amount</p>
                    <p className="font-medium">₦{parseFloat(selectedBatch.totalAmount || "0").toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="recipientEmails">Recipient Emails *</Label>
                <Textarea
                  id="recipientEmails"
                  value={submitForm.recipientEmails}
                  onChange={(e) => setSubmitForm({ ...submitForm, recipientEmails: e.target.value })}
                  placeholder="Enter email addresses separated by commas"
                  rows={2}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              <div>
                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                <Input
                  id="coverLetter"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSubmitForm({ 
                    ...submitForm, 
                    coverLetter: e.target.files?.[0] || null 
                  })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload a cover letter from CMD (PDF, DOC, DOCX)
                </p>
              </div>

              <div>
                <Label htmlFor="submissionNotes">Submission Notes</Label>
                <Textarea
                  id="submissionNotes"
                  value={submitForm.submissionNotes}
                  onChange={(e) => setSubmitForm({ ...submitForm, submissionNotes: e.target.value })}
                  placeholder="Any additional notes for this submission..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={submitBatch}
                  disabled={!submitForm.recipientEmails.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Batch
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}