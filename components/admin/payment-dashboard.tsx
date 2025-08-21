"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Users, 
  Calendar,
  Download,
  Eye,
  Filter,
  Search
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PaymentSummary {
  id: number
  batchId: number
  batchNumber: string
  tpaName: string
  facilityName: string
  totalPaidAmount: number
  numberOfBeneficiaries: number
  paymentDate: string
  paymentMethod: string
  paymentReference: string
  status: string
  submittedBy: string
  submittedAt: string
  forwardingLetterUrl?: string
}

export function AdminPaymentDashboard() {
  const [paymentSummaries, setPaymentSummaries] = useState<PaymentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  // Summary statistics
  const [totalPayments, setTotalPayments] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalBeneficiaries, setTotalBeneficiaries] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetchPaymentSummaries()
  }, [])

  const fetchPaymentSummaries = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/payment-summaries")
      if (!response.ok) {
        throw new Error("Failed to fetch payment summaries")
      }
      
      const data = await response.json()
      setPaymentSummaries(data.paymentSummaries || [])
      setTotalPayments(data.totalPayments || 0)
      setTotalAmount(data.totalAmount || 0)
      setTotalBeneficiaries(data.totalBeneficiaries || 0)
      setPendingCount(data.pendingCount || 0)
    } catch (error) {
      console.error("Error fetching payment summaries:", error)
      setError("Failed to load payment summaries")
    } finally {
      setLoading(false)
    }
  }

  const filteredPaymentSummaries = paymentSummaries.filter(payment => {
    const matchesSearch = 
      payment.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.tpaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentReference.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter

    let matchesDate = true
    if (dateFilter !== "all") {
      const paymentDate = new Date(payment.paymentDate)
      const now = new Date()
      
      switch (dateFilter) {
        case "today":
          matchesDate = paymentDate.toDateString() === now.toDateString()
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = paymentDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = paymentDate >= monthAgo
          break
      }
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300"
      case "reconciled":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "disputed":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-3 w-3" />
      case "reconciled":
        return <CheckCircle className="h-3 w-3" />
      case "disputed":
        return <Clock className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const exportToCSV = () => {
    const headers = [
      "Batch Number",
      "TPA",
      "Facility", 
      "Amount Paid",
      "Beneficiaries",
      "Payment Date",
      "Payment Method",
      "Reference",
      "Status",
      "Submitted By",
      "Submitted At"
    ]

    const csvData = filteredPaymentSummaries.map(payment => [
      payment.batchNumber,
      payment.tpaName,
      payment.facilityName,
      payment.totalPaidAmount,
      payment.numberOfBeneficiaries,
      formatDate(payment.paymentDate),
      payment.paymentMethod,
      payment.paymentReference,
      payment.status,
      payment.submittedBy,
      formatDateTime(payment.submittedAt)
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `payment-summaries-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading payment summaries...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Dashboard</h1>
          <p className="text-muted-foreground">
            Track and monitor batch payment summaries from TPAs
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{totalPayments.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦{totalAmount.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Beneficiaries</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalBeneficiaries.toLocaleString()}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batches, TPAs, facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="reconciled">Reconciled</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summaries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summaries ({filteredPaymentSummaries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPaymentSummaries.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payment Summaries</h3>
              <p className="text-muted-foreground">
                No payment summaries match your current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPaymentSummaries.map((payment) => (
                <Card key={payment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{payment.batchNumber}</h3>
                          <Badge className={getStatusColor(payment.status)}>
                            {getStatusIcon(payment.status)}
                            <span className="ml-1 capitalize">{payment.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">TPA:</span>
                            <p className="font-medium">{payment.tpaName}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Facility:</span>
                            <p className="font-medium">{payment.facilityName}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount Paid:</span>
                            <p className="font-medium text-green-600">
                              ₦{payment.totalPaidAmount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Beneficiaries:</span>
                            <p className="font-medium">{payment.numberOfBeneficiaries}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Payment Date:</span>
                            <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Method:</span>
                            <p className="font-medium capitalize">{payment.paymentMethod.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reference:</span>
                            <p className="font-medium font-mono text-xs">{payment.paymentReference}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Submitted:</span>
                            <p className="font-medium">{formatDateTime(payment.submittedAt)}</p>
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-muted-foreground">Submitted by:</span>
                          <span className="font-medium ml-1">{payment.submittedBy}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {payment.forwardingLetterUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(payment.forwardingLetterUrl, '_blank')}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Letter
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/admin/batches/${payment.batchId}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Batch
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}