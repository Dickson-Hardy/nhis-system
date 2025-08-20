"use client"

import { useState, useEffect } from "react"
import { ClaimsAudit } from "@/components/tpa/claims-audit"
import type { ClaimAuditData } from "@/components/tpa/claims-audit"

export default function ClaimsAuditPage() {
  const [claims, setClaims] = useState<ClaimAuditData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch audit data from API
    fetchAuditData()
  }, [])

  const fetchAuditData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/audit/claims', { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
      } else {
        // API not implemented yet, show empty state
        setClaims([])
      }
    } catch (error) {
      console.error('Error fetching audit data:', error)
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  const handleFlagClaim = (claimId: string, flags: any[]) => {
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        claim.id === claimId
          ? { ...claim, auditFlags: flags, riskScore: flags.length * 5 }
          : claim
      )
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Claims Audit System</h1>
          <p className="text-muted-foreground">
            Loading audit data...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Claims Audit System</h1>
        <p className="text-muted-foreground">
          Review and audit healthcare claims for fraud detection and compliance
        </p>
      </div>
      
      <ClaimsAudit 
        claims={claims} 
        onFlagClaim={handleFlagClaim}
      />
    </div>
  )
}