import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { slugifyEventName, uniqueEventSlug } from '@/lib/events'
import { requireRole } from '@/lib/auth/request'
import { logAuditDb } from '@/lib/audit/logAuditDb'

const createEventSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(1),
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
})

export async function GET() {
  try {
    const events = await db.event.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ fromDate: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        mode: true,
        fromDate: true,
        toDate: true,
        posterUrl: true,
        meetingLink: true,
        organizerInstitute: true,
      },
    })

    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error('GET_EVENTS_ERROR', error)
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (auth instanceof NextResponse) return auth

  try {
    const parsed = createEventSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const payload = parsed.data
    const baseSlug = slugifyEventName(payload.eventName)
    const slug = uniqueEventSlug(baseSlug)

    const event = await db.event.create({
      data: {
        slug,
        name: payload.eventName,
        mode: payload.mode,
        fromDate: new Date(payload.fromDate),
        toDate: new Date(payload.toDate),
        posterUrl: payload.eventPoster || null,
        meetingLink: payload.meetingLink || null,
        contactEmail: payload.contactEmail,
        contactMobile: payload.contactMobile,
        organizerFirstName: payload.firstName,
        organizerLastName: payload.lastName,
        organizerInstitute: payload.instituteName || null,
        organizerDepartment: payload.department || null,
        organizerAddress: payload.address || null,
        createdById: auth.userId,
        status: auth.role === 'SUPER_ADMIN' ? 'APPROVED' : 'PENDING',
        approvedAt: auth.role === 'SUPER_ADMIN' ? new Date() : null,
        approvedById: auth.role === 'SUPER_ADMIN' ? auth.userId : null,
      },
      select: { id: true, slug: true, status: true },
    })

    await logAuditDb({
      action: 'EVENT_CREATED',
      targetType: 'Event',
      targetId: event.id,
      actorId: auth.userId,
      metadata: { slug: event.slug },
    })

    return NextResponse.json({ success: true, event }, { status: 201 })
  } catch (error) {
    console.error('CREATE_EVENT_ERROR', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
