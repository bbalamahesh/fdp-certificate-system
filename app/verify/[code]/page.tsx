import { getRegistrationByVerificationCode } from '@/lib/googleSheets'
import { notFound } from 'next/navigation'

interface Props {
    params: { code: string }
}

export default async function VerifyPage({ params }: Props) {
    const registration = await getRegistrationByVerificationCode(params.code)

    if (!registration) {
        notFound()
    }

    if (registration.certificate_status !== 'ACTIVE') {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-lg">
                <h1 className="text-2xl font-bold mb-4">
                    Certificate Verification
                </h1>

                <div className="text-red-600 font-semibold">
                    ✕ This certificate is not valid or has been revoked
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 border rounded-lg">
            <h1 className="text-2xl font-bold mb-4">
                Certificate Verification
            </h1>

            <p><strong>Name:</strong> {registration.name}</p>
            <p><strong>Email:</strong> {registration.email}</p>
            <p><strong>Organization:</strong> {registration.organization}</p>
            <p><strong>Certificate ID:</strong> {registration.certificate_id}</p>
            <p><strong>Issued At:</strong> {registration.certificate_issued_at}</p>

            <div className="mt-6 text-green-600 font-semibold">
                ✓ This certificate is valid
            </div>
        </div>
    )
}