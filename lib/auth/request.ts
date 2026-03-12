import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { verifyAuthToken, type AuthTokenPayload } from './jwt'

export function getTokenFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length)
  }

  const cookieToken = req.cookies.get('adminToken')?.value
  return cookieToken || null
}

export function getAuthFromRequest(req: NextRequest): AuthTokenPayload | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice('Bearer '.length)
    const bearerAuth = verifyAuthToken(bearerToken)
    if (bearerAuth) return bearerAuth
  }

  const cookieToken = req.cookies.get('adminToken')?.value
  if (!cookieToken) return null
  return verifyAuthToken(cookieToken)
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function requireAuth(req: NextRequest): AuthTokenPayload | NextResponse {
  const auth = getAuthFromRequest(req)
  if (!auth) return unauthorized()
  return auth
}

export function requireRole(
  req: NextRequest,
  roles: UserRole[]
): AuthTokenPayload | NextResponse {
  const auth = getAuthFromRequest(req)
  if (!auth) return unauthorized()
  if (!roles.includes(auth.role)) return forbidden()
  return auth
}
