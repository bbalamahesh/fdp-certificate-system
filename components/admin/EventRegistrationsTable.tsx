'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<ParticipantRow>>({})
  const [bulkGenerating, setBulkGenerating] = useState(false)

  async function loadParticipants(eventId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/events/${eventId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load participants')
      }
      setParticipants(data.participants || [])
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to load participants')
      setParticipants([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedEventId) {
      setParticipants([])
      setSelectedIds([])
      return
    }

    loadParticipants(selectedEventId)
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

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((row) => selectedIds.includes(row.id))

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((row) => row.id === id)))
      return
    }

    setSelectedIds((prev) => {
      const next = new Set(prev)
      filtered.forEach((row) => next.add(row.id))
      return Array.from(next)
    })
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function startEdit(row: ParticipantRow) {
    setEditingId(row.id)
    setEditValues(row)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  async function saveEdit(participantId: string) {
    if (!selectedEventId) return
    setSavingId(participantId)
    try {
      const res = await fetch(
        `/api/admin/events/${selectedEventId}/participants/${participantId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: editValues.fullName || '',
            email: editValues.email || '',
            mobileNo: editValues.mobileNo || '',
            whatsappNo: editValues.whatsappNo || '',
            instituteName: editValues.instituteName || '',
            roleLabel: editValues.roleLabel || '',
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update participant')
      }
      toast.success('Participant updated')
      cancelEdit()
      await loadParticipants(selectedEventId)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update participant')
    } finally {
      setSavingId(null)
    }
  }

  async function deleteParticipant(participantId: string) {
    if (!selectedEventId) return
    const confirmed = window.confirm('Delete this participant?')
    if (!confirmed) return

    setSavingId(participantId)
    try {
      const res = await fetch(
        `/api/admin/events/${selectedEventId}/participants/${participantId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete participant')
      }
      toast.success('Participant deleted')
      setSelectedIds((prev) => prev.filter((id) => id !== participantId))
      await loadParticipants(selectedEventId)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete participant')
    } finally {
      setSavingId(null)
    }
  }

  async function generateForParticipant(participantId: string) {
    if (!selectedEventId) return
    setSavingId(participantId)
    try {
      const res = await fetch(
        `/api/admin/events/${selectedEventId}/participants/${participantId}/certificate`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate certificate')
      }
      toast.success(`Certificate generated (${data.certificateId})`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate certificate')
    } finally {
      setSavingId(null)
    }
  }

  async function bulkGenerate() {
    if (!selectedEventId || selectedIds.length === 0) return
    setBulkGenerating(true)
    try {
      let success = 0
      let failed = 0

      for (const participantId of selectedIds) {
        const res = await fetch(
          `/api/admin/events/${selectedEventId}/participants/${participantId}/certificate`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }
        )
        if (res.ok) success++
        else failed++
      }

      toast.success(`Bulk generate complete. Success: ${success}, Failed: ${failed}`)
    } catch (error) {
      console.error(error)
      toast.error('Bulk generate failed')
    } finally {
      setBulkGenerating(false)
    }
  }

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

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={bulkGenerate}
          disabled={!selectedEventId || selectedIds.length === 0 || bulkGenerating}
        >
          {bulkGenerating ? 'Generating...' : `Bulk Generate (${selectedIds.length})`}
        </Button>
      </div>

      {!selectedEventId ? (
        <p className="text-sm text-muted-foreground">Select an event to view registrations.</p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading registrations...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Institute</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Registered At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No registrations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelectOne(row.id)}
                      aria-label={`Select ${row.fullName}`}
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === row.id ? (
                      <Input
                        value={editValues.fullName ?? ''}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                      />
                    ) : (
                      row.fullName
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === row.id ? (
                      <Input
                        type="email"
                        value={editValues.email ?? ''}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, email: e.target.value }))
                        }
                      />
                    ) : (
                      row.email
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === row.id ? (
                      <Input
                        value={editValues.mobileNo ?? ''}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, mobileNo: e.target.value }))
                        }
                      />
                    ) : (
                      row.mobileNo
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === row.id ? (
                      <Input
                        value={editValues.whatsappNo ?? ''}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, whatsappNo: e.target.value }))
                        }
                      />
                    ) : (
                      row.whatsappNo || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === row.id ? (
                      <Input
                        value={editValues.instituteName ?? ''}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, instituteName: e.target.value }))
                        }
                      />
                    ) : (
                      row.instituteName || '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === row.id ? (
                      <Input
                        value={editValues.roleLabel ?? ''}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, roleLabel: e.target.value }))
                        }
                      />
                    ) : (
                      row.roleLabel || '-'
                    )}
                  </TableCell>
                  <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {editingId === row.id ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => saveEdit(row.id)}
                            disabled={savingId === row.id}
                          >
                            Save
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(row)}
                            disabled={savingId === row.id}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteParticipant(row.id)}
                            disabled={savingId === row.id}
                          >
                            Delete
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => generateForParticipant(row.id)}
                            disabled={savingId === row.id}
                          >
                            Generate
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
