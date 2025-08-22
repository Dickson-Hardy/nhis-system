"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DateFilterWidgetProps {
  onDateChange: (startDate: Date | null, endDate: Date | null) => void
  onRefresh: () => void
  isLoading?: boolean
}

export function DateFilterWidget({ onDateChange, onRefresh, isLoading = false }: DateFilterWidgetProps) {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isEndOpen, setIsEndOpen] = useState(false)

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date || null)
    setIsStartOpen(false)
    onDateChange(date || null, endDate)
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date || null)
    setIsEndOpen(false)
    onDateChange(startDate, date || null)
  }

  const handleQuickFilter = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    
    setStartDate(start)
    setEndDate(end)
    onDateChange(start, end)
  }

  const handleClearFilters = () => {
    setStartDate(null)
    setEndDate(null)
    onDateChange(null, null)
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-blue-900">
          <Filter className="h-5 w-5" />
          <span>Date Filter</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Start Date */}
          <div className="flex-1">
            <label className="text-sm font-medium text-blue-800 mb-2 block">Start Date</label>
            <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-blue-300 bg-white",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate || undefined}
                  onSelect={handleStartDateSelect}
                  initialFocus
                  disabled={(date) => endDate ? date > endDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="flex-1">
            <label className="text-sm font-medium text-blue-800 mb-2 block">End Date</label>
            <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-blue-300 bg-white",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate || undefined}
                  onSelect={handleEndDateSelect}
                  initialFocus
                  disabled={(date) => startDate ? date < startDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-blue-800">Quick Filters</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(7)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Last 7 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(30)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Last 30 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(90)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Last 90 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(365)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Last year
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Clear Filters
          </Button>
        </div>

        {/* Current Filter Display */}
        {(startDate || endDate) && (
          <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Current Filter:</span>{" "}
              {startDate && endDate
                ? `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`
                : startDate
                ? `From ${format(startDate, "MMM dd, yyyy")}`
                : `Until ${format(endDate!, "MMM dd, yyyy")}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
