import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/request'
import { logAuditDb } from '@/lib/audit/logAuditDb'

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const auth = requireRole(req, ['SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const event = await db.event.update({
      where: { id: params.eventId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: auth.userId,
      },
      select: {
        id: true,
        slug: true,
        status: true,
      },
    })

    await logAuditDb({
      action: 'EVENT_APPROVED',
      targetType: 'Event',
      targetId: event.id,
      actorId: auth.userId,
      metadata: { slug: event.slug },
    })

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('APPROVE_EVENT_ERROR', error)
    return NextResponse.json({ error: 'Failed to approve event' }, { status: 500 })
  }
}
