"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, FileText, DollarSign, XCircle, ArrowRight } from "lucide-react"

interface StatusWorkflowProps {
  currentStatus: string
  className?: string
}

export function StatusWorkflow({ currentStatus, className = "" }: StatusWorkflowProps) {
  const workflowSteps = [
    {
      status: "submitted",
      label: "Submitted",
      icon: FileText,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      description: "Claim submitted by facility"
    },
    {
      status: "awaiting_verification",
      label: "Awaiting Verification",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      description: "TPA reviewing claim"
    },
    {
      status: "verified",
      label: "Verified",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800 border-green-200",
      description: "TPA approved claim"
    },
    {
      status: "verified_awaiting_payment",
      label: "Awaiting Payment",
      icon: DollarSign,
      color: "bg-purple-100 text-purple-800 border-purple-200",
      description: "NHIS processing payment"
    },
    {
      status: "verified_paid",
      label: "Paid",
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      description: "Payment completed"
    }
  ]

  const rejectedStep = {
    status: "rejected",
    label: "Rejected",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Claim rejected by TPA"
  }

  const getCurrentStepIndex = () => {
    return workflowSteps.findIndex(step => step.status === currentStatus)
  }

  const isRejected = currentStatus === "rejected"
  const currentStepIndex = getCurrentStepIndex()

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span>Claims Status Workflow</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Workflow */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, index) => (
              <div key={step.status} className="flex items-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className={`relative p-3 rounded-full border-2 ${
                    index <= currentStepIndex && !isRejected 
                      ? step.color 
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}>
                    <step.icon className="h-5 w-5" />
                    {index < currentStepIndex && !isRejected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        index <= currentStepIndex && !isRejected 
                          ? step.color 
                          : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}
                    >
                      {step.label}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1 max-w-20">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>

          {/* Rejected Path */}
          {isRejected && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <ArrowRight className="h-4 w-4 text-gray-400 rotate-90" />
                <div className={`p-3 rounded-full border-2 ${rejectedStep.color}`}>
                  <rejectedStep.icon className="h-5 w-5" />
                </div>
                <div className="ml-2">
                  <Badge variant="outline" className={rejectedStep.color}>
                    {rejectedStep.label}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {rejectedStep.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Status Indicator */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">
                Current Status: {workflowSteps.find(s => s.status === currentStatus)?.label || 'Unknown'}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {workflowSteps.find(s => s.status === currentStatus)?.description || ''}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
