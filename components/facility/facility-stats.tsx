import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Clock, TrendingUp } from "lucide-react"

interface FacilityStatsProps {
  totalPatients: number
  totalDischarges: number
  pendingClaims: number
  monthlyGrowth: number
}

export function FacilityStats({ totalPatients, totalDischarges, pendingClaims, monthlyGrowth }: FacilityStatsProps) {
  const stats = [
    {
      title: "Total Patients",
      value: totalPatients.toLocaleString(),
      icon: Users,
      color: "text-chart-1",
    },
    {
      title: "Total Discharges",
      value: totalDischarges.toLocaleString(),
      icon: FileText,
      color: "text-chart-2",
    },
    {
      title: "Pending Claims",
      value: pendingClaims.toLocaleString(),
      icon: Clock,
      color: "text-chart-3",
    },
    {
      title: "Monthly Growth",
      value: `${monthlyGrowth}%`,
      icon: TrendingUp,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
            <stat.icon className={cn("h-4 w-4", stat.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
