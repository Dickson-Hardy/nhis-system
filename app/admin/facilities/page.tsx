"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Edit, Trash2, Building, Users, Phone, Mail, MapPin, Loader2 } from "lucide-react"

interface Facility {
  id: number
  name: string
  code: string
  state: string
  address: string | null
  contactEmail: string | null
  contactPhone: string | null
  isActive: boolean
  createdAt: string
  userCount: number
  tpa: {
    id: number
    name: string
    code: string
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface TPA {
  id: number
  name: string
  code: string
}

export default function FacilitiesManagement() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [tpas, setTpas] = useState<TPA[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [tpaFilter, setTpaFilter] = useState("")
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    state: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    tpaId: "",
  })

  // Nigerian states
  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
    "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
    "Yobe", "Zamfara"
  ]

  const fetchFacilities = async (page = 1, search = "", tpaId = "") => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search.trim()) {
        params.append("search", search.trim())
      }

      if (tpaId) {
        params.append("tpaId", tpaId)
      }

      const response = await fetch(`/api/admin/facilities?${params}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch facilities: ${response.statusText}`)
      }

      const data = await response.json()
      setFacilities(data.facilities || [])
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch facilities")
      console.error("Error fetching facilities:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTPAs = async () => {
    try {
      const response = await fetch("/api/admin/tpas?limit=100", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setTpas(data.tpas || [])
      }
    } catch (err) {
      console.error("Error fetching TPAs:", err)
    }
  }

  const createFacility = async () => {
    try {
      setIsCreating(true)
      setError(null)

      const requestData = {
        ...formData,
        tpaId: formData.tpaId ? parseInt(formData.tpaId) : null,
      }

      const response = await fetch("/api/admin/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create facility: ${response.statusText}`)
      }

      setIsCreateOpen(false)
      setFormData({ 
        name: "", 
        code: "", 
        state: "", 
        address: "", 
        contactEmail: "", 
        contactPhone: "", 
        tpaId: "" 
      })
      await fetchFacilities(pagination.page, searchTerm, tpaFilter)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create facility")
    } finally {
      setIsCreating(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    fetchFacilities(1, value, tpaFilter)
  }

  const handleTpaFilter = (value: string) => {
    setTpaFilter(value)
    fetchFacilities(1, searchTerm, value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  useEffect(() => {
    fetchFacilities()
    fetchTPAs()
  }, [])

  if (loading && facilities.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading facilities...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facilities Management</h1>
          <p className="text-muted-foreground">Manage healthcare facilities</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Facility
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Facility</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Facility Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter facility name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Facility Code *</Label>
                <Input
                  id="code"
                  placeholder="Enter facility code (e.g., FAC-001)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(value) => 
                  setFormData({ ...formData, state: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigerianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tpa">Assigned TPA</Label>
                <Select value={formData.tpaId} onValueChange={(value) => 
                  setFormData({ ...formData, tpaId: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select TPA (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No TPA</SelectItem>
                    {tpas.map((tpa) => (
                      <SelectItem key={tpa.id} value={tpa.id.toString()}>
                        {tpa.name} ({tpa.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter facility address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter contact email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter contact phone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createFacility}
                  disabled={!formData.name.trim() || !formData.code.trim() || !formData.state || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Facility"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search facilities..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select value={tpaFilter} onValueChange={handleTpaFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by TPA" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All TPAs</SelectItem>
            {tpas.map((tpa) => (
              <SelectItem key={tpa.id} value={tpa.id.toString()}>
                {tpa.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Facilities ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facility Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>TPA</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No facilities found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                facilities.map((facility) => (
                  <TableRow key={facility.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{facility.name}</p>
                        <Badge variant="outline" className="mt-1">{facility.code}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {facility.state}
                        </p>
                        {facility.address && (
                          <p className="text-sm text-muted-foreground">{facility.address}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {facility.tpa ? (
                        <div>
                          <p className="font-medium">{facility.tpa.name}</p>
                          <p className="text-sm text-muted-foreground">{facility.tpa.code}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No TPA assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {facility.contactEmail && (
                          <p className="text-sm flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {facility.contactEmail}
                          </p>
                        )}
                        {facility.contactPhone && (
                          <p className="text-sm flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {facility.contactPhone}
                          </p>
                        )}
                        {!facility.contactEmail && !facility.contactPhone && (
                          <span className="text-sm text-muted-foreground">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {facility.userCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={facility.isActive ? "default" : "secondary"}>
                        {facility.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(facility.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchFacilities(pagination.page - 1, searchTerm, tpaFilter)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchFacilities(pagination.page + 1, searchTerm, tpaFilter)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}