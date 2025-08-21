"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  Bell,
  Eye,
  BarChart3
} from "lucide-react"
import { useState, useEffect } from "react"

interface RealTimeMetrics {
  processingVelocity: number
  systemHealth: number
  alertsCount: number
  activeUsers: number
  recentActivity: Array<{
    type: 'claim_submitted' | 'claim_verified' | 'payment_processed' | 'error_detected'
    message: string
    timestamp: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }>
}

interface RealTimeMonitoringProps {
  initialMetrics?: RealTimeMetrics
}

export function RealTimeMonitoringWidget({ initialMetrics }: RealTimeMonitoringProps) {
  const [metrics, setMetrics] = useState<RealTimeMetrics>(initialMetrics || {
    processingVelocity: 85,
    systemHealth: 98,
    alertsCount: 3,
    activeUsers: 142,
    recentActivity: []
  })
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isLive, setIsLive] = useState(true)

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        processingVelocity: Math.max(60, Math.min(100, prev.processingVelocity + (Math.random() - 0.5) * 10)),
        systemHealth: Math.max(85, Math.min(100, prev.systemHealth + (Math.random() - 0.5) * 5)),
        alertsCount: Math.max(0, prev.alertsCount + Math.floor((Math.random() - 0.7) * 2)),
        activeUsers: Math.max(50, prev.activeUsers + Math.floor((Math.random() - 0.5) * 20))
      }))
      setLastUpdate(new Date())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [isLive])

  const getHealthStatus = (health: number) => {
    if (health >= 95) return { status: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' }
    if (health >= 85) return { status: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' }
    if (health >= 70) return { status: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700' }
    return { status: 'Poor', color: 'bg-red-500', textColor: 'text-red-700' }
  }

  const getVelocityStatus = (velocity: number) => {
    if (velocity >= 90) return { status: 'High', color: 'bg-green-500' }
    if (velocity >= 70) return { status: 'Normal', color: 'bg-blue-500' }
    if (velocity >= 50) return { status: 'Slow', color: 'bg-yellow-500' }
    return { status: 'Critical', color: 'bg-red-500' }
  }

  const healthStatus = getHealthStatus(metrics.systemHealth)
  const velocityStatus = getVelocityStatus(metrics.processingVelocity)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'claim_submitted': return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'claim_verified': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'payment_processed': return <Activity className="h-4 w-4 text-purple-600" />
      case 'error_detected': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>Real-Time System Monitoring</span>
                {isLive && (
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">LIVE</span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLive(!isLive)}
                className={isLive ? "border-green-300 text-green-700" : "border-gray-300"}
              >
                {isLive ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Live
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Paused
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{metrics.processingVelocity.toFixed(0)}%</div>
              <p className="text-sm text-blue-600 mb-2">Processing Velocity</p>
              <Badge className={`${velocityStatus.color} text-white`}>
                {velocityStatus.status}
              </Badge>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-700">{metrics.systemHealth.toFixed(0)}%</div>
              <p className="text-sm text-green-600 mb-2">System Health</p>
              <Badge className={`${healthStatus.color} text-white`}>
                {healthStatus.status}
              </Badge>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-700">{metrics.alertsCount}</div>
              <p className="text-sm text-yellow-600 mb-2">Active Alerts</p>
              <Badge variant={metrics.alertsCount > 5 ? "destructive" : "secondary"}>
                {metrics.alertsCount > 5 ? 'High' : 'Normal'}
              </Badge>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-700">{metrics.activeUsers}</div>
              <p className="text-sm text-purple-600 mb-2">Active Users</p>
              <Badge variant="outline" className="border-purple-300 text-purple-700">
                Online
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Performance Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Processing Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Claims Processing</span>
                  <span className="font-medium">{metrics.processingVelocity.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.processingVelocity} className="h-3" />
                <p className="text-xs text-gray-600 mt-1">
                  {metrics.processingVelocity > 80 ? 'Excellent performance' : 
                   metrics.processingVelocity > 60 ? 'Good performance' : 'Needs attention'}
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>System Health</span>
                  <span className="font-medium">{metrics.systemHealth.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.systemHealth} className="h-3" />
                <p className="text-xs text-gray-600 mt-1">
                  All systems operational
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>User Activity</span>
                  <span className="font-medium">{Math.min(100, (metrics.activeUsers / 200) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(100, (metrics.activeUsers / 200) * 100)} className="h-3" />
                <p className="text-xs text-gray-600 mt-1">
                  {metrics.activeUsers} users currently active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <span>System Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.alertsCount === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">All Clear</h3>
                  <p className="text-gray-600">No active alerts or issues detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from({ length: Math.min(metrics.alertsCount, 5) }, (_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-yellow-800">
                          Alert #{i + 1}
                        </h4>
                        <p className="text-xs text-yellow-700">
                          Sample alert message for monitoring purposes
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          {new Date(Date.now() - i * 300000).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {metrics.alertsCount > 5 && (
                    <div className="text-center py-2">
                      <Button variant="outline" size="sm">
                        View All {metrics.alertsCount} Alerts
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span>Recent System Activity</span>
          </CardTitle>
          <CardDescription>
            Live feed of system events and transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {metrics.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity to display</p>
              </div>
            ) : (
              metrics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                  {activity.severity && (
                    <Badge 
                      variant={activity.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {activity.severity}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}