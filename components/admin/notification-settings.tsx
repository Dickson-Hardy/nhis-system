"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Mail, Settings, Send } from "lucide-react"

interface NotificationSettings {
  claimApproved: boolean
  claimRejected: boolean
  claimSubmitted: boolean
  batchProcessed: boolean
  systemAlerts: boolean
  weeklyReports: boolean
  emailFrequency: "immediate" | "daily" | "weekly"
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    claimApproved: true,
    claimRejected: true,
    claimSubmitted: true,
    batchProcessed: true,
    systemAlerts: true,
    weeklyReports: false,
    emailFrequency: "immediate",
  })

  const [testEmail, setTestEmail] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Save settings to backend
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Settings saved:", settings)
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) return

    setIsSendingTest(true)
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, message: customMessage }),
      })

      if (response.ok) {
        console.log("Test email sent successfully")
      } else {
        console.error("Failed to send test email")
      }
    } catch (error) {
      console.error("Error sending test email:", error)
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notification Settings
          </CardTitle>
          <CardDescription>Configure when and how you receive email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground">Notification Types</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="claimApproved" className="text-card-foreground">
                    Claim Approved
                  </Label>
                  <p className="text-sm text-muted-foreground">Notify when claims are approved</p>
                </div>
                <Switch
                  id="claimApproved"
                  checked={settings.claimApproved}
                  onCheckedChange={(checked) => handleSettingChange("claimApproved", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="claimRejected" className="text-card-foreground">
                    Claim Rejected
                  </Label>
                  <p className="text-sm text-muted-foreground">Notify when claims are rejected</p>
                </div>
                <Switch
                  id="claimRejected"
                  checked={settings.claimRejected}
                  onCheckedChange={(checked) => handleSettingChange("claimRejected", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="claimSubmitted" className="text-card-foreground">
                    Claim Submitted
                  </Label>
                  <p className="text-sm text-muted-foreground">Notify when new claims are submitted</p>
                </div>
                <Switch
                  id="claimSubmitted"
                  checked={settings.claimSubmitted}
                  onCheckedChange={(checked) => handleSettingChange("claimSubmitted", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="batchProcessed" className="text-card-foreground">
                    Batch Processed
                  </Label>
                  <p className="text-sm text-muted-foreground">Notify when batches are processed</p>
                </div>
                <Switch
                  id="batchProcessed"
                  checked={settings.batchProcessed}
                  onCheckedChange={(checked) => handleSettingChange("batchProcessed", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="systemAlerts" className="text-card-foreground">
                    System Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">Notify about system maintenance and updates</p>
                </div>
                <Switch
                  id="systemAlerts"
                  checked={settings.systemAlerts}
                  onCheckedChange={(checked) => handleSettingChange("systemAlerts", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyReports" className="text-card-foreground">
                    Weekly Reports
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive weekly summary reports</p>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => handleSettingChange("weeklyReports", checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-primary text-primary-foreground">
              <Settings className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test Email Notifications
          </CardTitle>
          <CardDescription>Send a test email to verify your notification setup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="Enter email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customMessage">Custom Message (Optional)</Label>
            <Textarea
              id="customMessage"
              placeholder="Add a custom message to the test email"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="bg-input border-border"
              rows={3}
            />
          </div>

          <Alert>
            <AlertDescription>
              This will send a test notification email to verify that your email configuration is working correctly.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleSendTestEmail}
            disabled={!testEmail || isSendingTest}
            variant="outline"
            className="bg-transparent"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSendingTest ? "Sending..." : "Send Test Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
