"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { 
  Eye, 
  Edit, 
  Upload, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Search,
  Filter
} from "lucide-react"
import { format } from "date-fns"

interface AdvancePayment {
  id: number
  tpaId: number
  amount: string
  paymentReference: string
  paymentDate: string
  paymentMethod: string
  description: string
  purpose: string
  receiptUrl?: string
  receiptFileName?: string
  status: string
  approvedAt?: string
  disbursedAt?: string
  isReconciled: boolean
  reconciledAt?: string
  createdAt: string
  updatedAt: string
  tpa: {
    id: number
    name: string
    code: string
  }
  createdBy: {
    id: number
    name: string
    email: string
  }
}

interface AdvancePaymentsTableProps {
  onRefresh: () => void
}

export function AdvancePaymentsTable({ onRefresh }: AdvancePaymentsTableProps) {
  const [payments, setPayments] = useState<AdvancePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<AdvancePayment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [searchTerm, statusFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/admin/financial/advance-payments?${params}`, {
        credentials: "include"
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      } else {
        throw new Error("Failed to fetch advance payments")
      }
    } catch (error) {
      console.error("Error fetching advance payments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch advance payments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "disbursed":
        return "bg-green-100 text-green-800 border-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />
      case "approved":
        return <AlertCircle className="h-3 w-3" />
      case "disbursed":
        return <CheckCircle className="h-3 w-3" />
      case "cancelled":
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const handleStatusUpdate = async (paymentId: number, action: string) => {
    try {
      const response = await fetch(`/api/admin/financial/advance-payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Payment ${action}d successfully`
        })
        fetchPayments()
        onRefresh()
      } else {
        throw new Error(`Failed to ${action} payment`)
      }
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} payment`,
        variant: "destructive"
      })
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedPayment) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("receipt", uploadFile)

      const response = await fetch(`/api/admin/financial/advance-payments/${selectedPayment.id}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Receipt uploaded successfully"
        })
        setIsUploadOpen(false)
        setUploadFile(null)
        fetchPayments()
        onRefresh()
      } else {
        throw new Error("Failed to upload receipt")
      }
    } catch (error) {
      console.error("Error uploading receipt:", error)
      toast({
        title: "Error",
        description: "Failed to upload receipt",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading advance payments...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Advance Payments</CardTitle>
          <CardDescription>Manage advance payments made to TPAs</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by payment reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>TPA</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No advance payments found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.paymentReference}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.tpa.name}</div>
                          <div className="text-sm text-muted-foreground">{payment.tpa.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>₦{parseFloat(payment.amount).toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.purpose.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(payment.status)} border`}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1 capitalize">{payment.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.receiptUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(payment.receiptUrl, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setIsUploadOpen(true)
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setIsDetailsOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {payment.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(payment.id, "approve")}
                            >
                              Approve
                            </Button>
                          )}
                          
                          {payment.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(payment.id, "disburse")}
                            >
                              Disburse
                            </Button>
                          )}
                          
                          {payment.status === "disbursed" && !payment.isReconciled && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(payment.id, "reconcile")}
                            >
                              Reconcile
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View advance payment information
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Payment Reference</label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.paymentReference}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">TPA</label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.tpa.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <p className="text-sm text-muted-foreground">₦{parseFloat(selectedPayment.amount).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedPayment.paymentMethod.replace("_", " ")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Purpose</label>
                  <p className="text-sm text-muted-foreground capitalize">{selectedPayment.purpose.replace("_", " ")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={`${getStatusColor(selectedPayment.status)} border w-fit`}>
                    {getStatusIcon(selectedPayment.status)}
                    <span className="ml-1 capitalize">{selectedPayment.status}</span>
                  </Badge>
                </div>
              </div>
              
              {selectedPayment.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Created By</label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.createdBy.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created At</label>
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedPayment.createdAt), "MMM dd, yyyy HH:mm")}</p>
                </div>
              </div>

              {selectedPayment.receiptUrl && (
                <div>
                  <label className="text-sm font-medium">Receipt</label>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedPayment.receiptUrl, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      View Receipt ({selectedPayment.receiptFileName})
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Receipt Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Receipt</DialogTitle>
            <DialogDescription>
              Upload payment receipt for {selectedPayment?.paymentReference}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Accepted formats: PDF, JPEG, PNG (max 5MB)
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleFileUpload} 
                disabled={!uploadFile || uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}