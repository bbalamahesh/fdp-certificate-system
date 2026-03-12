import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/request'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ['SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const events = await db.event.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error('GET_PENDING_EVENTS_ERROR', error)
    return NextResponse.json({ error: 'Failed to load pending events' }, { status: 500 })
  }
}
