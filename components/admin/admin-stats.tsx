import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Building2, Users, DollarSign, TrendingUp, Clock } from "lucide-react"

interface AdminStatsProps {
  totalClaims: number
  totalTPAs: number
  totalFacilities: number
  totalAmount: number
  pendingClaims: number
  approvalRate: number
}

export function AdminStats({
  totalClaims,
  totalTPAs,
  totalFacilities,
  totalAmount,
  pendingClaims,
  approvalRate,
}: AdminStatsProps) {
  const stats = [
    {
      title: "Total Claims",
      value: totalClaims.toLocaleString(),
      icon: FileText,
      color: "text-chart-1",
      change: "+12%",
    },
    {
      title: "Active TPAs",
      value: totalTPAs.toLocaleString(),
      icon: Building2,
      color: "text-chart-2",
      change: "+2%",
    },
    {
      title: "Healthcare Facilities",
      value: totalFacilities.toLocaleString(),
      icon: Users,
      color: "text-chart-3",
      change: "+5%",
    },
    {
      title: "Total Amount",
      value: `₦${totalAmount.toLocaleString()}`,
      icon: DollarSign,
      color: "text-chart-4",
      change: "+18%",
    },
    {
      title: "Pending Claims",
      value: pendingClaims.toLocaleString(),
      icon: Clock,
      color: "text-chart-5",
      change: "-8%",
    },
    {
      title: "Approval Rate",
      value: `${approvalRate}%`,
      icon: TrendingUp,
      color: "text-chart-2",
      change: "+3%",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{stat.title}</CardTitle>
            <stat.icon className={cn("h-4 w-4", stat.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stat.change.startsWith("+") ? "text-chart-2" : "text-destructive"}>{stat.change}</span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
