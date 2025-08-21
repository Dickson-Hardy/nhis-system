"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BarChart3, 
  Users, 
  FileText, 
  Shield, 
  MapPin, 
  Activity,
  Settings,
  Download,
  Eye,
  AlertTriangle
} from "lucide-react"

interface QuickActionsProps {
  onTabChange?: (tab: string) => void
  currentTab?: string
}

export function QuickActionsWidget({ onTabChange, currentTab }: QuickActionsProps) {
  const actions = [
    {
      id: 'financial',
      title: 'Financial Overview',
      description: 'View financial metrics and payment status',
      icon: BarChart3,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'tpa-performance',
      title: 'TPA Performance',
      description: 'Compare TPA metrics and approval rates',
      icon: Users,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'pipeline',
      title: 'Claims Pipeline',
      description: 'Track claims through processing stages',
      icon: FileText,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      id: 'quality',
      title: 'Quality Control',
      description: 'Monitor duplicates and data quality',
      icon: Shield,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    },
    {
      id: 'geographic',
      title: 'Geographic Analysis',
      description: 'View claims distribution by location',
      icon: MapPin,
      color: 'bg-teal-500',
      hoverColor: 'hover:bg-teal-600'
    },
    {
      id: 'monitoring',
      title: 'Live Monitoring',
      description: 'Real-time system performance',
      icon: Activity,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600'
    }
  ]

  const utilities = [
    {
      id: 'export',
      title: 'Export Reports',
      icon: Download,
      action: () => console.log('Export functionality')
    },
    {
      id: 'logs',
      title: 'View Logs',
      icon: Eye,
      action: () => console.log('View logs functionality')
    },
    {
      id: 'alerts',
      title: 'System Alerts',
      icon: AlertTriangle,
      action: () => console.log('Alerts functionality')
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      action: () => console.log('Settings functionality')
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Dashboard Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Dashboard Navigation</span>
          </CardTitle>
          <CardDescription>
            Quick access to different dashboard sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action) => {
              const Icon = action.icon
              const isActive = currentTab === action.id
              
              return (
                <Button
                  key={action.id}
                  variant={isActive ? "default" : "outline"}
                  className={`h-auto p-4 flex flex-col items-start space-y-2 ${
                    isActive 
                      ? `${action.color} text-white shadow-lg` 
                      : `border-gray-300 ${action.hoverColor} hover:text-white`
                  }`}
                  onClick={() => onTabChange?.(action.id)}
                >
                  <div className="flex items-center space-x-2 w-full">
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">{action.title}</span>
                  </div>
                  <p className={`text-xs text-left ${isActive ? 'text-white/90' : 'text-gray-600'}`}>
                    {action.description}
                  </p>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Utility Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <span>Quick Utilities</span>
          </CardTitle>
          <CardDescription>
            System utilities and administrative tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {utilities.map((utility) => {
              const Icon = utility.icon
              
              return (
                <Button
                  key={utility.id}
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center space-y-2 h-20 border-gray-300 hover:bg-gray-50"
                  onClick={utility.action}
                >
                  <Icon className="h-5 w-5 text-gray-600" />
                  <span className="text-xs font-medium">{utility.title}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}