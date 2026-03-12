import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/request'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ['SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        actor: {
          select: {
            username: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, logs })
  } catch (error) {
    console.error('GET_AUDIT_ERROR', error)
    return NextResponse.json({ error: 'Failed to load audit logs' }, { status: 500 })
  }
}
