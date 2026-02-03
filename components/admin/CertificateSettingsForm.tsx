'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

type Orientation = 'landscape' | 'portrait'

interface CertificateLayoutConfig {
    title: string
    eventType: string
    orientation: Orientation
    signatureCount: 0 | 1 | 2
    watermarkEnabled: boolean
}

interface CertificateContent {
    programName: string
    programDates: string
    department: string
    faculty: string
    institution: string
    location: string
    coordinatorName?: string
    hodName?: string
}

const EVENT_ID = 'default-event'

export default function CertificateSettingsForm() {
    const [layout, setLayout] = useState<CertificateLayoutConfig | null>(null)
    const [content, setContent] = useState<CertificateContent | null>(null)

    useEffect(() => {
        loadAll()
    }, [])

    const loadAll = async () => {
        try {
            const [layoutRes, contentRes] = await Promise.all([
                fetch('/api/admin/certificate-config'),
                fetch(`/api/admin/events/${EVENT_ID}/certificate-content`),
            ])

            const layoutData = await layoutRes.json()
            const contentData = await contentRes.json()

            setLayout(layoutData.config)
            setContent(contentData.content)
        } catch {
            toast.error('Failed to load certificate settings')
        }
    }

    if (!layout || !content) {
        return <p className="text-sm text-muted-foreground">Loading settings…</p>
    }

    return (
        <div className="space-y-6">
            {/* Layout */}
            <Card>
                <CardHeader>
                    <CardTitle>Layout & Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Certificate Title</Label>
                        <Input
                            value={layout.title}
                            onChange={(e) =>
                                setLayout({ ...layout, title: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <Label>Event Type</Label>
                        <Input
                            value={layout.eventType}
                            onChange={(e) =>
                                setLayout({ ...layout, eventType: e.target.value })
                            }
                        />
                    </div>

                    <RadioGroup
                        value={layout.orientation}
                        onValueChange={(v: Orientation) =>
                            setLayout({ ...layout, orientation: v })
                        }
                        className="flex gap-6"
                    >
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="landscape" />
                            <span>Landscape</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="portrait" />
                            <span>Portrait</span>
                        </div>
                    </RadioGroup>

                    <Select
                        value={String(layout.signatureCount)}
                        onValueChange={(v) =>
                            setLayout({
                                ...layout,
                                signatureCount: Number(v) as 0 | 1 | 2,
                            })
                        }
                    >
                        <SelectTrigger className="w-[220px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">No signatures</SelectItem>
                            <SelectItem value="1">One signature</SelectItem>
                            <SelectItem value="2">Two signatures</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-3">
                        <Switch
                            checked={layout.watermarkEnabled}
                            onCheckedChange={(v) =>
                                setLayout({ ...layout, watermarkEnabled: v })
                            }
                        />
                        <span className="text-sm">Show watermark</span>
                    </div>
                </CardContent>
            </Card>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Certificate Content</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(content).map(([key, value]) => (
                        <div key={key}>
                            <Label className="capitalize">
                                {key.replace(/([A-Z])/g, ' $1')}
                            </Label>
                            <Input
                                value={value || ''}
                                onChange={(e) =>
                                    setContent({ ...content, [key]: e.target.value })
                                }
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
