import { ExcelUpload } from "@/components/tpa/excel-upload"

export default function UploadPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Upload Claims Data</h1>
        <p className="text-muted-foreground">
          Upload your Excel file containing claims data to automatically import multiple records
        </p>
      </div>
      <ExcelUpload />
    </div>
  )
}
