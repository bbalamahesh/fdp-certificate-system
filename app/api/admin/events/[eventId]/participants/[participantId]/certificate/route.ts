import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import QRCode from 'qrcode'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth/request'
import { renderCertificate } from '@/lib/certificates/renderCertificate'
import { getCertificateConfigForOrg } from '@/lib/certificates/getCertificateConfig'
import { getCertificateContentForEvent } from '@/lib/certificates/getCertificateContentForEvent'
import { sendCertificateEmail } from '@/lib/email/sendCertificateEmail'

async function getAuthorizedEvent(
  eventId: string,
  userId: string,
  role: 'ADMIN' | 'SUPER_ADMIN'
) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      slug: true,
      name: true,
      createdById: true,
    },
  })

  if (!event) {
    return { error: NextResponse.json({ error: 'Event not found' }, { status: 404 }) }
  }

  if (role !== 'SUPER_ADMIN' && event.createdById !== userId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { event }
}

export async function POST(
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
      select: {
        id: true,
        eventId: true,
        fullName: true,
        email: true,
      },
    })

    if (!participant || participant.eventId !== params.eventId) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    const certificateId = `CERT-${nanoid(8).toUpperCase()}`
    const issuedAtDisplay = new Date().toLocaleDateString()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin
    const verificationUrl = `${baseUrl}/events/${access.event.slug}`
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl)

    const layout = await getCertificateConfigForOrg(params.eventId)
    const content = await getCertificateContentForEvent(params.eventId)

    const doc = renderCertificate({
      recipientName: participant.fullName,
      certificateId,
      issuedAt: issuedAtDisplay,
      layout,
      content,
      qrCode: qrCodeDataUrl,
    })

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      doc.on('data', (c: Buffer) => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      doc.end()
    })

    await sendCertificateEmail({
      to: participant.email,
      recipientName: participant.fullName,
      programName: content.programName || access.event.name,
      institution: content.institution || '',
      pdfBuffer,
    })

    return NextResponse.json({
      success: true,
      certificateId,
    })
  } catch (error: any) {
    console.error('GENERATE_EVENT_PARTICIPANT_CERTIFICATE_ERROR', error)
    return NextResponse.json(
      {
        error: 'Failed to generate certificate',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}
