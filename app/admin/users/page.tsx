"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users,
  UserCheck,
  UserX,
  Shield,
  Building2,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Download,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle
} from "lucide-react"

interface User {
  id: number
  email: string
  role: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  tpa: {
    id: number
    name: string
    code: string
  } | null
  facility: {
    id: number
    name: string
    code: string
    state: string
  } | null
}

interface UsersStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  tpaUsers: number
  facilityUsers: number
  adminUsers: number
}

interface TPA {
  id: number
  name: string
  code: string
}

interface Facility {
  id: number
  name: string
  code: string
  state: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [statistics, setStatistics] = useState<UsersStats | null>(null)
  const [tpas, setTpas] = useState<TPA[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [useTemporaryPassword, setUseTemporaryPassword] = useState(true)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
    name: "",
    tpaId: "",
    facilityId: "",
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const fetchUsers = async (page = 1, search = "", role = "", status = "") => {
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
      if (role && role !== "all") {
        params.append("role", role)
      }
      if (status && status !== "all") {
        params.append("status", status)
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      const data = await response.json()
      setUsers(data.users || [])
      setStatistics(data.statistics)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users")
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTpasAndFacilities = async () => {
    try {
      const [tpasResponse, facilitiesResponse] = await Promise.all([
        fetch("/api/admin/tpas", { credentials: "include" }),
        fetch("/api/admin/facilities", { credentials: "include" })
      ])

      if (tpasResponse.ok) {
        const tpasData = await tpasResponse.json()
        setTpas(tpasData.tpas || [])
      }

      if (facilitiesResponse.ok) {
        const facilitiesData = await facilitiesResponse.json()
        setFacilities(facilitiesData.facilities || [])
      }
    } catch (err) {
      console.error("Error fetching TPAs and facilities:", err)
    }
  }

  const handleCreateUser = async () => {
    try {
      setIsProcessing(true)
      setError(null)

      const requestBody: any = {
        email: formData.email,
        role: formData.role,
        name: formData.name,
        useTemporaryPassword,
      }

      if (!useTemporaryPassword) {
        requestBody.password = formData.password
      }

      if (formData.role === "tpa" && formData.tpaId) {
        requestBody.tpaId = parseInt(formData.tpaId)
      }

      if (formData.role === "facility" && formData.facilityId) {
        requestBody.facilityId = parseInt(formData.facilityId)
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create user: ${response.statusText}`)
      }

      setIsCreateOpen(false)
      setFormData({ email: "", password: "", role: "", name: "", tpaId: "", facilityId: "" })
      await fetchUsers(pagination.page, searchTerm, roleFilter === "all" ? "" : roleFilter, statusFilter === "all" ? "" : statusFilter)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return

    try {
      setIsProcessing(true)
      setError(null)

      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userIds: selectedUsers,
          action,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to ${action} users: ${response.statusText}`)
      }

      setSelectedUsers([])
      await fetchUsers(pagination.page, searchTerm, roleFilter === "all" ? "" : roleFilter, statusFilter === "all" ? "" : statusFilter)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} users`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "nhis_admin":
        return "bg-purple-100 text-purple-800"
      case "tpa":
        return "bg-blue-100 text-blue-800"
      case "facility":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "nhis_admin":
        return <Shield className="h-3 w-3" />
      case "tpa":
        return <Building2 className="h-3 w-3" />
      case "facility":
        return <Users className="h-3 w-3" />
      default:
        return <Users className="h-3 w-3" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  useEffect(() => {
    fetchUsers(1, "", "", "")
    fetchTpasAndFacilities()
  }, [])

  if (loading && users.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage system users and access permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="useTemporaryPassword"
                      checked={useTemporaryPassword}
                      onCheckedChange={(checked) => setUseTemporaryPassword(checked as boolean)}
                    />
                    <Label htmlFor="useTemporaryPassword" className="text-sm">
                      Generate temporary password (recommended)
                    </Label>
                  </div>
                  <p className="text-xs text-gray-600">
                    {useTemporaryPassword 
                      ? "A secure temporary password will be generated and sent via email. User must change it on first login."
                      : "User will use the password you specify below."
                    }
                  </p>
                </div>
                {!useTemporaryPassword && (
                  <div>
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Enter password"
                        required={!useTemporaryPassword}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value, tpaId: "", facilityId: ""})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nhis_admin">NHIS Administrator</SelectItem>
                      <SelectItem value="tpa">TPA User</SelectItem>
                      <SelectItem value="facility">Facility User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === "tpa" && (
                  <div>
                    <Label>TPA</Label>
                    <Select value={formData.tpaId} onValueChange={(value) => setFormData({...formData, tpaId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select TPA" />
                      </SelectTrigger>
                      <SelectContent>
                        {tpas.map((tpa) => (
                          <SelectItem key={tpa.id} value={tpa.id.toString()}>
                            {tpa.name} ({tpa.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.role === "facility" && (
                  <div>
                    <Label>Facility</Label>
                    <Select value={formData.facilityId} onValueChange={(value) => setFormData({...formData, facilityId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select facility" />
                      </SelectTrigger>
                      <SelectContent>
                        {facilities.map((facility) => (
                          <SelectItem key={facility.id} value={facility.id.toString()}>
                            {facility.name} ({facility.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      "Create User"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* User Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.activeUsers} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.adminUsers}</div>
              <p className="text-xs text-muted-foreground">
                NHIS Administrators
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TPA Users</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.tpaUsers}</div>
              <p className="text-xs text-muted-foreground">
                Third Party Administrators
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facility Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.facilityUsers}</div>
              <p className="text-xs text-muted-foreground">
                Healthcare Facilities
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4 flex-1">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              fetchUsers(1, e.target.value, roleFilter === "all" ? "" : roleFilter, statusFilter === "all" ? "" : statusFilter)
            }}
            className="max-w-sm"
          />
          <Select value={roleFilter} onValueChange={(value) => {
            setRoleFilter(value)
            fetchUsers(1, searchTerm, value === "all" ? "" : value, statusFilter === "all" ? "" : statusFilter)
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="nhis_admin">NHIS Admin</SelectItem>
              <SelectItem value="tpa">TPA User</SelectItem>
              <SelectItem value="facility">Facility User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value)
            fetchUsers(1, searchTerm, roleFilter === "all" ? "" : roleFilter, value === "all" ? "" : value)
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {selectedUsers.length > 0 && (
          <div className="flex space-x-2">
            <Button
              onClick={() => handleBulkAction("activate")}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Activate ({selectedUsers.length})
            </Button>
            <Button
              onClick={() => handleBulkAction("deactivate")}
              disabled={isProcessing}
              variant="destructive"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Deactivate ({selectedUsers.length})
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>User Details</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No users found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(user.role)}
                          <span>
                            {user.role === "nhis_admin" ? "NHIS Admin" : 
                             user.role === "tpa" ? "TPA User" : "Facility User"}
                          </span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.tpa && (
                        <div>
                          <p className="font-medium">{user.tpa.name}</p>
                          <p className="text-sm text-muted-foreground">{user.tpa.code}</p>
                        </div>
                      )}
                      {user.facility && (
                        <div>
                          <p className="font-medium">{user.facility.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.facility.code} • {user.facility.state}
                          </p>
                        </div>
                      )}
                      {!user.tpa && !user.facility && user.role === "nhis_admin" && (
                        <p className="text-sm text-muted-foreground">NHIS Administration</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setIsEditOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction("deactivate")}
                        >
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
                  onClick={() => fetchUsers(pagination.page - 1, searchTerm, roleFilter === "all" ? "" : roleFilter, statusFilter === "all" ? "" : statusFilter)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1, searchTerm, roleFilter === "all" ? "" : roleFilter, statusFilter === "all" ? "" : statusFilter)}
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