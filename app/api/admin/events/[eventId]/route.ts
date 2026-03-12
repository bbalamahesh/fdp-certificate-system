import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/request'
import { logAuditDb } from '@/lib/audit/logAuditDb'
import { sendEventUpdateEmail } from '@/lib/email/sendEventUpdateEmail'

const updateSchema = z.object({
  eventName: z.string().min(3),
  mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  eventPoster: z.string().url().optional().or(z.literal('')),
  meetingLink: z.string().url().optional().or(z.literal('')),
  contactEmail: z.string().email(),
  contactMobile: z.string().min(8),
  instituteName: z.string().optional(),
  department: z.string().optional(),
  address: z.string().optional(),
  notifyParticipants: z.boolean().optional(),
})

async function getAuthorizedEvent(eventId: string, userId: string, role: 'ADMIN' | 'SUPER_ADMIN') {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      createdById: true,
      name: true,
      slug: true,
      mode: true,
      fromDate: true,
      toDate: true,
      posterUrl: true,
      meetingLink: true,
      contactEmail: true,
      contactMobile: true,
      organizerInstitute: true,
      organizerDepartment: true,
      organizerAddress: true,
    },
  })

  if (!event) return { error: NextResponse.json({ error: 'Event not found' }, { status: 404 }) }

  if (role !== 'SUPER_ADMIN' && event.createdById !== userId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { event }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const auth = requireRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const access = await getAuthorizedEvent(params.eventId, auth.userId, auth.role)
    if ('error' in access) return access.error

    return NextResponse.json({ success: true, event: access.event })
  } catch (error) {
    console.error('GET_EVENT_BY_ID_ERROR', error)
    return NextResponse.json({ error: 'Failed to load event' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const auth = requireRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const parsed = updateSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const access = await getAuthorizedEvent(params.eventId, auth.userId, auth.role)
    if ('error' in access) return access.error

    const payload = parsed.data

    const event = await db.event.update({
      where: { id: params.eventId },
      data: {
        name: payload.eventName,
        mode: payload.mode,
        fromDate: new Date(payload.fromDate),
        toDate: new Date(payload.toDate),
        posterUrl: payload.eventPoster || null,
        meetingLink: payload.meetingLink || null,
        contactEmail: payload.contactEmail,
        contactMobile: payload.contactMobile,
        organizerInstitute: payload.instituteName || null,
        organizerDepartment: payload.department || null,
        organizerAddress: payload.address || null,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        mode: true,
        fromDate: true,
        toDate: true,
        meetingLink: true,
        contactEmail: true,
        contactMobile: true,
      },
    })

    await logAuditDb({
      action: 'EVENT_UPDATED',
      targetType: 'Event',
      targetId: event.id,
      actorId: auth.userId,
      metadata: {
        slug: event.slug,
        notifyParticipants: !!payload.notifyParticipants,
      },
    })

    if (payload.notifyParticipants) {
      const participants = await db.participant.findMany({
        where: { eventId: event.id },
        select: { email: true, fullName: true },
      })

      await Promise.all(
        participants.map((participant) =>
          sendEventUpdateEmail({
            to: participant.email,
            participantName: participant.fullName,
            eventName: event.name,
            fromDate: event.fromDate,
            toDate: event.toDate,
            mode: event.mode,
            meetingLink: event.meetingLink,
            contactEmail: event.contactEmail,
            contactMobile: event.contactMobile,
          }).catch((error) => {
            console.error('EVENT_UPDATE_MAIL_ERROR', participant.email, error)
          })
        )
      )
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('PATCH_EVENT_ERROR', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const auth = requireRole(req, ['SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const existing = await db.event.findUnique({
      where: { id: params.eventId },
      select: { id: true, slug: true, name: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await db.event.delete({
      where: { id: params.eventId },
    })

    await logAuditDb({
      action: 'EVENT_DELETED',
      targetType: 'Event',
      targetId: existing.id,
      actorId: auth.userId,
      metadata: {
        slug: existing.slug,
        name: existing.name,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE_EVENT_ERROR', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
