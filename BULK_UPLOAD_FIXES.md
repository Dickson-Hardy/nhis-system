# Bulk Upload Fixes - NHIS System

## Overview
This document outlines the fixes implemented to resolve the bulk upload errors that were preventing batch creation and claim processing.

## Issues Identified

### 1. Date Parsing Errors
**Error**: `time zone displacement out of range: "+029593-01-01"` (PostgreSQL error code `22009`)

**Root Cause**: The Excel data contained malformed date strings in formats like:
- `+029593-01-01`
- `+045783-01-01`
- `+045996-01-01`

These strings were being interpreted as timezone offsets with invalid year values, causing PostgreSQL to reject them.

**Solution**: Enhanced the `parseDate` function in both `app/api/claims/bulk-upload/route.ts` and `app/api/claims/route.ts` to:
- Detect and skip malformed dates starting with `+` and invalid year values
- Add year validation (1900-2100 range)
- Improve error logging for debugging
- Return `null` for unparseable dates instead of throwing errors

### 2. Number Parsing Errors
**Error**: `invalid input syntax for type integer: "NaN"` (PostgreSQL error code `22P02`)

**Root Cause**: Excel data contained empty or non-numeric values that resulted in `NaN` when parsed with `parseInt()` or `parseFloat()`.

**Solution**: Created safe parsing helper functions:
- `safeParseInt()`: Safely parses integers, returns `null` for invalid values
- `safeParseFloat()`: Safely parses floats, returns `null` for invalid values, converts to string for decimal fields

### 3. Duplicate Facility Code Errors
**Error**: `duplicate key value violates unique constraint "facilities_code_key"` (PostgreSQL error code `23505`)

**Root Cause**: The bulk upload logic was attempting to create new facilities without checking if the facility code already existed.

**Solution**: Enhanced facility creation logic to:
- Check for existing facilities by both name and code
- Generate unique facility codes with timestamps and random strings
- Fall back to existing facilities with similar names if creation fails
- Use default facility ID as last resort

## Files Modified

### 1. `app/api/claims/bulk-upload/route.ts`
- Enhanced `parseDate` function with malformed date detection
- Added `safeParseInt` and `safeParseFloat` helper functions
- Updated all numeric field parsing to use safe functions
- Improved facility creation logic with duplicate handling
- Added better error logging and fallback mechanisms

### 2. `app/api/claims/route.ts`
- Enhanced `parseDate` function (same improvements as bulk upload)
- Added `safeParseInt` and `safeParseFloat` helper functions
- Updated POST endpoint to use safe parsing functions
- Maintained consistency with bulk upload route

## Key Improvements

### 1. Robust Date Parsing
```typescript
// Handle malformed dates that start with + and have invalid year values
if (trimmed.match(/^\+0\d{5}-\d{2}-\d{2}$/)) {
  console.warn(`Skipping malformed date: ${trimmed}`)
  return null
}

// Validate year is reasonable (between 1900 and 2100)
const yearNum = parseInt(year)
if (yearNum < 1900 || yearNum > 2100) {
  console.warn(`Invalid year in date: ${trimmed}`)
  return null
}
```

### 2. Safe Number Parsing
```typescript
function safeParseInt(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null
  
  const trimmed = value.trim()
  const parsed = parseInt(trimmed)
  
  if (isNaN(parsed)) {
    console.warn(`Could not parse integer: ${trimmed}`)
    return null
  }
  
  return parsed
}
```

### 3. Enhanced Facility Handling
```typescript
// Try to find facility by code if provided
if (row.facilityCode) {
  const facilityByCode = await db.select().from(facilities).where(eq(facilities.code, row.facilityCode)).limit(1)
  if (facilityByCode.length > 0) {
    facilityId = facilityByCode[0].id
  }
}

// Generate unique facility codes
code: row.facilityCode || `FAC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

## Benefits

1. **Error Prevention**: Eliminates the most common causes of bulk upload failures
2. **Data Integrity**: Ensures only valid data reaches the database
3. **Better Logging**: Improved error messages for debugging and monitoring
4. **Graceful Degradation**: System continues processing even with some invalid records
5. **Consistency**: Both individual and bulk claim creation use the same parsing logic

## Testing Recommendations

1. **Test with Malformed Data**: Upload Excel files with invalid dates and numbers to verify error handling
2. **Test Facility Creation**: Verify that duplicate facility codes are handled gracefully
3. **Monitor Logs**: Check console output for warning messages about skipped/invalid data
4. **Verify Data Quality**: Ensure that valid claims are still processed correctly

## Future Enhancements

1. **Data Validation**: Add frontend validation to catch issues before upload
2. **Batch Processing**: Implement retry mechanisms for failed claims
3. **Data Cleaning**: Add preprocessing steps to clean Excel data before parsing
4. **Metrics**: Track success/failure rates and common error patterns
