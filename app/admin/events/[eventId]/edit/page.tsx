'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type FormState = {
  eventName: string
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  fromDate: string
  toDate: string
  eventPoster: string
  meetingLink: string
  contactEmail: string
  contactMobile: string
  instituteName: string
  department: string
  address: string
  notifyParticipants: boolean
}

function toDateTimeLocal(value: string | Date) {
  const date = new Date(value)
  const tzOffset = date.getTimezoneOffset() * 60000
  const local = new Date(date.getTime() - tzOffset)
  return local.toISOString().slice(0, 16)
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams<{ eventId: string }>()
  const eventId = params.eventId

  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({
    eventName: '',
    mode: 'OFFLINE',
    fromDate: '',
    toDate: '',
    eventPoster: '',
    meetingLink: '',
    contactEmail: '',
    contactMobile: '',
    instituteName: '',
    department: '',
    address: '',
    notifyParticipants: true,
  })

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken') || ''
    if (!adminToken) {
      router.push('/admin/login')
      return
    }
    setToken(adminToken)
  }, [router])

  useEffect(() => {
    if (!token || !eventId) return

    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to load event')
          router.push('/admin/dashboard')
          return
        }

        const event = data.event
        setForm({
          eventName: event.name || '',
          mode: event.mode || 'OFFLINE',
          fromDate: toDateTimeLocal(event.fromDate),
          toDate: toDateTimeLocal(event.toDate),
          eventPoster: event.posterUrl || '',
          meetingLink: event.meetingLink || '',
          contactEmail: event.contactEmail || '',
          contactMobile: event.contactMobile || '',
          instituteName: event.organizerInstitute || '',
          department: event.organizerDepartment || '',
          address: event.organizerAddress || '',
          notifyParticipants: true,
        })
      } catch (error) {
        console.error(error)
        toast.error('Failed to load event')
      } finally {
        setLoading(false)
      }
    })()
  }, [token, eventId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...form,
        fromDate: new Date(form.fromDate).toISOString(),
        toDate: new Date(form.toDate).toISOString(),
      }

      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to update event')
        return
      }

      toast.success(
        form.notifyParticipants
          ? 'Event updated and participant emails sent.'
          : 'Event updated successfully.'
      )
      router.push('/admin/dashboard')
    } catch (error) {
      console.error(error)
      toast.error('Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="p-8">Loading event...</main>
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Event Name</Label>
              <Input
                required
                value={form.eventName}
                onChange={(e) => setForm((p) => ({ ...p, eventName: e.target.value }))}
              />
            </div>

            <div>
              <Label>Mode</Label>
              <Select
                value={form.mode}
                onValueChange={(value: 'ONLINE' | 'OFFLINE' | 'HYBRID') =>
                  setForm((p) => ({ ...p, mode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">ONLINE</SelectItem>
                  <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                  <SelectItem value="HYBRID">HYBRID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From Date</Label>
                <Input
                  type="datetime-local"
                  required
                  value={form.fromDate}
                  onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="datetime-local"
                  required
                  value={form.toDate}
                  onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Event Poster URL (optional)</Label>
              <Input
                value={form.eventPoster}
                onChange={(e) => setForm((p) => ({ ...p, eventPoster: e.target.value }))}
              />
            </div>

            <div>
              <Label>Meeting Invite Link (Google Meet / Zoom) (optional)</Label>
              <Input
                value={form.meetingLink}
                onChange={(e) => setForm((p) => ({ ...p, meetingLink: e.target.value }))}
                placeholder="https://meet.google.com/... or https://zoom.us/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  required
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label>Contact Mobile</Label>
                <Input
                  required
                  value={form.contactMobile}
                  onChange={(e) => setForm((p) => ({ ...p, contactMobile: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Institute (optional)</Label>
              <Input
                value={form.instituteName}
                onChange={(e) => setForm((p) => ({ ...p, instituteName: e.target.value }))}
              />
            </div>

            <div>
              <Label>Department (optional)</Label>
              <Input
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              />
            </div>

            <div>
              <Label>Address (optional)</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.notifyParticipants}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notifyParticipants: e.target.checked }))
                }
              />
              Notify all registered participants by email after update
            </label>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Update Event'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
