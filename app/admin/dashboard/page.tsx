'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import EventRegistrationsTable from '@/components/admin/EventRegistrationsTable'

type EventRow = {
  id: string
  name: string
  slug: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  mode: string
  fromDate: string
  toDate: string
  _count?: { participants: number }
  createdBy?: {
    username?: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  }
}

type UserRow = {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  email: string | null
  isActive: boolean
}

type AuditRow = {
  id: string
  action: string
  targetType: string
  targetId: string
  createdAt: string
  actor?: { username: string }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN')
  const [events, setEvents] = useState<EventRow[]>([])
  const [pending, setPending] = useState<EventRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [audit, setAudit] = useState<AuditRow[]>([])
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('adminToken') || ''
    const r = (localStorage.getItem('adminRole') as 'ADMIN' | 'SUPER_ADMIN') || 'ADMIN'

    if (!t) {
      router.push('/admin/login')
      return
    }

    setToken(t)
    setRole(r)
  }, [router])

  useEffect(() => {
    if (!token) return

    const headers = { Authorization: `Bearer ${token}` }

    ;(async () => {
      const eventsRes = await fetch('/api/admin/events', { headers })
      const eventsData = await eventsRes.json()
      setEvents(eventsData.events || [])

      if (role === 'SUPER_ADMIN') {
        const [pendingRes, usersRes, auditRes] = await Promise.all([
          fetch('/api/admin/events/pending', { headers }),
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/audit', { headers }),
        ])

        const pendingData = await pendingRes.json()
        const usersData = await usersRes.json()
        const auditData = await auditRes.json()

        setPending(pendingData.events || [])
        setUsers(usersData.users || [])
        setAudit(auditData.logs || [])
      }
    })()
  }, [token, role])

  async function approveEvent(eventId: string) {
    try {
      const approvedFromPending = pending.find((p) => p.id === eventId)
      const res = await fetch(`/api/admin/events/${eventId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to approve event')
        return
      }
      toast.success('Event approved')
      setPending((prev) => prev.filter((p) => p.id !== eventId))
      if (approvedFromPending) {
        setEvents((prev) => [
          {
            ...approvedFromPending,
            status: 'APPROVED',
          },
          ...prev,
        ])
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to approve event')
    }
  }

  async function deleteEvent(eventId: string, eventName: string) {
    const confirmed = window.confirm(
      `Delete event "${eventName}"? This will remove all related registrations and certificate config.`
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete event')
        return
      }

      toast.success('Event deleted')
      setEvents((prev) => prev.filter((event) => event.id !== eventId))
      setPending((prev) => prev.filter((event) => event.id !== eventId))
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete event')
    }
  }

  function viewParticipants(eventId: string) {
    setSelectedEventForParticipants(eventId)
    const node = document.getElementById('registrations-table-section')
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard ({role})</h1>
        <Link href="/admin/events/new">
          <Button>Create New Event</Button>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>Your Events</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events found.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded border p-3 text-sm">
                <p className="font-semibold">{event.name}</p>
                <p>Status: {event.status} | Mode: {event.mode}</p>
                <p>
                  Dates: {new Date(event.fromDate).toLocaleDateString()} - {new Date(event.toDate).toLocaleDateString()}
                </p>
                <p>Participants: {event._count?.participants ?? 0}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 mr-2"
                  onClick={() => viewParticipants(event.id)}
                >
                  View Participants
                </Button>
                <Link href={`/admin/events/${event.id}/edit`}>
                  <Button variant="secondary" size="sm" className="mt-3 mr-2">
                    Edit Event
                  </Button>
                </Link>
                {role === 'SUPER_ADMIN' ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3"
                    onClick={() => deleteEvent(event.id, event.name)}
                  >
                    Delete Event
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card id="registrations-table-section">
        <CardHeader><CardTitle>Registrations Table</CardTitle></CardHeader>
        <CardContent>
          <EventRegistrationsTable
            token={token}
            events={events}
            selectedEventId={selectedEventForParticipants}
            onSelectedEventChange={setSelectedEventForParticipants}
          />
        </CardContent>
      </Card>

      {role === 'SUPER_ADMIN' ? (
        <>
          <Card>
            <CardHeader><CardTitle>Pending Event Approvals</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending events.</p>
              ) : (
                pending.map((event) => (
                  <div key={event.id} className="rounded border p-3">
                    <p className="font-semibold">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      by {event.createdBy?.firstName} {event.createdBy?.lastName} ({event.createdBy?.username})
                    </p>
                    <Button className="mt-3" size="sm" onClick={() => approveEvent(event.id)}>
                      Approve
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Admins</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="rounded border p-2 text-sm">
                  {user.firstName} {user.lastName} ({user.username}) {user.email ? `- ${user.email}` : ''}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Audit Trail (Latest 100)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {audit.map((log) => (
                <div key={log.id} className="rounded border p-2 text-xs">
                  <strong>{log.action}</strong> on {log.targetType}:{log.targetId} by {log.actor?.username || 'system'} at{' '}
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </main>
  )
}
