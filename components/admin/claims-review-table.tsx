"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Check, X, Search } from "lucide-react"

interface Claim {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  facilityName: string
  tpaName: string
  totalCostOfCare: number
  status: "pending" | "approved" | "rejected"
  dateOfSubmission: string
  primaryDiagnosis: string
}

interface ClaimsReviewTableProps {
  claims: Claim[]
}

export function ClaimsReviewTable({ claims }: ClaimsReviewTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [filteredClaims, setFilteredClaims] = useState(claims)

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    applyFilters(term, statusFilter)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    applyFilters(searchTerm, status)
  }

  const applyFilters = (term: string, status: string) => {
    let filtered = claims.filter(
      (claim) =>
        claim.beneficiaryName.toLowerCase().includes(term.toLowerCase()) ||
        claim.uniqueClaimId.toLowerCase().includes(term.toLowerCase()) ||
        claim.facilityName.toLowerCase().includes(term.toLowerCase()) ||
        claim.tpaName.toLowerCase().includes(term.toLowerCase()),
    )

    if (status !== "all") {
      filtered = filtered.filter((claim) => claim.status === status)
    }

    setFilteredClaims(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-chart-2 text-white"
      case "rejected":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-chart-3 text-white"
    }
  }

  const handleApprove = (claimId: number) => {
    // Handle claim approval
    console.log("Approving claim:", claimId)
  }

  const handleReject = (claimId: number) => {
    // Handle claim rejection
    console.log("Rejecting claim:", claimId)
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">Claims Review</CardTitle>
          <div className="flex gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-40 bg-input border-border">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-card-foreground">Claim ID</TableHead>
                <TableHead className="text-card-foreground">Beneficiary</TableHead>
                <TableHead className="text-card-foreground">Facility</TableHead>
                <TableHead className="text-card-foreground">TPA</TableHead>
                <TableHead className="text-card-foreground">Amount</TableHead>
                <TableHead className="text-card-foreground">Status</TableHead>
                <TableHead className="text-card-foreground">Date</TableHead>
                <TableHead className="text-card-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id} className="border-border hover:bg-muted/50">
                  <TableCell className="font-medium text-card-foreground">{claim.uniqueClaimId}</TableCell>
                  <TableCell className="text-card-foreground">{claim.beneficiaryName}</TableCell>
                  <TableCell className="text-card-foreground">{claim.facilityName}</TableCell>
                  <TableCell className="text-card-foreground">{claim.tpaName}</TableCell>
                  <TableCell className="text-card-foreground">₦{claim.totalCostOfCare.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(claim.status)}>
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-card-foreground">
                    {new Date(claim.dateOfSubmission).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {claim.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-chart-2 text-white hover:bg-chart-2/90"
                            onClick={() => handleApprove(claim.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(claim.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
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
  )
}
