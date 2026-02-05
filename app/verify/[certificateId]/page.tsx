import { headers } from 'next/headers'

interface VerifyPageProps {
    params: {
        certificateId: string
    }
}

async function getVerificationData(certificateId: string) {
    const headersList = headers()
    const host = headersList.get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

    const res = await fetch(
        `${protocol}://${host}/api/verify/${certificateId}`,
        { cache: 'no-store' }
    )

    if (!res.ok) {
        throw new Error('Certificate not found')
    }

    return res.json()
}

export default async function VerifyPage({ params }: VerifyPageProps) {
    const data = await getVerificationData(params.certificateId)

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted p-6">
            <div className="max-w-xl w-full bg-white rounded-lg shadow p-6 space-y-4">
                <h1 className="text-2xl font-bold text-center">
                    Certificate Verification
                </h1>

                <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {data.name || '—'}</p>
                    <p><strong>Email:</strong> {data.email || '—'}</p>
                    <p><strong>Organization:</strong> {data.organization || '—'}</p>
                    <p><strong>Certificate ID:</strong> {data.certificate_id}</p>
                    <p><strong>Issued At:</strong> {data.issued_at || '—'}</p>
                </div>

                <div className="text-center text-green-600 font-medium pt-4">
                    ✔ This certificate is valid
                </div>
            </div>
        </div>
    )
}
