'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
    /** Used for live preview (existing behavior) */
    eventId?: string

    /** Used for issued certificate view */
    certificate_id?: string

    refreshKey?: number
}

export default function CertificatePreviewFrame({
    eventId,
    certificate_id,
    refreshKey = 0,
}: Props) {
    const [loading, setLoading] = useState(true)
    const [src, setSrc] = useState('')

    /**
     * Case 1: Issued certificate (VIEW)
     */
    useEffect(() => {
        if (!certificate_id) return

        setLoading(true)
        setSrc(
            `/api/admin/certificate/preview?certificate_id=${certificate_id}`
        )
    }, [certificate_id])

    /**
     * Case 2: Live preview (GENERATE / CONFIG)
     */
    useEffect(() => {
        if (!eventId || certificate_id) return

        setLoading(true)
        setSrc(
            `/api/admin/certificate/preview?eventId=${eventId}&v=${refreshKey}`
        )
    }, [eventId, refreshKey, certificate_id])

    if (!src) return null

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
