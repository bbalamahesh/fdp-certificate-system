'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, RotateCcw, Upload, Trash2, Palette, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import CertificatePreviewFrame from '@/components/admin/CertificatePreviewFrame'

type Orientation = 'landscape' | 'portrait'

type TextStyle = {
  fontSize?: number
  color?: string
}

type CertificateLayoutConfig = {
  title: string
  subtitle1: string
  subtitle2: string
  eventType: string
  orientation: Orientation
  signatureCount: 0 | 1 | 2
  watermarkEnabled: boolean
  showQrCode: boolean
  logoPosition: 'left' | 'right'
  backgroundTemplate: 'none' | 'classic' | 'blue' | 'minimal' | 'custom'
  customBackgroundUrl: string
  textStyles: Record<string, TextStyle>
}

type CertificateContentConfig = {
  programName: string
  startDate: string
  endDate: string
  programDates: string
  institution: string
  department: string
  faculty: string
  location: string
  address: string
  coordinatorName: string
  hodName: string
  footerText: string
  logoDataUrl: string
  coordinatorSignatureDataUrl: string
  hodSignatureDataUrl: string
}

const DEFAULT_LAYOUT: CertificateLayoutConfig = {
  title: 'Certificate of Participation',
  subtitle1: '',
  subtitle2: '',
  eventType: '',
  orientation: 'landscape',
  signatureCount: 2,
  watermarkEnabled: true,
  showQrCode: true,
  logoPosition: 'left',
  backgroundTemplate: 'none',
  customBackgroundUrl: '',
  textStyles: {},
}

const DEFAULT_CONTENT: CertificateContentConfig = {
  programName: '',
  startDate: '',
  endDate: '',
  programDates: '',
  institution: '',
  department: '',
  faculty: '',
  location: '',
  address: '',
  coordinatorName: '',
  hodName: '',
  footerText: '',
  logoDataUrl: '',
  coordinatorSignatureDataUrl: '',
  hodSignatureDataUrl: '',
}

const BACKGROUND_TEMPLATE_OPTIONS: Array<{
  value: CertificateLayoutConfig['backgroundTemplate']
  label: string
  thumb?: string
}> = [
    { value: 'none', label: 'No Background' },
    {
      value: 'classic',
      label: 'Template Classic',
      thumb: '/certificate-templates/template-classic.png',
    },
    {
      value: 'blue',
      label: 'Template Blue',
      thumb: '/certificate-templates/template-blue.png',
    },
    {
      value: 'minimal',
      label: 'Template Minimal',
      thumb: '/certificate-templates/template-minimal.png',
    },
    { value: 'custom', label: 'Custom Background' },
  ]

