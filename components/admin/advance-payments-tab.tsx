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
import { Plus, Eye, Edit, Search, Filter, DollarSign, Calendar } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AdvancePayment {
  id: number
  tpaId: number
  amount: number
  purpose: string
  paymentReference: string
  status: string
  requestedBy: number
  createdAt: string
  tpa?: {
    id: number
    name: string
    nhisCode: string
  }
}

interface AdvancePaymentsTabProps {
  initialData?: AdvancePayment[]
}

export function AdvancePaymentsTab({ initialData }: AdvancePaymentsTabProps) {
  const [payments, setPayments] = useState<AdvancePayment[]>(initialData || [])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<AdvancePayment | null>(null)
  const [tpas, setTpas] = useState([])

  // Form state for creating new payment
  const [newPayment, setNewPayment] = useState({
    tpaId: "",
    amount: "",
    purpose: "",
    notes: "",
  })

  useEffect(() => {
    fetchPayments()
    fetchTpas()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/financial/advance-payments")
      const data = await response.json()
      if (response.ok) {
        setPayments(data.payments)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch advance payments",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching advance payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTpas = async () => {
    try {
      const response = await fetch("/api/admin/tpas")
      const data = await response.json()
      if (response.ok) {
        setTpas(data.tpas)
      }
    } catch (error) {
      console.error("Error fetching TPAs:", error)
    }
  }

  const handleCreatePayment = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/financial/advance-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tpaId: parseInt(newPayment.tpaId),
          amount: parseFloat(newPayment.amount),
          purpose: newPayment.purpose,
          notes: newPayment.notes,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "Advance payment created successfully",
        })
        setIsCreateModalOpen(false)
        setNewPayment({ tpaId: "", amount: "", purpose: "", notes: "" })
        fetchPayments()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create advance payment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while creating advance payment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", variant: "default" as const },
      completed: { label: "Completed", variant: "success" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.tpa?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === "all" || payment.status === filterStatus

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Advance Payments</h3>
          <p className="text-sm text-muted-foreground">Manage advance payments to TPAs</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Advance Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Advance Payment</DialogTitle>
              <DialogDescription>
                Create a new advance payment to a TPA
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tpa">TPA</Label>
                <Select value={newPayment.tpaId} onValueChange={(value) => setNewPayment({...newPayment, tpaId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select TPA" />
                  </SelectTrigger>
                  <SelectContent>
                    {tpas.map((tpa: any) => (
                      <SelectItem key={tpa.id} value={tpa.id.toString()}>
                        {tpa.name} ({tpa.nhisCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  id="purpose"
                  value={newPayment.purpose}
                  onChange={(e) => setNewPayment({...newPayment, purpose: e.target.value})}
                  placeholder="Purpose of payment"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                  placeholder="Additional notes (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreatePayment}
                disabled={!newPayment.tpaId || !newPayment.amount || !newPayment.purpose || loading}
              >
                {loading ? "Creating..." : "Create Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Advance Payments ({filteredPayments.length})
          </CardTitle>
          <CardDescription>
            Total Amount: ₦{filteredPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No advance payments found
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
                  <TableHead>Date Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.paymentReference}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.tpa?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.tpa?.nhisCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₦{payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {payment.purpose}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
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

      {/* Payment Details Modal */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Reference: {selectedPayment.paymentReference}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">TPA</Label>
                  <p className="text-sm">{selectedPayment.tpa?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">NHIS Code</Label>
                  <p className="text-sm">{selectedPayment.tpa?.nhisCode}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm font-semibold">₦{selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedPayment.status)}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Purpose</Label>
                <p className="text-sm mt-1">{selectedPayment.purpose}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date Created</Label>
                <p className="text-sm mt-1">
                  {new Date(selectedPayment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}