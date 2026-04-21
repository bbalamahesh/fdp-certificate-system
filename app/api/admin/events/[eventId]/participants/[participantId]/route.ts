import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/request'

const updateParticipantSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  mobileNo: z.string().min(8),
  whatsappNo: z.string().optional().or(z.literal('')),
  instituteName: z.string().optional().or(z.literal('')),
  roleLabel: z.string().optional().or(z.literal('')),
})

async function getAuthorizedEvent(
  eventId: string,
  userId: string,
  role: 'ADMIN' | 'SUPER_ADMIN'
) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, createdById: true },
  })

  if (!event) {
    return { error: NextResponse.json({ error: 'Event not found' }, { status: 404 }) }
  }

  if (role !== 'SUPER_ADMIN' && event.createdById !== userId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { event }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string; participantId: string } }
) {
  const auth = requireRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const access = await getAuthorizedEvent(params.eventId, auth.userId, auth.role)
    if ('error' in access) return access.error

    const parsed = updateParticipantSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const participant = await db.participant.findUnique({
      where: { id: params.participantId },
      select: { id: true, eventId: true },
    })

    if (!participant || participant.eventId !== params.eventId) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    const updated = await db.participant.update({
      where: { id: params.participantId },
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        mobileNo: parsed.data.mobileNo,
        whatsappNo: parsed.data.whatsappNo || null,
        instituteName: parsed.data.instituteName || null,
        roleLabel: parsed.data.roleLabel || null,
      },
    })

    return NextResponse.json({ success: true, participant: updated })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Participant email already exists for this event' },
        { status: 409 }
      )
    }

    console.error('PATCH_EVENT_PARTICIPANT_ERROR', error)
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string; participantId: string } }
) {
  const auth = requireRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const access = await getAuthorizedEvent(params.eventId, auth.userId, auth.role)
    if ('error' in access) return access.error

    const participant = await db.participant.findUnique({
      where: { id: params.participantId },
      select: { id: true, eventId: true },
    })

    if (!participant || participant.eventId !== params.eventId) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    await db.participant.delete({
      where: { id: params.participantId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE_EVENT_PARTICIPANT_ERROR', error)
    return NextResponse.json({ error: 'Failed to delete participant' }, { status: 500 })
  }
}