async function fileToOptimizedDataUrl(
  file: File,
  options?: { maxW?: number; maxH?: number; mimeType?: string; quality?: number }
) {
  const { maxW = 540, maxH = 220, mimeType = 'image/png', quality = 0.9 } =
    options || {}

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxW / img.width, maxH / img.height)
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to process image'))
          return
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL(mimeType, quality))
      }
      img.onerror = () => reject(new Error('Invalid image file'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function StylePopover({
  open,
  value,
  onToggle,
  onChange,
}: {
  open: boolean
  value?: TextStyle
  onToggle: () => void
  onChange: (next: TextStyle) => void
}) {
  return (
    <div className="relative">
      <Button type="button" size="icon" variant="outline" onClick={onToggle}>
        <Palette className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-64 rounded-md border bg-background p-3 shadow-lg">
          <div className="space-y-1">
            <Label className="text-xs">Font size</Label>
            <Input
              type="range"
              min={12}
              max={72}
              value={value?.fontSize ?? 16}
              onChange={(e) =>
                onChange({
                  ...value,
                  fontSize: Number(e.target.value),
                })
              }
            />
            <p className="text-[11px] text-muted-foreground">{value?.fontSize ?? 16}px</p>
          </div>
          <div className="mt-2 space-y-1">
            <Label className="text-xs">Color</Label>
            <Input
              type="color"
              value={value?.color || '#000000'}
              onChange={(e) =>
                onChange({
                  ...value,
                  color: e.target.value,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function CertificateSettingsPage() {
  const [eventId, setEventId] = useState('')
  const [eventName, setEventName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const [autoSaveBlocked, setAutoSaveBlocked] = useState(false)
  const [activeStyleField, setActiveStyleField] = useState<string | null>(null)

  const [layout, setLayout] = useState<CertificateLayoutConfig>(DEFAULT_LAYOUT)
  const [content, setContent] = useState<CertificateContentConfig>(DEFAULT_CONTENT)

  const [savedLayout, setSavedLayout] = useState<CertificateLayoutConfig>(DEFAULT_LAYOUT)
  const [savedContent, setSavedContent] = useState<CertificateContentConfig>(DEFAULT_CONTENT)

  const validation = useMemo(() => {
    const errors: Record<string, string> = {}
    if (!layout.title.trim()) errors.title = 'Certificate title is required'
    if (!content.programName.trim()) errors.programName = 'Program title is required'
    return errors
  }, [layout.title, content.programName])

  const hasErrors = Object.keys(validation).length > 0

  const dirty = useMemo(() => {
    return (
      JSON.stringify(layout) !== JSON.stringify(savedLayout) ||
      JSON.stringify(content) !== JSON.stringify(savedContent)
    )
  }, [layout, content, savedLayout, savedContent])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const nextEventId = params.get('eventId') || ''
    const nextEventName = params.get('eventName') || ''
    setEventId(nextEventId)
    setEventName(nextEventName)
  }, [])

  const loadSettings = useCallback(async () => {
    if (!eventId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [contentRes, layoutRes] = await Promise.all([
        fetch(`/api/admin/events/${eventId}/certificate-content`),
        fetch(`/api/admin/events/${eventId}/certificate-config`),
      ])

      const contentPayload = await contentRes.json()
      const layoutPayload = await layoutRes.json()

      if (!contentRes.ok) {
        throw new Error(
          contentPayload?.details ||
          contentPayload?.error ||
          'Failed to load certificate content'
        )
      }
      if (!layoutRes.ok) {
        throw new Error(
          layoutPayload?.details ||
          layoutPayload?.error ||
          'Failed to load certificate config'
        )
      }

      const nextContent: CertificateContentConfig = {
        ...DEFAULT_CONTENT,
        ...(contentPayload?.data || {}),
      }
      const nextLayout: CertificateLayoutConfig = {
        ...DEFAULT_LAYOUT,
        ...(layoutPayload?.config || {}),
        textStyles: {
          ...DEFAULT_LAYOUT.textStyles,
          ...(layoutPayload?.config?.textStyles || {}),
        },
      }

      setContent(nextContent)
      setSavedContent(nextContent)
      setLayout(nextLayout)
      setSavedLayout(nextLayout)
      setInitialized(true)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load certificate settings')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const saveSettings = useCallback(
    async (silent = false) => {
      if (hasErrors) {
        if (!silent) toast.error('Please fix validation errors before saving')
        return false
      }

      setSaving(true)
      try {
        const [contentRes, layoutRes] = await Promise.all([
          fetch(`/api/admin/events/${eventId}/certificate-content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(content),
          }),
          fetch(`/api/admin/events/${eventId}/certificate-config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(layout),
          }),
        ])

        const contentPayload = await contentRes.json()
        const layoutPayload = await layoutRes.json()

        if (!contentRes.ok) {
          throw new Error(
            contentPayload?.details ||
            contentPayload?.error ||
            'Failed to save certificate content'
          )
        }
        if (!layoutRes.ok) {
          throw new Error(
            layoutPayload?.details ||
            layoutPayload?.error ||
            'Failed to save certificate config'
          )
        }

        setSavedLayout(layout)
        setSavedContent(content)
        setRefreshKey((k) => k + 1)
        setAutoSaveBlocked(false)

        if (!silent) toast.success('Certificate settings saved')
        return true
      } catch (error: any) {
        if (silent) setAutoSaveBlocked(true)
        if (!silent) {
          toast.error(error?.message || 'Failed to save certificate settings')
        }
        return false
      } finally {
        setSaving(false)
      }
    },
    [content, eventId, hasErrors, layout]
  )

  useEffect(() => {
    if (!initialized || !dirty || hasErrors || saving || autoSaveBlocked) return
    const timer = setTimeout(() => {
      void saveSettings(true)
    }, 1200)
    return () => clearTimeout(timer)
  }, [dirty, hasErrors, initialized, saveSettings, saving, autoSaveBlocked])

  useEffect(() => {
    if (!initialized) return
    setAutoSaveBlocked(false)
  }, [layout, content, initialized])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const resetToSaved = () => {
    setLayout(savedLayout)
    setContent(savedContent)
  }

  const setTextStyle = (field: string, next: TextStyle) => {
    setLayout((prev) => ({
      ...prev,
      textStyles: {
        ...prev.textStyles,
        [field]: {
          ...prev.textStyles[field],
          ...next,
        },
      },
    }))
  }

  const handleImageUpload = async (
    key:
      | 'logoDataUrl'
      | 'coordinatorSignatureDataUrl'
      | 'hodSignatureDataUrl'
      | 'customBackgroundUrl',
    file?: File
  ) => {
    if (!file) return
    try {
      const options =
        key === 'logoDataUrl'
          ? { maxW: 520, maxH: 220, mimeType: 'image/png', quality: 0.9 }
          : key === 'customBackgroundUrl'
            ? { maxW: 1600, maxH: 1200, mimeType: 'image/jpeg', quality: 0.88 }
            : { maxW: 360, maxH: 120, mimeType: 'image/png', quality: 0.9 }
      const dataUrl = await fileToOptimizedDataUrl(file, options)
      const kind =
        key === 'logoDataUrl'
          ? 'logo'
          : key === 'customBackgroundUrl'
            ? 'background'
            : key === 'coordinatorSignatureDataUrl'
              ? 'coordinator-signature'
              : 'hod-signature'

      const uploadRes = await fetch('/api/admin/certificate-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, kind }),
      })
      const uploadPayload = await uploadRes.json()
      if (!uploadRes.ok) {
        throw new Error(uploadPayload?.details || uploadPayload?.error || 'Failed to upload image')
      }

      if (key === 'customBackgroundUrl') {
        setLayout((prev) => ({ ...prev, customBackgroundUrl: uploadPayload.url }))
      } else {
        setContent((prev) => ({ ...prev, [key]: uploadPayload.url }))
      }
      toast.success('Image uploaded')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload image')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!eventId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Select an event first</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Open Certificate Settings from an event card in the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Certificate Settings</h1>
          <p className="text-sm text-muted-foreground">
            Layout, content, optional branding, signatures, and style controls for this event.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          {saving
            ? 'Saving changes...'
            : autoSaveBlocked
              ? 'Auto-save paused due to last error'
              : dirty
                ? 'Unsaved changes'
                : 'All changes saved'}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-sm">
          <Link href="/admin/dashboard" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            Dashboard
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          {eventId ? (
            <Link
              href={`/admin/events/${eventId}/edit`}
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              {eventName || 'Event'}
            </Link>
          ) : (
            <span className="text-muted-foreground">{eventName || eventId || 'Event'}</span>
          )}
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="font-medium">Certificate Settings</span>
        </div>
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Layout Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'title',
                  label: 'Certificate Title',
                  value: layout.title,
                  onChange: (v: string) => setLayout((prev) => ({ ...prev, title: v })),
                  error: validation.title,
                  placeholder: 'Certificate of Participation',
                },
                {
                  key: 'subtitle1',
                  label: 'Subtitle 1 (Optional)',
                  value: layout.subtitle1,
                  onChange: (v: string) => setLayout((prev) => ({ ...prev, subtitle1: v })),
                  placeholder: 'Institute Name / Accreditation',
                },
                {
                  key: 'subtitle2',
                  label: 'Subtitle 2 (Optional)',
                  value: layout.subtitle2,
                  onChange: (v: string) => setLayout((prev) => ({ ...prev, subtitle2: v })),
                  placeholder: 'Additional line',
                },
                {
                  key: 'eventType',
                  label: 'Event Type (Optional)',
                  value: layout.eventType,
                  onChange: (v: string) => setLayout((prev) => ({ ...prev, eventType: v })),
                  placeholder: 'FDP',
                },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={field.placeholder}
                    />
                    <StylePopover
                      open={activeStyleField === field.key}
                      value={layout.textStyles[field.key]}
                      onToggle={() =>
                        setActiveStyleField((prev) => (prev === field.key ? null : field.key))
                      }
                      onChange={(next) => setTextStyle(field.key, next)}
                    />
                  </div>
                  {field.error && <p className="text-xs text-destructive">{field.error}</p>}
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Orientation</Label>
                  <Select
                    value={layout.orientation}
                    onValueChange={(v: Orientation) =>
                      setLayout((prev) => ({ ...prev, orientation: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape">Landscape</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Signatures</Label>
                  <Select
                    value={String(layout.signatureCount)}
                    onValueChange={(v) =>
                      setLayout((prev) => ({
                        ...prev,
                        signatureCount: Number(v) as 0 | 1 | 2,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No signatures</SelectItem>
                      <SelectItem value="1">One signature</SelectItem>
                      <SelectItem value="2">Two signatures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo Position</Label>
                <Select
                  value={layout.logoPosition}
                  onValueChange={(v: 'left' | 'right') =>
                    setLayout((prev) => ({ ...prev, logoPosition: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Background Template</Label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {BACKGROUND_TEMPLATE_OPTIONS.map((template) => {
                    const active = layout.backgroundTemplate === template.value
                    return (
                      <button
                        key={template.value}
                        type="button"
                        onClick={() =>
                          setLayout((prev) => ({
                            ...prev,
                            backgroundTemplate: template.value,
                          }))
                        }
                        className={`overflow-hidden rounded-md border text-left transition ${active
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        {template.thumb ? (
                          <img
                            src={template.thumb}
                            alt={template.label}
                            className="h-24 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                            {template.value === 'custom'
                              ? 'Upload your own image'
                              : 'No background image'}
                          </div>
                        )}
                        <div className="px-2 py-1 text-xs font-medium">{template.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {layout.backgroundTemplate === 'custom' && (
                <div className="space-y-2">
                  <Label>Custom Background</Label>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                      <label className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" /> Upload Background
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            void handleImageUpload('customBackgroundUrl', e.target.files?.[0])
                            e.currentTarget.value = ''
                          }}
                        />
                      </label>
                    </Button>
                    {layout.customBackgroundUrl && (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setLayout((prev) => ({ ...prev, customBackgroundUrl: '' }))
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                      </Button>
                    )}
                  </div>
                  {layout.customBackgroundUrl && (
                    <img
                      src={layout.customBackgroundUrl}
                      alt="Custom background"
                      className="h-20 w-auto border rounded"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-between rounded-md border p-3">
                <p className="text-sm font-medium">Show Watermark</p>
                <Switch
                  checked={layout.watermarkEnabled}
                  onCheckedChange={(v) =>
                    setLayout((prev) => ({ ...prev, watermarkEnabled: v }))
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <p className="text-sm font-medium">Show QR Code</p>
                <Switch
                  checked={layout.showQrCode}
                  onCheckedChange={(v) => setLayout((prev) => ({ ...prev, showQrCode: v }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Program Title</Label>
                <div className="flex gap-2">
                  <Input
                    value={content.programName}
                    onChange={(e) => setContent((prev) => ({ ...prev, programName: e.target.value }))}
                  />
                  <StylePopover
                    open={activeStyleField === 'programName'}
                    value={layout.textStyles.programName}
                    onToggle={() =>
                      setActiveStyleField((prev) => (prev === 'programName' ? null : 'programName'))
                    }
                    onChange={(next) => setTextStyle('programName', next)}
                  />
                </div>
                {validation.programName && (
                  <p className="text-xs text-destructive">{validation.programName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    value={content.startDate}
                    onChange={(e) => setContent((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    value={content.endDate}
                    onChange={(e) => setContent((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <Input
                placeholder="Program Dates (optional override)"
                value={content.programDates}
                onChange={(e) => setContent((prev) => ({ ...prev, programDates: e.target.value }))}
              />
              <Input
                placeholder="Institute / College / Organization (Optional)"
                value={content.institution}
                onChange={(e) => setContent((prev) => ({ ...prev, institution: e.target.value }))}
              />
              <Input
                placeholder="Department (Optional)"
                value={content.department}
                onChange={(e) => setContent((prev) => ({ ...prev, department: e.target.value }))}
              />
              <Input
                placeholder="Faculty / School (Optional)"
                value={content.faculty}
                onChange={(e) => setContent((prev) => ({ ...prev, faculty: e.target.value }))}
              />
              <Input
                placeholder="Location (Optional)"
                value={content.location}
                onChange={(e) => setContent((prev) => ({ ...prev, location: e.target.value }))}
              />
              <Textarea
                placeholder="Address (Optional)"
                value={content.address}
                onChange={(e) => setContent((prev) => ({ ...prev, address: e.target.value }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo & Signatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Logo (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" /> Upload Logo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          void handleImageUpload('logoDataUrl', e.target.files?.[0])
                          e.currentTarget.value = ''
                        }}
                      />
                    </label>
                  </Button>
                  {content.logoDataUrl && (
                    <Button
                      variant="ghost"
                      onClick={() => setContent((prev) => ({ ...prev, logoDataUrl: '' }))}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  )}
                </div>
                {content.logoDataUrl && (
                  <img src={content.logoDataUrl} alt="Logo" className="h-20 w-auto border rounded" />
                )}
              </div>

              <div className="space-y-2">
                <Label>Coordinator Signature (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" /> Upload Signature
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          void handleImageUpload('coordinatorSignatureDataUrl', e.target.files?.[0])
                          e.currentTarget.value = ''
                        }}
                      />
                    </label>
                  </Button>
                  {content.coordinatorSignatureDataUrl && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setContent((prev) => ({ ...prev, coordinatorSignatureDataUrl: '' }))
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  )}
                </div>
                {content.coordinatorSignatureDataUrl && (
                  <img
                    src={content.coordinatorSignatureDataUrl}
                    alt="Coordinator signature"
                    className="h-16 w-auto border rounded"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>HOD Signature (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" /> Upload Signature
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          void handleImageUpload('hodSignatureDataUrl', e.target.files?.[0])
                          e.currentTarget.value = ''
                        }}
                      />
                    </label>
                  </Button>
                  {content.hodSignatureDataUrl && (
                    <Button
                      variant="ghost"
                      onClick={() => setContent((prev) => ({ ...prev, hodSignatureDataUrl: '' }))}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  )}
                </div>
                {content.hodSignatureDataUrl && (
                  <img
                    src={content.hodSignatureDataUrl}
                    alt="HOD signature"
                    className="h-16 w-auto border rounded"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signatories & Footer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Coordinator Name (Optional)"
                value={content.coordinatorName}
                onChange={(e) => setContent((prev) => ({ ...prev, coordinatorName: e.target.value }))}
              />
              <Input
                placeholder="HOD Name (Optional)"
                value={content.hodName}
                onChange={(e) => setContent((prev) => ({ ...prev, hodName: e.target.value }))}
              />
              <Textarea
                placeholder="Footer Text (Optional)"
                value={content.footerText}
                onChange={(e) => setContent((prev) => ({ ...prev, footerText: e.target.value }))}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={() => void saveSettings(false)} disabled={saving || hasErrors}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>

            <Button variant="outline" onClick={resetToSaved} disabled={!dirty || saving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Saved
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-medium">Live Certificate Preview</h2>
          <p className="text-sm text-muted-foreground">Auto-saves changes and refreshes preview.</p>
          <CertificatePreviewFrame eventId={eventId} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  )
}
