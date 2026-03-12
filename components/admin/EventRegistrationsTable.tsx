'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type EventRow = {
  id: string
  name: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

type ParticipantRow = {
  id: string
  fullName: string
  email: string
  mobileNo: string
  whatsappNo?: string | null
  instituteName?: string | null
  roleLabel?: string | null
  createdAt: string
}

type Props = {
  token: string
  events: EventRow[]
  selectedEventId: string
  onSelectedEventChange: (eventId: string) => void
}

export default function EventRegistrationsTable({
  token,
  events,
  selectedEventId,
  onSelectedEventChange,
}: Props) {
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!selectedEventId) {
      setParticipants([])
      return
    }

    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/events/${selectedEventId}/participants`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load participants')
        }
        setParticipants(data.participants || [])
      } catch (error) {
        console.error(error)
        setParticipants([])
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedEventId, token])

  const filtered = useMemo(() => {
    if (!search.trim()) return participants
    const q = search.toLowerCase()
    return participants.filter((p) =>
      [p.fullName, p.email, p.mobileNo, p.whatsappNo, p.instituteName, p.roleLabel]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [participants, search])

  const selectableEvents = useMemo(
    () => events.filter((event) => event.status === 'APPROVED' || event.status === 'PENDING'),
    [events]
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="event-select">Select Event</Label>
          <select
            id="event-select"
            value={selectedEventId}
            onChange={(e) => onSelectedEventChange(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Choose an event</option>
            {selectableEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.status})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="participant-search">Search</Label>
          <Input
            id="participant-search"
            placeholder="Search name, email, phone, institute"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!selectedEventId}
          />
        </div>
      </div>

      {!selectedEventId ? (
        <p className="text-sm text-muted-foreground">Select an event to view registrations.</p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading registrations...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Institute</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Registered At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No registrations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.fullName}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.mobileNo}</TableCell>
                  <TableCell>{row.whatsappNo || '-'}</TableCell>
                  <TableCell>{row.instituteName || '-'}</TableCell>
                  <TableCell>{row.roleLabel || '-'}</TableCell>
                  <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
