"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock, 
  Trash2, 
  Eye,
  FileText,
  Package,
  DollarSign,
  Users
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface Notification {
  id: number
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  category: "claim" | "batch" | "payment" | "system" | "general"
  timestamp: string
  read: boolean
  actionUrl?: string
  actionText?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/facility/notifications")
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(data.notifications.map((notif: any) => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          category: notif.category,
          timestamp: notif.createdAt,
          read: notif.isRead,
          actionUrl: notif.actionUrl,
          actionText: notif.actionUrl ? "View Details" : undefined
        })))
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch notifications",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch("/api/facility/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        )
        toast({
          title: "Success",
          description: "Notification marked as read",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to mark notification as read",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/facility/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllAsRead: true }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        toast({
          title: "Success",
          description: "All notifications marked as read",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to mark all notifications as read",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      // Simulate API call
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      toast({
        title: "Success",
        description: "Notification deleted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "claim":
        return <FileText className="h-4 w-4" />
      case "batch":
        return <Package className="h-4 w-4" />
      case "payment":
        return <DollarSign className="h-4 w-4" />
      case "system":
        return <Users className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "claim":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "batch":
        return "bg-green-100 text-green-800 border-green-200"
      case "payment":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "system":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    }
  }

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(notif => notif.category === activeTab)

  const unreadCount = notifications.filter(notif => !notif.read).length

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading notifications...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#088C17] via-[#16a085] to-[#003C06] rounded-2xl border-0 p-8 shadow-2xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">
              Notifications Center
            </h1>
            <p className="text-xl text-green-100 font-medium drop-shadow-md">
              Stay updated with all system alerts and updates
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/20"
              onClick={markAllAsRead}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
            <div className="text-sm text-blue-700">Total Notifications</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{unreadCount}</div>
            <div className="text-sm text-yellow-700">Unread</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {notifications.filter(n => n.type === "success").length}
            </div>
            <div className="text-sm text-green-700">Success</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter(n => n.type === "error" || n.type === "warning").length}
            </div>
            <div className="text-sm text-red-700">Alerts</div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="claim">Claims</TabsTrigger>
          <TabsTrigger value="batch">Batches</TabsTrigger>
          <TabsTrigger value="payment">Payments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No notifications found</p>
                <p className="text-sm">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryColor(notification.category)}`}
                          >
                            <div className="flex items-center space-x-1">
                              {getCategoryIcon(notification.category)}
                              <span className="capitalize">{notification.category}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(notification.timestamp)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          
                          {notification.actionUrl && notification.actionText && (
                            <Button size="sm" asChild>
                              <a href={notification.actionUrl}>
                                {notification.actionText}
                              </a>
                            </Button>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
