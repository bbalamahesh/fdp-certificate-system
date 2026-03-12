import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'
const EXPIRY = '24h'

export type AuthTokenPayload = {
  userId: string
  username: string
  role: UserRole
}

export function signAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRY })
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload
  } catch {
    return null
  }
}
