"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Users,
  Activity,
  AlertCircle,
  Loader2,
  Download,
  Building2,
  Hospital,
  HeartHandshake,
  FileText,
} from "lucide-react"

interface Facility {
  id: number
  name: string
  code: string
  state: string
  address: string
  contactEmail: string
  contactPhone: string
  isActive: boolean
  createdAt: string
  tpa: {
    id: number
    name: string
    code: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function TPAFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const states = [
    "Lagos", "Abuja", "Kano", "Rivers", "Oyo", "Kaduna", "Ogun", "Imo", "Plateau",
    "Delta", "Edo", "Enugu", "Akwa Ibom", "Anambra", "Ondo", "Kwara", "Borno",
    "Cross River", "Osun", "Bauchi", "Sokoto", "Katsina", "Niger", "Jigawa",
    "Adamawa", "Gombe", "Yobe", "Taraba", "Kebbi", "Zamfara", "Kogi", "Nasarawa",
    "Abia", "Ebonyi", "Ekiti", "Bayelsa"
  ]

  const fetchFacilities = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (searchTerm) params.append("search", searchTerm)
      if (selectedState) params.append("state", selectedState)
      if (selectedStatus) params.append("isActive", selectedStatus)

      const response = await fetch(`/api/facilities?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch facilities")
      }

      setFacilities(data.facilities)
      setPagination(data.pagination)
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFacilities()
  }, [pagination.page, pagination.limit])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchFacilities()
  }

  const handleViewFacility = (facility: Facility) => {
    setSelectedFacility(facility)
    setIsViewOpen(true)
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  if (loading && facilities.length === 0) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Loading Header */}
        <div className="bg-gradient-to-br from-[#104D7F] to-[#0d3f6b] rounded-2xl h-40 shadow-xl"></div>
        
        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-32 shadow-md"></div>
          ))}
        </div>
        
        {/* Loading Content */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-96 shadow-md"></div>
        
        {/* Loading Indicator */}
        <div className="flex items-center justify-center py-16">
          <div className="relative">
            <div className="w-20 h-20 border-6 border-[#104D7F]/20 border-t-[#104D7F] rounded-full animate-spin shadow-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-[#104D7F] rounded-full flex items-center justify-center shadow-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="ml-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading Healthcare Facilities</h3>
            <p className="text-lg text-gray-600">Fetching facility data...</p>
          </div>
        </div>
      </div>
    )
  }

  const activeFacilities = facilities.filter(f => f.isActive).length
  const inactiveFacilities = facilities.filter(f => !f.isActive).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#104D7F] via-[#0d3f6b] to-[#003C06] rounded-2xl border-0 p-8 md:p-10 shadow-2xl text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-8 lg:space-y-0">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <Building className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-5xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">Healthcare Facilities</h1>
                <p className="text-xl text-blue-100 font-medium drop-shadow-md">
                  Manage and monitor healthcare facility partnerships
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-white font-semibold drop-shadow-md">System Online</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                <Activity className="h-5 w-5 text-blue-200" />
                <span className="text-white font-medium drop-shadow-md">Real-time Updates</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border border-white/30">
                <Hospital className="h-12 w-12 text-white drop-shadow-lg" />
              </div>
            </div>
            <div className="flex flex-col space-y-4">
              <Button variant="outline" size="lg" className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm h-12 px-6 drop-shadow-md">
                <Download className="h-5 w-5 mr-3" />
                Export Facilities
              </Button>
              <Button className="bg-white text-[#104D7F] hover:bg-gray-100 shadow-xl h-12 px-6 font-semibold" onClick={fetchFacilities}>
                <Building className="h-5 w-5 mr-3" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 shadow-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-blue-800">Total Facilities</CardTitle>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-blue-700">
              <Building className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-900 mb-2">{pagination.total}</div>
            <p className="text-sm text-blue-700 font-medium">Registered facilities</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-green-800">Active Facilities</CardTitle>
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-green-700">
              <CheckCircle className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900 mb-2">{activeFacilities}</div>
            <p className="text-sm text-green-700 font-medium">Currently operational</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-bold text-gray-800">Inactive Facilities</CardTitle>
            <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-gray-700">
              <XCircle className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900 mb-2">{inactiveFacilities}</div>
            <p className="text-sm text-gray-700 font-medium">Currently inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-xl border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Search className="h-5 w-5 mr-2 text-[#104D7F]" />
            Search & Filter Facilities
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search by name, code, or address..." 
                className="pl-12 h-12 text-lg border-2 border-gray-300 focus:border-[#104D7F] focus:ring-[#104D7F]" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="h-12 text-lg border-2 border-gray-300 focus:border-[#104D7F] focus:ring-[#104D7F]">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-12 text-lg border-2 border-gray-300 focus:border-[#104D7F] focus:ring-[#104D7F]">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleSearch} 
              className="bg-[#104D7F] hover:bg-[#0d3f6b] shadow-lg h-12 px-6 font-semibold transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Search className="h-5 w-5 mr-2" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Facilities List */}
      <Card className="shadow-xl border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#104D7F] rounded-xl flex items-center justify-center shadow-lg border-2 border-[#0d3f6b]">
                <Building className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Healthcare Facilities</CardTitle>
                <p className="text-gray-600">Showing {facilities.length} of {pagination.total} facilities</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {facilities.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Building className="h-20 w-20 mx-auto mb-6 text-gray-400" />
              <p className="text-2xl font-medium mb-2">No facilities found</p>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {facilities.map((facility) => (
                <div
                  key={facility.id}
                  className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-12 h-12 bg-[#104D7F]/10 rounded-xl flex items-center justify-center">
                        <Hospital className="h-6 w-6 text-[#104D7F]" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-bold text-gray-900">{facility.name}</h3>
                          <Badge variant={facility.isActive ? "default" : "secondary"} className="text-sm font-semibold">
                            {facility.isActive ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        <p className="text-lg text-gray-700 font-medium">Code: {facility.code}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{facility.state}</span>
                      </div>
                      {facility.contactPhone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{facility.contactPhone}</span>
                        </div>
                      )}
                      {facility.contactEmail && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{facility.contactEmail}</span>
                        </div>
                      )}
                    </div>
                    
                    {facility.address && (
                      <p className="text-sm text-gray-600 mt-2">{facility.address}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-10 px-4 border-2 border-gray-300 hover:border-[#104D7F] hover:bg-[#104D7F]/5 transition-all duration-200"
                      onClick={() => handleViewFacility(facility)}
                    >
                      <Eye className="h-4 w-4 mr-2 text-gray-600" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-gray-200">
              <p className="text-sm text-gray-600 font-medium">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} facilities
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className="h-10 px-4 border-2 border-gray-300 hover:border-[#104D7F]"
                >
                  Previous
                </Button>
                
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i
                  if (pageNum > pagination.totalPages) return null
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`h-10 px-4 ${pageNum === pagination.page ? 'bg-[#104D7F] hover:bg-[#0d3f6b]' : 'border-2 border-gray-300 hover:border-[#104D7F]'}`}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                  className="h-10 px-4 border-2 border-gray-300 hover:border-[#104D7F]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facility Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-[#104D7F] to-[#0d3f6b] text-white rounded-t-lg -mt-6 -mx-6 p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">Facility Details</DialogTitle>
                <p className="text-blue-100 mt-1">
                  {selectedFacility?.name} • {selectedFacility?.code}
                </p>
              </div>
            </div>
          </DialogHeader>

          {selectedFacility && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-[#104D7F]" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">Facility Name</Label>
                      <p className="text-lg font-bold text-gray-900">{selectedFacility.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">Facility Code</Label>
                      <p className="text-lg font-bold text-gray-900">{selectedFacility.code}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">State</Label>
                      <p className="text-lg font-bold text-gray-900">{selectedFacility.state}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-600">Status</Label>
                      <Badge variant={selectedFacility.isActive ? "default" : "secondary"} className="text-sm font-semibold">
                        {selectedFacility.isActive ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                    {selectedFacility.address && (
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-600">Address</Label>
                        <p className="text-lg font-bold text-gray-900">{selectedFacility.address}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <HeartHandshake className="h-5 w-5 mr-2 text-[#104D7F]" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedFacility.contactEmail && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-600">Email</Label>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <p className="text-lg font-bold text-gray-900">{selectedFacility.contactEmail}</p>
                        </div>
                      </div>
                    )}
                    {selectedFacility.contactPhone && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-600">Phone</Label>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <p className="text-lg font-bold text-gray-900">{selectedFacility.contactPhone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* TPA Information */}
              {selectedFacility.tpa && (
                <Card className="border-2 border-gray-200 shadow-lg">
                  <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-[#104D7F]" />
                      TPA Partnership
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-600">TPA Name</Label>
                        <p className="text-lg font-bold text-gray-900">{selectedFacility.tpa.name}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-600">TPA Code</Label>
                        <p className="text-lg font-bold text-gray-900">{selectedFacility.tpa.code}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Information */}
              <Card className="border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-[#104D7F]" />
                    Registration Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-600">Registration Date</Label>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(selectedFacility.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}