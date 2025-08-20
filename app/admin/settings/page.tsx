import { NotificationSettings } from "@/components/admin/notification-settings"

export default function AdminSettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings and notifications</p>
      </div>
      <NotificationSettings />
    </div>
  )
}
