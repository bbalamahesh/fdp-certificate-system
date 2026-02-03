'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
    eventId: string
    refreshKey?: number
}

export default function CertificatePreviewFrame({
    eventId,
    refreshKey = 0,
}: Props) {
    const [loading, setLoading] = useState(true)
    const [src, setSrc] = useState('')

    useEffect(() => {
        setLoading(true)
        setSrc(
            `/api/admin/certificate/preview?eventId=${eventId}&v=${refreshKey}`
        )
    }, [eventId, refreshKey])

    return (
        <div className="relative w-full h-[800px] border rounded-md overflow-hidden bg-white">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            )}

            <iframe
                src={src}
                className="w-full h-full"
                onLoad={() => setLoading(false)}
                title="Certificate Preview"
            />
        </div>
    )
}
