import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/request'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const events = await db.event.findMany({
      where:
        auth.role === 'SUPER_ADMIN'
          ? undefined
          : {
              createdById: auth.userId,
            },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error('GET_ADMIN_EVENTS_ERROR', error)
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
  }
}
