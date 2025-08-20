"use client"

import { AnalyticsDashboard } from "@/components/tpa/analytics-dashboard"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics & Reporting</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics dashboard providing insights into claims performance, facility metrics, cost analysis, and TPA efficiency
        </p>
      </div>
      
      <AnalyticsDashboard />
    </div>
  )
}
