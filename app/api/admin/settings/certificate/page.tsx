'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Eye, Save } from 'lucide-react'
import { toast } from 'sonner'

import CertificateSettingsForm from '@/components/admin/CertificateSettingsForm'

const EVENT_ID = 'default-event'

export default function CertificateSettingsPage() {
    const [saving, setSaving] = useState(false)
    const [previewKey, setPreviewKey] = useState(0)

    const handleSave = async () => {
        setSaving(true)
        try {
            await Promise.all([
                fetch('/api/admin/certificate-config', { method: 'POST' }),
                fetch(`/api/admin/events/${EVENT_ID}/certificate-content`, {
                    method: 'POST',
                }),
            ])

            toast.success('Certificate settings saved')
            setPreviewKey((k) => k + 1) // 🔥 refresh preview
            window.dispatchEvent(new Event('certificate-preview-refresh'))
        } catch {
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: SETTINGS */}
            <div className="overflow-y-auto pr-2">
                <h1 className="text-2xl font-semibold mb-2">
                    Certificate Settings
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                    Configure certificate layout and content. Changes are reflected
                    instantly in the preview.
                </p>

                <CertificateSettingsForm />

                <Separator className="my-6" />

                <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() =>
                            window.open(
                                `/api/admin/certificate/preview?eventId=${EVENT_ID}`,
                                '_blank'
                            )
                        }
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Open Full Preview
                    </Button>
                </div>
            </div>

            {/* RIGHT: LIVE PREVIEW */}
            <Card className="hidden lg:block h-full overflow-hidden">
                <iframe
                    key={previewKey}
                    src={`/api/admin/certificate/preview?eventId=${EVENT_ID}`}
                    className="w-full h-full border-0"
                    title="Certificate Preview"
                />
            </Card>
        </div>
    )
}
