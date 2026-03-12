import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/request'

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const auth = requireRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const event = await db.event.findUnique({
      where: { id: params.eventId },
      select: { createdById: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (auth.role !== 'SUPER_ADMIN' && event.createdById !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const participants = await db.participant.findMany({
      where: { eventId: params.eventId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, participants })
  } catch (error) {
    console.error('GET_EVENT_PARTICIPANTS_ERROR', error)
    return NextResponse.json({ error: 'Failed to load participants' }, { status: 500 })
  }
}
