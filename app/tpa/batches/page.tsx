"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, FileText, Plus, ArrowRight, Eye } from "lucide-react"
import Link from "next/link"

interface Batch {
  id: string
  batchNumber: string
  status: string
  totalClaims: number
  totalAmount: string
  createdAt: string
  submittedAt?: string
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/batches', { credentials: 'include' })
      
      if (response.ok) {
        const data = await response.json()
        setBatches(data.batches || [])
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "submitted":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft"
      case "submitted":
        return "Submitted"
      default:
        return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#104D7F] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading batches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#104D7F] to-[#0d3f6b] rounded-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Batch Management</h1>
                <p className="text-xl text-blue-100">Manage your claim batches and review claims</p>
                <p className="text-blue-200 mt-2">Choose between modal view or full-screen detailed view</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{batches.length}</div>
                <div className="text-blue-200">Total Batches</div>
              </div>
            </div>
          </div>
        </div>

        {/* Batches Grid */}
        <div className="grid gap-6">
          {batches.map((batch) => (
            <Card key={batch.id} className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#104D7F]/10 rounded-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-[#104D7F]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{batch.batchNumber}</h3>
                      <p className="text-gray-600">Created: {new Date(batch.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#104D7F]">{batch.totalClaims}</div>
                    <div className="text-gray-600">Claims</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={`mt-1 ${getStatusColor(batch.status)}`}>
                      {getStatusDisplay(batch.status)}
                    </Badge>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-lg font-semibold text-green-600">
                      ₦{parseFloat(batch.totalAmount).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Actions</p>
                    <div className="flex justify-center space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#104D7F] text-[#104D7F] hover:bg-[#104D7F]/10"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Modal View
                      </Button>
                      <Link href={`/tpa/batches/${batch.id}`}>
                        <Button
                          size="sm"
                          className="bg-[#104D7F] hover:bg-[#0d3f6b]"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Full Screen
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {batch.status === "submitted" && batch.submittedAt && (
                        <>Submitted: {new Date(batch.submittedAt).toLocaleDateString()}</>
                      )}
                    </p>
                    <Link href={`/tpa/batches/${batch.id}`}>
                      <Button className="bg-[#104D7F] hover:bg-[#0d3f6b]">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Open Full Screen View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {batches.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <Package className="h-24 w-24 mx-auto mb-6 text-gray-400" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No batches yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get started by creating your first batch to organize and submit claims efficiently.
              </p>
              <Button className="bg-[#104D7F] hover:bg-[#0d3f6b]">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Batch
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
