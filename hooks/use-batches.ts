"use client"

import { useState, useEffect } from "react"

interface Batch {
  id: number
  batchNumber: string
  totalClaims: number
  totalAmount: string
  status: string
  createdAt: string
  submittedAt?: string
  tpa: {
    name: string
  }
}

interface UseBatchesReturn {
  batches: Batch[]
  loading: boolean
  error: string | null
  refetch: () => void
  createBatch: (data: { batchNumber: string; facilityId: number; tpaId?: number; description?: string }) => Promise<void>
}

export function useBatches(): UseBatchesReturn {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBatches = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/batches", {
        credentials: "include", // Include cookies for authentication
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch batches: ${response.statusText}`)
      }

      const data = await response.json()
      setBatches(data.batches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error fetching batches:", err)
    } finally {
      setLoading(false)
    }
  }

  const createBatch = async (batchData: { batchNumber: string; facilityId: number; tpaId?: number; description?: string }) => {
    try {
      setError(null)
      
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(batchData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create batch: ${response.statusText}`)
      }

      // Refetch batches after creating
      await fetchBatches()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create batch")
      throw err
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  return {
    batches,
    loading,
    error,
    refetch: fetchBatches,
    createBatch,
  }
}