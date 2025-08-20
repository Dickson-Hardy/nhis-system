"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Eye, Edit, Search } from "lucide-react"

interface Claim {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  facilityName: string
  totalCostOfCare: number
  status: "pending" | "approved" | "rejected"
  dateOfAdmission: string
  primaryDiagnosis: string
}

interface ClaimsTableProps {
  claims: Claim[]
}

export function ClaimsTable({ claims }: ClaimsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClaims, setFilteredClaims] = useState(claims)

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    const filtered = claims.filter(
      (claim) =>
        claim.beneficiaryName.toLowerCase().includes(term.toLowerCase()) ||
        claim.uniqueClaimId.toLowerCase().includes(term.toLowerCase()) ||
        claim.facilityName.toLowerCase().includes(term.toLowerCase()),
    )
    setFilteredClaims(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">Recent Claims</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search claims..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-input border-border"
            />
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
                  <TableCell className="text-card-foreground">₦{claim.totalCostOfCare.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(claim.status)}>
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-card-foreground">
                    {new Date(claim.dateOfAdmission).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
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
