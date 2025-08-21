"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Eye, 
  Upload, 
  FileText, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  X,
  Search,
  Filter,
  DollarSign
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Reimbursement {
  id: number
  tpaId: number
  batchIds: number[]
  amount: number
  purpose: string
  status: string
  reimbursementReference: string
  receiptUrl?: string
  receiptFileName?: string
  supportingDocsUrls?: string
  processingNotes?: string
  processedBy?: number
  processedAt?: string
  createdAt: string
  tpa?: {
    id: number
    name: string
    nhisCode: string
  }
}

interface ReimbursementsHistoryTabProps {
  initialData?: Reimbursement[]
}

export function ReimbursementsHistoryTab({ initialData }: ReimbursementsHistoryTabProps) {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>(initialData || [])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedReimbursement, setSelectedReimbursement] = useState<Reimbursement | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"receipt" | "supporting">("receipt")
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [processingAction, setProcessingAction] = useState("")
  const [processingNotes, setProcessingNotes] = useState("")

  useEffect(() => {
    fetchReimbursements()
  }, [])

  const fetchReimbursements = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/financial/reimbursements")
      const data = await response.json()
      if (response.ok) {
        setReimbursements(data.reimbursements)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch reimbursements",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching reimbursements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedReimbursement || uploadFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      
      if (uploadType === "receipt" && uploadFiles[0]) {
        formData.append("receipt", uploadFiles[0])
        formData.append("documentType", "receipt")
      } else if (uploadType === "supporting") {
        uploadFiles.forEach(file => {
          formData.append("supportingDocs", file)
        })
        formData.append("documentType", "supporting")
      }

      const response = await fetch(`/api/admin/financial/reimbursements/${selectedReimbursement.id}`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        })
        setIsUploadModalOpen(false)
        setUploadFiles([])
        fetchReimbursements()
        // Update selected reimbursement
        setSelectedReimbursement(data.reimbursement)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to upload files",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while uploading files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (action: string) => {
    if (!selectedReimbursement) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/financial/reimbursements/${selectedReimbursement.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          processingNotes,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        })
        setProcessingAction("")
        setProcessingNotes("")
        fetchReimbursements()
        setSelectedReimbursement(data.reimbursement)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update reimbursement",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while updating reimbursement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "warning" as const, icon: Clock },
      processed: { label: "Processed", variant: "default" as const, icon: AlertCircle },
      completed: { label: "Completed", variant: "success" as const, icon: CheckCircle },
      disputed: { label: "Disputed", variant: "destructive" as const, icon: X },
      cancelled: { label: "Cancelled", variant: "destructive" as const, icon: X },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: "secondary" as const, 
      icon: Clock 
    }
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getSupportingDocs = (reimbursement: Reimbursement) => {
    try {
      return reimbursement.supportingDocsUrls ? JSON.parse(reimbursement.supportingDocsUrls) : []
    } catch {
      return []
    }
  }

  const filteredReimbursements = reimbursements.filter((reimbursement) => {
    const matchesSearch = 
      reimbursement.tpa?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reimbursement.reimbursementReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reimbursement.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === "all" || reimbursement.status === filterStatus

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Reimbursements History</h3>
          <p className="text-sm text-muted-foreground">
            View and manage all reimbursement records
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by TPA name, reference, or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reimbursements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Reimbursements History ({filteredReimbursements.length})
          </CardTitle>
          <CardDescription>
            Total Amount: ₦{filteredReimbursements.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading reimbursements...</div>
          ) : filteredReimbursements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No reimbursements found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>TPA</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReimbursements.map((reimbursement) => (
                  <TableRow key={reimbursement.id}>
                    <TableCell className="font-mono text-sm">
                      {reimbursement.reimbursementReference}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reimbursement.tpa?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {reimbursement.tpa?.nhisCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₦{reimbursement.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {reimbursement.purpose}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reimbursement.status)}
                    </TableCell>
                    <TableCell>
                      {reimbursement.receiptUrl ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(reimbursement.receiptUrl, "_blank")}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReimbursement(reimbursement)
                            setUploadType("receipt")
                            setIsUploadModalOpen(true)
                          }}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(reimbursement.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReimbursement(reimbursement)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload {uploadType === "receipt" ? "payment receipt" : "supporting documents"} for reimbursement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={uploadType} onValueChange={(value: "receipt" | "supporting") => setUploadType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receipt">Payment Receipt</SelectItem>
                  <SelectItem value="supporting">Supporting Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>
                {uploadType === "receipt" ? "Receipt File" : "Supporting Documents"}
              </Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                multiple={uploadType === "supporting"}
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setUploadFiles(files)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, JPG, PNG{uploadType === "supporting" ? ", DOC, DOCX" : ""} (Max 5MB each)
              </p>
            </div>

            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files:</Label>
                <div className="space-y-1">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="text-sm bg-muted p-2 rounded flex items-center justify-between">
                      <span>{file.name}</span>
                      <span className="text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleFileUpload}
              disabled={uploadFiles.length === 0 || loading}
            >
              {loading ? "Uploading..." : "Upload Files"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reimbursement Details Modal */}
      {selectedReimbursement && !isUploadModalOpen && (
        <Dialog open={!!selectedReimbursement} onOpenChange={() => setSelectedReimbursement(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reimbursement Details</DialogTitle>
              <DialogDescription>
                Reference: {selectedReimbursement.reimbursementReference}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">TPA</Label>
                    <p className="text-sm">{selectedReimbursement.tpa?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedReimbursement.tpa?.nhisCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedReimbursement.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <p className="text-sm font-semibold">₦{selectedReimbursement.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Batches</Label>
                    <p className="text-sm">{selectedReimbursement.batchIds.length} batch(es)</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Purpose</Label>
                  <p className="text-sm mt-1">{selectedReimbursement.purpose}</p>
                </div>
                {selectedReimbursement.processingNotes && (
                  <div>
                    <Label className="text-sm font-medium">Processing Notes</Label>
                    <p className="text-sm mt-1">{selectedReimbursement.processingNotes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Created Date</Label>
                    <p className="text-sm">{new Date(selectedReimbursement.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedReimbursement.processedAt && (
                    <div>
                      <Label className="text-sm font-medium">Processed Date</Label>
                      <p className="text-sm">{new Date(selectedReimbursement.processedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Payment Receipt</Label>
                    {selectedReimbursement.receiptUrl ? (
                      <div className="mt-2 p-3 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{selectedReimbursement.receiptFileName}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(selectedReimbursement.receiptUrl, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = selectedReimbursement.receiptUrl!
                              link.download = selectedReimbursement.receiptFileName || 'receipt.pdf'
                              link.click()
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-4 border-2 border-dashed rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-2">No receipt uploaded</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadType("receipt")
                            setIsUploadModalOpen(true)
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Receipt
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Supporting Documents</Label>
                    {getSupportingDocs(selectedReimbursement).length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {getSupportingDocs(selectedReimbursement).map((url: string, index: number) => (
                          <div key={index} className="p-3 border rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">Supporting Document {index + 1}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(url, "_blank")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = url
                                  link.download = `supporting_doc_${index + 1}.pdf`
                                  link.click()
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadType("supporting")
                            setIsUploadModalOpen(true)
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Add More Documents
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 p-4 border-2 border-dashed rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-2">No supporting documents</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadType("supporting")
                            setIsUploadModalOpen(true)
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Documents
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4">
                {selectedReimbursement.status === "pending" && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Process Reimbursement</Label>
                      <div className="mt-2 space-y-2">
                        <Textarea
                          placeholder="Processing notes..."
                          value={processingNotes}
                          onChange={(e) => setProcessingNotes(e.target.value)}
                        />
                        <Button
                          onClick={() => handleStatusUpdate("process")}
                          disabled={loading}
                        >
                          Mark as Processed
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedReimbursement.status === "processed" && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Complete Reimbursement</Label>
                      <div className="mt-2 space-y-2">
                        <Button
                          onClick={() => handleStatusUpdate("complete")}
                          disabled={loading}
                          className="w-full"
                        >
                          Mark as Completed
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Other Actions</Label>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProcessingAction("dispute")
                        setProcessingNotes("Disputed - ")
                      }}
                      disabled={selectedReimbursement.status === "completed"}
                    >
                      Dispute
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate("cancel")}
                      disabled={selectedReimbursement.status === "completed" || loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}