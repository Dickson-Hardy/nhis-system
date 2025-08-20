"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download,
  Loader2,
  Building2,
  FileText
} from "lucide-react"

interface Payment {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  totalCostOfCare: string | null
  approvedCostOfCare: string | null
  status: string
  dateOfClaimsPayment: string | null
  batchNumber: string | null
  dateOfClaimSubmission: string | null
  primaryDiagnosis: string | null
  tpa: {
    id: number
    name: string
    code: string
  } | null
  facility: {
    id: number
    name: string
    code: string
  } | null
}

interface PaymentStats {
  totalPending: number
  totalPaid: number
  totalPendingAmount: number
  totalPaidAmount: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [statistics, setStatistics] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedClaims, setSelectedClaims] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const fetchPayments = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search.trim()) {
        params.append("search", search.trim())
      }

      if (status) {
        params.append("status", status)
      }

      const response = await fetch(`/api/admin/payments?${params}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.statusText}`)
      }

      const data = await response.json()
      setPayments(data.payments || [])
      setStatistics(data.statistics)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch payments")
      console.error("Error fetching payments:", err)
    } finally {
      setLoading(false)
    }
  }

  const processPayments = async (action: "approve_payment" | "reject_payment") => {
    if (selectedClaims.length === 0) return

    try {
      setIsProcessing(true)
      setError(null)

      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          claimIds: selectedClaims,
          action,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to process payments: ${response.statusText}`)
      }

      setSelectedClaims([])
      await fetchPayments(pagination.page, searchTerm, statusFilter)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payments")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClaims(payments.map(p => p.id))
    } else {
      setSelectedClaims([])
    }
  }

  const handleSelectClaim = (claimId: number, checked: boolean) => {
    if (checked) {
      setSelectedClaims([...selectedClaims, claimId])
    } else {
      setSelectedClaims(selectedClaims.filter(id => id !== claimId))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified_awaiting_payment":
        return "bg-yellow-100 text-yellow-800"
      case "verified_paid":
        return "bg-green-100 text-green-800"
      case "not_verified":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified_awaiting_payment":
        return <Clock className="h-3 w-3" />
      case "verified_paid":
        return <CheckCircle className="h-3 w-3" />
      case "not_verified":
        return <XCircle className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const formatAmount = (amount: string | null) => {
    if (!amount) return "₦0"
    return `₦${parseFloat(amount).toLocaleString()}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  if (loading && payments.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading payments...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
          <p className="text-muted-foreground">Process and track claim payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Payment Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalPending}</div>
              <p className="text-xs text-muted-foreground">
                {formatAmount(statistics.totalPendingAmount?.toString())}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Claims</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalPaid}</div>
              <p className="text-xs text-muted-foreground">
                {formatAmount(statistics.totalPaidAmount?.toString())}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(statistics.totalPendingAmount?.toString())}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Amount</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(statistics.totalPaidAmount?.toString())}
              </div>
              <p className="text-xs text-muted-foreground">Successfully paid</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4 flex-1">
          <Input
            placeholder="Search by claim ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              fetchPayments(1, e.target.value, statusFilter)
            }}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value)
            fetchPayments(1, searchTerm, value)
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="verified_awaiting_payment">Awaiting Payment</SelectItem>
              <SelectItem value="verified_paid">Paid</SelectItem>
              <SelectItem value="not_verified">Not Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {selectedClaims.length > 0 && (
          <div className="flex space-x-2">
            <Button
              onClick={() => processPayments("approve_payment")}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Approve Payment ({selectedClaims.length})
            </Button>
            <Button
              variant="destructive"
              onClick={() => processPayments("reject_payment")}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject ({selectedClaims.length})
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Claims ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClaims.length === payments.length && payments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Claim ID</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>TPA/Facility</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Payment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No payment claims found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedClaims.includes(payment.id)}
                        onCheckedChange={(checked) => handleSelectClaim(payment.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.uniqueClaimId}</p>
                        {payment.batchNumber && (
                          <p className="text-sm text-muted-foreground">{payment.batchNumber}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.beneficiaryName}</p>
                        {payment.primaryDiagnosis && (
                          <p className="text-sm text-muted-foreground">{payment.primaryDiagnosis}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {payment.tpa && (
                          <p className="text-sm flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {payment.tpa.name}
                          </p>
                        )}
                        {payment.facility && (
                          <p className="text-sm text-muted-foreground">
                            {payment.facility.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatAmount(payment.approvedCostOfCare)}</p>
                        {payment.totalCostOfCare !== payment.approvedCostOfCare && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatAmount(payment.totalCostOfCare)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1">
                          {payment.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(payment.dateOfClaimSubmission)}</TableCell>
                    <TableCell>{formatDate(payment.dateOfClaimsPayment)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchPayments(pagination.page - 1, searchTerm, statusFilter)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchPayments(pagination.page + 1, searchTerm, statusFilter)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}