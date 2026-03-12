import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/request'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ['SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const users = await db.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('GET_USERS_ERROR', error)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}
