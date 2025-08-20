import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Download,
  FileText,
  BarChart3,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Building2
} from "lucide-react"

const reportTypes = [
  { id: "claims-summary", name: "Claims Summary Report", description: "Overview of all claims processed" },
  { id: "facility-performance", name: "Facility Performance Report", description: "Performance metrics by facility" },
  { id: "financial-analysis", name: "Financial Analysis Report", description: "Cost analysis and payment trends" },
  { id: "rejection-analysis", name: "Rejection Analysis Report", description: "Analysis of rejected claims" },
  { id: "monthly-summary", name: "Monthly Summary Report", description: "Monthly claims and payment summary" },
  { id: "audit-report", name: "Audit Report", description: "Detailed audit trail and compliance report" },
]

const quickStats = [
  {
    title: "Total Claims This Month",
    value: "1,247",
    change: "+18%",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    title: "Total Amount Processed",
    value: "₦45.7M",
    change: "+12%", 
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    title: "Active Facilities",
    value: "23",
    change: "+2",
    icon: Building2,
    color: "text-purple-600",
  },
  {
    title: "Approval Rate",
    value: "94.2%",
    change: "+2.1%",
    icon: TrendingUp,
    color: "text-orange-600",
  },
]

export default function TPAReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-600 mt-1">Generate comprehensive reports and analyze performance metrics</p>
        </div>
        <Button className="bg-[#104D7F] hover:bg-[#0d3f6b]">
          <Download className="h-4 w-4 mr-2" />
          Export All Data
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="border-l-4 border-l-[#104D7F]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-xs text-green-600 font-medium">{stat.change} from last month</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generator */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Generate Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{report.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{report.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm" className="bg-[#104D7F] hover:bg-[#0d3f6b]">
                    <Download className="h-4 w-4 mr-1" />
                    Generate
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Custom Report Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Custom Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input id="report-name" placeholder="Enter report name..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-3-months">Last 3 months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 months</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facility">Facility Filter</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Facilities</SelectItem>
                  <SelectItem value="luth">Lagos University Teaching Hospital</SelectItem>
                  <SelectItem value="nha">National Hospital Abuja</SelectItem>
                  <SelectItem value="upth">University of Port Harcourt Teaching Hospital</SelectItem>
                  <SelectItem value="uch">University College Hospital Ibadan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Claim Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-[#104D7F] hover:bg-[#0d3f6b]">
              <Download className="h-4 w-4 mr-2" />
              Generate Custom Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Monthly Claims Summary - January 2024", date: "2024-01-31", size: "2.4 MB", format: "PDF" },
              { name: "Facility Performance Analysis", date: "2024-01-28", size: "1.8 MB", format: "Excel" },
              { name: "Financial Analysis Q4 2023", date: "2024-01-15", size: "3.1 MB", format: "PDF" },
              { name: "Rejection Analysis Report", date: "2024-01-10", size: "956 KB", format: "CSV" },
            ].map((report, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#104D7F]/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[#104D7F]" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{report.name}</p>
                    <p className="text-sm text-slate-600">{report.date} • {report.size} • {report.format}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}