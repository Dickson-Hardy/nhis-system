// Utility functions for Excel parsing and validation

export interface ExcelColumnMapping {
  [key: string]: string
}

export const REQUIRED_COLUMNS: ExcelColumnMapping = {
  "S/N": "serialNumber",
  "Unique Beneficiary ID": "uniqueBeneficiaryId",
  "Unique Claim ID": "uniqueClaimId",
  "TPA Name": "tpaName",
  "Facility Name": "facilityName",
  "Facility State": "facilityState",
  "Facility Code": "facilityCode",
  "Batch Number": "batchNumber",
  "Hospital Number": "hospitalNumber",
  "Date of Admission (DD/MM/YYYY)": "dateOfAdmission",
  "Name of beneficiary": "beneficiaryName",
  "DOB (DD/MM/YYYY)": "dateOfBirth",
  Age: "age",
  Address: "address",
  "Phone Number": "phoneNumber",
  NIN: "nin",
  "Date of Treatment/Procedure": "dateOfTreatment",
  "Date of Discharge": "dateOfDischarge",
  "Primary Diagnosis": "primaryDiagnosis",
  "Secondary Diagnosis": "secondaryDiagnosis",
  "Treatment/ Procedure": "treatmentProcedure",
  Quantity: "quantity",
  Cost: "cost",
  "Date of claim submission (DD/MM/YY)": "dateOfClaimSubmission",
  "Month of Submission (Automatically generated)": "monthOfSubmission",
  "Cost of Investigation": "costOfInvestigation",
  "Cost of Procedure": "costOfProcedure",
  "Cost of Medication": "costOfMedication",
  "Cost of other services (e.g., bed)": "costOfOtherServices",
  "Total Cost of Care": "totalCostOfCare",
  "Approved Cost of Care": "approvedCostOfCare",
  Decision: "decision",
  "Reason for Rejection (If applicable)": "reasonForRejection",
  "Date of claims payment": "dateOfClaimsPayment",
  "TPA Remarks": "tpaRemarks",
}

export const REQUIRED_FIELDS = [
  "uniqueBeneficiaryId",
  "uniqueClaimId",
  "tpaName",
  "facilityName",
  "beneficiaryName",
  "dateOfAdmission",
  "primaryDiagnosis",
  "treatmentProcedure",
  "totalCostOfCare",
]

export function validateRow(row: any): string[] {
  const errors: string[] = []

  // Check required fields
  REQUIRED_FIELDS.forEach((field) => {
    if (!row[field] || row[field].toString().trim() === "") {
      errors.push(`Missing required field: ${field}`)
    }
  })

  // Validate date formats
  const dateFields = ["dateOfAdmission", "dateOfBirth", "dateOfTreatment", "dateOfDischarge"]
  dateFields.forEach((field) => {
    if (row[field] && !isValidDate(row[field])) {
      errors.push(`Invalid date format for ${field}`)
    }
  })

  // Validate numeric fields
  const numericFields = [
    "age",
    "cost",
    "costOfInvestigation",
    "costOfProcedure",
    "costOfMedication",
    "costOfOtherServices",
    "totalCostOfCare",
  ]
  numericFields.forEach((field) => {
    if (row[field] && isNaN(Number(row[field]))) {
      errors.push(`Invalid numeric value for ${field}`)
    }
  })

  // Validate phone number format
  if (row.phoneNumber && !isValidPhoneNumber(row.phoneNumber)) {
    errors.push("Invalid phone number format")
  }

  // Validate NIN format (11 digits)
  if (row.nin && !/^\d{11}$/.test(row.nin)) {
    errors.push("Invalid NIN format (must be 11 digits)")
  }

  return errors
}

function isValidDate(dateString: string): boolean {
  // Check for DD/MM/YYYY format
  const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/
  if (!dateRegex.test(dateString)) return false

  const [day, month, year] = dateString.split("/").map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function isValidPhoneNumber(phone: string): boolean {
  // Nigerian phone number format
  const phoneRegex = /^(\+234|0)[789]\d{9}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export function generateExcelTemplate(): void {
  // In a real implementation, this would generate and download an Excel template
  // with all the required columns and sample data
  console.log("Generating Excel template with required columns...")
}
