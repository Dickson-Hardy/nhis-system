import { FacilityStats } from "@/components/facility/facility-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, FileText, Send } from "lucide-react"

// Mock data - replace with actual database queries
const mockStats = {
  totalPatients: 342,
  totalDischarges: 298,
  pendingClaims: 12,
  monthlyGrowth: 8.5,
}

const recentDischarges = [
  {
    id: 1,
    patientName: "Amina Hassan",
    hospitalNumber: "HSP-2024-001",
    dischargeDate: "2024-01-15",
    procedure: "Cesarean Section",
    status: "Submitted",
  },
  {
    id: 2,
    patientName: "Chioma Okwu",
    hospitalNumber: "HSP-2024-002",
    dischargeDate: "2024-01-14",
    procedure: "Cesarean Section",
    status: "Draft",
  },
  {
    id: 3,
    patientName: "Khadija Musa",
    hospitalNumber: "HSP-2024-003",
    dischargeDate: "2024-01-13",
    procedure: "Cesarean Section",
    status: "Submitted",
  },
]

export default function FacilityDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facility Dashboard</h1>
          <p className="text-muted-foreground">Manage patient discharges and claims</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-primary text-primary-foreground">
            <Link href="/facility/discharge">
              <Plus className="h-4 w-4 mr-2" />
              New Discharge Form
            </Link>
          </Button>
        </div>
      </div>

      <FacilityStats {...mockStats} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Discharges
            </CardTitle>
            <CardDescription>Latest patient discharge forms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDischarges.map((discharge) => (
                <div key={discharge.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-card-foreground">{discharge.patientName}</p>
                    <p className="text-sm text-muted-foreground">{discharge.hospitalNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(discharge.dischargeDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        discharge.status === "Submitted" ? "bg-chart-2 text-white" : "bg-chart-3 text-white"
                      }`}
                    >
                      {discharge.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/facility/patients">View All Discharges</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <Send className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/facility/discharge">
                <Plus className="h-4 w-4 mr-2" />
                Create New Discharge Form
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/facility/patients">
                <FileText className="h-4 w-4 mr-2" />
                View Patient Records
              </Link>
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" asChild>
              <Link href="/facility/submit">
                <Send className="h-4 w-4 mr-2" />
                Submit Claims to TPA
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
