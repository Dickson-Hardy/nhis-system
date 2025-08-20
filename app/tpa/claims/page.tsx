"use client"

import { ClaimsProcessor } from "@/components/tpa/claims-processor"

export default function ClaimsProcessingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Claims Processing</h1>
        <p className="text-muted-foreground">
          Review, audit, and approve healthcare facility claims with cost analysis and NHIA standard comparison
        </p>
      </div>
      
      <ClaimsProcessor />
    </div>
  )
}