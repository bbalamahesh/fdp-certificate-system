import { NextResponse } from 'next/server'
import { getRegistrationByCertificateId } from '@/lib/googleSheets'

export async function GET(
    _req: Request,
    { params }: { params: { certificateId: string } }
) {
    try {
        const certificateId = params.certificateId

        const registration =
            await getRegistrationByCertificateId(certificateId)

        if (!registration) {
            return NextResponse.json(
                { valid: false, message: 'Certificate not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            name: registration.name,
            email: registration.email,
            organization: registration.organization,
            certificate_id: registration.certificate_id,
            issued_at: registration.issued_at,
        })
    } catch (error) {
        console.error('VERIFY CERT ERROR:', error)

        return NextResponse.json(
            { valid: false, message: 'Verification failed' },
            { status: 500 }
        )
    }
}
