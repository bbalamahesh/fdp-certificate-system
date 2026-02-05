import { NextResponse } from 'next/server'
import { getRegistrationByCertificateId } from '@/lib/googleSheets'

export async function GET(
    _req: Request,
    { params }: { params: { certificate_id: string } }
) {
    const { certificate_id } = params

    const registration =
        await getRegistrationByCertificateId(certificate_id)

    if (!registration) {
        return NextResponse.json(
            { message: 'Certificate not found' },
            { status: 404 }
        )
    }

    /**
     * IMPORTANT:
     * Your current schema does NOT have:
     * - certificate_issued_at
     * - event_name
     * - certificate_pdf_url
     *
     * So "issued" is determined purely by the presence of certificate_id.
     */
    if (!registration.certificate_id) {
        return NextResponse.json(
            { message: 'Certificate not issued yet' },
            { status: 409 }
        )
    }

    return NextResponse.json({
        certificate_id: registration.certificate_id,
        name: registration.name,
        email: registration.email,
        title: registration.title,
    })
}
