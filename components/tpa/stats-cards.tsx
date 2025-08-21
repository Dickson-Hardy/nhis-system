import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, DollarSign, Clock, CheckCircle } from "lucide-react"

interface StatsCardsProps {
  totalClaims: number
  totalAmount: number
  pendingClaims: number
  approvedClaims: number
}

export function StatsCards({ totalClaims, totalAmount, pendingClaims, approvedClaims }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Claims",
      value: totalClaims.toLocaleString(),
      icon: FileText,
      color: "text-chart-1",
    },
    {
      title: "Total Amount",
      value: `₦${totalAmount.toLocaleString()}`,
      icon: DollarSign,
      color: "text-chart-2",
    },
    {
      title: "Pending Claims",
      value: pendingClaims.toLocaleString(),
      icon: Clock,
      color: "text-chart-3",
    },
    {
      title: "Approved Claims",
      value: approvedClaims.toLocaleString(),
      icon: CheckCircle,
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
