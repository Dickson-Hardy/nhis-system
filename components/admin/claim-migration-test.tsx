"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, PlayCircle, Database, AlertTriangle } from "lucide-react"

interface MigrationResult {
  success: boolean
  type: 'test' | 'migration'
  facilityId?: string
  totalClaims?: number
  migratedClaims?: number
  skippedClaims?: number
  errors?: string[]
  sampleResults?: Array<{
    claimId: string
    originalText: string
    itemCount: number
    totalAmount: number
    categories: {
      procedures: number
      medications: number
      investigations: number
    }
  }>
}

export default function ClaimMigrationTest() {
  const [facilityId, setFacilityId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState("")

  const runTest = async () => {
    if (!facilityId.trim()) {
      setError("Please enter a facility ID")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/claims/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "test",
          facilityId: facilityId.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Migration test failed")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const runMigration = async () => {
    if (!facilityId.trim()) {
      setError("Please enter a facility ID")
      return
    }

    if (!confirm("Are you sure you want to migrate all claims for this facility? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/claims/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "migrate_facility",
          facilityId: facilityId.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Migration failed")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Claim Migration Tool
          </CardTitle>
          <CardDescription>
            Test and migrate claims from text format to itemized format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facilityId">Facility ID</Label>
            <Input
              id="facilityId"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              placeholder="Enter facility ID to migrate"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={runTest}
              disabled={isLoading || !facilityId.trim()}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Test Migration
            </Button>
            <Button
              onClick={runMigration}
              disabled={isLoading || !facilityId.trim()}
              variant="default"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Run Migration
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.type === 'test' ? (
                <>
                  <PlayCircle className="h-5 w-5" />
                  Test Results
                </>
              ) : (
                <>
                  <Database className="h-5 w-5" />
                  Migration Results
                </>
              )}
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Total Claims</div>
                <div className="text-2xl font-bold">{result.totalClaims || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Migrated</div>
                <div className="text-2xl font-bold text-green-600">{result.migratedClaims || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Skipped</div>
                <div className="text-2xl font-bold text-yellow-600">{result.skippedClaims || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Errors</div>
                <div className="text-2xl font-bold text-red-600">{result.errors?.length || 0}</div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Errors:</h4>
                <div className="space-y-1">
                  {result.errors.map((error, index) => (
                    <Alert key={index} variant="destructive" className="text-sm">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {result.sampleResults && result.sampleResults.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Sample Parsed Claims:</h4>
                <div className="space-y-3">
                  {result.sampleResults.map((sample, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="text-sm font-medium">Claim ID: {sample.claimId}</div>
                            <Badge variant="outline">₦{sample.totalAmount.toLocaleString()}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {sample.originalText}
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span>Items: <strong>{sample.itemCount}</strong></span>
                            <span>Procedures: <strong>{sample.categories.procedures}</strong></span>
                            <span>Medications: <strong>{sample.categories.medications}</strong></span>
                            <span>Investigations: <strong>{sample.categories.investigations}</strong></span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}