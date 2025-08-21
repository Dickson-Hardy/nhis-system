import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Plus, Upload } from "lucide-react"
import { AdvancePaymentsTab } from "@/components/admin/advance-payments-tab"
import { BatchReimbursementsTab } from "@/components/admin/batch-reimbursements-tab"
import { ReimbursementsHistoryTab } from "@/components/admin/reimbursements-history-tab"
import { FinancialOverviewTab } from "@/components/admin/financial-overview-tab"

interface FinancialDashboardProps {
  initialData?: {
    advancePayments?: any[]
    reimbursements?: any[]
    batches?: any[]
    financialStats?: any
  }
}

export function FinancialDashboard({ initialData }: FinancialDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage advance payments and reimbursements for TPAs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advance Payments</CardTitle>
            <Badge variant="secondary">
              {initialData?.financialStats?.totalAdvancePayments || 0}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{(initialData?.financialStats?.totalAdvanceAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Active payments to TPAs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reimbursements</CardTitle>
            <Badge variant="warning">
              {initialData?.financialStats?.pendingReimbursements || 0}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{(initialData?.financialStats?.pendingAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eligible Batches</CardTitle>
            <Badge variant="success">
              {initialData?.financialStats?.eligibleBatches || 0}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{(initialData?.financialStats?.eligibleAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for reimbursement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Badge variant="outline">
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{(initialData?.financialStats?.monthlyTotal || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="advance-payments">Advance Payments</TabsTrigger>
          <TabsTrigger value="batch-reimbursements">Batch Reimbursements</TabsTrigger>
          <TabsTrigger value="reimbursements-history">Reimbursements History</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinancialOverviewTab initialData={initialData} />
        </TabsContent>

        <TabsContent value="advance-payments">
          <AdvancePaymentsTab initialData={initialData?.advancePayments} />
        </TabsContent>

        <TabsContent value="batch-reimbursements">
          <BatchReimbursementsTab initialData={initialData?.batches} />
        </TabsContent>

        <TabsContent value="reimbursements-history">
          <ReimbursementsHistoryTab initialData={initialData?.reimbursements} />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Generate and download financial reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Advance Payments Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Reimbursements Report
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Monthly Summary
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Annual Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}