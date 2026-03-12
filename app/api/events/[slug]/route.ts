import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const event = await db.event.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        slug: true,
        name: true,
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
        status: true,
      },
    })

    if (!event || event.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('GET_EVENT_BY_SLUG_ERROR', error)
    return NextResponse.json({ error: 'Failed to load event' }, { status: 500 })
  }
}
