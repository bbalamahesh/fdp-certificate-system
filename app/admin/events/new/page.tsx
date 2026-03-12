'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
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
  })

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken') || ''
    if (!adminToken) {
      router.push('/admin/login')
      return
    }
    setToken(adminToken)
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!token) {
      toast.error('Session expired. Please login again.')
      router.push('/admin/login')
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...form,
        fromDate: new Date(form.fromDate).toISOString(),
        toDate: new Date(form.toDate).toISOString(),
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Session expired. Please login again.')
          router.push('/admin/login')
          return
        }
        toast.error(data.error || 'Failed to create event')
        return
      }

      if (data?.event?.status === 'APPROVED') {
        toast.success('Event created and published successfully.')
      } else {
        toast.success('Event submitted for super-admin approval.')
      }
      router.push('/admin/dashboard')
    } catch (error) {
      console.error(error)
      toast.error('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Event / Program</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input required value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input required value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Event Name</Label>
              <Input required value={form.eventName} onChange={(e) => setForm((p) => ({ ...p, eventName: e.target.value }))} />
            </div>

            <div>
              <Label>Mode</Label>
              <Select value={form.mode} onValueChange={(value) => setForm((p) => ({ ...p, mode: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Input type="datetime-local" required value={form.fromDate} onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))} />
              </div>
              <div>
                <Label>To Date</Label>
                <Input type="datetime-local" required value={form.toDate} onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Event Poster URL (optional)</Label>
              <Input value={form.eventPoster} onChange={(e) => setForm((p) => ({ ...p, eventPoster: e.target.value }))} />
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
                <Input type="email" required value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} />
              </div>
              <div>
                <Label>Contact Mobile</Label>
                <Input required value={form.contactMobile} onChange={(e) => setForm((p) => ({ ...p, contactMobile: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Institute (optional)</Label>
              <Input value={form.instituteName} onChange={(e) => setForm((p) => ({ ...p, instituteName: e.target.value }))} />
            </div>

            <div>
              <Label>Department (optional)</Label>
              <Input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
            </div>

            <div>
              <Label>Address (optional)</Label>
              <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </div>

            <Button disabled={loading} type="submit" className="w-full">
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
