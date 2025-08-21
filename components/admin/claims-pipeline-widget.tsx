"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, FileText, Eye, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react"

interface StatusBreakdown {
  [key: string]: {
    count: number
    amount: number
  }
}

interface ClaimsPipelineProps {
  statusBreakdown: StatusBreakdown
  totalClaims: number
}

export function ClaimsPipelineWidget({ statusBreakdown, totalClaims }: ClaimsPipelineProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  }

  // Define the claims pipeline stages
  const pipelineStages = [
    {
      key: 'submitted',
      label: 'Submitted',
      description: 'Claims awaiting initial review',
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'awaiting_verification',
      label: 'Under Review',
      description: 'Claims being verified',
      icon: Eye,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50'
    },
    {
      key: 'verified',
      label: 'Verified',
      description: 'Claims approved and verified',
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50'
    },
    {
      key: 'verified_awaiting_payment',
      label: 'Awaiting Payment',
      description: 'Verified claims pending payment',
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50'
    },
    {
      key: 'verified_paid',
      label: 'Paid',
      description: 'Claims fully processed and paid',
      icon: DollarSign,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50'
    },
    {
      key: 'rejected',
      label: 'Rejected',
      description: 'Claims that were rejected',
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50'
    }
  ]

  // Calculate pipeline metrics
  const completionRate = totalClaims > 0 
    ? ((statusBreakdown.verified_paid?.count || 0) / totalClaims) * 100 
    : 0

  const rejectionRate = totalClaims > 0
    ? ((statusBreakdown.rejected?.count || 0) / totalClaims) * 100
    : 0

  const processingEfficiency = totalClaims > 0
    ? (((statusBreakdown.verified?.count || 0) + (statusBreakdown.verified_paid?.count || 0)) / totalClaims) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Claims Processing Pipeline</span>
          </CardTitle>
          <CardDescription>
            Visual representation of claims flow through the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pipeline Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{completionRate.toFixed(1)}%</div>
              <p className="text-sm text-green-600">Completion Rate</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{processingEfficiency.toFixed(1)}%</div>
              <p className="text-sm text-blue-600">Processing Efficiency</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{rejectionRate.toFixed(1)}%</div>
              <p className="text-sm text-red-600">Rejection Rate</p>
            </div>
          </div>

          {/* Pipeline Visualization */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
              {pipelineStages.map((stage, index) => {
                const stageData = statusBreakdown[stage.key] || { count: 0, amount: 0 }
                const percentage = totalClaims > 0 ? (stageData.count / totalClaims) * 100 : 0
                const Icon = stage.icon

                return (
                  <div key={stage.key} className="relative">
                    <Card className={`${stage.bgColor} border-2 hover:shadow-lg transition-all`}>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <div className={`w-12 h-12 ${stage.color} rounded-full flex items-center justify-center`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          
                          <h3 className={`font-semibold ${stage.textColor} mb-1`}>
                            {stage.label}
                          </h3>
                          
                          <div className={`text-2xl font-bold ${stage.textColor} mb-1`}>
                            {stageData.count}
                          </div>
                          
                          <div className="text-xs text-gray-600 mb-2">
                            {formatCurrency(stageData.amount)}
                          </div>
                          
                          <Badge variant="secondary" className="text-xs">
                            {percentage.toFixed(1)}%
                          </Badge>
                          
                          <p className="text-xs text-gray-500 mt-2 leading-tight">
                            {stage.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Arrow connector (except for last item) */}
                    {index < pipelineStages.length - 2 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                        <ArrowRight className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Pipeline Health Indicators */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Pipeline Health</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span className="font-medium">{processingEfficiency.toFixed(1)}%</span>
                </div>
                <Progress value={processingEfficiency} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Bottleneck Stage:</span>
                  <span className="font-medium">
                    {Object.entries(statusBreakdown)
                      .filter(([key]) => !['verified_paid', 'rejected'].includes(key))
                      .sort(([,a], [,b]) => b.count - a.count)[0]?.[0]?.replace(/_/g, ' ') || 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Velocity:</span>
                  <span className="font-medium">
                    {completionRate > 70 ? 'High' : completionRate > 40 ? 'Medium' : 'Low'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}