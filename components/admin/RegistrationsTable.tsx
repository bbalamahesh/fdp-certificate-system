'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

import {
  Loader2,
  Search,
  Mail,
  Trash2,
  RefreshCcw,
  Copy,
  Pencil,
  Save,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Registration {
  id: number
  timestamp: string
  title: string
  name: string
  email: string
  phone: string
  organization: string
  certificateId: string
}

const PAGE_SIZE = 10

export default function RegistrationsTable() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // selection
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // pagination
  const [page, setPage] = useState(1)

  // edit
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<Registration>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 🔥 MUST BE HERE
  const [saving, setSaving] = useState(false)
  const [originalRow, setOriginalRow] =
    useState<Registration | null>(null)

  /* -------------------- DATA -------------------- */
  useEffect(() => {
    loadRegistrations()
  }, [])

  const loadRegistrations = async () => {
    try {
      const res = await fetch('/api/admin/registrations')
      if (!res.ok) {
        throw new Error('Update failed')
      }
      const data = await res.json()
      if (data.success) {
        setRegistrations(data.registrations)
      }
    } finally {
      setLoading(false)
    }
  }

  /* -------------------- FILTER + PAGINATION -------------------- */
  const filteredData = registrations.filter((r) =>
    [r.name, r.email, r.organization, r.certificateId]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE)

  const paginatedData = filteredData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  /* -------------------- SELECTION -------------------- */
  const toggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const pageIds = paginatedData.map((r) => r.id)
    const allSelected = pageIds.every((id) => selectedIds.includes(id))

    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...prev, ...pageIds.filter((id) => !prev.includes(id))]
    )
  }

  const selectedRegistrations = registrations.filter((r) =>
    selectedIds.includes(r.id)
  )

  /* -------------------- EDIT -------------------- */
  const startEdit = (row: Registration) => {
    setEditingId(row.id)
    setEditValues(row)
    setOriginalRow(row)
    setErrors({})
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!editValues.name?.trim()) {
      newErrors.name = 'Name is required'
    }

    if (
      !editValues.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValues.email)
    ) {
      newErrors.email = 'Invalid email'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveEdit = async () => {
    if (!validate() || editingId === null || !originalRow) return

    setSaving(true)

    // Optimistic update
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === editingId
          ? { ...r, ...(editValues as Registration) }
          : r
      )
    )

    try {
      const res = await fetch('/api/admin/update-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      })

      const text = await res.text()
      console.log('UPDATE RESPONSE:', res.status, text)

      if (!res.ok) {
        throw new Error(text || 'Update failed')
      }

      toast.success('Changes saved')

      setEditingId(null)
      setEditValues({})
      setErrors({})
      setOriginalRow(null)

      loadRegistrations()
    } catch (error) {
      console.error('SAVE ERROR:', error)

      // Rollback
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === originalRow.id ? originalRow : r
        )
      )

      toast.error('Your changes were not saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({})
    setErrors({})
  }

  /* -------------------- ACTIONS -------------------- */
  const resend = async (email: string) => {
    await fetch('/api/admin/resend-certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  }

  const remove = async (email: string) => {
    await fetch('/api/admin/delete-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    loadRegistrations()
  }

  const bulkResend = async () => {
    for (const r of selectedRegistrations) await resend(r.email)
    setSelectedIds([])
  }

  const bulkDelete = async () => {
    for (const r of selectedRegistrations) await remove(r.email)
    setSelectedIds([])
  }

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value)
  }

  /* -------------------- UI -------------------- */
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search + actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            className="pl-9"
            placeholder="Search name, email, or certificate ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRegistrations}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setSelectedIds([])}>
            Deselect All
          </Button>
        </div>
      </div>

      {/* Bulk bar – always visible */}
      <div className="flex gap-3 items-center p-3 border rounded-md bg-muted">
        <span className="text-sm font-medium">
          {selectedIds.length} selected
        </span>
        <Button
          variant="outline"
          disabled={selectedIds.length === 0 || editingId !== null}
          onClick={bulkResend}
        >
          Bulk Send
        </Button>
        <Button
          variant="destructive"
          disabled={selectedIds.length === 0 || editingId !== null}
          onClick={bulkDelete}
        >
          Bulk Delete
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    paginatedData.length > 0 &&
                    paginatedData.every((r) =>
                      selectedIds.includes(r.id)
                    )
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>#</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Certificate ID</TableHead>
              <TableHead>Edit</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(r.id)}
                    onCheckedChange={() => toggleRow(r.id)}
                    disabled={editingId !== null || saving}
                  />
                </TableCell>

                <TableCell>{r.id}</TableCell>
                <TableCell>{r.timestamp}</TableCell>

                {/* Name */}
                <TableCell>
                  {editingId === r.id ? (
                    <>
                      <Input
                        value={editValues.name || ''}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            name: e.target.value,
                          }))
                        }
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive">
                          {errors.name}
                        </p>
                      )}
                    </>
                  ) : (
                    r.name
                  )}
                </TableCell>

                {/* Email */}
                <TableCell>
                  {editingId === r.id ? (
                    <>
                      <Input
                        value={editValues.email || ''}
                        onChange={(e) =>
                          setEditValues((v) => ({
                            ...v,
                            email: e.target.value,
                          }))
                        }
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">
                          {errors.email}
                        </p>
                      )}
                    </>
                  ) : (
                    r.email
                  )}
                </TableCell>

                {/* Certificate ID */}
                <TableCell className="font-mono text-xs align-middle">
                  <div className="flex items-center gap-2 min-h-[28px]">
                    {r.certificateId ? (
                      <>
                        <span>{r.certificateId}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(r.certificateId)
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-muted-foreground italic">
                        —
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Edit */}
                <TableCell className="align-middle">
                  {editingId === r.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Save
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={editingId !== null || saving}
                      onClick={() => startEdit(r)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="align-middle">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={editingId !== null || saving}
                      onClick={() => resend(r.email)}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Resend
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={editingId !== null || saving}
                      onClick={() => remove(r.email)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </Button>

        <span className="text-sm px-2 flex items-center">
          Page {page} of {totalPages}
        </span>

        <Button
          size="sm"
          variant="outline"
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
