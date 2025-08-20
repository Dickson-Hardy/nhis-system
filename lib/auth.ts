import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { db } from "./db"
import { users } from "./db/schema"
import { eq } from "drizzle-orm"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  id: number
  email: string
  name: string
  role: "tpa" | "facility" | "nhis_admin"
  tpaId?: number | null
  facilityId?: number | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tpaId: user.tpaId,
      facilityId: user.facilityId,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User
    return decoded
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) return null

  const user = verifyToken(token)
  if (!user) return null

  // Verify user still exists in database and get fresh data
  const dbUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
  if (dbUser.length === 0 || !dbUser[0].isActive) return null

  // Return fresh user data from database to ensure tpaId/facilityId are current
  return {
    id: dbUser[0].id,
    email: dbUser[0].email,
    name: dbUser[0].name,
    role: dbUser[0].role as "tpa" | "facility" | "nhis_admin",
    tpaId: dbUser[0].tpaId,
    facilityId: dbUser[0].facilityId,
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (user.length === 0 || !user[0].isActive) return null

  const isValid = await verifyPassword(password, user[0].password)
  if (!isValid) return null

  return {
    id: user[0].id,
    email: user[0].email,
    name: user[0].name,
    role: user[0].role as "tpa" | "facility" | "nhis_admin",
    tpaId: user[0].tpaId,
    facilityId: user[0].facilityId,
  }
}
