"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, MapPin, Phone, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Facility {
  id: number
  name: string
  code: string
  state: string
  address: string
  contactEmail?: string
  contactPhone?: string
}

interface FacilitySelectorProps {
  selectedFacilityId?: number
  onSelect: (facilityId: number) => void
  onCreateNew?: (facility: Facility) => void
  className?: string
  placeholder?: string
}

export default function FacilitySelector({
  selectedFacilityId,
  onSelect,
  onCreateNew,
  className = "",
  placeholder = "Select a facility..."
}: FacilitySelectorProps) {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFacility, setNewFacility] = useState({
    name: "",
    code: "",
    state: "",
    address: "",
    contactEmail: "",
    contactPhone: ""
  })

  // Fetch facilities on component mount
  useEffect(() => {
    fetchFacilities()
  }, [])

  const fetchFacilities = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/facilities")
      if (response.ok) {
        const data = await response.json()
        setFacilities(data.facilities || [])
      } else {
        console.error("Failed to fetch facilities")
        toast({
          title: "Error",
          description: "Failed to load facilities",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching facilities:", error)
      toast({
        title: "Error",
        description: "Failed to load facilities",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFacility = async () => {
    if (!newFacility.name || !newFacility.code || !newFacility.state) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch("/api/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newFacility)
      })

      if (response.ok) {
        const data = await response.json()
        const createdFacility = data.facility
        
        // Update local state
        setFacilities(prev => [...prev, createdFacility])
        
        // Select the new facility
        onSelect(createdFacility.id)
        
        // Call the optional callback
        if (onCreateNew) {
          onCreateNew(createdFacility)
        }

        // Reset form and close dialog
        setNewFacility({
          name: "",
          code: "",
          state: "",
          address: "",
          contactEmail: "",
          contactPhone: ""
        })
        setShowCreateDialog(false)

        toast({
          title: "Success",
          description: "Facility created successfully"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create facility",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating facility:", error)
      toast({
        title: "Error",
        description: "Failed to create facility",
        variant: "destructive"
      })
    }
  }

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId)

  if (loading) {
    return (
      <div className={`p-4 border rounded-md ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Select 
          value={selectedFacilityId?.toString() || ""} 
          onValueChange={(value) => onSelect(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder}>
              {selectedFacility ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedFacility.name}</span>
                  <Badge variant="secondary">{selectedFacility.code}</Badge>
                </div>
              ) : (
                placeholder
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {facilities.map((facility) => (
              <SelectItem key={facility.id} value={facility.id.toString()}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{facility.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {facility.code} • {facility.state}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Facility</DialogTitle>
              <DialogDescription>
                Add a new healthcare facility to your TPA network.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facility-name">Facility Name *</Label>
                <Input
                  id="facility-name"
                  value={newFacility.name}
                  onChange={(e) => setNewFacility(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Lagos University Teaching Hospital"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facility-code">Facility Code *</Label>
                <Input
                  id="facility-code"
                  value={newFacility.code}
                  onChange={(e) => setNewFacility(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., LUTH"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facility-state">State *</Label>
                <Select 
                  value={newFacility.state} 
                  onValueChange={(value) => setNewFacility(prev => ({ ...prev, state: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lagos">Lagos</SelectItem>
                    <SelectItem value="Abuja">FCT - Abuja</SelectItem>
                    <SelectItem value="Kano">Kano</SelectItem>
                    <SelectItem value="Rivers">Rivers</SelectItem>
                    <SelectItem value="Oyo">Oyo</SelectItem>
                    <SelectItem value="Kaduna">Kaduna</SelectItem>
                    <SelectItem value="Ogun">Ogun</SelectItem>
                    <SelectItem value="Imo">Imo</SelectItem>
                    <SelectItem value="Plateau">Plateau</SelectItem>
                    <SelectItem value="Akwa Ibom">Akwa Ibom</SelectItem>
                    {/* Add more states as needed */}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facility-address">Address</Label>
                <Input
                  id="facility-address"
                  value={newFacility.address}
                  onChange={(e) => setNewFacility(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Full address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facility-email">Contact Email</Label>
                <Input
                  id="facility-email"
                  type="email"
                  value={newFacility.contactEmail}
                  onChange={(e) => setNewFacility(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="contact@facility.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facility-phone">Contact Phone</Label>
                <Input
                  id="facility-phone"
                  value={newFacility.contactPhone}
                  onChange={(e) => setNewFacility(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+234-xxx-xxx-xxxx"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateFacility}
                  className="flex-1"
                >
                  Create Facility
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedFacility && (
        <Card className="mt-2">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{selectedFacility.name}</h4>
                  <Badge variant="secondary">{selectedFacility.code}</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 mt-1">
                  {selectedFacility.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{selectedFacility.address}, {selectedFacility.state}</span>
                    </div>
                  )}
                  {selectedFacility.contactEmail && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{selectedFacility.contactEmail}</span>
                    </div>
                  )}
                  {selectedFacility.contactPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{selectedFacility.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}