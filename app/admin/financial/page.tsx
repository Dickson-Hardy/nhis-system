"use client"

import { useState, useEffect } from "react"
import { FinancialDashboard } from "@/components/admin/financial-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface FinancialData {
  advancePayments: any[]
  reimbursements: any[]
  batches: any[]
  financialStats: any
}

export default function FinancialManagementPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      
      // Fetch advance payments
      const advancePaymentsResponse = await fetch('/api/admin/financial/advance-payments')
      const advancePaymentsData = advancePaymentsResponse.ok ? await advancePaymentsResponse.json() : { payments: [] }
      
      // Fetch reimbursements
      const reimbursementsResponse = await fetch('/api/admin/financial/reimbursements')
      const reimbursementsData = reimbursementsResponse.ok ? await reimbursementsResponse.json() : { reimbursements: [] }
      
      // Fetch eligible batches
      const batchesResponse = await fetch('/api/admin/financial/batch-reimbursements')
      const batchesData = batchesResponse.ok ? await batchesResponse.json() : { batches: [] }
      
      // Calculate financial stats
      const financialStats = {
        totalAdvancePayments: advancePaymentsData.payments?.length || 0,
        totalAdvanceAmount: advancePaymentsData.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
        pendingReimbursements: reimbursementsData.reimbursements?.filter((r: any) => r.status === 'pending').length || 0,
        pendingAmount: reimbursementsData.reimbursements?.filter((r: any) => r.status === 'pending').reduce((sum: number, r: any) => sum + r.amount, 0) || 0,
        eligibleBatches: batchesData.batches?.length || 0,
        eligibleAmount: batchesData.batches?.reduce((sum: number, b: any) => sum + b.reimbursableAmount, 0) || 0,
        monthlyTotal: reimbursementsData.reimbursements?.filter((r: any) => {
          const createdDate = new Date(r.createdAt)
          const currentDate = new Date()
          return createdDate.getMonth() === currentDate.getMonth() && createdDate.getFullYear() === currentDate.getFullYear()
        }).reduce((sum: number, r: any) => sum + r.amount, 0) || 0,
      }
      
      setFinancialData({
        advancePayments: advancePaymentsData.payments || [],
        reimbursements: reimbursementsData.reimbursements || [],
        batches: batchesData.batches || [],
        financialStats,
      })
    } catch (error) {
      console.error('Error fetching financial data:', error)
      // Set empty data on error
      setFinancialData({
        advancePayments: [],
        reimbursements: [],
        batches: [],
        financialStats: {
          totalAdvancePayments: 0,
          totalAdvanceAmount: 0,
          pendingReimbursements: 0,
          pendingAmount: 0,
          eligibleBatches: 0,
          eligibleAmount: 0,
          monthlyTotal: 0,
        }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#088C17] mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#088C17] to-[#003C06] rounded-lg flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
                <p className="text-gray-600">Manage advance payments and reimbursements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Dashboard */}
      <FinancialDashboard initialData={financialData || undefined} />
    </div>
  )
}