import { db } from "./index"

// Retry wrapper for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a connection timeout or network error
      const isRetryableError = 
        error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error.message?.includes('fetch failed') ||
        error.message?.includes('Connect Timeout Error') ||
        error.message?.includes('Error connecting to database')

      if (!isRetryableError || attempt === maxRetries) {
        throw error
      }

      console.log(`Database operation failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError
}

// Helper function to test database connectivity
export async function testConnection(): Promise<boolean> {
  try {
    await db.execute({ sql: 'SELECT 1', args: [] })
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}