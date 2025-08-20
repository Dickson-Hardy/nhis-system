"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  CreditCard,
  Download,
  Upload,
  Calendar,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Eye,
  RefreshCw
} from "lucide-react"

interface PaymentRecord {
  id: string
  claimId: string
  batchNumber: string
  beneficiaryName: string
  facilityName: string
  approvedAmount: number
  paymentAmount: number
  paymentDate: string | null
  paymentReference: string | null
  paymentMethod: string
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'disputed'
  submissionDate: string
  daysInPaymentQueue: number
  rejectionReason?: string
  bankAccount?: string
  bankName?: string
}

interface PaymentBatch {
  id: string
  batchNumber: string
  totalClaims: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  createdDate: string
  paymentDate: string | null
  status: 'draft' | 'ready_for_payment' | 'processing' | 'completed' | 'partial'
}

interface PaymentTrackingProps {
  onPaymentStatusUpdate?: (paymentId: string, status: string) => void
}

export function PaymentTracking({ onPaymentStatusUpdate }: PaymentTrackingProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [paymentBatches, setPaymentBatches] = useState<PaymentBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Fetch payment data from API
  useEffect(() => {
    fetchPaymentData()
  }, [])

  const fetchPaymentData = async () => {
    try {
      setLoading(true)
      const [paymentsResponse, batchesResponse] = await Promise.all([
        fetch('/api/payments', { credentials: 'include' }),
        fetch('/api/payments/batches', { credentials: 'include' })
      ])

      if (paymentsResponse.ok && batchesResponse.ok) {
        const [paymentsData, batchesData] = await Promise.all([
          paymentsResponse.json(),
          batchesResponse.json()
        ])
        
        setPayments(paymentsData.payments || [])
        setPaymentBatches(batchesData.batches || [])
      } else {
        // APIs not implemented yet, show empty state
        setPayments([])
        setPaymentBatches([])
      }
    } catch (error) {
      console.error('Error fetching payment data:', error)
      setPayments([])
      setPaymentBatches([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "failed":
        return "bg-red-100 text-red-800 border-red-300"
      case "disputed":
        return "bg-orange-100 text-orange-800 border-orange-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3" />
      case "processing":
        return <Clock className="h-3 w-3" />
      case "pending":
        return <AlertCircle className="h-3 w-3" />
      case "failed":
        return <AlertCircle className="h-3 w-3" />
      case "disputed":
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || payment.paymentStatus === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const paymentStats = {
    totalPayments: payments.length,
    completedPayments: payments.filter(p => p.paymentStatus === 'completed').length,
    pendingPayments: payments.filter(p => p.paymentStatus === 'pending').length,
    processingPayments: payments.filter(p => p.paymentStatus === 'processing').length,
    disputedPayments: payments.filter(p => p.paymentStatus === 'disputed').length,
    totalAmount: payments.reduce((sum, p) => sum + p.approvedAmount, 0),
    paidAmount: payments.filter(p => p.paymentStatus === 'completed').reduce((sum, p) => sum + p.paymentAmount, 0),
    pendingAmount: payments.filter(p => p.paymentStatus !== 'completed').reduce((sum, p) => sum + p.approvedAmount, 0)
  }

  const processPayment = async (paymentId: string) => {
    setIsProcessingPayment(true)
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setPayments(prevPayments =>
        prevPayments.map(payment =>
          payment.id === paymentId
            ? {
                ...payment,
                paymentStatus: 'completed' as const,
                paymentDate: new Date().toLocaleDateString(),
                paymentReference: `NHIA/PAY/2025/${Math.random().toString(36).substr(2, 9).toUpperCase()}`
              }
            : payment
        )
      )
      
      onPaymentStatusUpdate?.(paymentId, 'completed')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-slate-600">Loading payment data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{paymentStats.totalPayments}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ₦{paymentStats.totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{paymentStats.completedPayments}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ₦{paymentStats.paidAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{paymentStats.pendingPayments}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ₦{paymentStats.pendingAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{paymentStats.processingPayments}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {paymentStats.disputedPayments} disputed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Payment Management */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payment Records</TabsTrigger>
          <TabsTrigger value="batches">Payment Batches</TabsTrigger>
          <TabsTrigger value="analytics">Payment Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Records</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Process Payments
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by claim ID, beneficiary, or facility..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Days in Queue</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.claimId}</TableCell>
                        <TableCell>{payment.beneficiaryName}</TableCell>
                        <TableCell className="max-w-xs truncate">{payment.facilityName}</TableCell>
                        <TableCell>₦{payment.approvedAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(payment.paymentStatus)} border`}>
                            {getStatusIcon(payment.paymentStatus)}
                            <span className="ml-1 capitalize">{payment.paymentStatus.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.paymentDate || '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`${payment.daysInPaymentQueue > 30 ? 'text-red-600 font-medium' : 
                                          payment.daysInPaymentQueue > 14 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {payment.daysInPaymentQueue} days
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {payment.paymentStatus === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => processPayment(payment.id)}
                                disabled={isProcessingPayment}
                              >
                                {isProcessingPayment ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CreditCard className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentBatches.map((batch) => (
                  <Card key={batch.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{batch.batchNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {batch.totalClaims} claims • Created {batch.createdDate}
                          </p>
                        </div>
                        <Badge className={getStatusColor(batch.status)}>
                          {batch.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-3 bg-slate-50 rounded">
                          <div className="text-lg font-bold">₦{batch.totalAmount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Total Amount</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-600">₦{batch.paidAmount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Paid Amount</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded">
                          <div className="text-lg font-bold text-yellow-600">₦{batch.pendingAmount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Pending Amount</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Payment Progress</span>
                          <span>{((batch.paidAmount / batch.totalAmount) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(batch.paidAmount / batch.totalAmount) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Payment Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Processing Time</span>
                    <span className="text-sm font-medium">12.5 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium text-green-600">92.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Payment Amount</span>
                    <span className="text-sm font-medium">₦{(paymentStats.totalAmount / paymentStats.totalPayments).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Payment Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">This Week</span>
                    <span className="text-sm font-medium">₦{paymentStats.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">This Month</span>
                    <span className="text-sm font-medium">₦{paymentStats.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending This Week</span>
                    <span className="text-sm font-medium text-yellow-600">₦{paymentStats.pendingAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payment Details - {selectedPayment.claimId}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Beneficiary</Label>
                  <p className="text-sm">{selectedPayment.beneficiaryName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Facility</Label>
                  <p className="text-sm">{selectedPayment.facilityName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Approved Amount</Label>
                  <p className="text-sm font-semibold">₦{selectedPayment.approvedAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <Badge className={getStatusColor(selectedPayment.paymentStatus)}>
                    {selectedPayment.paymentStatus.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Reference</Label>
                  <p className="text-sm">{selectedPayment.paymentReference || 'Not yet assigned'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Date</Label>
                  <p className="text-sm">{selectedPayment.paymentDate || 'Not yet paid'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bank Account</Label>
                  <p className="text-sm">{selectedPayment.bankAccount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Bank Name</Label>
                  <p className="text-sm">{selectedPayment.bankName}</p>
                </div>
              </div>
              
              {selectedPayment.rejectionReason && (
                <Alert className="border-red-300 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Payment Issue:</strong> {selectedPayment.rejectionReason}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                  Close
                </Button>
                {selectedPayment.paymentStatus === 'pending' && (
                  <Button onClick={() => processPayment(selectedPayment.id)}>
                    Process Payment
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export type { PaymentRecord, PaymentBatch }
