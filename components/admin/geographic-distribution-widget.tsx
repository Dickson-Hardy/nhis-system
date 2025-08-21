"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building, TrendingUp, Users } from "lucide-react"

interface GeographicData {
  state: string
  totalClaims: number
  totalAmount: number
  facilities: number
  avgClaimAmount: number
}

interface GeographicDistributionProps {
  geographicData: GeographicData[]
  totalClaims: number
  totalAmount: number
}

export function GeographicDistributionWidget({ 
  geographicData = [], 
  totalClaims, 
  totalAmount 
}: GeographicDistributionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  }

  // Sort states by total claims (descending)
  const sortedStates = geographicData.sort((a, b) => b.totalClaims - a.totalClaims)
  
  // Get top performing states
  const topState = sortedStates[0]
  const totalStates = sortedStates.length

  // Calculate coverage metrics
  const avgClaimsPerState = totalClaims / totalStates || 0
  const avgAmountPerState = totalAmount / totalStates || 0

  const getPerformanceLevel = (claims: number) => {
    const percentage = totalClaims > 0 ? (claims / totalClaims) * 100 : 0
    if (percentage > 15) return { level: 'High', color: 'bg-green-500' }
    if (percentage > 8) return { level: 'Medium', color: 'bg-yellow-500' }
    if (percentage > 3) return { level: 'Low', color: 'bg-orange-500' }
    return { level: 'Very Low', color: 'bg-red-500' }
  }

  return (
    <div className="space-y-6">
      {/* Geographic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Area</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStates}</div>
            <p className="text-xs text-muted-foreground">
              States covered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top State</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topState?.state || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {topState?.totalClaims || 0} claims
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per State</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgClaimsPerState)}</div>
            <p className="text-xs text-muted-foreground">
              Claims per state
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Building className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {geographicData.reduce((sum, state) => sum + state.facilities, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Healthcare facilities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* State-by-State Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>State-by-State Analysis</span>
          </CardTitle>
          <CardDescription>
            Geographic distribution of claims and healthcare facilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedStates.map((state, index) => {
              const percentage = totalClaims > 0 ? (state.totalClaims / totalClaims) * 100 : 0
              const performance = getPerformanceLevel(state.totalClaims)
              
              return (
                <div key={state.state} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <h3 className="text-lg font-semibold">{state.state}</h3>
                      </div>
                      <Badge className={`${performance.color} text-white`}>
                        {performance.level}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Market Share</div>
                      <div className="text-lg font-semibold">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* State Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{state.totalClaims}</div>
                      <p className="text-xs text-blue-600">Total Claims</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">
                        {formatCurrency(state.totalAmount)}
                      </div>
                      <p className="text-xs text-green-600">Total Value</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">{state.facilities}</div>
                      <p className="text-xs text-purple-600">Facilities</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">
                        {formatCurrency(state.avgClaimAmount)}
                      </div>
                      <p className="text-xs text-orange-600">Avg Claim</p>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Relative Performance</span>
                      <span>{percentage.toFixed(1)}% of national volume</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${performance.color}`}
                        style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {geographicData.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Geographic Data Available</h3>
              <p className="text-gray-600">
                Geographic distribution data will appear here once claims are processed
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic Insights */}
      {geographicData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Geographic Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Coverage Analysis</h4>
                <p className="text-sm text-blue-700">
                  Currently serving {totalStates} states with an average of {Math.round(avgClaimsPerState)} claims per state
                </p>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Market Concentration</h4>
                <p className="text-sm text-green-700">
                  Top 3 states account for {
                    sortedStates.slice(0, 3).reduce((sum, state) => 
                      sum + (state.totalClaims / totalClaims) * 100, 0
                    ).toFixed(1)
                  }% of total claims volume
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}