/**
 * Database table checker - verifies if required tables exist and have expected columns
 */

import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

interface TableColumn {
  column_name: string
  data_type: string
  is_nullable: string
}

interface TableInfo {
  exists: boolean
  columns: TableColumn[]
  expectedColumns: string[]
  missingColumns: string[]
}

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(
      sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = ${tableName}
      )`
    )
    return result.rows[0]?.exists === true
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

export async function getTableColumns(tableName: string): Promise<TableColumn[]> {
  try {
    const result = await db.execute(
      sql`SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = ${tableName} 
          ORDER BY ordinal_position`
    )
    return result.rows as TableColumn[]
  } catch (error) {
    console.error(`Error getting columns for table ${tableName}:`, error)
    return []
  }
}

export async function checkTableSchema(tableName: string, expectedColumns: string[]): Promise<TableInfo> {
  const exists = await checkTableExists(tableName)
  
  if (!exists) {
    return {
      exists: false,
      columns: [],
      expectedColumns,
      missingColumns: expectedColumns
    }
  }

  const columns = await getTableColumns(tableName)
  const existingColumnNames = columns.map(col => col.column_name)
  const missingColumns = expectedColumns.filter(col => !existingColumnNames.includes(col))

  return {
    exists: true,
    columns,
    expectedColumns,
    missingColumns
  }
}

export async function checkBatchesTable(): Promise<TableInfo> {
  const expectedColumns = [
    'id',
    'batch_number', 
    'tpa_id',
    'facility_id',
    'batch_type',
    'week_start_date',
    'week_end_date',
    'status',
    'total_claims',
    'completed_claims',
    'created_at',
    'updated_at'
  ]
  
  return await checkTableSchema('batches', expectedColumns)
}

export async function checkClaimsTable(): Promise<TableInfo> {
  const expectedColumns = [
    'id',
    'facility_id',
    'tpa_id',
    'unique_claim_id',
    'beneficiary_name',
    'status',
    'created_at'
  ]
  
  return await checkTableSchema('claims', expectedColumns)
}