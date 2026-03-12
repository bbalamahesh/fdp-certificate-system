import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sendEventRegistrationEmail } from '@/lib/email/sendEventRegistrationEmail'
import { logAuditDb } from '@/lib/audit/logAuditDb'

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  mobileNo: z.string().min(8),
  whatsappNo: z.string().optional(),
  instituteName: z.string().optional(),
  roleLabel: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const event = await db.event.findUnique({ where: { slug: params.slug } })
    if (!event || event.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const email = parsed.data.email.toLowerCase()

    const existing = await db.participant.findUnique({
      where: {
        eventId_email: {
          eventId: event.id,
          email,
        },
      },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You are already registered for this event.' },
        { status: 409 }
      )
    }

    const participant = await db.participant.create({
      data: {
        eventId: event.id,
        fullName: parsed.data.fullName,
        email,
        mobileNo: parsed.data.mobileNo,
        whatsappNo: parsed.data.whatsappNo || null,
        instituteName: parsed.data.instituteName || null,
        roleLabel: parsed.data.roleLabel || null,
      },
      select: { id: true },
    })

    try {
      await sendEventRegistrationEmail({
        to: email,
        participantName: parsed.data.fullName,
        eventName: event.name,
        fromDate: event.fromDate,
        toDate: event.toDate,
        mode: event.mode,
        contactEmail: event.contactEmail,
        contactMobile: event.contactMobile,
      })
    } catch (mailError) {
      console.error('REG_EMAIL_ERROR', mailError)
    }

    await logAuditDb({
      action: 'PARTICIPANT_REGISTERED',
      targetType: 'Event',
      targetId: event.id,
      metadata: { participantId: participant.id, email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('REGISTER_EVENT_PARTICIPANT_ERROR', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
