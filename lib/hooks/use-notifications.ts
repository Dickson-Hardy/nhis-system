"use client"

import { useState, useEffect } from "react"

interface Notification {
  id: number
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  createdAt: string
  isRead: boolean
  readAt?: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      // Fallback to empty array on error
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark_read",
          notificationId: id,
        }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) => 
            notification.id === id 
              ? { ...notification, isRead: true, readAt: new Date().toISOString() } 
              : notification
          ),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark_all_read",
        }),
      })

      if (response.ok) {
        setNotifications((prev) => 
          prev.map((notification) => ({ 
            ...notification, 
            isRead: true,
            readAt: new Date().toISOString()
          }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refreshNotifications: fetchNotifications,
  }
}
