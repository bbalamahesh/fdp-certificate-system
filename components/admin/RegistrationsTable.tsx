'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Loader2,
  Search,
  Trash2,
  RefreshCcw,
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
  sheetRow: number
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

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk' | null>(null)
  const [rowToDelete, setRowToDelete] = useState<Registration | null>(null)

  // selection
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // pagination
  const [page, setPage] = useState(1)

  // single edit
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<Registration>>({})
  const [originalRow, setOriginalRow] =
    useState<Registration | null>(null)
  const [saving, setSaving] = useState(false)

  const [pendingDeletes, setPendingDeletes] = useState<Registration[]>([])
  /* -------------------- DATA -------------------- */
  useEffect(() => {
    loadRegistrations()
  }, [])

  const loadRegistrations = async () => {
    const res = await fetch('/api/admin/registrations')
    const data = await res.json()
    setRegistrations(data.registrations || [])
    setLoading(false)
  }

  /* -------------------- FILTER + PAGINATION -------------------- */
  const filtered = registrations.filter((r) =>
    [
      r.name,
      r.email,
      r.phone,
      r.organization,
      r.title,
      r.certificateId,
    ]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  /* -------------------- SELECTION -------------------- */
  const toggleRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const pageIds = paginated.map((r) => r.id)
    const allSelected = pageIds.every((id) =>
      selectedIds.includes(id)
    )

    setSelectedIds((prev) =>
      allSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...prev, ...pageIds.filter((id) => !prev.includes(id))]
    )
  }

  const selectedRows = registrations.filter((r) =>
    selectedIds.includes(r.id)
  )

  /* -------------------- SINGLE EDIT -------------------- */
  const startEdit = (row: Registration) => {
    setEditingId(row.id)
    setEditValues(row)
    setOriginalRow(row)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({})
    setOriginalRow(null)
  }

  const saveEdit = async () => {
    if (!originalRow || !editingId) return

    setSaving(true)

    // Optimistic UI
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === editingId ? { ...r, ...editValues } : r
      )
    )

    try {
      const payload = {
        sheetRow: originalRow.sheetRow,
        title: editValues.title ?? originalRow.title,
        name: editValues.name ?? originalRow.name,
        email: editValues.email ?? originalRow.email,
        phone: editValues.phone ?? originalRow.phone,
        organization:
          editValues.organization ?? originalRow.organization,
      }

      const res = await fetch('/api/admin/update-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      toast.success('Changes saved')

      setEditingId(null)
      setEditValues({})
      setOriginalRow(null)

      loadRegistrations()
    } catch {
      // rollback
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === originalRow.id ? originalRow : r
        )
      )
      toast.error('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /* -------------------- DELETE -------------------- */
  const removeWithUndo = (
    row: Registration,
    showToast: boolean = true
  ) => {
    // remove from UI
    setRegistrations((prev) =>
      prev.filter((r) => r.id !== row.id)
    )

    const timeoutId = setTimeout(async () => {
      await fetch('/api/admin/delete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: row.email }),
      })
    }, 5000)

    if (showToast) {
      toast.message('Registration deleted', {
        action: {
          label: 'Undo',
          onClick: () => {
            clearTimeout(timeoutId)
            setRegistrations((prev) =>
              [...prev, row].sort((a, b) => a.id - b.id)
            )
          },
        },
      })
    }

    return timeoutId
  }

  const confirmDelete = () => {
    if (deleteMode === 'single' && rowToDelete) {
      removeWithUndo(rowToDelete)
    }

    if (deleteMode === 'bulk') {
      bulkDelete()
    }

    setConfirmOpen(false)
    setRowToDelete(null)
    setDeleteMode(null)
  }

  const bulkDelete = () => {
    const rows = selectedRows
    setSelectedIds([])

    const timeouts = rows.map((row) =>
      removeWithUndo(row, false) // 👈 NO per-row toast
    )

    toast.message(`${rows.length} registrations deleted`, {
      action: {
        label: 'Undo',
        onClick: () => {
          timeouts.forEach(clearTimeout)

          setRegistrations((prev) => {
            const restored = [...prev, ...rows]
            return restored.sort((a, b) => a.id - b.id)
          })
        },
      },
    })
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
      {/* Search */}
      <div className="flex justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            className="pl-9"
            placeholder="Search…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <Button variant="outline" onClick={loadRegistrations}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Bulk bar */}
      <div className="flex gap-3 items-center p-3 border rounded-md bg-muted">
        <span className="text-sm font-medium">
          {selectedIds.length} selected
        </span>

        <Button
          variant="destructive"
          disabled={selectedIds.length < 2 || saving || editingId !== null}
          onClick={() => {
            setDeleteMode('bulk')
            setConfirmOpen(true)
          }}
        >
          Bulk Delete
        </Button>

        {selectedIds.length === 1 && (
          <span className="text-xs text-muted-foreground">
            Select at least 2 rows for bulk delete
          </span>
        )}

      </div>

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    paginated.length > 0 &&
                    paginated.every((r) =>
                      selectedIds.includes(r.id)
                    )
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Org</TableHead>
              <TableHead>Edit</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(r.id)}
                    onCheckedChange={() => toggleRow(r.id)}
                    disabled={editingId !== null || saving}
                  />
                </TableCell>

                {(['name', 'email', 'title', 'phone', 'organization'] as const).map(
                  (field) => (
                    <TableCell key={field}>
                      {editingId === r.id ? (
                        <Input
                          value={(editValues[field] as string) || ''}
                          onChange={(e) =>
                            setEditValues((v) => ({
                              ...v,
                              [field]: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        r[field] || '—'
                      )}
                    </TableCell>
                  )
                )}

                <TableCell>
                  {editingId === r.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={saving}
                      >
                        <Save className="h-3 w-3 mr-1" />
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
                      onClick={() => startEdit(r)}
                      disabled={saving}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </TableCell>

                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={saving}
                    onClick={() => {
                      setDeleteMode('single')
                      setRowToDelete(r)
                      setConfirmOpen(true)
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
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
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteMode === 'bulk'
                ? 'Delete registrations?'
                : 'Delete registration?'}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {deleteMode === 'bulk'
                ? `Are you sure you want to delete ${selectedIds.length} registrations? This action can be undone for a short time.`
                : 'Are you sure you want to delete this registration? This action can be undone for a short time.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
