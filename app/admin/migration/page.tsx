import ClaimMigrationTest from "@/components/admin/claim-migration-test"

export default function MigrationPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Data Migration</h1>
          <p className="text-gray-600 mt-2">
            Migrate legacy claim data to the new itemized format
          </p>
        </div>
        
        <ClaimMigrationTest />
      </div>
    </div>
  )
}