"use client"

import { useState, useEffect } from "react"

interface Claim {
  id: number
  uniqueClaimId: string
  beneficiaryName: string
  facility: {
    name: string
    state: string
  }
  totalCostOfCare: string
  status: string
  dateOfAdmission: string
  primaryDiagnosis: string
  createdAt: string
  tpa: {
    name: string
  }
}

interface ClaimStats {
  submitted: number
  awaitingVerification: number
  notVerified: number
  verified: number
  verifiedAwaitingPayment: number
  verifiedPaid: number
  totalAmount: number
}

interface UseClaimsReturn {
  claims: Claim[]
  stats: ClaimStats
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useClaims(status?: string): UseClaimsReturn {
  const [claims, setClaims] = useState<Claim[]>([])
  const [stats, setStats] = useState<ClaimStats>({
    submitted: 0,
    awaitingVerification: 0,
    notVerified: 0,
    verified: 0,
    verifiedAwaitingPayment: 0,
    verifiedPaid: 0,
    totalAmount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClaims = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (status) {
        params.append("status", status)
      }
      params.append("limit", "100") // Get more claims for better overview

      const response = await fetch(`/api/claims?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch claims: ${response.statusText}`)
      }

      const data = await response.json()
      setClaims(data.claims || [])

      // Calculate stats from the claims data
      const claimsData = data.claims || []
      const newStats: ClaimStats = {
        submitted: claimsData.filter((c: Claim) => c.status === "submitted").length,
        awaitingVerification: claimsData.filter((c: Claim) => c.status === "awaiting_verification").length,
        notVerified: claimsData.filter((c: Claim) => c.status === "not_verified").length,
        verified: claimsData.filter((c: Claim) => c.status === "verified").length,
        verifiedAwaitingPayment: claimsData.filter((c: Claim) => c.status === "verified_awaiting_payment").length,
        verifiedPaid: claimsData.filter((c: Claim) => c.status === "verified_paid").length,
        totalAmount: claimsData.reduce((sum: number, c: Claim) => sum + parseFloat(c.totalCostOfCare || "0"), 0),
      }
      setStats(newStats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching claims:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClaims()
  }, [status])

  return {
    claims,
    stats,
    loading,
    error,
    refetch: fetchClaims,
  }
}