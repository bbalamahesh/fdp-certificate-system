'use client'

import { useState, useEffect } from 'react'
import { Loader2, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Settings {
  program_name: string
  program_dates: string
  department: string
  faculty: string
  institution: string
  location: string
  coordinator_name: string
  hod_name: string
}

export default function ContentEditor() {
  /* -------------------- LIVE SETTINGS (REAL DATA) -------------------- */
  const [settings, setSettings] = useState<Settings>({
    program_name: '',
    program_dates: '',
    department: '',
    faculty: '',
    institution: '',
    location: '',
    coordinator_name: '',
    hod_name: '',
  })

  /* -------------------- PREVIEW / TEST DATA -------------------- */
  const [preview, setPreview] = useState({
    name: 'Test Participant',
  })

  /* -------------------- UI STATE -------------------- */
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  const [message, setMessage] = useState<{ type: string; text: string }>({
    type: '',
    text: '',
  })

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  /* -------------------- EFFECTS -------------------- */
  useEffect(() => {
    loadSettings()
  }, [])

  /* -------------------- API HANDLERS -------------------- */
  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (data.success) {
        setSettings(data.settings)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!res.ok) throw new Error()

      setMessage({
        type: 'success',
        text: 'Settings saved successfully!',
      })
    } catch {
      setMessage({
        type: 'error',
        text: 'Failed to save settings',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    loadSettings()
    setMessage({
      type: 'info',
      text: 'Settings reset to last saved version',
    })
  }

  const handlePreview = async () => {
    try {
      const res = await fetch(
        `/api/admin/email-preview?name=${encodeURIComponent(preview.name)}`
      )
      const data = await res.json()
      setPreviewHtml(data.html)
      setPreviewOpen(true)
    } catch (error) {
      console.error('Preview failed', error)
    }
  }

  const handleSendTestEmail = async () => {
    try {
      setSendingTest(true)

      const res = await fetch('/api/admin/send-test-email', {
        method: 'POST',
      })

      if (!res.ok) throw new Error()

      setMessage({
        type: 'success',
        text: 'Test email sent to admin Gmail successfully!',
      })
    } catch {
      setMessage({
        type: 'error',
        text: 'Failed to send test email',
      })
    } finally {
      setSendingTest(false)
    }
  }

  /* -------------------- LOADING -------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="space-y-8">
      {/* ===================================================== */}
      {/* LIVE / PRODUCTION SETTINGS */}
      {/* ===================================================== */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">
            Live Certificate Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            These settings affect real certificates and emails sent to participants.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Program Name</Label>
            <Input
              value={settings.program_name}
              onChange={(e) =>
                setSettings({ ...settings, program_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Program Dates</Label>
            <Input
              value={settings.program_dates}
              onChange={(e) =>
                setSettings({ ...settings, program_dates: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Input
              value={settings.department}
              onChange={(e) =>
                setSettings({ ...settings, department: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Faculty</Label>
            <Input
              value={settings.faculty}
              onChange={(e) =>
                setSettings({ ...settings, faculty: e.target.value })
              }
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Institution</Label>
            <Input
              value={settings.institution}
              onChange={(e) =>
                setSettings({ ...settings, institution: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={settings.location}
              onChange={(e) =>
                setSettings({ ...settings, location: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Coordinator Name</Label>
            <Input
              value={settings.coordinator_name}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  coordinator_name: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>HOD Name</Label>
            <Input
              value={settings.hod_name}
              onChange={(e) =>
                setSettings({ ...settings, hod_name: e.target.value })
              }
            />
          </div>
        </div>

        {message.text && (
          <div className="p-3 rounded-md bg-muted text-sm">
            {message.text}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>

          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </Card>

      {/* ===================================================== */}
      {/* PREVIEW / TEST SECTION */}
      {/* ===================================================== */}
      <Card className="p-6 space-y-6 border-dashed bg-muted/30">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Preview & Test
            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
              Safe
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Used only for preview and test emails. Does not affect real users.
          </p>
        </div>

        <div className="space-y-2 max-w-sm">
          <Label>Preview Name</Label>
          <Input
            value={preview.name}
            onChange={(e) =>
              setPreview({ ...preview, name: e.target.value })
            }
            placeholder="Dr. Jane Smith"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePreview}>
            Preview Email
          </Button>

          <Button
            variant="secondary"
            onClick={handleSendTestEmail}
            disabled={sendingTest}
          >
            {sendingTest ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Test...
              </>
            ) : (
              'Send Test Email'
            )}
          </Button>
        </div>
      </Card>

      {/* ---------------- EMAIL PREVIEW MODAL ---------------- */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>

          <div
            className="border rounded-md p-4 max-h-[70vh] overflow-auto bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
