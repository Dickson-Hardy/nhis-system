import { FacilityStats } from "@/components/facility/facility-stats"
import { FacilityBatchDashboard } from "@/components/facility/facility-batch-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Plus, FileText, Send, Package } from "lucide-react"
import { FacilityDashboardClient } from "@/components/facility/facility-dashboard-client"

export default function FacilityDashboard() {
  return <FacilityDashboardClient />
}
